import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../config/prisma";

export const orderInclude = {
  items: true,
  payments: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, provider: true, status: true, amount: true, createdAt: true } },
} satisfies Prisma.OrderInclude;

export const restockAndCancel = async (tx: Prisma.TransactionClient, orderId: string) => {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
  }
  await tx.payment.updateMany({ where: { orderId, status: PaymentStatus.PENDING }, data: { status: PaymentStatus.FAILED } });
  return tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.CANCELLED }, include: orderInclude });
};

export const expireUnpaidOrders = async () => {
  const cutoff = new Date(Date.now() - env.UNPAID_ORDER_TTL_MINUTES * 60 * 1000);
  const stale = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.CARD,
      paymentStatus: { not: PaymentStatus.SUCCEEDED },
      createdAt: { lt: cutoff },
    },
    select: { id: true },
  });
  for (const order of stale) {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.order.findUnique({ where: { id: order.id }, select: { status: true, paymentStatus: true } });
      if (fresh?.status === OrderStatus.PENDING && fresh.paymentStatus !== PaymentStatus.SUCCEEDED) {
        await restockAndCancel(tx, order.id);
      }
    });
  }
  return stale.length;
};
