import { z } from "zod";

export const idParamSchema = z.object({ id: z.string().min(1) });
export const productIdParamSchema = z.object({ productId: z.string().min(1) });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
