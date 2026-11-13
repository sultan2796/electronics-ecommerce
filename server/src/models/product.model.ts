import { StorageType } from "@prisma/client";
import { isSafeUrl } from "../utils/safeUrl";
import { z } from "zod";

const csv = z
  .string()
  .optional()
  .transform((value) => (value ? value.split(",").map((item) => item.trim()).filter(Boolean) : undefined));

const csvInt = csv.transform((items) => items?.map(Number).filter((n) => Number.isInteger(n) && n > 0));

const optionalNumber = z.coerce.number().nonnegative().optional();

export const productSortOptions = ["newest", "price_asc", "price_desc", "name_asc", "bestsellers", "rating"] as const;

export const productQuerySchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().optional(),
  brand: csv,
  minPrice: optionalNumber,
  maxPrice: optionalNumber,
  ram: csvInt,
  storage: csvInt,
  storageType: csv.transform((items) =>
    items?.filter((item): item is StorageType => Object.values(StorageType).includes(item as StorageType)),
  ),
  cpu: csv,
  gpu: csv,
  os: csv,
  minScreen: optionalNumber,
  maxScreen: optionalNumber,
  minRefreshRate: optionalNumber,
  minBattery: optionalNumber,
  inStock: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  sort: z.enum(productSortOptions).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
});

export const featuredQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(10).default(4) });

export const facetsQuerySchema = z.object({ category: z.string().optional() });

export const lookupQuerySchema = z.object({
  ids: z
    .string()
    .max(2000)
    .transform((value) => [...new Set(value.split(",").map((id) => id.trim()).filter(Boolean))])
    .pipe(z.array(z.string().max(64)).min(1).max(30)),
});

export const compareQuerySchema = z.object({
  ids: z
    .string()
    .transform((value) => [...new Set(value.split(",").map((id) => id.trim()).filter(Boolean))])
    .pipe(z.array(z.string()).min(2).max(4)),
});

export const specSchema = z.object({
  cpu: z.string().optional(),
  gpu: z.string().optional(),
  ramGb: z.number().int().positive().optional(),
  storageGb: z.number().int().positive().optional(),
  storageType: z.nativeEnum(StorageType).optional(),
  screenSizeInch: z.number().positive().max(100).optional(),
  resolution: z.string().optional(),
  refreshRateHz: z.number().int().positive().optional(),
  batteryMah: z.number().int().positive().optional(),
  os: z.string().optional(),
  weightGrams: z.number().int().positive().optional(),
  connectivity: z.array(z.string()).default([]),
  extra: z.record(z.unknown()).optional(),
});

export const productCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sku: z.string().trim().min(2).max(64),
  brand: z.string().trim().min(1).max(60),
  description: z.string().max(5000).default(""),
  price: z.number().positive(),
  salePrice: z.number().positive().nullable().optional(),
  model3dUrl: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((value) => (value ? value : null))
    .refine(
      (value) => value === null || (/^https:\/\/[^\s\\]+\.(glb|gltf)(\?[^\s\\]*)?$/i.test(value) && !/[\u0000-\u001f]/.test(value)),
      "3D model linki https:// ilə başlamalı və .glb və ya .gltf faylı olmalıdır",
    ),
  model3dActive: z.boolean().optional(),
  videoUrl: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((value) => (value ? value : null))
    .refine(
      (value) => value === null || (isSafeUrl(value) && /^https:\/\/[^?#]+\.(mp4|webm)(\?[^\s]*)?$/i.test(value)),
      "Video linki https:// ilə başlamalı və .mp4 və ya .webm faylı olmalıdır",
    ),
  videoPoster: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((value) => (value ? value : null))
    .refine((value) => value === null || isSafeUrl(value), "Poster linki / ilə və ya https:// ilə başlamalıdır"),
  model3dSize: z.number().int().min(0).max(50 * 1024 * 1024).nullish(),
  model3dLicense: z
    .string()
    .trim()
    .max(200)
    .nullish()
    .transform((value) => (value ? value : null)),
  model3dSource: z
    .string()
    .trim()
    .max(300)
    .nullish()
    .transform((value) => (value ? value : null)),
  stock: z.number().int().min(0),
  images: z.array(z.string().trim().min(1)).default([]),
  categoryId: z.string().min(1),
  isActive: z.boolean().default(true),
  specs: specSchema.optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

export const salePriceIsValid = (price: number, salePrice: number | null | undefined) =>
  salePrice === null || salePrice === undefined || salePrice < price;

export const stockUpdateSchema = z.object({ stock: z.number().int().min(0) });

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  parentId: z.string().optional(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export type ProductQuery = z.infer<typeof productQuerySchema>;
export type ProductSort = (typeof productSortOptions)[number];
export type SpecInput = z.infer<typeof specSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
