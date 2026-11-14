import { Prisma, PromotionPlacement } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { audit } from "../services/audit.service";
import { isLive } from "../services/campaign.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { dateOrderIssue, dateOrderMessage, datesInOrder, mergedDatesInOrder, optionalDate, optionalText, requiredImageUrl, safeLink } from "../utils/zodFields";

const promotionFields = z.object({
  title: z.string().trim().min(2, "Başlıq ən az 2 simvol olmalıdır").max(90),
  description: optionalText(220),
  eyebrow: optionalText(40),
  imageUrl: requiredImageUrl,
  ctaText: optionalText(30),
  link: safeLink,
  placement: z.nativeEnum(PromotionPlacement).default(PromotionPlacement.HOME_BANNER),
  campaignId: z.string().min(1).nullish().transform((value) => value ?? null),
  startsAt: optionalDate,
  endsAt: optionalDate,
  isActive: z.boolean().default(true),
});


export const promotionSchema = promotionFields.refine(datesInOrder, dateOrderIssue);
export const promotionUpdateSchema = promotionFields.partial().refine(datesInOrder, dateOrderIssue);
export const promotionOrderSchema = z.object({ placement: z.nativeEnum(PromotionPlacement), ids: z.array(z.string().min(1)).min(1).max(50) });
export const promotionQuerySchema = z.object({ placement: z.nativeEnum(PromotionPlacement) });
export const promotionEventSchema = z.object({
  impressions: z.array(z.string().min(1).max(40)).max(10).default([]),
  clicks: z.array(z.string().min(1).max(40)).max(5).default([]),
});

type PromotionInput = z.infer<typeof promotionFields>;

const ensureCampaign = async (campaignId: string | null | undefined) => {
  if (!campaignId) return;
  if (!(await prisma.campaign.findUnique({ where: { id: campaignId }, select: { id: true } }))) throw new AppError(400, "Seçilmiş kampaniya tapılmadı");
};

const publicSelect = {
  id: true,
  title: true,
  description: true,
  eyebrow: true,
  imageUrl: true,
  ctaText: true,
  link: true,
  placement: true,
  campaign: { select: { id: true, name: true, discountPercent: true, isActive: true, startsAt: true, endsAt: true, fridayOnly: true } },
} satisfies Prisma.PromotionSelect;

export const livePromotionWhere = (placement: PromotionPlacement, now: Date): Prisma.PromotionWhereInput => ({
  placement,
  isActive: true,
  AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
  OR: [{ campaignId: null }, { campaign: { isActive: true, endsAt: { gt: now } } }],
});

export const listLivePromotions = asyncHandler(async (req, res) => {
  const now = new Date();
  const { placement } = req.query as unknown as z.infer<typeof promotionQuerySchema>;
  const promotions = await prisma.promotion.findMany({
    where: livePromotionWhere(placement, now),
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: publicSelect,
    take: placement === PromotionPlacement.HERO_SIDE ? 2 : 6,
  });
  res.set("Cache-Control", "no-cache");
  res.json(
    promotions.map(({ campaign, ...promotion }) => ({
      ...promotion,
      campaign: campaign ? { id: campaign.id, name: campaign.name, discountPercent: campaign.discountPercent, live: isLive(campaign, now) } : null,
    })),
  );
});

export const recordPromotionEvents = asyncHandler(async (req, res) => {
  const { impressions, clicks } = req.body as z.infer<typeof promotionEventSchema>;
  const seen = [...new Set(impressions)];
  const clicked = [...new Set(clicks)];
  await prisma.$transaction([
    ...(seen.length ? [prisma.promotion.updateMany({ where: { id: { in: seen }, isActive: true }, data: { impressions: { increment: 1 } } })] : []),
    ...(clicked.length ? [prisma.promotion.updateMany({ where: { id: { in: clicked }, isActive: true }, data: { clicks: { increment: 1 } } })] : []),
  ]);
  res.status(204).end();
});

export const listPromotions = asyncHandler(async (_req, res) => {
  res.json(
    await prisma.promotion.findMany({
      orderBy: [{ placement: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      include: { campaign: { select: { id: true, name: true } } },
    }),
  );
});

export const createPromotion = asyncHandler(async (req, res) => {
  const data = req.body as PromotionInput;
  await ensureCampaign(data.campaignId);
  const last = await prisma.promotion.aggregate({ where: { placement: data.placement }, _max: { sortOrder: true } });
  const promotion = await prisma.promotion.create({
    data: { ...data, startsAt: data.startsAt ?? null, endsAt: data.endsAt ?? null, sortOrder: (last._max.sortOrder ?? -1) + 1 },
    include: { campaign: { select: { id: true, name: true } } },
  });
  audit(req, "promotion.create", "Promotion", promotion.id, { title: data.title, placement: data.placement });
  res.status(201).json(promotion);
});

export const updatePromotion = asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const data = req.body as Partial<PromotionInput>;
  const current = await prisma.promotion.findUnique({ where: { id } });
  if (!current) throw new AppError(404, "Reklam tapılmadı");
  if (!mergedDatesInOrder(data, current)) throw new AppError(400, dateOrderMessage);
  await ensureCampaign(data.campaignId);
  let sortOrder: number | undefined;
  if (data.placement && data.placement !== current.placement) {
    const last = await prisma.promotion.aggregate({ where: { placement: data.placement }, _max: { sortOrder: true } });
    sortOrder = (last._max.sortOrder ?? -1) + 1;
  }
  const promotion = await prisma.promotion.update({
    where: { id },
    data: { ...data, ...(sortOrder !== undefined && { sortOrder }) },
    include: { campaign: { select: { id: true, name: true } } },
  });
  audit(req, "promotion.update", "Promotion", id, data);
  res.json(promotion);
});

export const deletePromotion = asyncHandler(async (req, res) => {
  await prisma.promotion.delete({ where: { id: req.params.id } });
  audit(req, "promotion.delete", "Promotion", req.params.id ?? null, {});
  res.status(204).end();
});

export const reorderPromotions = asyncHandler(async (req, res) => {
  const { placement, ids } = req.body as z.infer<typeof promotionOrderSchema>;
  const existing = await prisma.promotion.findMany({ where: { placement }, select: { id: true } });
  const known = new Set(existing.map((promotion) => promotion.id));
  if (new Set(ids).size !== ids.length || ids.length !== known.size || ids.some((id) => !known.has(id))) {
    throw new AppError(409, "Reklam siyahısı köhnəlib, səhifəni yeniləyin");
  }
  await prisma.$transaction(ids.map((id, sortOrder) => prisma.promotion.update({ where: { id }, data: { sortOrder } })));
  audit(req, "promotion.reorder", "Promotion", null, { placement, ids });
  res.status(204).end();
});
