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

export const effectivePrice = (product: { price: Prisma.Decimal; categoryId: string }) => {
  const campaign = campaignFor(product.categoryId);
  return campaign ? discounted(product.price, campaign.discountPercent) : product.price;
};

export const withPricing = <T extends { price: Prisma.Decimal; categoryId: string }>(input: T) => {
  const product = localizeProduct(input as T & { sku?: string });
  const campaign = campaignFor(product.categoryId);
  if (!campaign) return { ...product, compareAtPrice: null, campaign: null };
  return {
    ...product,
    price: discounted(product.price, campaign.discountPercent),
    compareAtPrice: product.price,
    campaign: { name: campaign.name, discountPercent: campaign.discountPercent, endsAt: campaign.endsAt },
  };
};

export const startCampaignRefresher = () => {
  const run = () => refreshCampaigns().catch((error) => console.error("Kampaniyalar yüklənmədi", error));
  run();
  return setInterval(run, 60_000);
};
