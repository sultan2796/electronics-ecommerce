import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { audit } from "../services/audit.service";
import { brandSlug } from "../services/brand.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { BrandCreateInput, BrandUpdateInput } from "../models/brand.model";

const duplicateGuard = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new AppError(409, "Bu adda və ya slug-da brend artıq var");
  }
  throw error;
};

export const listBrands = asyncHandler(async (req, res) => {
  const includeInactive = req.query.all === "1";
  const brands = await prisma.brand.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  res.json(brands);
});

export const createBrand = asyncHandler(async (req, res) => {
  const data = req.body as BrandCreateInput;
  const clash = await prisma.brand.findFirst({ where: { name: { equals: data.name, mode: "insensitive" } }, select: { id: true } });
  if (clash) throw new AppError(409, "Bu adda brend artıq var");
  const brand = await prisma.brand
    .create({ data: { ...data, slug: data.slug || brandSlug(data.name) } })
    .catch(duplicateGuard);
  res.status(201).json(brand);
  audit(req, "brand.create", "Brand", brand.id, req.body);
});

export const updateBrand = asyncHandler(async (req, res) => {
  const data = req.body as BrandUpdateInput;
  const current = await prisma.brand.findUnique({ where: { id: req.params.id } });
  if (!current) throw new AppError(404, "Brend tapılmadı");
  if (data.name) {
    const clash = await prisma.brand.findFirst({
      where: { id: { not: current.id }, name: { equals: data.name, mode: "insensitive" } },
      select: { id: true },
    });
    if (clash) throw new AppError(409, "Bu adda brend artıq var");
  }
  const brand = await prisma
    .$transaction(async (tx) => {
      const updated = await tx.brand.update({ where: { id: current.id }, data });
      if (data.name && data.name !== current.name) {
        await tx.product.updateMany({ where: { brandId: current.id }, data: { brand: data.name } });
      }
      return updated;
    })
    .catch(duplicateGuard);
  res.json(brand);
  audit(req, "brand.update", "Brand", brand.id, req.body);
});

export const deleteBrand = asyncHandler(async (req, res) => {
  const productCount = await prisma.product.count({ where: { brandId: req.params.id } });
  if (productCount > 0) {
    throw new AppError(409, `Bu brendə bağlı ${productCount} məhsul var. Əvvəlcə məhsulları başqa brendə keçirin və ya brendi deaktiv edin.`);
  }
  await prisma.brand.delete({ where: { id: req.params.id } }).catch(() => {
    throw new AppError(404, "Brend tapılmadı");
  });
  res.status(204).end();
  audit(req, "brand.delete", "Brand", req.params.id ?? null);
});
