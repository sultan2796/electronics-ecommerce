import { Router } from "express";
import {
  getAdminProduct,
  getStats,
  importProducts,
  listInventory,
  listOrders,
  updateOrderStatus,
  updateStock,
} from "../controllers/admin.controller";
import {
  getUserDetail,
  listUsers, updateUser } from "../controllers/user.controller";
import { listAllReviews } from "../controllers/review.controller";
import { listEmails } from "../controllers/email.controller";
import { adminReviewQuerySchema } from "../models/review.model";
import { EmailStatus } from "@prisma/client";
import { z } from "zod";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../models/common.model";
import { adminOrdersQuerySchema, catalogImportSchema, inventoryQuerySchema, orderStatusSchema } from "../models/order.model";
import { stockUpdateSchema } from "../models/product.model";
import { userQuerySchema, userUpdateSchema } from "../models/user.model";

import { adminPaymentsQuerySchema, adminSearch, adminSearchQuerySchema, adminNotifications, listPayments, markPaymentRefunded, optimizeImagesSchema, optimizeStoredImages } from "../controllers/adminExtra.controller";

export const adminRouter = Router();

adminRouter.use(authenticate, requirePermission("dashboard:read"));

adminRouter.get("/stats", getStats);
adminRouter.get("/notifications", adminNotifications);
adminRouter.post("/uploads/optimize", requirePermission("settings:write"), validate({ body: optimizeImagesSchema }), optimizeStoredImages);
adminRouter.get("/search", validate({ query: adminSearchQuerySchema }), adminSearch);
adminRouter.get("/payments", requirePermission("orders:read"), validate({ query: adminPaymentsQuerySchema }), listPayments);
adminRouter.post("/payments/:id/refunded", requirePermission("orders:write"), validate({ params: idParamSchema }), markPaymentRefunded);

adminRouter.get("/orders", requirePermission("orders:read"), validate({ query: adminOrdersQuerySchema }), listOrders);
adminRouter.patch(
  "/orders/:id/status",
  requirePermission("orders:write"),
  validate({ params: idParamSchema, body: orderStatusSchema }),
  updateOrderStatus,
);

adminRouter.get("/inventory", requirePermission("inventory:write"), validate({ query: inventoryQuerySchema }), listInventory);
adminRouter.get("/products/:id", requirePermission("products:write"), validate({ params: idParamSchema }), getAdminProduct);
adminRouter.patch(
  "/products/:id/stock",
  requirePermission("inventory:write"),
  validate({ params: idParamSchema, body: stockUpdateSchema }),
  updateStock,
);
adminRouter.post("/import", requirePermission("catalog:import"), validate({ body: catalogImportSchema }), importProducts);

adminRouter.get("/users", requirePermission("users:read"), validate({ query: userQuerySchema }), listUsers);
adminRouter.get("/users/:id", requirePermission("users:read"), validate({ params: idParamSchema }), getUserDetail);
adminRouter.patch("/users/:id", requirePermission("users:write"), validate({ params: idParamSchema, body: userUpdateSchema }), updateUser);
adminRouter.get("/reviews", requirePermission("reviews:moderate"), validate({ query: adminReviewQuerySchema }), listAllReviews);
adminRouter.get(
  "/emails",
  requirePermission("emails:read"),
  validate({
    query: z.object({
      q: z.string().trim().optional(),
      status: z.nativeEnum(EmailStatus).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
  }),
  listEmails,
);
