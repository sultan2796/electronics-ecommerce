import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { audit } from "../services/audit.service";

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  res.json(categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await prisma.category.create({ data: req.body });
  res.status(201).json(category);
  audit(req, "category.create", "Category", req.params.id ?? null, req.body);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
  res.json(category);
  audit(req, "category.update", "Category", req.params.id ?? null, req.body);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const productCount = await prisma.product.count({ where: { categoryId: req.params.id } });
  if (productCount > 0) {
    throw new AppError(409, `Bu kateqoriyada ${productCount} məhsul var. Əvvəlcə məhsulları başqa kateqoriyaya keçirin.`);
  }
  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).end();
  audit(req, "category.delete", "Category", req.params.id ?? null, req.body);
});
