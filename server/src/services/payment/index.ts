import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import crypto from "crypto";
import { env, isProduction } from "../../config/env";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { queueEmail } from "../email";
import { paymentSucceededEmail } from "../email/templates";
import { epointProvider } from "./epoint.provider";
import { mockProvider } from "./mock.provider";
import { PaymentOutcome, PaymentProvider } from "./types";

export const activeProvider = (): PaymentProvider | null => {
  if (env.PAYMENT_PROVIDER === "epoint") return epointProvider;
  if (env.PAYMENT_PROVIDER === "mock" && !isProduction) return mockProvider;
  return null;
};

export const paymentConfig = () => {
  const provider = activeProvider();
  return {
    methods: provider ? [PaymentMethod.CARD, PaymentMethod.CASH_ON_DELIVERY] : [PaymentMethod.CASH_ON_DELIVERY],
    provider: provider?.name ?? null,
    testMode: provider?.testMode ?? false,
  };
};

const newReference = (provider: string) => `${provider.toUpperCase()}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;

export const startPayment = async (orderId: string) => {
  const provider = activeProvider();
  if (!provider) throw new AppError(503, "Kartla ödəniş hazırda mümkün deyil");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(404, "Sifariş tapılmadı");
  if (order.status !== OrderStatus.PENDING || order.paymentStatus === PaymentStatus.SUCCEEDED) {
    throw new AppError(409, "Bu sifariş üçün ödəniş tələb olunmur");
  }

  const reference = newReference(provider.name);
  const payment = await prisma.payment.create({
    data: { orderId: order.id, provider: provider.name, reference, amount: order.total },
  });

  try {
    const session = await provider.createSession({
      reference,
      orderId: order.id,
      amount: order.total.toFixed(2),
      currency: payment.currency,
      description: `ElectroShop sifarişi #${order.id.slice(-8).toUpperCase()}`,
    });
    await prisma.payment.update({
      where: { id: payment.id },
      data: { redirectUrl: session.redirectUrl, raw: (session.raw ?? undefined) as Prisma.InputJsonValue | undefined },
    });
    if (order.paymentMethod !== PaymentMethod.CARD || order.paymentStatus === PaymentStatus.FAILED) {
      await prisma.order.update({ where: { id: order.id }, data: { paymentMethod: PaymentMethod.CARD, paymentStatus: PaymentStatus.PENDING } });
    }
    return { reference, redirectUrl: session.redirectUrl };
  } catch (error) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED } });
    throw error;
  }
};

export const finalizePayment = async (reference: string, outcome: PaymentOutcome, raw?: unknown) => {
  if (outcome === "pending") return prisma.payment.findUnique({ where: { reference } });

  const outcomeState: { paidOrderId: string | null } = { paidOrderId: null };
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { reference }, include: { order: true } });
    if (!payment) throw new AppError(404, "Ödəniş tapılmadı");
    if (payment.status !== PaymentStatus.PENDING) return payment;

    const succeeded = outcome === "succeeded";
    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: succeeded ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
        ...(raw !== undefined && { raw: raw as Prisma.InputJsonValue }),
      },
    });

    if (succeeded) {
      outcomeState.paidOrderId = payment.orderId;
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: PaymentStatus.SUCCEEDED,
          paidAt: new Date(),
          ...(payment.order.status === OrderStatus.PENDING && { status: OrderStatus.PAID }),
        },
      });
    } else if (payment.order.paymentStatus !== PaymentStatus.SUCCEEDED) {
      await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: PaymentStatus.FAILED } });
    }
    return updated;
  });

  if (outcomeState.paidOrderId) {
    const order = await prisma.order.findUnique({ where: { id: outcomeState.paidOrderId }, include: { items: true, user: { select: { name: true, email: true } } } });
    if (order) queueEmail({ ...paymentSucceededEmail(order.user, order), to: order.user.email, userId: order.userId });
  }
  return result;
};

export const refreshPaymentStatus = async (orderId: string) => {
  const latest = await prisma.payment.findFirst({ where: { orderId }, orderBy: { createdAt: "desc" } });
  if (latest?.status === PaymentStatus.PENDING) {
    const provider = activeProvider();
    if (provider?.name === latest.provider && provider.fetchStatus) {
      try {
        const result = await provider.fetchStatus(latest.reference);
        await finalizePayment(latest.reference, result.outcome, result.raw);
      } catch (error) {
        console.error("Ödəniş statusu yoxlanılmadı", error);
      }
    }
  }
  return prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, status: true, paymentStatus: true, paymentMethod: true, paidAt: true, total: true },
  });
};
