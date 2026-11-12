import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  checkCoupon,
  createAddress,
  createCoupon,
  deleteAddress,
  deleteCoupon,
  listAddresses,
  listCoupons,
  reportClientError,
  serveUpload,
  sitemap,
  subscribeStockAlert,
  updateAddress,
  updateCoupon,
  uploadImage,
} from "../controllers/extra.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../models/common.model";
import { addressSchema, clientErrorSchema, couponCheckSchema, couponCreateSchema, couponUpdateSchema, uploadSchema } from "../models/extra.model";

export const extraRouter = Router();

const errorLimiter = rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false });

extraRouter.get("/sitemap.xml", sitemap);
extraRouter.post("/client-errors", errorLimiter, validate({ body: clientErrorSchema }), reportClientError);
extraRouter.get("/uploads/:id", validate({ params: idParamSchema }), serveUpload);
extraRouter.post("/uploads", authenticate, requirePermission("products:write"), validate({ body: uploadSchema }), uploadImage);

extraRouter.post("/coupons/check", authenticate, validate({ body: couponCheckSchema }), checkCoupon);
extraRouter.get("/admin/coupons", authenticate, requirePermission("products:write"), listCoupons);
extraRouter.post("/admin/coupons", authenticate, requirePermission("products:write"), validate({ body: couponCreateSchema }), createCoupon);
extraRouter.patch("/admin/coupons/:id", authenticate, requirePermission("products:write"), validate({ params: idParamSchema, body: couponUpdateSchema }), updateCoupon);
extraRouter.delete("/admin/coupons/:id", authenticate, requirePermission("products:write"), validate({ params: idParamSchema }), deleteCoupon);

extraRouter.get("/addresses", authenticate, listAddresses);
extraRouter.post("/addresses", authenticate, validate({ body: addressSchema }), createAddress);
extraRouter.patch("/addresses/:id", authenticate, validate({ params: idParamSchema, body: addressSchema.partial() }), updateAddress);
extraRouter.delete("/addresses/:id", authenticate, validate({ params: idParamSchema }), deleteAddress);

extraRouter.post("/products/:id/stock-alert", authenticate, validate({ params: idParamSchema }), subscribeStockAlert);
