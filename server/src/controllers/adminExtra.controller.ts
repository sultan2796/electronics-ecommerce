import { EmailStatus, OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { audit } from "../services/audit.service";
import { optimizeImage } from "../services/image.service";
import { AppError } from "../utils/AppError";
import { z } from "zod";
import { hasPermission } from "../config/permissions";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { currentUser } from "../utils/currentUser";

export const adminPaymentsQuerySchema = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const adminSearchQuerySchema = z.object({ q: z.string().trim().min(2).max(80) });

const needsRefund = (raw: Prisma.JsonValue | null) =>
  Boolean(raw && typeof raw === "object" && !Array.isArray(raw) && (raw as Record<string, unknown>).refundRequired === true);

export const markPaymentRefunded = asyncHandler(async (req, res) => {
  const payment = await prisma.$transaction(async (tx) => {
    const current = await tx.payment.findUnique({ where: { id: req.params.id }, include: { order: { select: { id: true, status: true } } } });
    if (!current) throw new AppError(404, "Ödəniş tapılmadı");
    const claimed = await tx.payment.updateMany({
      where: { id: current.id, status: PaymentStatus.SUCCEEDED },
      data: {
        status: PaymentStatus.REFUNDED,
        raw: { ...(current.raw && typeof current.raw === "object" && !Array.isArray(current.raw) ? current.raw : {}), refundRequired: false, refundedAt: new Date().toISOString() },
      },
    });
    if (claimed.count === 0) throw new AppError(409, "Yalnız uğurlu ödəniş geri qaytarılmış kimi qeyd oluna bilər");
    if (current.order.status === OrderStatus.CANCELLED) {
      const stillPaid = await tx.payment.count({ where: { orderId: current.orderId, status: PaymentStatus.SUCCEEDED } });
      if (stillPaid === 0) await tx.order.update({ where: { id: current.orderId }, data: { paymentStatus: PaymentStatus.REFUNDED } });
    }
    return tx.payment.findUniqueOrThrow({ where: { id: current.id }, select: { id: true, status: true } });
  });
  audit(req, "payment.refunded", "Payment", payment.id);
  res.json(payment);
});

export const listPayments = asyncHandler(async (req, res) => {
  const { status, q, page, limit } = req.query as unknown as z.infer<typeof adminPaymentsQuerySchema>;
  const where: Prisma.PaymentWhereInput = {
    ...(status && { status }),
    ...(q && {
      OR: [
        { reference: { contains: q, mode: "insensitive" } },
        { provider: { contains: q, mode: "insensitive" } },
        { order: { orderNumber: { contains: q, mode: "insensitive" } } },
        { order: { guestEmail: { contains: q, mode: "insensitive" } } },
        { order: { user: { email: { contains: q, mode: "insensitive" } } } },
      ],
    }),
  };
  const [items, total, summary] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        provider: true,
        reference: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        raw: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentMethod: true,
            guestEmail: true,
            guestName: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    }),
    prisma.payment.count({ where }),
    prisma.payment.groupBy({ by: ["status"], _count: { _all: true }, _sum: { amount: true } }),
  ]);
  res.json({
    items: items.map(({ raw, ...payment }) => ({ ...payment, refundRequired: needsRefund(raw) })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    summary: Object.fromEntries(summary.map((row) => [row.status, { count: row._count._all, amount: Number(row._sum.amount ?? 0) }])),
  });
});

export const adminSearch = asyncHandler(async (req, res) => {
  const { q } = req.query as unknown as z.infer<typeof adminSearchQuerySchema>;
  const role = currentUser(req);
  const contains = { contains: q, mode: "insensitive" as const };
  const [orders, products, users] = await Promise.all([
    hasPermission(role, "orders:read")
      ? prisma.order.findMany({
          where: { OR: [{ orderNumber: contains }, { guestEmail: contains }, { user: { email: contains } }, { user: { name: contains } }] },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, orderNumber: true, status: true, total: true, guestName: true, user: { select: { name: true } } },
        })
      : [],
    hasPermission(role, "products:write") || hasPermission(role, "inventory:write")
      ? prisma.product.findMany({
          where: { OR: [{ name: contains }, { sku: contains }, { brand: contains }] },
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: { id: true, name: true, sku: true, stock: true, isActive: true },
        })
      : [],
    hasPermission(role, "users:read")
      ? prisma.user.findMany({
          where: { OR: [{ email: contains }, { name: contains }] },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, name: true, email: true, role: true },
        })
      : [],
  ]);
  res.json({ orders, products, users });
});

type Notice = { id: string; kind: "order" | "stock" | "review" | "refund" | "email"; title: string; detail: string; to: string; createdAt: Date };

