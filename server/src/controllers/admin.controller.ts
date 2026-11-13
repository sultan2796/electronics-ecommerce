import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { importCatalog } from "../services/catalogImport.service";
import { notifyOrderStatus, orderInclude, recordOrderStatus, restockAndCancel } from "../services/order.service";
import { adminProductInclude, productInclude } from "../services/product.service";

const adminOrderInclude = { ...orderInclude, user: { select: { name: true, email: true } } } satisfies Prisma.OrderInclude;
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { notifyBackInStock } from "../services/stockAlert.service";
import { audit } from "../services/audit.service";
import { awardPoints } from "../services/loyalty.service";

const LOW_STOCK_THRESHOLD = 5;
const revenueStatuses = [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.PAID, OrderStatus.CANCELLED],
  PAID: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

const CHART_DAYS = 14;

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

export const getStats = asyncHandler(async (_req, res) => {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (CHART_DAYS - 1));

  const [
    productCount,
    inactiveCount,
    lowStockCount,
    outOfStockCount,
    userCount,
    ordersByStatus,
    revenue,
    recentOrders,
    recentOrderRows,
    topSelling,
    lowStockProducts,
    categories,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: false } }),
    prisma.product.count({ where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } } }),
    prisma.product.count({ where: { isActive: true, stock: { lte: 0 } } }),
    prisma.user.count(),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.aggregate({ where: { status: { in: revenueStatuses } }, _sum: { total: true }, _count: { _all: true } }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: adminOrderInclude,
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { not: OrderStatus.CANCELLED } },
      select: { createdAt: true, total: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { status: { not: OrderStatus.CANCELLED } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
      orderBy: [{ stock: "asc" }, { name: "asc" }],
      take: 6,
      select: { id: true, name: true, stock: true, images: true, category: { select: { slug: true } } },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { name: true, slug: true, _count: { select: { products: { where: { isActive: true } } } } },
    }),
  ]);

  const salesMap = new Map<string, { revenue: number; orders: number }>();
  for (let offset = 0; offset < CHART_DAYS; offset += 1) {
    const day = new Date(since);
    day.setUTCDate(since.getUTCDate() + offset);
    salesMap.set(dayKey(day), { revenue: 0, orders: 0 });
  }
  for (const row of recentOrderRows) {
    const bucket = salesMap.get(dayKey(row.createdAt));
    if (bucket) {
      bucket.revenue += Number(row.total);
      bucket.orders += 1;
    }
  }

  const topProductRecords = await prisma.product.findMany({
    where: { id: { in: topSelling.map((row) => row.productId) } },
    select: { id: true, name: true, price: true, images: true, category: { select: { slug: true } } },
  });

  const statusCounts = Object.fromEntries(ordersByStatus.map((row) => [row.status, row._count._all]));
  const totalOrders = ordersByStatus.reduce((sum, row) => sum + row._count._all, 0);
  const revenueTotal = Number(revenue._sum.total ?? 0);

  res.json({
    productCount,
    inactiveCount,
    lowStockCount,
    outOfStockCount,
    userCount,
    totalOrders,
    revenue: revenueTotal,
    averageOrderValue: revenue._count._all ? revenueTotal / revenue._count._all : 0,
    ordersByStatus: statusCounts,
    salesByDay: [...salesMap.entries()].map(([date, value]) => ({ date, ...value })),
    topProducts: topSelling.flatMap((row) => {
      const product = topProductRecords.find((record) => record.id === row.productId);
      return product ? [{ ...product, sold: row._sum.quantity ?? 0 }] : [];
    }),
    lowStockProducts,
    categories: categories
      .map((category) => ({ name: category.name, slug: category.slug, products: category._count.products }))
      .filter((category) => category.products > 0),
    recentOrders,
  });
});

export const getAdminProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id }, include: adminProductInclude });
  if (!product) throw new AppError(404, "Məhsul tapılmadı");
  res.json(product);
});

export const listOrders = asyncHandler(async (req, res) => {
  const { status, q, userId, page, limit } = req.query as unknown as {
    status?: OrderStatus;
    q?: string;
    userId?: string;
    page: number;
    limit: number;
  };
  const where: Prisma.OrderWhereInput = {
    ...(status && { status }),
    ...(userId && { userId }),
    ...(q && {
      OR: [
        { orderNumber: { contains: q, mode: "insensitive" } },
        { id: { endsWith: q.replace(/^#/, ""), mode: "insensitive" } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { guestEmail: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: adminOrderInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
});

export const nextStatusesFor = (status: OrderStatus, paymentMethod: PaymentMethod) => {
  const base = allowedTransitions[status];
  if (status === OrderStatus.PENDING && paymentMethod === PaymentMethod.CASH_ON_DELIVERY) {
    return [OrderStatus.PROCESSING, ...base];
  }
  return base;
};

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body as { status: OrderStatus };

  const order = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, "Sifariş tapılmadı");
    if (!nextStatusesFor(existing.status, existing.paymentMethod).includes(status)) {
      throw new AppError(409, `${existing.status} statusundan ${status} statusuna keçid mümkün deyil`);
    }
    if (status === OrderStatus.CANCELLED) {
      await restockAndCancel(tx, existing.id, existing.status);
    } else {
      const marksPaid =
        status === OrderStatus.PAID ||
        (status === OrderStatus.DELIVERED && existing.paymentMethod === PaymentMethod.CASH_ON_DELIVERY);
      const moved = await tx.order.updateMany({ where: { id: existing.id, status: existing.status }, data: { status } });
      if (moved.count === 0) throw new AppError(409, "Sifarişin statusu artıq dəyişib. Səhifəni yeniləyin.");
      await tx.order.update({
        where: { id: existing.id },
        data: {
          status,
          ...(marksPaid && existing.paymentStatus !== PaymentStatus.SUCCEEDED && { paymentStatus: PaymentStatus.SUCCEEDED, paidAt: new Date() }),
        },
      });
      await recordOrderStatus(tx, existing.id, status);
      if (status === OrderStatus.DELIVERED) await awardPoints(tx, existing.id);
    }
    return tx.order.findUniqueOrThrow({ where: { id: existing.id }, include: adminOrderInclude });
  });

  void notifyOrderStatus(order.id, status);
  audit(req, "order.status", "Order", order.id, { status });
  res.json(order);
});

export const listInventory = asyncHandler(async (req, res) => {
  const { q, lowStock, page, limit, model } = req.query as unknown as {
    q?: string;
    lowStock: boolean;
    page: number;
    limit: number;
    model?: "with" | "without";
  };
  const where: Prisma.ProductWhereInput = {
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(lowStock && { stock: { lte: LOW_STOCK_THRESHOLD } }),
    ...(model === "with" && { model3dUrl: { not: null } }),
    ...(model === "without" && { model3dUrl: null }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: [{ stock: "asc" }, { name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
});

export const updateStock = asyncHandler(async (req, res) => {
  const { stock } = req.body as { stock: number };
  if (await prisma.productVariant.count({ where: { productId: req.params.id, isActive: true } })) {
    throw new AppError(409, "Bu məhsulun variantları var. Stoku variantlar üzrə dəyişin.");
  }
  const product = await prisma.product.update({ where: { id: req.params.id }, data: { stock }, include: productInclude });
  if (stock > 0) void notifyBackInStock(product.id);
  audit(req, "product.stock", "Product", product.id, { name: product.name, stock });
  res.json(product);
});

export const importProducts = asyncHandler(async (req, res) => {
  const { replaceDemo } = req.body as { replaceDemo: boolean };
  res.json(await importCatalog({ replaceDemo }));
});
