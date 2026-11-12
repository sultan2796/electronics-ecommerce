import { prisma } from "../config/prisma";
import { ProductCreateInput, ProductQuery, ProductUpdateInput } from "../models/product.model";
import { buildProductOrderBy, buildProductWhere, getFacets, getFeaturedProducts, productInclude, toSpecData } from "../services/product.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

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

  res.json({ items, total, page: query.page, limit: query.limit, totalPages: Math.max(1, Math.ceil(total / query.limit)) });
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
  res.json(product);
});

export const compareProducts = asyncHandler(async (req, res) => {
  const { ids } = req.query as unknown as { ids: string[] };
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    include: productInclude,
  });
  const ordered = ids.map((id) => products.find((product) => product.id === id)).filter(Boolean);
  res.json({ items: ordered });
});

export const createProduct = asyncHandler(async (req, res) => {
  const { specs, ...data } = req.body as ProductCreateInput;
  const product = await prisma.product.create({
    data: { ...data, specs: specs ? { create: toSpecData(specs) } : undefined },
    include: productInclude,
  });
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { specs, ...data } = req.body as ProductUpdateInput;
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...data,
      specs: specs ? { upsert: { create: toSpecData(specs), update: toSpecData(specs) } } : undefined,
    },
    include: productInclude,
  });
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.status(204).end();
});

export const featuredProducts = asyncHandler(async (req, res) => {
  const { limit } = req.query as unknown as { limit: number };
  res.json(await getFeaturedProducts(limit));
});
