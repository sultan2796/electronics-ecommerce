import { AppError } from "../utils/AppError";
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { releaseStock } from "./variant.service";
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

export const restockAndCancel = async (tx: Prisma.TransactionClient, orderId: string, expected?: OrderStatus) => {
  const claimed = await tx.order.updateMany({
    where: { id: orderId, status: expected ?? { notIn: [OrderStatus.CANCELLED, OrderStatus.DELIVERED] } },
    data: { status: OrderStatus.CANCELLED },
  });
  if (claimed.count === 0) throw new AppError(409, "Sifarişin statusu artıq dəyişib. Səhifəni yeniləyin.");
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    await releaseStock(tx, item.productId, item.variantId, item.quantity);
  }
  await tx.payment.updateMany({ where: { orderId, status: PaymentStatus.PENDING }, data: { status: PaymentStatus.FAILED } });
  await refundPoints(tx, orderId);
  await recordOrderStatus(tx, orderId, OrderStatus.CANCELLED);
  return tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.CANCELLED }, include: orderInclude });
};

export const expireUnpaidOrders = async () => {
  const cutoff = new Date(Date.now() - env.UNPAID_ORDER_TTL_MINUTES * 60 * 1000);
  const guestCutoff = new Date(Date.now() - env.GUEST_ORDER_TTL_HOURS * 60 * 60 * 1000);
  const stale = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING,
      paymentStatus: { not: PaymentStatus.SUCCEEDED },
      OR: [
        { paymentMethod: PaymentMethod.CARD, createdAt: { lt: cutoff } },
        { paymentMethod: PaymentMethod.CASH_ON_DELIVERY, userId: null, createdAt: { lt: guestCutoff } },
      ],
    },
    select: { id: true },
  });
  let expired = 0;
  for (const order of stale) {
    const cancelled = await prisma
      .$transaction(async (tx) => {
        const fresh = await tx.order.findUnique({ where: { id: order.id }, select: { status: true, paymentStatus: true } });
        if (fresh?.status !== OrderStatus.PENDING || fresh.paymentStatus === PaymentStatus.SUCCEEDED) return false;
        await restockAndCancel(tx, order.id, OrderStatus.PENDING);
        return true;
      })
      .catch((error: unknown) => {
        if (error instanceof AppError && error.statusCode === 409) return false;
        throw error;
      });
    if (!cancelled) continue;
    expired += 1;
    await notifyOrderStatus(order.id, OrderStatus.CANCELLED);
  }
  return expired;
};

export const notifyOrderStatus = async (orderId: string, status: OrderStatus) => {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, user: { select: { name: true, email: true } } } });
  if (!order) return;
  const recipient = orderRecipient(order);
  if (!recipient) return;
  const email = orderStatusEmail(recipient, order, status);
  if (email) queueEmail({ ...email, to: recipient.email, userId: order.userId });
};
