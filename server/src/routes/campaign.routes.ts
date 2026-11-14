import { Router } from "express";
import {
  activeCampaigns,
  campaignDetail,
  campaignSchema,
  campaignStats,
  campaignUpdateSchema,
  createCampaign,
  deleteCampaign,
  fridayCampaign,
  listCampaigns,
  updateCampaign,
} from "../controllers/campaign.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../models/common.model";

export const campaignRouter = Router();

const admin = [authenticate, requirePermission("products:write")];

campaignRouter.get("/campaigns/active", activeCampaigns);
campaignRouter.get("/campaigns/friday", fridayCampaign);
campaignRouter.get("/campaigns/:id", validate({ params: idParamSchema }), campaignDetail);

campaignRouter.get("/admin/campaigns", ...admin, listCampaigns);
campaignRouter.post("/admin/campaigns", ...admin, validate({ body: campaignSchema }), createCampaign);
campaignRouter.get("/admin/campaigns/:id/stats", ...admin, validate({ params: idParamSchema }), campaignStats);
campaignRouter.patch("/admin/campaigns/:id", ...admin, validate({ params: idParamSchema, body: campaignUpdateSchema }), updateCampaign);
campaignRouter.delete("/admin/campaigns/:id", ...admin, validate({ params: idParamSchema }), deleteCampaign);
