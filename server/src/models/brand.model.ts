import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug yalnız kiçik hərf, rəqəm və tire ola bilər");

const logoSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value.startsWith("/uploads/") || /^https:\/\//.test(value), "Loqo https və ya /uploads/ ünvanı olmalıdır");

export const brandCreateSchema = z.object({
  name: z.string().trim().min(1).max(60),
  slug: slugSchema.optional(),
  logoUrl: logoSchema.nullable().optional(),
  isActive: z.boolean().optional(),
});

export const brandUpdateSchema = brandCreateSchema.partial().refine((value) => Object.keys(value).length > 0, "Dəyişiklik yoxdur");

export type BrandCreateInput = z.infer<typeof brandCreateSchema>;
export type BrandUpdateInput = z.infer<typeof brandUpdateSchema>;
