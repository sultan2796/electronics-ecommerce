import { Router } from "express";
import {
  createPromotion,
  deletePromotion,
  listLivePromotions,
  listPromotions,
  promotionEventSchema,
  promotionOrderSchema,
  promotionQuerySchema,
  promotionSchema,
  promotionUpdateSchema,
  recordPromotionEvents,
  reorderPromotions,
  updatePromotion,
} from "../controllers/promotion.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { eventLimiter } from "../middleware/rateLimit";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../models/common.model";

export const promotionRouter = Router();

const admin = [authenticate, requirePermission("products:write")];

promotionRouter.get("/promotions", validate({ query: promotionQuerySchema }), listLivePromotions);
promotionRouter.post("/promotions/events", eventLimiter, validate({ body: promotionEventSchema }), recordPromotionEvents);

promotionRouter.get("/admin/promotions", ...admin, listPromotions);
promotionRouter.post("/admin/promotions", ...admin, validate({ body: promotionSchema }), createPromotion);
promotionRouter.put("/admin/promotions/order", ...admin, validate({ body: promotionOrderSchema }), reorderPromotions);
promotionRouter.patch("/admin/promotions/:id", ...admin, validate({ params: idParamSchema, body: promotionUpdateSchema }), updatePromotion);
promotionRouter.delete("/admin/promotions/:id", ...admin, validate({ params: idParamSchema }), deletePromotion);
