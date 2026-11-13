import { z } from "zod";
import { prisma } from "../config/prisma";
import { audit } from "../services/audit.service";
import { asyncHandler } from "../utils/asyncHandler";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

const safeLink = z
  .string()
  .trim()
  .max(300)
  .nullish()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || /^(\/(?!\/)|https:\/\/)/.test(value), "Keçid / ilə və ya https:// ilə başlamalıdır");

const imageUrl = z
  .string()
  .trim()
  .min(1, "Şəkil tələb olunur")
  .max(500)
  .refine((value) => /^(\/(?!\/)|https:\/\/)/.test(value), "Şəkil ünvanı / ilə və ya https:// ilə başlamalıdır");

export const slideSchema = z.object({
  title: z.string().trim().min(2, "Başlıq ən az 2 simvol olmalıdır").max(120),
  subtitle: optionalText(300),
  eyebrow: optionalText(60),
  imageUrl,
  buttonText: optionalText(40),
  buttonLink: safeLink,
  isActive: z.boolean().default(true),
});

export const slideUpdateSchema = slideSchema.partial();

export const slideOrderSchema = z.object({ ids: z.array(z.string().min(1)).min(1).max(50) });

const publicSelect = { id: true, title: true, subtitle: true, eyebrow: true, imageUrl: true, buttonText: true, buttonLink: true } as const;

export const listActiveSlides = asyncHandler(async (_req, res) => {
  res.set("Cache-Control", "public, max-age=60");
  res.json(await prisma.slide.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: publicSelect, take: 10 }));
});

export const listSlides = asyncHandler(async (_req, res) => {
  res.json(await prisma.slide.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }));
});

export const createSlide = asyncHandler(async (req, res) => {
  const last = await prisma.slide.aggregate({ _max: { sortOrder: true } });
  const slide = await prisma.slide.create({ data: { ...req.body, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
  audit(req, "slide.create", "Slide", slide.id, req.body);
  res.status(201).json(slide);
});

export const updateSlide = asyncHandler(async (req, res) => {
  const slide = await prisma.slide.update({ where: { id: req.params.id }, data: req.body });
  audit(req, "slide.update", "Slide", slide.id, req.body);
  res.json(slide);
});

export const deleteSlide = asyncHandler(async (req, res) => {
  await prisma.slide.delete({ where: { id: req.params.id } });
  audit(req, "slide.delete", "Slide", req.params.id ?? null, {});
  res.status(204).end();
});

export const reorderSlides = asyncHandler(async (req, res) => {
  const { ids } = req.body as z.infer<typeof slideOrderSchema>;
  await prisma.$transaction(ids.map((id, sortOrder) => prisma.slide.update({ where: { id }, data: { sortOrder } })));
  audit(req, "slide.reorder", "Slide", null, { ids });
  res.json(await prisma.slide.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }));
});
