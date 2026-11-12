import { Router } from "express";
import { z } from "zod";
import {
  completeMockPayment,
  epointCallback,
  getMockPayment,
  getOrderPaymentStatus,
  getPaymentConfig,
} from "../controllers/payment.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

export const paymentRouter = Router();

const referenceParam = z.object({ reference: z.string().min(1) });

paymentRouter.get("/config", getPaymentConfig);
paymentRouter.post("/epoint/callback", epointCallback);
paymentRouter.get("/order/:orderId", authenticate, validate({ params: z.object({ orderId: z.string().min(1) }) }), getOrderPaymentStatus);
paymentRouter.get("/mock/:reference", authenticate, validate({ params: referenceParam }), getMockPayment);
paymentRouter.post(
  "/mock/:reference/complete",
  authenticate,
  validate({ params: referenceParam, body: z.object({ outcome: z.enum(["succeeded", "failed"]) }) }),
  completeMockPayment,
);
