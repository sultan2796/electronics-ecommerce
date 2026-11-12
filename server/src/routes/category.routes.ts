import { Router } from "express";
import { createCategory, deleteCategory, listCategories, updateCategory } from "../controllers/category.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../models/common.model";
import { categoryCreateSchema, categoryUpdateSchema } from "../models/product.model";

export const categoryRouter = Router();

categoryRouter.get("/", listCategories);
categoryRouter.post("/", authenticate, requirePermission("categories:write"), validate({ body: categoryCreateSchema }), createCategory);
categoryRouter.patch(
  "/:id",
  authenticate,
  requirePermission("categories:write"),
  validate({ params: idParamSchema, body: categoryUpdateSchema }),
  updateCategory,
);
categoryRouter.delete("/:id", authenticate, requirePermission("categories:write"), validate({ params: idParamSchema }), deleteCategory);
