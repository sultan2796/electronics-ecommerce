import { z } from "zod";
import { prisma } from "../config/prisma";
import { audit } from "../services/audit.service";
import { withPricing } from "../services/campaign.service";
import { AppError } from "../utils/AppError";
import { isSafeUrl } from "../utils/safeUrl";
import { dateOrderIssue, dateOrderMessage, datesInOrder, mergedDatesInOrder, optionalDate, optionalText, requiredImageUrl, safeLink } from "../utils/zodFields";
import { asyncHandler } from "../utils/asyncHandler";

const videoUrl = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((value) => (value ? value : null))
  .refine(
    (value) => value === null || (isSafeUrl(value) && /^https:\/\/[^?#]+\.(mp4|webm)(\?[^\s]*)?$/i.test(value)),
    "Video linki https:// ilə başlamalı və .mp4 və ya .webm faylı olmalıdır",
  );

const slideFields = z.object({
  title: z.string().trim().min(2, "Başlıq ən az 2 simvol olmalıdır").max(120),
  subtitle: optionalText(300),
  eyebrow: optionalText(60),
  imageUrl: requiredImageUrl,
  videoUrl,
  buttonText: optionalText(40),
  buttonLink: safeLink,
  productId: z.string().min(1).nullish().transform((value) => value ?? null),
  startsAt: optionalDate,
  endsAt: optionalDate,
  isActive: z.boolean().default(true),
});

export const slideSchema = slideFields.refine(datesInOrder, dateOrderIssue);
export const slideUpdateSchema = slideFields.partial().refine(datesInOrder, dateOrderIssue);

type SlideInput = z.infer<typeof slideFields>;

const ensureProduct = async (productId: string | null | undefined) => {
  if (!productId) return;
  if (!(await prisma.product.findUnique({ where: { id: productId }, select: { id: true } }))) throw new AppError(400, "Seçilmiş məhsul tapılmadı");
};

const adminInclude = { product: { select: { id: true, name: true, slug: true, images: true } } } as const;

export const slideOrderSchema = z.object({ ids: z.array(z.string().min(1)).min(1).max(50) });

const publicSelect = {
  id: true,
  title: true,
  subtitle: true,
  eyebrow: true,
  imageUrl: true,
  videoUrl: true,
  buttonText: true,
  buttonLink: true,
  product: { select: { id: true, name: true, slug: true, price: true, salePrice: true, categoryId: true, stock: true, isActive: true } },
} as const;

export const listActiveSlides = asyncHandler(async (_req, res) => {
  const now = new Date();
  res.set("Cache-Control", "no-cache");
  const slides = await prisma.slide.findMany({
    where: {
      isActive: true,
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: publicSelect,
    take: 10,
  });
  res.json(
    slides.map(({ product, ...slide }) => {
      if (!product || !product.isActive) return { ...slide, product: null };
      const priced = withPricing(product);
      return {
        ...slide,
        buttonLink: slide.buttonLink ?? `/products/${product.slug}`,
        product: { id: product.id, name: priced.name, slug: product.slug, price: priced.price, compareAtPrice: priced.compareAtPrice, inStock: product.stock > 0 },
      };
    }),
  );
});

export const listSlides = asyncHandler(async (_req, res) => {
  res.json(await prisma.slide.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: adminInclude }));
});

export const createSlide = asyncHandler(async (req, res) => {
  const data = req.body as SlideInput;
  await ensureProduct(data.productId);
  const last = await prisma.slide.aggregate({ _max: { sortOrder: true } });
  const slide = await prisma.slide.create({
    data: { ...data, startsAt: data.startsAt ?? null, endsAt: data.endsAt ?? null, sortOrder: (last._max.sortOrder ?? -1) + 1 },
    include: adminInclude,
  });
  audit(req, "slide.create", "Slide", slide.id, req.body);
  res.status(201).json(slide);
});

export const updateSlide = asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const data = req.body as Partial<SlideInput>;
  const current = await prisma.slide.findUnique({ where: { id }, select: { startsAt: true, endsAt: true } });
  if (!current) throw new AppError(404, "Slayd tapılmadı");
  if (!mergedDatesInOrder(data, current)) throw new AppError(400, dateOrderMessage);
  await ensureProduct(data.productId);
  const slide = await prisma.slide.update({ where: { id }, data, include: adminInclude });
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
  const existing = await prisma.slide.findMany({ select: { id: true } });
  const known = new Set(existing.map((slide) => slide.id));
  if (new Set(ids).size !== ids.length || ids.length !== known.size || ids.some((id) => !known.has(id))) {
    throw new AppError(409, "Slayd siyahısı köhnəlib, səhifəni yeniləyin");
  }
  await prisma.$transaction(ids.map((id, sortOrder) => prisma.slide.update({ where: { id }, data: { sortOrder } })));
  audit(req, "slide.reorder", "Slide", null, { ids });
  res.json(await prisma.slide.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: adminInclude }));
});
