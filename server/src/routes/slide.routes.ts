import { Router } from "express";
import {
  createSlide,
  deleteSlide,
  listActiveSlides,
  listSlides,
  reorderSlides,
  slideOrderSchema,
  slideSchema,
  slideUpdateSchema,
  updateSlide,
} from "../controllers/slide.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../models/common.model";

export const slideRouter = Router();

slideRouter.get("/slides", listActiveSlides);
slideRouter.get("/admin/slides", authenticate, requirePermission("products:write"), listSlides);
slideRouter.post("/admin/slides", authenticate, requirePermission("products:write"), validate({ body: slideSchema }), createSlide);
slideRouter.put("/admin/slides/order", authenticate, requirePermission("products:write"), validate({ body: slideOrderSchema }), reorderSlides);
slideRouter.patch("/admin/slides/:id", authenticate, requirePermission("products:write"), validate({ params: idParamSchema, body: slideUpdateSchema }), updateSlide);
slideRouter.delete("/admin/slides/:id", authenticate, requirePermission("products:write"), validate({ params: idParamSchema }), deleteSlide);
