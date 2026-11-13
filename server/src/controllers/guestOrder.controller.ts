import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { lineName, pricedSource, reserveStock, resolveVariant } from "../services/variant.service";
import { OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { z } from "zod";
import { clientUrl } from "../config/env";
import { prisma } from "../config/prisma";
import { shippingAddressSchema } from "../models/order.model";
import { effectivePrice } from "../services/campaign.service";
import { queueEmail } from "../services/email";
import { orderConfirmationEmail } from "../services/email/templates";
import { alertLowStock } from "../services/jobs.service";
import { uniqueOrderNumber } from "../services/order.service";
import { shippingFor } from "../services/shipping.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

const GUEST_MAX_QUANTITY = 5;
const GUEST_MAX_LINES = 10;
const GUEST_MAX_OPEN_ORDERS = 3;
const GUEST_OPEN_QUANTITY_PER_PRODUCT = 15;

export const guestCheckoutSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-poçt düzgün deyil").max(120),
  shippingAddress: shippingAddressSchema,
  items: z
    .array(z.object({ productId: z.string().trim().min(1).max(64), variantId: z.string().trim().min(1).max(64).optional(), quantity: z.number().int().min(1).max(GUEST_MAX_QUANTITY) }))
    .min(1, "Səbət boşdur")
    .max(GUEST_MAX_LINES, `Qonaq sifarişində ən çox ${GUEST_MAX_LINES} fərqli məhsul ola bilər`),
  paymentMethod: z.literal(PaymentMethod.CASH_ON_DELIVERY).default(PaymentMethod.CASH_ON_DELIVERY),
});

export const trackQuerySchema = z.object({ token: z.string().trim().regex(/^[A-Za-z0-9_-]{32,64}$/, "İzləmə linki yanlışdır") });
export const trackParamsSchema = z.object({ orderNumber: z.string().trim().regex(/^ES-\d{6}-[A-Z0-9]{5,6}$/, "Sifariş nömrəsi yanlışdır") });

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const sameHash = (a: string, b: string) => {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
};

export const trackingLink = (orderNumber: string, token: string) => `${clientUrl}/track/${orderNumber}#token=${token}`;

const maskPhone = (phone: unknown) => {
  const text = typeof phone === "string" ? phone : "";
  return text.length > 4 ? `${"•".repeat(Math.max(0, text.length - 4))}${text.slice(-4)}` : text;
};

export const guestCheckout = asyncHandler(async (req, res) => {
  const { email, shippingAddress, items, paymentMethod } = req.body as z.infer<typeof guestCheckoutSchema>;
  const lines = new Map<string, { productId: string; variantId?: string; quantity: number }>();
  for (const item of items) {
    const key = `${item.productId}:${item.variantId ?? ""}`;
    const current = lines.get(key);
    lines.set(key, { productId: item.productId, variantId: item.variantId, quantity: Math.min(GUEST_MAX_QUANTITY, (current?.quantity ?? 0) + item.quantity) });
  }
  const open = await prisma.order.count({
    where: { guestEmail: email, status: { in: [OrderStatus.PENDING, OrderStatus.PROCESSING] } },
  });
  if (open >= GUEST_MAX_OPEN_ORDERS) {
    throw new AppError(429, "Bu e-poçt üçün çoxlu açıq sifariş var. Hesab yaradın və ya bizimlə əlaqə saxlayın.");
  }
  const productIds = [...new Set([...lines.values()].map((line) => line.productId))];
  const held = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, order: { userId: null, status: OrderStatus.PENDING } },
    _sum: { quantity: true },
  });
  for (const row of held) {
    const requested = [...lines.values()].filter((line) => line.productId === row.productId).reduce((sum, line) => sum + line.quantity, 0);
    if ((row._sum.quantity ?? 0) + requested > GUEST_OPEN_QUANTITY_PER_PRODUCT) {
      throw new AppError(429, "Bu məhsul üçün çoxlu təsdiqlənməmiş qonaq sifarişi var. Hesaba daxil olaraq sifariş verin və ya bizimlə əlaqə saxlayın.");
    }
  }
  const token = randomBytes(24).toString("base64url");

  const order = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });
    if (products.length !== productIds.length) throw new AppError(409, "Səbətdəki bəzi məhsullar artıq mövcud deyil");
    const byId = new Map(products.map((product) => [product.id, product]));

    const priced = [];
    for (const line of lines.values()) {
      const product = byId.get(line.productId)!;
      if (!product.isActive) throw new AppError(409, `${product.name} artıq satışda deyil`);
      const variant = await resolveVariant(tx, product, line.variantId);
      await reserveStock(tx, product, variant, line.quantity);
      priced.push({ product, variant, quantity: line.quantity, unitPrice: effectivePrice(pricedSource(product, variant)) });
    }

    const subtotal = priced.reduce((sum, item) => sum.add(item.unitPrice.mul(item.quantity)), new Prisma.Decimal(0));
    const shippingFee = shippingFor(subtotal);

    return tx.order.create({
      data: {
        orderNumber: await uniqueOrderNumber(tx),
        statusHistory: { create: { status: OrderStatus.PENDING } },
        guestEmail: email,
        guestName: shippingAddress.fullName,
        guestPhone: shippingAddress.phone,
        trackingTokenHash: hashToken(token),
        total: subtotal.add(shippingFee),
        subtotal,
        shippingFee,
        paymentMethod,
        shippingAddress: shippingAddress as Prisma.InputJsonObject,
        items: {
          create: priced.map((item) => ({
            productId: item.product.id,
            productName: lineName(item.product, item.variant),
            variantId: item.variant?.id ?? null,
            variantName: item.variant?.name ?? null,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });
  });

  const link = trackingLink(order.orderNumber ?? "", token);
  queueEmail({ ...orderConfirmationEmail({ name: shippingAddress.fullName }, order, link), to: email, userId: null });
  void alertLowStock(order.items.map((item) => item.productId));

  res.status(201).json({
    orderNumber: order.orderNumber,
    trackingToken: token,
    total: order.total,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
  });
});

export const trackOrder = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params as z.infer<typeof trackParamsSchema>;
  const { token } = req.query as z.infer<typeof trackQuerySchema>;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: { select: { productName: true, quantity: true, unitPrice: true, productId: true } },
      statusHistory: { orderBy: { createdAt: "asc" }, select: { status: true, note: true, createdAt: true } },
    },
  });
  if (!order || !order.trackingTokenHash || !sameHash(order.trackingTokenHash, hashToken(token))) {
    throw new AppError(404, "Sifariş tapılmadı və ya izləmə linki yanlışdır");
  }
  res.set("Cache-Control", "no-store");
  res.json({
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    total: order.total,
    createdAt: order.createdAt,
    items: order.items,
    statusHistory: order.statusHistory,
    shippingAddress: { ...(order.shippingAddress as Record<string, unknown>), phone: maskPhone((order.shippingAddress as Record<string, unknown>)?.phone) },
  });
});
