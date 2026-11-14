import { localizeProduct } from "./localize.service";
import { Campaign, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { bakuDayStart, bakuWeekday } from "../utils/bakuTime";

type CampaignEntry = { productId: string; specialPrice: Prisma.Decimal | null };

export type LiveCampaign = Campaign & { products: CampaignEntry[]; scope: Map<string, CampaignEntry> | null };

const withScope = <T extends Campaign & { products: CampaignEntry[] }>(campaign: T): T & LiveCampaign => ({
  ...campaign,
  scope: campaign.products.length ? new Map(campaign.products.map((entry) => [entry.productId, entry])) : null,
});

let active: LiveCampaign[] = [];

const FRIDAY = 5;

export const isLive = (campaign: Pick<Campaign, "isActive" | "startsAt" | "endsAt" | "fridayOnly">, now = new Date()) =>
  campaign.isActive && campaign.startsAt <= now && campaign.endsAt > now && (!campaign.fridayOnly || bakuWeekday(now) === FRIDAY);

export const windowEnd = (campaign: Pick<Campaign, "endsAt" | "fridayOnly">, now = new Date()) => {
  if (!campaign.fridayOnly) return campaign.endsAt;
  const dayEnd = bakuDayStart(now, 1);
  return dayEnd < campaign.endsAt ? dayEnd : campaign.endsAt;
};

export const nextWindowStart = (campaign: Pick<Campaign, "isActive" | "startsAt" | "endsAt" | "fridayOnly">, now = new Date()) => {
  if (!campaign.isActive || campaign.endsAt <= now) return null;
  const from = campaign.startsAt > now ? campaign.startsAt : now;
  if (!campaign.fridayOnly) return from;
  for (let offset = 0; offset < 8; offset += 1) {
    const dayStart = bakuDayStart(from, offset);
    if (bakuWeekday(dayStart) !== FRIDAY) continue;
    const start = dayStart > from ? dayStart : from;
    return start < campaign.endsAt ? start : null;
  }
  return null;
};

export const refreshCampaigns = async () => {
  const now = new Date();
  const campaigns = await prisma.campaign.findMany({
    where: { isActive: true, startsAt: { lte: new Date(now.getTime() + 120_000) }, endsAt: { gt: now } },
    include: { products: { select: { productId: true, specialPrice: true } } },
    orderBy: { discountPercent: "desc" },
  });
  active = campaigns.map(withScope);
  return campaigns.filter((campaign) => isLive(campaign, now));
};

export const setActiveCampaigns = (campaigns: (Omit<Campaign, "fridayOnly"> & { fridayOnly?: boolean; products?: CampaignEntry[] })[]) => {
  active = campaigns.map((campaign) => withScope({ ...campaign, fridayOnly: campaign.fridayOnly ?? false, products: campaign.products ?? [] }));
};

export const discounted = (price: Prisma.Decimal, percent: number) => price.mul(100 - percent).div(100).toDecimalPlaces(2);

type PricedProduct = { id?: string; price: Prisma.Decimal; salePrice?: Prisma.Decimal | null; categoryId: string; listPrice?: Prisma.Decimal };

const openEntry: Pick<CampaignEntry, "specialPrice"> = { specialPrice: null };

const appliesTo = (campaign: LiveCampaign, product: PricedProduct) => {
  if (campaign.scope) return (product.id && campaign.scope.get(product.id)) || null;
  return !campaign.categoryId || campaign.categoryId === product.categoryId ? openEntry : null;
};

const campaignPrice = (campaign: LiveCampaign, entry: { specialPrice: Prisma.Decimal | null }, product: PricedProduct) => {
  const base = product.listPrice ?? product.price;
  if (entry.specialPrice && entry.specialPrice.gt(0) && entry.specialPrice.lt(base)) {
    return product.price.mul(entry.specialPrice).div(base).toDecimalPlaces(2);
  }
  return campaign.discountPercent > 0 ? discounted(product.price, campaign.discountPercent) : null;
};

export const campaignFor = (product: PricedProduct | string, now = new Date()) => {
  const subject = typeof product === "string" ? { categoryId: product, price: new Prisma.Decimal(0) } : product;
  return active.find((campaign) => isLive(campaign, now) && appliesTo(campaign, subject)) ?? null;
};

const resolvePrice = (product: PricedProduct, now = new Date()) => {
  const sale = product.salePrice && product.salePrice.lt(product.price) ? product.salePrice : null;
  let best: { price: Prisma.Decimal; campaign: LiveCampaign } | null = null;
  for (const campaign of active) {
    if (!isLive(campaign, now)) continue;
    const entry = appliesTo(campaign, product);
    if (!entry) continue;
    const price = campaignPrice(campaign, entry, product);
    if (price && price.lt(product.price) && (!best || price.lt(best.price))) best = { price, campaign };
  }
  if (best && (!sale || best.price.lte(sale))) return { price: best.price, campaign: best.campaign };
  if (sale) return { price: sale, campaign: null };
  return { price: product.price, campaign: null };
};

export const effectivePrice = (product: PricedProduct) => resolvePrice(product).price;

export const priceLine = (product: PricedProduct) => {
  const { price, campaign } = resolvePrice(product);
  return { unitPrice: price, originalPrice: price.lt(product.price) ? product.price : null, campaignId: campaign?.id ?? null };
};

const publicCampaign = (campaign: LiveCampaign, now = new Date()) => ({
  id: campaign.id,
  name: campaign.name,
  discountPercent: campaign.discountPercent,
  fridayOnly: campaign.fridayOnly,
  endsAt: windowEnd(campaign, now),
});

type PricedVariant = { price: Prisma.Decimal | null; salePrice: Prisma.Decimal | null };

export const variantPrice = (product: PricedProduct, variant: PricedVariant) => {
  const source = variant.price !== null ? { ...product, price: variant.price, salePrice: variant.salePrice, listPrice: product.price } : product;
  const price = resolvePrice(source).price;
  return { price, compareAtPrice: price.eq(source.price) ? null : source.price };
};

const priceVariants = (product: PricedProduct, variants: unknown) => {
  if (!Array.isArray(variants)) return undefined;
  return (variants as PricedVariant[]).map((variant) => ({ ...variant, basePrice: variant.price, ...variantPrice(product, variant) }));
};

export const withPricing = <T extends PricedProduct>(input: T) => {
  const localized = localizeProduct(input as T & { sku?: string });
  const variants = priceVariants(input, (input as { variants?: unknown }).variants);
  const product = variants ? { ...localized, variants } : localized;
  const { price, campaign } = resolvePrice(input);
  if (price.eq(input.price)) return { ...product, compareAtPrice: null, campaign: null };
  return {
    ...product,
    price,
    compareAtPrice: input.price,
    campaign: campaign ? publicCampaign(campaign) : null,
  };
};

export const startCampaignRefresher = () => {
  const run = () => refreshCampaigns().catch((error) => console.error("Kampaniyalar yüklənmədi", error));
  run();
  return setInterval(run, 60_000);
};
