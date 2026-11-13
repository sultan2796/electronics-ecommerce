import { Prisma } from "@prisma/client";

export const POINT_VALUE = 0.01;
export const POINTS_PER_AZN = 1;
export const MAX_POINTS_SHARE = 0.5;

export const pointsEarnedFor = (total: Prisma.Decimal | number) => Math.floor(Number(total) * POINTS_PER_AZN);

export const redeemablePoints = (available: number, total: Prisma.Decimal | number) =>
  Math.max(0, Math.min(available, Math.floor((Number(total) * MAX_POINTS_SHARE) / POINT_VALUE)));

export const pointsToMoney = (points: number) => new Prisma.Decimal(points).mul(POINT_VALUE).toDecimalPlaces(2);

export const awardPoints = async (tx: Prisma.TransactionClient, orderId: string) => {
  const order = await tx.order.findUnique({ where: { id: orderId } });
  if (!order || order.pointsAwarded || !order.userId) return;
  const earned = pointsEarnedFor(order.total.sub(order.shippingFee));
  await tx.order.update({ where: { id: orderId }, data: { pointsAwarded: true, pointsEarned: earned } });
  if (earned > 0) await tx.user.update({ where: { id: order.userId }, data: { points: { increment: earned } } });
};

export const refundPoints = async (tx: Prisma.TransactionClient, orderId: string) => {
  const order = await tx.order.findUnique({ where: { id: orderId } });
  if (!order || !order.userId) return;
  const refund = order.pointsUsed - (order.pointsAwarded ? order.pointsEarned : 0);
  if (refund !== 0) await tx.user.update({ where: { id: order.userId }, data: { points: { increment: refund } } });
  if (order.pointsAwarded) await tx.order.update({ where: { id: orderId }, data: { pointsAwarded: false } });
};
