import { prisma } from "../config/prisma";
import { AddCartItemInput } from "../models/order.model";
import { formatCart, getOrCreateCart } from "../services/cart.service";
import { lineName, resolveVariant, variantKeyOf } from "../services/variant.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { currentUser } from "../utils/currentUser";

const findSellableProduct = async (productId: string) => {
  const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
  if (!product) throw new AppError(404, "Məhsul tapılmadı");
  return product;
};

const availableStock = (product: { stock: number }, variant: { stock: number } | null) => (variant ? variant.stock : product.stock);

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(currentUser(req).id);
  res.json(formatCart(cart));
});

export const addCartItem = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity } = req.body as AddCartItemInput;
  const product = await findSellableProduct(productId);
  const variant = await prisma.$transaction((tx) => resolveVariant(tx, product, variantId));
  const cart = await getOrCreateCart(currentUser(req).id);
  const variantKey = variantKeyOf(variant?.id);
  const existing = cart.items.find((item) => item.productId === productId && item.variantKey === variantKey);
  const nextQuantity = (existing?.quantity ?? 0) + quantity;
  const stock = availableStock(product, variant);

  if (nextQuantity > stock) throw new AppError(409, `${lineName(product, variant)}: stokda yalnız ${stock} ədəd var`);

  await prisma.cartItem.upsert({
    where: { cartId_productId_variantKey: { cartId: cart.id, productId, variantKey } },
    update: { quantity: nextQuantity },
    create: { cartId: cart.id, productId, variantId: variant?.id ?? null, variantKey, quantity },
  });
  await prisma.cart.update({ where: { id: cart.id }, data: { remindedAt: null } });
  res.status(201).json(formatCart(await getOrCreateCart(cart.userId)));
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body as { quantity: number };
  const cart = await getOrCreateCart(currentUser(req).id);
  const item = cart.items.find((entry) => entry.id === itemId);
  if (!item) throw new AppError(404, "Səbətdə belə məhsul yoxdur");

  if (quantity === 0) {
    await prisma.cartItem.deleteMany({ where: { id: item.id, cartId: cart.id } });
  } else {
    const product = await findSellableProduct(item.productId);
    const stock = availableStock(product, item.variant);
    if (quantity > stock) throw new AppError(409, `${lineName(product, item.variant)}: stokda yalnız ${stock} ədəd var`);
    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  }
  res.json(formatCart(await getOrCreateCart(cart.userId)));
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(currentUser(req).id);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, id: req.params.itemId } });
  res.json(formatCart(await getOrCreateCart(cart.userId)));
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(currentUser(req).id);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  res.json(formatCart(await getOrCreateCart(cart.userId)));
});
