import { Prisma } from "@prisma/client";
import { shippingConfig } from "../services/shipping.service";
import { apiPublicUrl, clientUrl } from "../config/env";
import { prisma } from "../config/prisma";
import { assertCouponUsable, calculateDiscount, normalizeCode } from "../services/coupon.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { currentUser } from "../utils/currentUser";
import { audit } from "../services/audit.service";

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export const checkCoupon = asyncHandler(async (req, res) => {
  const userId = currentUser(req).id;
  const cart = await prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: true } } } });
  const subtotal = (cart?.items ?? []).reduce((sum, item) => sum.add(item.product.price.mul(item.quantity)), new Prisma.Decimal(0));
  const coupon = assertCouponUsable(await prisma.coupon.findUnique({ where: { code: normalizeCode(req.body.code) } }), subtotal);
  const discount = calculateDiscount(coupon, subtotal);
  res.json({ code: coupon.code, type: coupon.type, value: coupon.value, discount, subtotal, total: subtotal.sub(discount) });
});

export const listCoupons = asyncHandler(async (_req, res) => {
  res.json(await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }));
});

export const createCoupon = asyncHandler(async (req, res) => {
  res.status(201).json(await prisma.coupon.create({ data: { ...req.body, code: normalizeCode(req.body.code) } }));
  audit(req, "coupon.create", "Coupon", req.params.id ?? null, req.body);
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const data = { ...req.body, ...(req.body.code && { code: normalizeCode(req.body.code) }) };
  res.json(await prisma.coupon.update({ where: { id: req.params.id }, data }));
  audit(req, "coupon.update", "Coupon", req.params.id ?? null, req.body);
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.status(204).end();
  audit(req, "coupon.delete", "Coupon", req.params.id ?? null, req.body);
});

export const listAddresses = asyncHandler(async (req, res) => {
  res.json(await prisma.address.findMany({ where: { userId: currentUser(req).id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }));
});

export const createAddress = asyncHandler(async (req, res) => {
  const userId = currentUser(req).id;
  const count = await prisma.address.count({ where: { userId } });
  if (count >= 10) throw new AppError(400, "Ən çox 10 ünvan saxlamaq olar");
  const isDefault = req.body.isDefault || count === 0;
  const address = await prisma.$transaction(async (tx) => {
    if (isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return tx.address.create({ data: { ...req.body, userId, isDefault } });
  });
  res.status(201).json(address);
});

export const updateAddress = asyncHandler(async (req, res) => {
  const userId = currentUser(req).id;
  const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId } });
  if (!existing) throw new AppError(404, "Ünvan tapılmadı");
  const address = await prisma.$transaction(async (tx) => {
    if (req.body.isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return tx.address.update({ where: { id: existing.id }, data: req.body });
  });
  res.json(address);
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const deleted = await prisma.address.deleteMany({ where: { id: req.params.id, userId: currentUser(req).id } });
  if (!deleted.count) throw new AppError(404, "Ünvan tapılmadı");
  res.status(204).end();
});

export const subscribeStockAlert = asyncHandler(async (req, res) => {
  const userId = currentUser(req).id;
  const product = await prisma.product.findFirst({ where: { OR: [{ id: req.params.id }, { slug: req.params.id }] }, select: { id: true } });
  if (!product) throw new AppError(404, "Məhsul tapılmadı");
  await prisma.stockAlert.upsert({
    where: { productId_userId: { productId: product.id, userId } },
    update: { notifiedAt: null },
    create: { productId: product.id, userId },
  });
  res.status(201).json({ message: "Stoka gələndə e-poçtla xəbər verəcəyik" });
});

export const uploadImage = asyncHandler(async (req, res) => {
  const [meta, base64] = (req.body.dataUrl as string).split(",");
  const mimeType = meta.slice(5, meta.indexOf(";"));
  const data = Buffer.from(base64, "base64");
  if (data.length > MAX_UPLOAD_BYTES) throw new AppError(413, "Şəkil 2 MB-dan böyük olmamalıdır");
  const upload = await prisma.upload.create({ data: { mimeType, data, size: data.length } });
  res.status(201).json({ id: upload.id, url: `${apiPublicUrl}/api/uploads/${upload.id}` });
});

const MAX_MODEL_BYTES = 10 * 1024 * 1024;

export const storeConfig = asyncHandler(async (_req, res) => {
  res.set("Cache-Control", "public, max-age=300");
  res.json(shippingConfig());
});

export const uploadModel = asyncHandler(async (req, res) => {
  const data = req.body;
  if (!Buffer.isBuffer(data) || data.length < 20) throw new AppError(400, "GLB faylı göndərilməyib");
  if (data.length > MAX_MODEL_BYTES) throw new AppError(413, "3D model 10 MB-dan böyük olmamalıdır");
  if (data.toString("ascii", 0, 4) !== "glTF" || data.readUInt32LE(4) !== 2) {
    throw new AppError(400, "Fayl düzgün GLB (glTF 2.0) formatında deyil");
  }
  if (data.readUInt32LE(8) !== data.length) throw new AppError(400, "GLB faylı zədələnib");
  const upload = await prisma.upload.create({ data: { mimeType: "model/gltf-binary", data, size: data.length } });
  res.status(201).json({ id: upload.id, url: `${apiPublicUrl}/api/uploads/${upload.id}.glb`, size: data.length });
});

export const serveUpload = asyncHandler(async (req, res) => {
  const upload = await prisma.upload.findUnique({ where: { id: req.params.id } });
  if (!upload) throw new AppError(404, "Şəkil tapılmadı");
  res.setHeader("Content-Type", upload.mimeType);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.send(Buffer.from(upload.data));
});

export const sitemap = asyncHandler(async (_req, res) => {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);
  const urls = [
    `<url><loc>${clientUrl}/</loc><priority>1.0</priority></url>`,
    `<url><loc>${clientUrl}/products</loc><priority>0.9</priority></url>`,
    ...categories.map((c) => `<url><loc>${clientUrl}/products?category=${c.slug}</loc><priority>0.8</priority></url>`),
    ...products.map((p) => `<url><loc>${clientUrl}/products/${p.slug}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod><priority>0.7</priority></url>`),
  ];
  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`);
});

export const reportClientError = asyncHandler(async (req, res) => {
  console.error("[client-error]", JSON.stringify({ ...req.body, userAgent: req.headers["user-agent"] }));
  res.status(204).end();
});
