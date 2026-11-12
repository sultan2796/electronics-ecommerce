import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

export const REVIEWABLE_STATUSES = [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

type Client = Prisma.TransactionClient | typeof prisma;

export const displayName = (name: string) => {
  const [first, ...rest] = name.trim().split(/\s+/);
  const lastInitial = rest.length ? ` ${rest[rest.length - 1].charAt(0).toUpperCase()}.` : "";
  return `${first}${lastInitial}`;
};

export const resolveProduct = async (idOrSlug: string) => {
  const product = await prisma.product.findFirst({ where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }, select: { id: true, name: true } });
  if (!product) throw new AppError(404, "Məhsul tapılmadı");
  return product;
};

export const hasPurchased = async (userId: string, productId: string, client: Client = prisma) =>
  (await client.orderItem.count({ where: { productId, order: { userId, status: { in: REVIEWABLE_STATUSES } } } })) > 0;

export const recalculateRating = async (productId: string, client: Client = prisma) => {
  const aggregate = await client.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: { _all: true } });
  const average = aggregate._avg.rating;
  await client.product.update({
    where: { id: productId },
    data: {
      ratingAverage: average === null ? null : Math.round(average * 10) / 10,
      reviewCount: aggregate._count._all,
    },
  });
};

export const reviewSummary = async (productId: string) => {
  const [aggregate, groups] = await Promise.all([
    prisma.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: { _all: true } }),
    prisma.review.groupBy({ by: ["rating"], where: { productId }, _count: { _all: true } }),
  ]);
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const group of groups) distribution[group.rating] = group._count._all;
  return {
    average: aggregate._avg.rating === null ? null : Math.round(aggregate._avg.rating * 10) / 10,
    count: aggregate._count._all,
    distribution,
  };
};
