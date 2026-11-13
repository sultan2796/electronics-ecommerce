import { Router } from "express";
import { getSettings, settingsSchema, updateSettings } from "../controllers/settings.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";

export const settingsRouter = Router();

settingsRouter.get("/settings", getSettings);
settingsRouter.put("/admin/settings", authenticate, requirePermission("settings:write"), validate({ body: settingsSchema }), updateSettings);
