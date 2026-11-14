import { Prisma } from "@prisma/client";
import { hasPermission } from "../config/permissions";
import { prisma } from "../config/prisma";
import { ReviewBody } from "../models/review.model";
import { displayName, hasPurchased, recalculateRating, resolveProduct, reviewSummary } from "../services/review.service";
import { deleteReviewPhotos, prepareReviewPhotos, resolveReviewPhotos } from "../services/reviewPhotos.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { currentUser } from "../utils/currentUser";

const orderByFor = (sort: string): Prisma.ReviewOrderByWithRelationInput[] => {
  if (sort === "highest") return [{ rating: "desc" }, { createdAt: "desc" }];
  if (sort === "lowest") return [{ rating: "asc" }, { createdAt: "desc" }];
  return [{ createdAt: "desc" }];
};

const publicReview = (review: { id: string; rating: number; title: string | null; comment: string; images: string[]; createdAt: Date; updatedAt: Date; userId: string; user: { name: string } }) => ({
  id: review.id,
  rating: review.rating,
  title: review.title,
  comment: review.comment,
  images: review.images,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
  userId: review.userId,
  author: displayName(review.user.name),
});

export const listReviews = asyncHandler(async (req, res) => {
  const product = await resolveProduct(req.params.id);
  const { sort, page, limit, rating } = req.query as unknown as { sort: string; page: number; limit: number; rating?: number };
  const where = { productId: product.id, ...(rating && { rating }) };
  const [items, total, summary] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: orderByFor(sort),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
    reviewSummary(product.id),
  ]);
  res.json({ items: items.map(publicReview), total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)), summary });
});

export const myReviewStatus = asyncHandler(async (req, res) => {
  const user = currentUser(req);
  const product = await resolveProduct(req.params.id);
  const [purchased, review] = await Promise.all([
    hasPurchased(user.id, product.id),
    prisma.review.findUnique({ where: { productId_userId: { productId: product.id, userId: user.id } }, include: { user: { select: { name: true } } } }),
  ]);
  res.json({ canReview: purchased, hasPurchased: purchased, review: review ? publicReview(review) : null });
});

export const upsertReview = asyncHandler(async (req, res) => {
  const user = currentUser(req);
  const product = await resolveProduct(req.params.id);
  const { rating, title, comment, images } = req.body as ReviewBody;

  if (!(await hasPurchased(user.id, product.id))) {
    throw new AppError(403, "Rəyi yalnız bu məhsulu almış (ödənilmiş sifarişi olan) müştərilər yaza bilər");
  }

  const prepared = await prepareReviewPhotos(images);
  const review = await prisma.$transaction(async (tx) => {
    const existing = await tx.review.findUnique({ where: { productId_userId: { productId: product.id, userId: user.id } }, select: { images: true } });
    const photos = await resolveReviewPhotos(tx, prepared, existing?.images ?? []);
    const saved = await tx.review.upsert({
      where: { productId_userId: { productId: product.id, userId: user.id } },
      update: { rating, title: title || null, comment, images: photos.images },
      create: { productId: product.id, userId: user.id, rating, title: title || null, comment, images: photos.images },
      include: { user: { select: { name: true } } },
    });
    await recalculateRating(product.id, tx);
    return saved;
  });

  res.status(201).json(publicReview(review));
});

export const deleteReview = asyncHandler(async (req, res) => {
  const user = currentUser(req);
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) throw new AppError(404, "Rəy tapılmadı");
  if (review.userId !== user.id && !hasPermission(user, "reviews:moderate")) {
    throw new AppError(403, "Bu rəyi silmək üçün icazəniz yoxdur");
  }
  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: review.id } });
    await deleteReviewPhotos(tx, review.images);
    await recalculateRating(review.productId, tx);
  });
  res.status(204).end();
});

export const listAllReviews = asyncHandler(async (req, res) => {
  const { rating, q, page, limit } = req.query as unknown as { rating?: number; q?: string; page: number; limit: number };
  const where: Prisma.ReviewWhereInput = {
    ...(rating && { rating }),
    ...(q && {
      OR: [
        { comment: { contains: q, mode: "insensitive" } },
        { product: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };
  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { user: { select: { name: true, email: true } }, product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);
  res.json({ items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
});
