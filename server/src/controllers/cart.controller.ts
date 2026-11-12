import { prisma } from "../config/prisma";
import { AddCartItemInput } from "../models/order.model";
import { formatCart, getOrCreateCart } from "../services/cart.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { currentUser } from "../utils/currentUser";

const findSellableProduct = async (productId: string) => {
  const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
  if (!product) throw new AppError(404, "Məhsul tapılmadı");
  return product;
};

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(currentUser(req).id);
  res.json(formatCart(cart));
});

export const addCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body as AddCartItemInput;
  const product = await findSellableProduct(productId);
  const cart = await getOrCreateCart(currentUser(req).id);
  const existing = cart.items.find((item) => item.productId === productId);
  const nextQuantity = (existing?.quantity ?? 0) + quantity;

  if (nextQuantity > product.stock) throw new AppError(409, `Stokda yalnız ${product.stock} ədəd var`);

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: nextQuantity },
    create: { cartId: cart.id, productId, quantity },
  });
  res.status(201).json(formatCart(await getOrCreateCart(cart.userId)));
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body as { quantity: number };
  const cart = await getOrCreateCart(currentUser(req).id);

  if (quantity === 0) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  } else {
    const product = await findSellableProduct(productId);
    if (quantity > product.stock) throw new AppError(409, `Stokda yalnız ${product.stock} ədəd var`);
    await prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { quantity },
    });
  }
  res.json(formatCart(await getOrCreateCart(cart.userId)));
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(currentUser(req).id);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId: req.params.productId } });
  res.json(formatCart(await getOrCreateCart(cart.userId)));
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(currentUser(req).id);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  res.json(formatCart(await getOrCreateCart(cart.userId)));
});
