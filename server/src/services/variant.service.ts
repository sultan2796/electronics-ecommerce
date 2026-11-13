import { Prisma, ProductVariant } from "@prisma/client";
import { AppError } from "../utils/AppError";

type Client = Prisma.TransactionClient;
type BaseProduct = { id: string; name: string; price: Prisma.Decimal; salePrice: Prisma.Decimal | null; categoryId: string; isActive: boolean };
type VariantLike = Pick<ProductVariant, "id" | "name" | "price" | "salePrice" | "isActive" | "productId">;

export const variantKeyOf = (variantId?: string | null) => variantId ?? "";

export const pricedSource = <P extends BaseProduct>(product: P, variant?: VariantLike | null) =>
  variant && variant.price !== null
    ? { ...product, price: variant.price, salePrice: variant.salePrice }
    : product;

export const lineName = (product: { name: string }, variant?: { name: string } | null) =>
  variant ? `${product.name} — ${variant.name}` : product.name;

export const resolveVariant = async (tx: Client, product: BaseProduct, variantId?: string | null) => {
  const activeCount = await tx.productVariant.count({ where: { productId: product.id, isActive: true } });
  if (!variantId) {
    if (activeCount > 0) throw new AppError(400, `${product.name} üçün variant seçin`);
    return null;
  }
  const variant = await tx.productVariant.findFirst({ where: { id: variantId, productId: product.id } });
  if (!variant || !variant.isActive) throw new AppError(409, `${product.name} üçün seçilmiş variant artıq mövcud deyil`);
  return variant;
};

export const reserveStock = async (tx: Client, product: BaseProduct, variant: VariantLike | null, quantity: number) => {
  if (variant) {
    const taken = await tx.productVariant.updateMany({
      where: { id: variant.id, productId: product.id, isActive: true, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (taken.count === 0) throw new AppError(409, `${lineName(product, variant)} üçün kifayət qədər stok yoxdur`);
    await syncProductStock(tx, product.id);
    return;
  }
  const reserved = await tx.product.updateMany({
    where: { id: product.id, stock: { gte: quantity } },
    data: { stock: { decrement: quantity } },
  });
  if (reserved.count === 0) throw new AppError(409, `${product.name} üçün kifayət qədər stok yoxdur`);
};

export const releaseStock = async (tx: Client, productId: string, variantId: string | null, quantity: number) => {
  if (variantId) {
    const restored = await tx.productVariant.updateMany({ where: { id: variantId, productId }, data: { stock: { increment: quantity } } });
    if (restored.count > 0) {
      await syncProductStock(tx, productId);
      return;
    }
  }
  await tx.product.update({ where: { id: productId }, data: { stock: { increment: quantity } } });
};

export const syncProductStock = async (tx: Client, productId: string) => {
  const variants = await tx.productVariant.findMany({ where: { productId, isActive: true }, select: { stock: true } });
  if (!variants.length) return;
  const stock = variants.reduce((sum, variant) => sum + variant.stock, 0);
  await tx.product.update({ where: { id: productId }, data: { stock } });
};
