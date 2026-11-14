import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { adminQuestionQuerySchema } from "../models/review.model";
import { audit } from "../services/audit.service";
import { displayName, resolveProduct } from "../services/review.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { currentUser } from "../utils/currentUser";

const MAX_OPEN_PER_USER = 5;

const publicQuestion = (question: {
  id: string;
  question: string;
  answer: string | null;
  answeredAt: Date | null;
  createdAt: Date;
  userId: string;
  user: { name: string };
}) => ({
  id: question.id,
  question: question.question,
  answer: question.answer,
  answeredAt: question.answeredAt,
  createdAt: question.createdAt,
  userId: question.userId,
  author: displayName(question.user.name),
});

export const listQuestions = asyncHandler(async (req, res) => {
  const product = await resolveProduct(req.params.id);
  const viewerId = req.user?.id;
  const items = await prisma.productQuestion.findMany({
    where: {
      productId: product.id,
      isPublished: true,
      OR: [{ answer: { not: null } }, ...(viewerId ? [{ userId: viewerId }] : [])],
    },
    orderBy: [{ answeredAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
    take: 50,
    include: { user: { select: { name: true } } },
  });
  res.json({ items: items.map(publicQuestion) });
});

export const askQuestion = asyncHandler(async (req, res) => {
  const user = currentUser(req);
  const product = await resolveProduct(req.params.id);
  const open = await prisma.productQuestion.count({ where: { userId: user.id, answer: null } });
  if (open >= MAX_OPEN_PER_USER) throw new AppError(429, "Cavab gözləyən çox sualınız var. Cavablandıqdan sonra yenisini verin.");
  const question = await prisma.productQuestion.create({
    data: { productId: product.id, userId: user.id, question: (req.body as { question: string }).question },
    include: { user: { select: { name: true } } },
  });
  res.status(201).json(publicQuestion(question));
});

export const deleteOwnQuestion = asyncHandler(async (req, res) => {
  const user = currentUser(req);
  const removed = await prisma.productQuestion.deleteMany({ where: { id: req.params.id, userId: user.id, answer: null } });
  if (removed.count === 0) throw new AppError(404, "Sual tapılmadı və ya artıq cavablandırılıb");
  res.status(204).end();
});

export const adminListQuestions = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query as unknown as z.infer<typeof adminQuestionQuerySchema>;
  const where: Prisma.ProductQuestionWhereInput =
    status === "open" ? { answer: null } : status === "answered" ? { answer: { not: null } } : {};
  const [items, total, openCount] = await Promise.all([
    prisma.productQuestion.findMany({
      where,
      orderBy: { createdAt: status === "open" ? "asc" : "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
        answeredBy: { select: { name: true } },
      },
    }),
    prisma.productQuestion.count({ where }),
    prisma.productQuestion.count({ where: { answer: null } }),
  ]);
  res.json({ items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)), openCount });
});

export const adminUpdateQuestion = asyncHandler(async (req, res) => {
  const { answer, isPublished } = req.body as { answer?: string; isPublished?: boolean };
  const staff = currentUser(req);
  const updated = await prisma.productQuestion
    .update({
      where: { id: req.params.id },
      data: {
        ...(answer !== undefined && { answer, answeredById: staff.id, answeredAt: new Date() }),
        ...(isPublished !== undefined && { isPublished }),
      },
    })
    .catch(() => {
      throw new AppError(404, "Sual tapılmadı");
    });
  audit(req, "question.update", "ProductQuestion", updated.id, { answered: answer !== undefined, isPublished });
  res.json(updated);
});

export const adminDeleteQuestion = asyncHandler(async (req, res) => {
  await prisma.productQuestion.delete({ where: { id: req.params.id } }).catch(() => {
    throw new AppError(404, "Sual tapılmadı");
  });
  audit(req, "question.delete", "ProductQuestion", req.params.id ?? null);
  res.status(204).end();
});
