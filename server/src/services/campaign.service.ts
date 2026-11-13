import { localizeProduct } from "./localize.service";
import { Campaign, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

let active: Campaign[] = [];

export const refreshCampaigns = async () => {
  const now = new Date();
  active = await prisma.campaign.findMany({
    where: { isActive: true, startsAt: { lte: now }, endsAt: { gt: now } },
    orderBy: { discountPercent: "desc" },
  });
  return active;
};

export const setActiveCampaigns = (campaigns: Campaign[]) => {
  active = campaigns;
};

export const campaignFor = (categoryId: string, now = new Date()) =>
  active.find((campaign) => campaign.startsAt <= now && campaign.endsAt > now && (!campaign.categoryId || campaign.categoryId === categoryId)) ?? null;

export const discounted = (price: Prisma.Decimal, percent: number) => price.mul(100 - percent).div(100).toDecimalPlaces(2);

type PricedProduct = { price: Prisma.Decimal; salePrice?: Prisma.Decimal | null; categoryId: string };

const resolvePrice = (product: PricedProduct) => {
  const sale = product.salePrice && product.salePrice.lt(product.price) ? product.salePrice : null;
  const campaign = campaignFor(product.categoryId);
  const campaignPrice = campaign ? discounted(product.price, campaign.discountPercent) : null;
  if (campaign && campaignPrice && (!sale || campaignPrice.lte(sale))) return { price: campaignPrice, campaign };
  if (sale) return { price: sale, campaign: null };
  return { price: product.price, campaign: null };
};

export const effectivePrice = (product: PricedProduct) => resolvePrice(product).price;

export const withPricing = <T extends PricedProduct>(input: T) => {
  const product = localizeProduct(input as T & { sku?: string });
  const { price, campaign } = resolvePrice(product);
  if (price.eq(product.price)) return { ...product, compareAtPrice: null, campaign: null };
  return {
    ...product,
    price,
    compareAtPrice: product.price,
    campaign: campaign ? { name: campaign.name, discountPercent: campaign.discountPercent, endsAt: campaign.endsAt } : null,
  };
};

export const startCampaignRefresher = () => {
  const run = () => refreshCampaigns().catch((error) => console.error("Kampaniyalar yüklənmədi", error));
  run();
  return setInterval(run, 60_000);
};
