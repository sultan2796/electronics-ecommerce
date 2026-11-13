import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { orderRecipient } from "./orderRecipient";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { queueEmail } from "./email";
import { orderStatusEmail } from "./email/templates";
import { refundPoints } from "./loyalty.service";

export const orderInclude = {
  items: true,
  statusHistory: { orderBy: { createdAt: "asc" }, select: { id: true, status: true, note: true, createdAt: true } },
  payments: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, provider: true, status: true, amount: true, createdAt: true } },
} satisfies Prisma.OrderInclude;

const ORDER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generateOrderNumber = (date = new Date()) => {
  const stamp = `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  let code = "";
  for (let index = 0; index < 6; index += 1) code += ORDER_CODE_ALPHABET[Math.floor(Math.random() * ORDER_CODE_ALPHABET.length)];
  return `ES-${stamp}-${code}`;
};

export const uniqueOrderNumber = async (tx: Prisma.TransactionClient) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateOrderNumber();
    if (!(await tx.order.findUnique({ where: { orderNumber: candidate }, select: { id: true } }))) return candidate;
  }
  throw new Error("Unikal sifariş nömrəsi yaradıla bilmədi");
};

export const recordOrderStatus = (tx: Prisma.TransactionClient, orderId: string, status: OrderStatus, note?: string) =>
  tx.orderStatusHistory.create({ data: { orderId, status, note: note ?? null } });

export const restockAndCancel = async (tx: Prisma.TransactionClient, orderId: string) => {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
  }
  await tx.payment.updateMany({ where: { orderId, status: PaymentStatus.PENDING }, data: { status: PaymentStatus.FAILED } });
  await refundPoints(tx, orderId);
  await recordOrderStatus(tx, orderId, OrderStatus.CANCELLED);
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
    await notifyOrderStatus(order.id, OrderStatus.CANCELLED);
  }
  return stale.length;
};

export const notifyOrderStatus = async (orderId: string, status: OrderStatus) => {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, user: { select: { name: true, email: true } } } });
  if (!order) return;
  const recipient = orderRecipient(order);
  if (!recipient) return;
  const email = orderStatusEmail(recipient, order, status);
  if (email) queueEmail({ ...email, to: recipient.email, userId: order.userId });
};
