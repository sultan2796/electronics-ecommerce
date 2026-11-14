import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { audit } from "../services/audit.service";
import { isLive, nextWindowStart, refreshCampaigns, windowEnd, withPricing } from "../services/campaign.service";
import { productInclude } from "../services/product.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { dateOrderIssue, dateOrderMessage, datesInOrder, optionalImageUrl, optionalText } from "../utils/zodFields";

const campaignProductSchema = z.object({
  productId: z.string().min(1),
  specialPrice: z.coerce.number().positive().max(1_000_000).nullish(),
});

const campaignFields = z.object({
  name: z.string().trim().min(2).max(80),
  description: optionalText(400),
  bannerUrl: optionalImageUrl,
  fridayOnly: z.boolean().default(false),
  discountPercent: z.number().int().min(0).max(90),
  categoryId: z.string().min(1).nullable().optional(),
  products: z.array(campaignProductSchema).max(200).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  isActive: z.boolean().default(true),
});

const hasDiscount = (value: { discountPercent?: number; products?: { specialPrice?: number | null }[] }) =>
  value.discountPercent === undefined ||
  value.discountPercent > 0 ||
  (value.products !== undefined && value.products.length > 0 && value.products.every((product) => product.specialPrice));

const discountMessage = { message: "Endirim faizi verin və ya hər seçilmiş məhsul üçün xüsusi qiymət təyin edin", path: ["discountPercent"] };

export const campaignSchema = campaignFields
  .refine((value) => value.endsAt > value.startsAt, dateOrderIssue)
  .refine(hasDiscount, discountMessage);

export const campaignUpdateSchema = campaignFields
  .partial()
  .refine(datesInOrder, dateOrderIssue)
  .refine(hasDiscount, discountMessage);

type CampaignInput = z.infer<typeof campaignFields>;

const campaignInclude = {
  category: { select: { id: true, name: true, slug: true } },
  products: { include: { product: { select: { id: true, name: true, price: true, salePrice: true, images: true, stock: true, isActive: true } } } },
  _count: { select: { promotions: true } },
} satisfies Prisma.CampaignInclude;

const checkProducts = async (entries: CampaignInput["products"]) => {
  if (!entries?.length) return;
  const ids = [...new Set(entries.map((entry) => entry.productId))];
  if (ids.length !== entries.length) throw new AppError(400, "Eyni məhsul kampaniyaya iki dəfə əlavə edilə bilməz");
  const products = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, price: true } });
  if (products.length !== ids.length) throw new AppError(400, "Seçilmiş məhsullardan bəziləri tapılmadı");
  for (const entry of entries) {
    const product = products.find((item) => item.id === entry.productId)!;
    if (entry.specialPrice && new Prisma.Decimal(entry.specialPrice).gte(product.price)) {
      throw new AppError(400, `${product.name} üçün xüsusi qiymət əsas qiymətdən aşağı olmalıdır`);
    }
  }
};

const productRows = (entries: NonNullable<CampaignInput["products"]>) =>
  entries.map((entry) => ({ productId: entry.productId, specialPrice: entry.specialPrice ? new Prisma.Decimal(entry.specialPrice) : null }));

const status = (campaign: Parameters<typeof isLive>[0], now = new Date()) => {
  if (!campaign.isActive) return "paused";
  if (campaign.endsAt <= now) return "ended";
  if (isLive(campaign, now)) return "live";
  return "scheduled";
};

export const listCampaigns = asyncHandler(async (_req, res) => {
  const now = new Date();
  const campaigns = await prisma.campaign.findMany({ include: campaignInclude, orderBy: { startsAt: "desc" } });
  res.json(
    campaigns.map((campaign) => ({
      ...campaign,
      status: status(campaign, now),
      currentEndsAt: isLive(campaign, now) ? windowEnd(campaign, now) : null,
      nextStartsAt: isLive(campaign, now) ? null : nextWindowStart(campaign, now),
    })),
  );
});

export const createCampaign = asyncHandler(async (req, res) => {
  const { products, ...data } = req.body as CampaignInput;
  await checkProducts(products);
  const campaign = await prisma.campaign.create({
    data: { ...data, ...(products?.length && { products: { create: productRows(products) } }) },
  });
  await refreshCampaigns();
  audit(req, "campaign.create", "Campaign", campaign.id, { ...data, products: products?.length ?? 0 });
  res.status(201).json(campaign);
});

export const updateCampaign = asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const { products, ...data } = req.body as Partial<CampaignInput>;
  const current = await prisma.campaign.findUnique({ where: { id }, include: { products: true } });
  if (!current) throw new AppError(404, "Kampaniya tapılmadı");
  const startsAt = data.startsAt ?? current.startsAt;
  const endsAt = data.endsAt ?? current.endsAt;
  if (endsAt <= startsAt) throw new AppError(400, dateOrderMessage);
  const percent = data.discountPercent ?? current.discountPercent;
  const entries = products ?? current.products.map((entry) => ({ productId: entry.productId, specialPrice: entry.specialPrice ? Number(entry.specialPrice) : null }));
  if (percent === 0 && (entries.length === 0 || entries.some((entry) => !entry.specialPrice))) throw new AppError(400, discountMessage.message);
  await checkProducts(products);
  const campaign = await prisma.$transaction(async (tx) => {
    if (products) {
      await tx.campaignProduct.deleteMany({ where: { campaignId: id } });
      if (products.length) await tx.campaignProduct.createMany({ data: productRows(products).map((row) => ({ ...row, campaignId: id })) });
    }
    return tx.campaign.update({ where: { id }, data });
  });
  await refreshCampaigns();
  audit(req, "campaign.update", "Campaign", campaign.id, { ...data, ...(products && { products: products.length }) });
  res.json(campaign);
});

