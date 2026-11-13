import { prisma } from "../config/prisma";
import { ProductCreateInput, ProductQuery, ProductUpdateInput, salePriceIsValid } from "../models/product.model";
import { buildProductOrderBy, buildProductWhere, getFacets, getFeaturedProducts, productInclude, toSpecData } from "../services/product.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { notifyBackInStock } from "../services/stockAlert.service";
import { withPricing } from "../services/campaign.service";
import { audit } from "../services/audit.service";

export const listProducts = asyncHandler(async (req, res) => {
  const query = req.query as unknown as ProductQuery;
  const where = buildProductWhere(query);

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: buildProductOrderBy(query.sort),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ items: items.map(withPricing), total, page: query.page, limit: query.limit, totalPages: Math.max(1, Math.ceil(total / query.limit)) });
});

export const productFacets = asyncHandler(async (req, res) => {
  const { category } = req.query as { category?: string };
  res.json(await getFacets(category));
});

export const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await prisma.product.findFirst({
    where: { isActive: true, OR: [{ id }, { slug: id }] },
    include: productInclude,
  });
  if (!product) throw new AppError(404, "Məhsul tapılmadı");
  res.json(withPricing(product));
});

export const compareProducts = asyncHandler(async (req, res) => {
  const { ids } = req.query as unknown as { ids: string[] };
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    include: productInclude,
  });
  const ordered = ids.map((id) => products.find((product) => product.id === id)).filter(Boolean);
  res.json({ items: ordered.map((product) => withPricing(product!)) });
});

export const createProduct = asyncHandler(async (req, res) => {
  const { specs, ...data } = req.body as ProductCreateInput;
  if (!salePriceIsValid(data.price, data.salePrice)) throw new AppError(400, "Endirimli qiymət əsas qiymətdən aşağı olmalıdır");
  const product = await prisma.product.create({
    data: { ...data, specs: specs ? { create: toSpecData(specs) } : undefined },
    include: productInclude,
  });
  res.status(201).json(product);
  audit(req, "product.create", "Product", req.params.id ?? null, req.body);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { specs, ...data } = req.body as ProductUpdateInput;
  if (data.salePrice !== undefined || data.price !== undefined) {
    const current = await prisma.product.findUnique({ where: { id: req.params.id }, select: { price: true, salePrice: true } });
    if (!current) throw new AppError(404, "Məhsul tapılmadı");
    const price = data.price ?? Number(current.price);
    const salePrice = data.salePrice === undefined ? (current.salePrice === null ? null : Number(current.salePrice)) : data.salePrice;
    if (!salePriceIsValid(price, salePrice)) throw new AppError(400, "Endirimli qiymət əsas qiymətdən aşağı olmalıdır");
  }
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...data,
      specs: specs ? { upsert: { create: toSpecData(specs), update: toSpecData(specs) } } : undefined,
    },
    include: productInclude,
  });
  if (product.stock > 0) void notifyBackInStock(product.id);
  res.json(product);
  audit(req, "product.update", "Product", req.params.id ?? null, req.body);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.status(204).end();
  audit(req, "product.deactivate", "Product", req.params.id ?? null, req.body);
});

export const featuredProducts = asyncHandler(async (req, res) => {
  const { limit } = req.query as unknown as { limit: number };
  res.json((await getFeaturedProducts(limit)).map(withPricing));
});

export const relatedProducts = asyncHandler(async (req, res) => {
  const product = await prisma.product.findFirst({ where: { OR: [{ id: req.params.id }, { slug: req.params.id }] }, select: { id: true, categoryId: true } });
  if (!product) throw new AppError(404, "Məhsul tapılmadı");
  const coBought = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { productId: { not: product.id }, order: { status: { not: "CANCELLED" }, items: { some: { productId: product.id } } } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 8,
  });
  const boughtIds = coBought.map((row) => row.productId);
  const bought = boughtIds.length
    ? await prisma.product.findMany({ where: { id: { in: boughtIds }, isActive: true }, include: productInclude })
    : [];
  const ordered = boughtIds.map((id) => bought.find((item) => item.id === id)).filter((item): item is (typeof bought)[number] => Boolean(item));
  const fill = ordered.length < 8
    ? await prisma.product.findMany({
        where: { isActive: true, categoryId: product.categoryId, id: { notIn: [product.id, ...boughtIds] }, stock: { gt: 0 } },
        include: productInclude,
        orderBy: { createdAt: "desc" },
        take: 8 - ordered.length,
      })
    : [];
  res.json({ boughtTogether: ordered.length > 0, items: [...ordered, ...fill].map(withPricing) });
});
