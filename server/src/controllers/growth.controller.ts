import { OrderStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { audit } from "../services/audit.service";
import { refreshCampaigns } from "../services/campaign.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export const campaignSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    discountPercent: z.number().int().min(1).max(90),
    categoryId: z.string().min(1).nullable().optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    isActive: z.boolean().default(true),
  })
  .refine((value) => value.endsAt > value.startsAt, { message: "Bitmə vaxtı başlanğıcdan sonra olmalıdır", path: ["endsAt"] });

export const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  action: z.enum(["setStock", "adjustStock", "adjustPrice", "activate", "deactivate", "setCategory"]),
  value: z.union([z.number(), z.string()]).optional(),
});

export const reportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const auditQuerySchema = z.object({
  entity: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const activeCampaigns = asyncHandler(async (_req, res) => {
  const campaigns = await refreshCampaigns();
  const categories = await prisma.category.findMany({ where: { id: { in: campaigns.map((c) => c.categoryId).filter((id): id is string => Boolean(id)) } }, select: { id: true, name: true, slug: true } });
  res.json(campaigns.map((campaign) => ({ ...campaign, category: categories.find((c) => c.id === campaign.categoryId) ?? null })));
});

export const listCampaigns = asyncHandler(async (_req, res) => {
  res.json(await prisma.campaign.findMany({ include: { category: { select: { id: true, name: true } } }, orderBy: { startsAt: "desc" } }));
});

export const createCampaign = asyncHandler(async (req, res) => {
  const campaign = await prisma.campaign.create({ data: req.body });
  await refreshCampaigns();
  audit(req, "campaign.create", "Campaign", campaign.id, req.body);
  res.status(201).json(campaign);
});

export const updateCampaign = asyncHandler(async (req, res) => {
  const campaign = await prisma.campaign.update({ where: { id: req.params.id }, data: req.body });
  await refreshCampaigns();
  audit(req, "campaign.update", "Campaign", campaign.id, req.body);
  res.json(campaign);
});

export const deleteCampaign = asyncHandler(async (req, res) => {
  await prisma.campaign.delete({ where: { id: req.params.id } });
  await refreshCampaigns();
  audit(req, "campaign.delete", "Campaign", req.params.id);
  res.status(204).end();
});

export const bulkProducts = asyncHandler(async (req, res) => {
  const { ids, action, value } = req.body as z.infer<typeof bulkSchema>;
  const number = Number(value);
  const where = { id: { in: ids } };
  let count = 0;
  if (action === "activate" || action === "deactivate") {
    count = (await prisma.product.updateMany({ where, data: { isActive: action === "activate" } })).count;
  } else if (action === "setStock") {
    if (!Number.isInteger(number) || number < 0) throw new AppError(400, "Stok 0 və ya müsbət tam ədəd olmalıdır");
    count = (await prisma.product.updateMany({ where, data: { stock: number } })).count;
  } else if (action === "adjustStock") {
    if (!Number.isInteger(number)) throw new AppError(400, "Tam ədəd daxil edin");
    count = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where, select: { id: true, stock: true } });
      for (const product of products) await tx.product.update({ where: { id: product.id }, data: { stock: Math.max(0, product.stock + number) } });
      return products.length;
    });
  } else if (action === "adjustPrice") {
    if (!Number.isFinite(number) || number <= -90 || number > 500) throw new AppError(400, "Faiz -90 ilə 500 arasında olmalıdır");
    count = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where, select: { id: true, price: true } });
      for (const product of products) {
        const price = product.price.mul(100 + number).div(100).toDecimalPlaces(2);
        await tx.product.update({ where: { id: product.id }, data: { price: Prisma.Decimal.max(price, new Prisma.Decimal(0.01)) } });
      }
      return products.length;
    });
  } else if (action === "setCategory") {
    const category = await prisma.category.findUnique({ where: { id: String(value) } });
    if (!category) throw new AppError(404, "Kateqoriya tapılmadı");
    count = (await prisma.product.updateMany({ where, data: { categoryId: category.id } })).count;
  }
  audit(req, `product.bulk.${action}`, "Product", null, { ids, value });
  res.json({ updated: count });
});

const PAID_STATUSES = [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

const reportRange = (query: { from?: Date; to?: Date }) => {
  const to = query.to ?? new Date();
  const from = query.from ?? new Date(to.getFullYear(), to.getMonth() - 11, 1);
  return { from, to };
};

export const salesReport = asyncHandler(async (req, res) => {
  const { from, to } = reportRange(req.query as never);
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lte: to }, status: { in: PAID_STATUSES } },
    select: { total: true, discount: true, createdAt: true, items: { select: { productName: true, quantity: true, unitPrice: true } } },
  });
  const months = new Map<string, { month: string; revenue: number; orders: number; discount: number }>();
  for (let cursor = new Date(from.getFullYear(), from.getMonth(), 1); cursor <= to; cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    months.set(key, { month: key, revenue: 0, orders: 0, discount: 0 });
  }
  const products = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const order of orders) {
    const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = months.get(key);
    if (bucket) {
      bucket.revenue += Number(order.total);
      bucket.orders += 1;
      bucket.discount += Number(order.discount);
    }
    for (const item of order.items) {
      const row = products.get(item.productName) ?? { name: item.productName, quantity: 0, revenue: 0 };
      row.quantity += item.quantity;
      row.revenue += Number(item.unitPrice) * item.quantity;
      products.set(item.productName, row);
    }
  }
  const monthly = [...months.values()].map((m) => ({ ...m, revenue: Math.round(m.revenue * 100) / 100, discount: Math.round(m.discount * 100) / 100 }));
  const revenue = monthly.reduce((sum, m) => sum + m.revenue, 0);
  const count = monthly.reduce((sum, m) => sum + m.orders, 0);
  res.json({
    from,
    to,
    totals: { revenue: Math.round(revenue * 100) / 100, orders: count, averageOrderValue: count ? Math.round((revenue / count) * 100) / 100 : 0 },
    monthly,
    topProducts: [...products.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
  });
});

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export const salesCsv = asyncHandler(async (req, res) => {
  const { from, to } = reportRange(req.query as never);
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lte: to } },
    include: { user: { select: { name: true, email: true } }, items: true },
    orderBy: { createdAt: "desc" },
  });
  const header = ["Sifariş", "Tarix", "Müştəri", "E-poçt", "Status", "Ödəniş", "Məhsullar", "Ara cəm", "Endirim", "Kupon", "Bal", "Cəmi"];
  const rows = orders.map((order) => [
    order.id.slice(-8).toUpperCase(),
    order.createdAt.toISOString().replace("T", " ").slice(0, 16),
    order.user.name,
    order.user.email,
    order.status,
    order.paymentMethod,
    order.items.map((item) => `${item.productName} x${item.quantity}`).join(" | "),
    Number(order.subtotal).toFixed(2),
    Number(order.discount).toFixed(2),
    order.couponCode ?? "",
    order.pointsUsed,
    Number(order.total).toFixed(2),
  ]);
  const csv = "﻿" + [header, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="sifarisler-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

export const listAuditLogs = asyncHandler(async (req, res) => {
  const { entity, page, limit } = req.query as unknown as z.infer<typeof auditQuerySchema>;
  const where: Prisma.AuditLogWhereInput = entity ? { entity } : {};
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({ where, include: { user: { select: { name: true, email: true, role: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.auditLog.count({ where }),
  ]);
  res.json({ items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
});
