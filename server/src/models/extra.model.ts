import { CouponType } from "@prisma/client";
import { z } from "zod";
import { shippingAddressSchema } from "./order.model";

export const couponCheckSchema = z.object({ code: z.string().trim().min(2).max(40) });

export const couponCreateSchema = z.object({
  code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/, "Yalnız hərf, rəqəm, - və _"),
  type: z.nativeEnum(CouponType),
  value: z.number().positive(),
  minTotal: z.number().min(0).default(0),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const couponUpdateSchema = couponCreateSchema.partial();

export const addressSchema = shippingAddressSchema.extend({
  label: z.string().trim().min(1).max(40),
  isDefault: z.boolean().optional(),
});

export const uploadSchema = z.object({
  dataUrl: z.string().regex(/^data:image\/(png|jpe?g|webp|gif);base64,/, "Yalnız PNG, JPG, WEBP və ya GIF şəkil"),
});

export const clientErrorSchema = z.object({
  message: z.string().max(1000),
  stack: z.string().max(5000).optional(),
  url: z.string().max(500).optional(),
});
