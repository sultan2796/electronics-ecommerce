import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

const SOURCE_URL = process.env.CATALOG_SOURCE_URL ?? "https://dummyjson.com";
const USD_TO_AZN = Number(process.env.USD_TO_AZN ?? 1.7);
export const IMPORT_SKU_PREFIX = "DJ-";

const categoryMap = [
  { source: "smartphones", slug: "smartphones", name: "Smartfonlar" },
  { source: "laptops", slug: "laptops", name: "Noutbuklar" },
  { source: "tablets", slug: "tablets", name: "Planşetlər" },
  { source: "mobile-accessories", slug: "mobile-accessories", name: "Mobil aksesuarlar" },
];

interface SourceProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage?: number;
  rating?: number;
  stock: number;
  brand?: string;
  warrantyInformation?: string;
  shippingInformation?: string;
  returnPolicy?: string;
  tags?: string[];
  images?: string[];
  thumbnail?: string;
  dimensions?: { width?: number; height?: number; depth?: number };
}

export interface ImportResult {
  source: string;
  categories: number;
  created: number;
  updated: number;
  deactivated: number;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

const fetchCategory = async (source: string): Promise<SourceProduct[]> => {
  const response = await fetch(`${SOURCE_URL}/products/category/${source}?limit=0`);
  if (!response.ok) throw new Error(`"${source}" kateqoriyası yüklənmədi (HTTP ${response.status})`);
  const body = (await response.json()) as { products?: SourceProduct[] };
  return body.products ?? [];
};

const toProductData = (product: SourceProduct, categoryId: string) => ({
  name: product.title,
  brand: product.brand?.trim() || "Digər",
  description: product.description,
  price: new Prisma.Decimal((product.price * USD_TO_AZN).toFixed(2)),
  stock: Math.max(0, Math.round(product.stock)),
  images: product.images?.length ? product.images : product.thumbnail ? [product.thumbnail] : [],
  isActive: true,
  categoryId,
});

const dimensionsOf = (product: SourceProduct) => {
  const { width, height, depth } = product.dimensions ?? {};
  return typeof width === "number" && typeof height === "number" && typeof depth === "number" ? { width, height, depth, unit: "cm" } : null;
};

export const enrichImportedSpecs = async () => {
  const pending = await prisma.techSpecification.findMany({
    where: { product: { sku: { startsWith: IMPORT_SKU_PREFIX } } },
    select: { id: true, extra: true, product: { select: { sku: true } } },
  });
  const missing = pending.filter((spec) => !(spec.extra && typeof spec.extra === "object" && "dimensions" in spec.extra));
  if (!missing.length) return 0;
  const batches = await Promise.all(categoryMap.map((entry) => fetchCategory(entry.source)));
  const bySku = new Map(batches.flat().map((product) => [`${IMPORT_SKU_PREFIX}${product.id}`, product]));
  let updated = 0;
  for (const spec of missing) {
    const source = bySku.get(spec.product.sku);
    const extra = { ...((spec.extra as Prisma.JsonObject | null) ?? {}), dimensions: source ? dimensionsOf(source) : null };
    await prisma.techSpecification.update({ where: { id: spec.id }, data: { extra } });
    updated += 1;
  }
  return updated;
};

const toSpecData = (product: SourceProduct) => {
  const extra: Prisma.InputJsonObject = {
    source: "dummyjson",
    sourceId: product.id,
    rating: product.rating ?? null,
    discountPercentage: product.discountPercentage ?? null,
    warranty: product.warrantyInformation ?? null,
    shipping: product.shippingInformation ?? null,
    returnPolicy: product.returnPolicy ?? null,
    tags: product.tags ?? [],
    dimensions: dimensionsOf(product),
  };
  return { connectivity: [] as string[], extra };
};

export const importCatalog = async ({ replaceDemo = true }: { replaceDemo?: boolean } = {}): Promise<ImportResult> => {
  const batches = await Promise.all(categoryMap.map(async (entry) => ({ entry, products: await fetchCategory(entry.source) })));
  let created = 0;
  let updated = 0;

  for (const { entry, products } of batches) {
    const category = await prisma.category.upsert({
      where: { slug: entry.slug },
      update: { name: entry.name },
      create: { name: entry.name, slug: entry.slug },
    });

    for (const product of products) {
      const sku = `${IMPORT_SKU_PREFIX}${product.id}`;
      const data = toProductData(product, category.id);
      const specs = toSpecData(product);
      const existing = await prisma.product.findUnique({ where: { sku }, select: { id: true } });

      if (existing) {
        await prisma.product.update({
          where: { sku },
          data: { ...data, specs: { upsert: { create: specs, update: specs } } },
        });
        updated += 1;
      } else {
        await prisma.product.create({
          data: { ...data, sku, slug: `${slugify(product.title)}-${product.id}`, specs: { create: specs } },
        });
        created += 1;
      }
    }
  }

  const deactivated = replaceDemo
    ? (
        await prisma.product.updateMany({
          where: { isActive: true, NOT: { sku: { startsWith: IMPORT_SKU_PREFIX } } },
          data: { isActive: false },
        })
      ).count
    : 0;

  return { source: SOURCE_URL, categories: categoryMap.length, created, updated, deactivated };
};
