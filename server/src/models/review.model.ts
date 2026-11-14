import { z } from "zod";

export const reviewBodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  comment: z.string().trim().min(10, "Rəy ən az 10 simvol olmalıdır").max(2000),
  images: z
    .array(z.string().max(2_000_000))
    .max(3, "Ən çox 3 şəkil əlavə etmək olar")
    .optional(),
});

export const questionBodySchema = z.object({
  question: z.string().trim().min(10, "Sual ən az 10 simvol olmalıdır").max(500),
});

export const answerBodySchema = z
  .object({
    answer: z.string().trim().min(2).max(2000).optional(),
    isPublished: z.boolean().optional(),
  })
  .refine((value) => value.answer !== undefined || value.isPublished !== undefined, "Dəyişiklik yoxdur");

export const adminQuestionQuerySchema = z.object({
  status: z.enum(["open", "answered", "all"]).default("open"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const reviewListQuerySchema = z.object({
  sort: z.enum(["newest", "highest", "lowest"]).default("newest"),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const adminReviewQuerySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ReviewBody = z.infer<typeof reviewBodySchema>;