export const deleteCampaign = asyncHandler(async (req, res) => {
  await prisma.campaign.delete({ where: { id: req.params.id } });
  await refreshCampaigns();
  audit(req, "campaign.delete", "Campaign", req.params.id);
  res.status(204).end();
});


export const campaignStats = asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const campaign = await prisma.campaign.findUnique({ where: { id }, select: { id: true } });
  if (!campaign) throw new AppError(404, "Kampaniya tapılmadı");
  const items = await prisma.orderItem.findMany({
    where: { campaignId: id, order: { status: { not: OrderStatus.CANCELLED }, paymentStatus: { not: PaymentStatus.REFUNDED } } },
    select: { orderId: true, productId: true, productName: true, unitPrice: true, originalPrice: true, quantity: true },
  });
  const promotions = await prisma.promotion.aggregate({ where: { campaignId: id }, _sum: { impressions: true, clicks: true } });
  let revenue = new Prisma.Decimal(0);
  let savings = new Prisma.Decimal(0);
  const byProduct = new Map<string, { productId: string; name: string; units: number; revenue: Prisma.Decimal }>();
  for (const item of items) {
    const line = item.unitPrice.mul(item.quantity);
    revenue = revenue.add(line);
    if (item.originalPrice) savings = savings.add(item.originalPrice.sub(item.unitPrice).mul(item.quantity));
    const entry = byProduct.get(item.productId) ?? { productId: item.productId, name: item.productName, units: 0, revenue: new Prisma.Decimal(0) };
    entry.units += item.quantity;
    entry.revenue = entry.revenue.add(line);
    byProduct.set(item.productId, entry);
  }
  res.json({
    orders: new Set(items.map((item) => item.orderId)).size,
    units: items.reduce((sum, item) => sum + item.quantity, 0),
    revenue: revenue.toFixed(2),
    savings: savings.toFixed(2),
    impressions: promotions._sum.impressions ?? 0,
    clicks: promotions._sum.clicks ?? 0,
    topProducts: [...byProduct.values()]
      .sort((a, b) => b.units - a.units)
      .slice(0, 5)
      .map((entry) => ({ ...entry, revenue: entry.revenue.toFixed(2) })),
  });
});

export const activeCampaigns = asyncHandler(async (_req, res) => {
  const now = new Date();
  const campaigns = await refreshCampaigns();
  const categories = await prisma.category.findMany({
    where: { id: { in: campaigns.map((c) => c.categoryId).filter((id): id is string => Boolean(id)) } },
    select: { id: true, name: true, slug: true },
  });
  res.set("Cache-Control", "no-cache");
  res.json(
    campaigns.map(({ products, ...campaign }) => ({
      ...campaign,
      productCount: products.length,
      endsAt: windowEnd(campaign, now),
      category: categories.find((c) => c.id === campaign.categoryId) ?? null,
    })),
  );
});

const showcaseProducts = async (campaign: { id: string; categoryId: string | null }, limit: number) => {
  const entries = await prisma.campaignProduct.findMany({ where: { campaignId: campaign.id }, select: { productId: true } });
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(entries.length ? { id: { in: entries.map((entry) => entry.productId) } } : campaign.categoryId ? { categoryId: campaign.categoryId } : {}),
  };
  const products = await prisma.product.findMany({ where, include: productInclude, orderBy: [{ stock: "desc" }, { createdAt: "desc" }], take: limit });
  return products.slice(0, limit).map(withPricing);
};

const publicCampaign = async (campaign: Prisma.CampaignGetPayload<object>, now: Date, limit = 12) => {
  const live = isLive(campaign, now);
  return {
    serverTime: now.toISOString(),
    status: live ? "live" : "upcoming",
    campaign: {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      bannerUrl: campaign.bannerUrl,
      fridayOnly: campaign.fridayOnly,
      discountPercent: campaign.discountPercent,
      endsAt: live ? windowEnd(campaign, now) : null,
      startsAt: live ? null : nextWindowStart(campaign, now),
    },
    products: live ? await showcaseProducts(campaign, limit) : [],
  };
};

export const fridayCampaign = asyncHandler(async (_req, res) => {
  const now = new Date();
  const candidates = await prisma.campaign.findMany({
    where: { fridayOnly: true, isActive: true, endsAt: { gt: now } },
    orderBy: [{ startsAt: "asc" }],
    take: 20,
  });
  res.set("Cache-Control", "no-cache");
  const live = candidates.find((campaign) => isLive(campaign, now));
  if (live) {
    res.json(await publicCampaign(live, now));
    return;
  }
  const upcoming = candidates
    .map((campaign) => ({ campaign, start: nextWindowStart(campaign, now) }))
    .filter((entry): entry is { campaign: (typeof candidates)[number]; start: Date } => entry.start !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
  res.json(upcoming ? await publicCampaign(upcoming.campaign, now) : { serverTime: now.toISOString(), status: "none", campaign: null, products: [] });
});

export const campaignDetail = asyncHandler(async (req, res) => {
  const now = new Date();
  const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
  if (!campaign || !campaign.isActive || campaign.endsAt <= now) throw new AppError(404, "Kampaniya bitib və ya tapılmadı");
  if (!isLive(campaign, now) && !nextWindowStart(campaign, now)) throw new AppError(404, "Kampaniya bitib və ya tapılmadı");
  res.set("Cache-Control", "no-cache");
  res.json(await publicCampaign(campaign, now, 48));
});
