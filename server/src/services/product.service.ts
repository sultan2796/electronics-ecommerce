import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ProductQuery, ProductSort, SpecInput } from "../models/product.model";

export const productInclude = {
  specs: true,
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductInclude;

const range = (min?: number, max?: number) => {
  if (min === undefined && max === undefined) return undefined;
  return { ...(min !== undefined && { gte: min }), ...(max !== undefined && { lte: max }) };
};

const containsAny = (field: "cpu" | "gpu", values?: string[]): Prisma.TechSpecificationWhereInput | undefined =>
  values?.length ? { OR: values.map((value) => ({ [field]: { contains: value, mode: "insensitive" } })) } : undefined;

export const buildProductWhere = (query: ProductQuery): Prisma.ProductWhereInput => {
  const specConditions: Prisma.TechSpecificationWhereInput[] = [];

  if (query.ram?.length) specConditions.push({ ramGb: { in: query.ram } });
  if (query.storage?.length) specConditions.push({ storageGb: { in: query.storage } });
  if (query.storageType?.length) specConditions.push({ storageType: { in: query.storageType } });
  if (query.os?.length) specConditions.push({ os: { in: query.os, mode: "insensitive" } });

  const cpu = containsAny("cpu", query.cpu);
  const gpu = containsAny("gpu", query.gpu);
  if (cpu) specConditions.push(cpu);
  if (gpu) specConditions.push(gpu);

  const screen = range(query.minScreen, query.maxScreen);
  if (screen) specConditions.push({ screenSizeInch: screen });
  if (query.minRefreshRate !== undefined) specConditions.push({ refreshRateHz: { gte: query.minRefreshRate } });
  if (query.minBattery !== undefined) specConditions.push({ batteryMah: { gte: query.minBattery } });

  const price = range(query.minPrice, query.maxPrice);

  return {
    isActive: true,
    ...(query.category && { category: { slug: query.category } }),
    ...(query.brand?.length && { brand: { in: query.brand, mode: "insensitive" } }),
    ...(price && { price }),
    ...(query.inStock && { stock: { gt: 0 } }),
    ...(query.q && {
      OR: [
        { name: { contains: query.q, mode: "insensitive" } },
        { brand: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
      ],
    }),
    ...(specConditions.length && { specs: { is: { AND: specConditions } } }),
  };
};

export const buildProductOrderBy = (sort: ProductSort): Prisma.ProductOrderByWithRelationInput => {
  switch (sort) {
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    case "name_asc":
      return { name: "asc" };
    default:
      return { createdAt: "desc" };
  }
};

export const toSpecData = (specs: SpecInput) => ({
  ...specs,
  extra: specs.extra as Prisma.InputJsonValue | undefined,
});

const compact = <T>(values: (T | null)[]): T[] => values.filter((value): value is T => value !== null);

export const getFacets = async (categorySlug?: string) => {
  const productWhere: Prisma.ProductWhereInput = {
    isActive: true,
    ...(categorySlug && { category: { slug: categorySlug } }),
  };
  const specWhere: Prisma.TechSpecificationWhereInput = { product: productWhere };

  const [brands, ram, storage, storageTypes, os, price, screen] = await Promise.all([
    prisma.product.findMany({ where: productWhere, distinct: ["brand"], select: { brand: true }, orderBy: { brand: "asc" } }),
    prisma.techSpecification.findMany({ where: specWhere, distinct: ["ramGb"], select: { ramGb: true }, orderBy: { ramGb: "asc" } }),
    prisma.techSpecification.findMany({ where: specWhere, distinct: ["storageGb"], select: { storageGb: true }, orderBy: { storageGb: "asc" } }),
    prisma.techSpecification.findMany({ where: specWhere, distinct: ["storageType"], select: { storageType: true } }),
    prisma.techSpecification.findMany({ where: specWhere, distinct: ["os"], select: { os: true }, orderBy: { os: "asc" } }),
    prisma.product.aggregate({ where: productWhere, _min: { price: true }, _max: { price: true } }),
    prisma.techSpecification.aggregate({ where: specWhere, _min: { screenSizeInch: true }, _max: { screenSizeInch: true } }),
  ]);

  return {
    brands: brands.map((item) => item.brand),
    ram: compact(ram.map((item) => item.ramGb)),
    storage: compact(storage.map((item) => item.storageGb)),
    storageTypes: compact(storageTypes.map((item) => item.storageType)),
    os: compact(os.map((item) => item.os)),
    price: { min: Number(price._min.price ?? 0), max: Number(price._max.price ?? 0) },
    screen: { min: Number(screen._min.screenSizeInch ?? 0), max: Number(screen._max.screenSizeInch ?? 0) },
  };
};

const ratingOf = (extra: Prisma.JsonValue | null | undefined) => {
  if (extra && typeof extra === "object" && !Array.isArray(extra)) {
    const rating = (extra as Prisma.JsonObject).rating;
    return typeof rating === "number" ? rating : 0;
  }
  return 0;
};

export const getFeaturedProducts = async (limit: number) => {
  const products = await prisma.product.findMany({
    where: { isActive: true, stock: { gt: 0 }, NOT: { images: { isEmpty: true } } },
    include: productInclude,
    take: 300,
  });
  const ranked = [...products].sort((a, b) => ratingOf(b.specs?.extra) - ratingOf(a.specs?.extra));
  const picked: typeof products = [];
  const usedCategories = new Set<string>();
  for (const product of ranked) {
    if (picked.length >= limit) break;
    if (usedCategories.has(product.categoryId)) continue;
    usedCategories.add(product.categoryId);
    picked.push(product);
  }
  for (const product of ranked) {
    if (picked.length >= limit) break;
    if (!picked.includes(product)) picked.push(product);
  }
  return picked;
};
