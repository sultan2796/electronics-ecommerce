import { PaymentStatus } from "@prisma/client";
import { hasPermission } from "../config/permissions";
import { prisma } from "../config/prisma";
import { finalizePayment, paymentConfig, activeProvider, refreshPaymentStatus } from "../services/payment";
import { mapEpointStatus, verifyEpointCallback } from "../services/payment/epoint.provider";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { currentUser } from "../utils/currentUser";

export const getPaymentConfig = asyncHandler(async (_req, res) => {
  res.json(paymentConfig());
});

export const getMockPayment = asyncHandler(async (req, res) => {
  const user = currentUser(req);
  if (activeProvider()?.name !== "mock") throw new AppError(404, "Test ödəniş rejimi aktiv deyil");
  const payment = await prisma.payment.findUnique({
    where: { reference: req.params.reference },
    include: { order: { select: { id: true, userId: true, total: true, status: true } } },
  });
  if (!payment || payment.order.userId !== user.id) throw new AppError(404, "Ödəniş tapılmadı");
  res.json({
    reference: payment.reference,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    orderId: payment.order.id,
  });
});

export const completeMockPayment = asyncHandler(async (req, res) => {
  const user = currentUser(req);
  if (activeProvider()?.name !== "mock") throw new AppError(404, "Test ödəniş rejimi aktiv deyil");
  const { outcome } = req.body as { outcome: "succeeded" | "failed" };
  const payment = await prisma.payment.findUnique({ where: { reference: req.params.reference }, include: { order: true } });
  if (!payment || payment.order.userId !== user.id) throw new AppError(404, "Ödəniş tapılmadı");
  if (payment.provider !== "mock") throw new AppError(400, "Bu ödəniş test rejimində deyil");
  await finalizePayment(payment.reference, outcome, { simulated: true, outcome, at: new Date().toISOString() });
  res.json({ orderId: payment.orderId });
});

export const epointCallback = asyncHandler(async (req, res) => {
  const { data, signature } = req.body as { data?: string; signature?: string };
  if (!data || !signature) throw new AppError(400, "data və signature tələb olunur");
  const payload = verifyEpointCallback(data, signature);
  if (!payload) throw new AppError(400, "İmza etibarsızdır");
  const reference = String(payload.order_id ?? "");
  await finalizePayment(reference, mapEpointStatus(payload.status), payload);
  res.json({ status: "ok" });
});

export const getOrderPaymentStatus = asyncHandler(async (req, res) => {
  const user = currentUser(req);
  const order = await refreshPaymentStatus(req.params.orderId);
  if (!order || (order.userId !== user.id && !hasPermission(user.role, "orders:read"))) {
    throw new AppError(404, "Sifariş tapılmadı");
  }
  const { userId, ...rest } = order;
  res.json({ ...rest, paid: order.paymentStatus === PaymentStatus.SUCCEEDED });
});
