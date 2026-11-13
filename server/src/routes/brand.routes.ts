import { Router } from "express";
import { createBrand, deleteBrand, listBrands, updateBrand } from "../controllers/brand.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { brandCreateSchema, brandUpdateSchema } from "../models/brand.model";
import { idParamSchema } from "../models/common.model";

export const brandRouter = Router();

brandRouter.get("/", listBrands);
brandRouter.post("/", authenticate, requirePermission("categories:write"), validate({ body: brandCreateSchema }), createBrand);
brandRouter.patch(
  "/:id",
  authenticate,
  requirePermission("categories:write"),
  validate({ params: idParamSchema, body: brandUpdateSchema }),
  updateBrand,
);
brandRouter.delete("/:id", authenticate, requirePermission("categories:write"), validate({ params: idParamSchema }), deleteBrand);
