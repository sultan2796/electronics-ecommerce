import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { audit } from "../services/audit.service";
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
  const role = currentUser(req).role;
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
