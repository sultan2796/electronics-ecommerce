import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { productInclude } from "./product.service";
import { variantPrice, withPricing } from "./campaign.service";

export const cartInclude = {
  items: { include: { product: { include: productInclude }, variant: true }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export const formatCart = (cart: CartWithItems) => {
  const items = cart.items.map((item) => {
    const product = withPricing(item.product);
    const variant = item.variant;
    const lineProduct = variant
      ? { ...product, ...variantPrice(item.product, variant), stock: variant.stock, images: variant.images.length ? variant.images : product.images }
      : product;
    return {
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      createdAt: item.createdAt,
      variant: variant ? { id: variant.id, name: variant.name, color: variant.color, colorHex: variant.colorHex, size: variant.size, sku: variant.sku } : null,
      product: lineProduct,
    };
  });
  return {
    id: cart.id,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: Math.round(items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0) * 100) / 100,
  };
};

const lineStock = (item: CartWithItems["items"][number]) => (item.variant ? item.variant.stock : item.product.stock);

const lineUnavailable = (item: CartWithItems["items"][number]) => {
  if (!item.product.isActive) return true;
  if (item.variant) return !item.variant.isActive || item.variant.stock === 0;
  if (item.product.variants.length > 0) return true;
  return item.product.stock === 0;
};

const sanitizeCart = async (cart: CartWithItems) => {
  const unavailable = cart.items.filter(lineUnavailable);
  const overStock = cart.items.filter((item) => !lineUnavailable(item) && item.quantity > lineStock(item));
  if (!unavailable.length && !overStock.length) return false;

  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { id: { in: unavailable.map((item) => item.id) } } }),
    ...overStock.map((item) => prisma.cartItem.update({ where: { id: item.id }, data: { quantity: lineStock(item) } })),
  ]);
  return true;
};

export const getOrCreateCart = async (userId: string) => {
  const cart = await prisma.cart.upsert({ where: { userId }, update: {}, create: { userId }, include: cartInclude });
  if (await sanitizeCart(cart)) {
    return prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude });
  }
  return cart;
};
