import { prisma } from "../config/prisma";
import { productInclude } from "../services/product.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { currentUser } from "../utils/currentUser";

const listFor = (userId: string) =>
  prisma.wishlistItem.findMany({
    where: { userId, product: { isActive: true } },
    include: { product: { include: productInclude } },
    orderBy: { createdAt: "desc" },
  });

export const getWishlist = asyncHandler(async (req, res) => {
  res.json(await listFor(currentUser(req).id));
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const userId = currentUser(req).id;
  const { productId } = req.params;
  const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
  if (!product) throw new AppError(404, "Məhsul tapılmadı");

  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
  res.status(201).json(await listFor(userId));
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const userId = currentUser(req).id;
  await prisma.wishlistItem.deleteMany({ where: { userId, productId: req.params.productId } });
  res.json(await listFor(userId));
});