export const adminNotifications = asyncHandler(async (req, res) => {
  const role = currentUser(req);
  const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const notices: Notice[] = [];

  if (hasPermission(role, "orders:read")) {
    const pending = await prisma.order.findMany({
      where: { status: OrderStatus.PENDING },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, orderNumber: true, total: true, createdAt: true, guestName: true, user: { select: { name: true } } },
    });
    for (const order of pending) {
      notices.push({
        id: `order-${order.id}`,
        kind: "order",
        title: `Yeni sifariş ${order.orderNumber ?? order.id.slice(-8)}`,
        detail: `${order.user?.name ?? order.guestName ?? "Qonaq"} · ${order.total.toFixed(2)} ₼`,
        to: `/admin/orders?q=${encodeURIComponent(order.orderNumber ?? order.id)}`,
        createdAt: order.createdAt,
      });
    }
  }

  if (hasPermission(role, "orders:write")) {
    const refunds = await prisma.payment.findMany({
      where: { status: PaymentStatus.SUCCEEDED, raw: { path: ["refundRequired"], equals: true } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, amount: true, updatedAt: true, order: { select: { orderNumber: true } } },
    });
    for (const payment of refunds) {
      notices.push({
        id: `refund-${payment.id}`,
        kind: "refund",
        title: "Geri qaytarılmalı ödəniş",
        detail: `${payment.order.orderNumber ?? ""} · ${payment.amount.toFixed(2)} ₼`,
        to: "/admin/payments",
        createdAt: payment.updatedAt,
      });
    }
  }

  if (hasPermission(role, "inventory:write")) {
    const empty = await prisma.product.findMany({
      where: { isActive: true, stock: { lte: 0 } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, name: true, updatedAt: true },
    });
    for (const product of empty) {
      notices.push({ id: `stock-${product.id}-${product.updatedAt.getTime()}`, kind: "stock", title: "Stok bitdi", detail: product.name, to: `/admin/products/${product.id}`, createdAt: product.updatedAt });
    }
  }

  if (hasPermission(role, "reviews:moderate")) {
    const reviews = await prisma.review.findMany({
      where: { createdAt: { gte: week } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, rating: true, createdAt: true, product: { select: { name: true } } },
    });
    for (const review of reviews) {
      notices.push({ id: `review-${review.id}`, kind: "review", title: `Yeni rəy · ${review.rating}★`, detail: review.product.name, to: "/admin/reviews", createdAt: review.createdAt });
    }
  }

  if (hasPermission(role, "reviews:moderate")) {
    const questions = await prisma.productQuestion.findMany({
      where: { answer: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, question: true, createdAt: true, product: { select: { name: true } } },
    });
    for (const item of questions) {
      notices.push({ id: `question-${item.id}`, kind: "review", title: `Yeni sual · ${item.product.name}`, detail: item.question.slice(0, 80), to: "/admin/questions", createdAt: item.createdAt });
    }
  }

  if (hasPermission(role, "emails:read")) {
    const where = { status: EmailStatus.FAILED, createdAt: { gte: week } };
    const [failed, latest] = await Promise.all([
      prisma.emailLog.count({ where }),
      prisma.emailLog.findFirst({ where, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    ]);
    if (failed > 0 && latest) {
      notices.push({ id: `email-failed-${failed}`, kind: "email", title: "Göndərilməyən e-poçtlar", detail: `Son 7 gündə ${failed} e-poçt göndərilmədi`, to: "/admin/emails?status=FAILED", createdAt: latest.createdAt });
    }
  }

  notices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  res.json({ items: notices.slice(0, 20) });
});

const OPTIMIZE_BATCH = 20;

export const optimizeImagesSchema = z.object({ cursor: z.string().trim().min(1).max(64).optional() });

export const optimizeStoredImages = asyncHandler(async (req, res) => {
  const { cursor } = req.body as z.infer<typeof optimizeImagesSchema>;
  const candidates = await prisma.upload.findMany({
    where: { mimeType: { in: ["image/png", "image/jpeg"] } },
    orderBy: { id: "asc" },
    take: OPTIMIZE_BATCH,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: { id: true, data: true, size: true },
  });
  let converted = 0;
  let savedBytes = 0;
  let skipped = 0;
  for (const upload of candidates) {
    try {
      const result = await optimizeImage(Buffer.from(upload.data));
      if (result.mimeType !== "image/webp" || result.data.length >= upload.size) {
        skipped += 1;
        continue;
      }
      await prisma.upload.update({ where: { id: upload.id }, data: { data: result.data, mimeType: result.mimeType, size: result.data.length } });
      converted += 1;
      savedBytes += upload.size - result.data.length;
    } catch {
      skipped += 1;
    }
  }
  const nextCursor = candidates.length === OPTIMIZE_BATCH ? candidates[candidates.length - 1].id : null;
  audit(req, "uploads.optimize", "Upload", null, { converted, savedBytes, skipped });
  res.json({ converted, savedBytes, skipped, nextCursor });
});
