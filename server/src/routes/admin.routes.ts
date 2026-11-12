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
import { listUsers, updateUser } from "../controllers/user.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../models/common.model";
import { adminOrdersQuerySchema, catalogImportSchema, inventoryQuerySchema, orderStatusSchema } from "../models/order.model";
import { stockUpdateSchema } from "../models/product.model";
import { userQuerySchema, userUpdateSchema } from "../models/user.model";

export const adminRouter = Router();

adminRouter.use(authenticate, requirePermission("dashboard:read"));

adminRouter.get("/stats", getStats);

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
adminRouter.patch("/users/:id", requirePermission("users:write"), validate({ params: idParamSchema, body: userUpdateSchema }), updateUser);
