import { Router } from "express";
import {
  auditQuerySchema,
  bulkProducts,
  bulkSchema,
  listAuditLogs,
  reportQuerySchema,
  salesCsv,
  salesReport,
} from "../controllers/growth.controller";
import { relatedProducts } from "../controllers/product.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../models/common.model";

export const growthRouter = Router();

growthRouter.get("/products/:id/related", validate({ params: idParamSchema }), relatedProducts);

growthRouter.post("/admin/products/bulk", authenticate, requirePermission("products:write"), validate({ body: bulkSchema }), bulkProducts);
growthRouter.get("/admin/reports/sales", authenticate, requirePermission("dashboard:read"), validate({ query: reportQuerySchema }), salesReport);
growthRouter.get("/admin/reports/sales.csv", authenticate, requirePermission("orders:read"), validate({ query: reportQuerySchema }), salesCsv);
growthRouter.get("/admin/audit", authenticate, requirePermission("users:read"), validate({ query: auditQuerySchema }), listAuditLogs);

