import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { productInclude } from "./product.service";

export const cartInclude = {
  items: { include: { product: { include: productInclude } }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export const formatCart = (cart: CartWithItems) => ({
  id: cart.id,
  items: cart.items,
  itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
  subtotal: cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0),
});

const sanitizeCart = async (cart: CartWithItems) => {
  const unavailable = cart.items.filter((item) => !item.product.isActive || item.product.stock === 0);
  const overStock = cart.items.filter(
    (item) => item.product.isActive && item.product.stock > 0 && item.quantity > item.product.stock,
  );
  if (!unavailable.length && !overStock.length) return false;

  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { id: { in: unavailable.map((item) => item.id) } } }),
    ...overStock.map((item) =>
      prisma.cartItem.update({ where: { id: item.id }, data: { quantity: item.product.stock } }),
    ),
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
