import { Router } from "express";
import { deleteReview } from "../controllers/review.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../models/common.model";

export const reviewRouter = Router();

reviewRouter.delete("/:id", authenticate, validate({ params: idParamSchema }), deleteReview);
