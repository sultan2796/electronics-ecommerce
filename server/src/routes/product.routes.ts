import { Router } from "express";
import {
  compareProducts,
  createProduct,
  deleteProduct,
  featuredProducts,
  getProduct,
  listProducts,
  productFacets,
  updateProduct,
} from "../controllers/product.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../models/common.model";
import { reviewBodySchema, reviewListQuerySchema } from "../models/review.model";
import { listReviews, myReviewStatus, upsertReview } from "../controllers/review.controller";
import {
  compareQuerySchema,
  facetsQuerySchema,
  featuredQuerySchema,
  productCreateSchema,
  productQuerySchema,
  productUpdateSchema,
} from "../models/product.model";

export const productRouter = Router();

productRouter.get("/", validate({ query: productQuerySchema }), listProducts);
productRouter.get("/featured", validate({ query: featuredQuerySchema }), featuredProducts);
productRouter.get("/facets", validate({ query: facetsQuerySchema }), productFacets);
productRouter.get("/compare", validate({ query: compareQuerySchema }), compareProducts);
productRouter.get("/:id", validate({ params: idParamSchema }), getProduct);
productRouter.get("/:id/reviews", validate({ params: idParamSchema, query: reviewListQuerySchema }), listReviews);
productRouter.get("/:id/reviews/me", authenticate, validate({ params: idParamSchema }), myReviewStatus);
productRouter.post("/:id/reviews", authenticate, validate({ params: idParamSchema, body: reviewBodySchema }), upsertReview);

productRouter.post("/", authenticate, requirePermission("products:write"), validate({ body: productCreateSchema }), createProduct);
productRouter.patch(
  "/:id",
  authenticate,
  requirePermission("products:write"),
  validate({ params: idParamSchema, body: productUpdateSchema }),
  updateProduct,
);
productRouter.delete("/:id", authenticate, requirePermission("products:write"), validate({ params: idParamSchema }), deleteProduct);
