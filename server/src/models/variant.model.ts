import { z } from "zod";
import { isSafeUrl } from "../utils/safeUrl";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

export const variantInputSchema = z
  .object({
    id: z.string().trim().min(1).max(64).optional(),
    name: z.string().trim().min(1).max(80),
    color: optionalText(40),
    colorHex: optionalText(7).refine((value) => value === null || /^#[0-9a-fA-F]{6}$/.test(value), "Rəng kodu #RRGGBB formatında olmalıdır"),
    size: optionalText(40),
    sku: z.string().trim().min(2).max(64),
    price: z.number().positive().max(1_000_000).nullable().optional(),
    salePrice: z.number().positive().max(1_000_000).nullable().optional(),
    stock: z.number().int().min(0).max(1_000_000),
    images: z.array(z.string().trim().max(500).refine(isSafeUrl, "Şəkil linki təhlükəsiz deyil")).max(8).default([]),
    isActive: z.boolean().default(true),
  })
  .refine((value) => value.salePrice == null || (value.price != null && value.salePrice < value.price), {
    message: "Variantın endirimli qiyməti öz qiymətindən aşağı olmalıdır",
    path: ["salePrice"],
  });

export const variantListSchema = z.object({
  variants: z
    .array(variantInputSchema)
    .max(50, "Ən çox 50 variant ola bilər")
    .refine((list) => new Set(list.map((item) => item.sku.toLowerCase())).size === list.length, "Variant SKU-ları təkrarlanmamalıdır")
    .refine((list) => new Set(list.map((item) => item.name.toLowerCase())).size === list.length, "Variant adları təkrarlanmamalıdır"),
});

export type VariantListInput = z.infer<typeof variantListSchema>;
