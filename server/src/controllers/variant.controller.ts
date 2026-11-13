import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { VariantListInput } from "../models/variant.model";
import { audit } from "../services/audit.service";
import { notifyBackInStock } from "../services/stockAlert.service";
import { adminProductInclude } from "../services/product.service";
import { syncProductStock } from "../services/variant.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export const replaceVariants = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const { variants } = req.body as VariantListInput;
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) throw new AppError(404, "Məhsul tapılmadı");

  const updated = await prisma
    .$transaction(async (tx) => {
      const existing = await tx.productVariant.findMany({ where: { productId }, select: { id: true } });
      const existingIds = new Set(existing.map((variant) => variant.id));
      const foreign = variants.find((variant) => variant.id && !existingIds.has(variant.id));
      if (foreign) throw new AppError(400, "Variant bu məhsula aid deyil");
      const keepIds = variants.flatMap((variant) => (variant.id ? [variant.id] : []));
      await tx.productVariant.deleteMany({ where: { productId, id: { notIn: keepIds } } });

      for (const [index, variant] of variants.entries()) {
        const { id, ...rest } = variant;
        const data = { ...rest, price: rest.price ?? null, salePrice: rest.salePrice ?? null, sortOrder: index };
        if (id) await tx.productVariant.update({ where: { id }, data });
        else await tx.productVariant.create({ data: { ...data, productId } });
      }
      await syncProductStock(tx, productId);
      return tx.product.findUniqueOrThrow({ where: { id: productId }, include: adminProductInclude });
    })
    .catch((error: unknown) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(409, "Bu SKU artıq başqa variantda istifadə olunur");
      }
      throw error;
    });

  if (updated.stock > 0) void notifyBackInStock(updated.id);
  audit(req, "product.variants", "Product", productId, { count: variants.length });
  res.json(updated);
});
