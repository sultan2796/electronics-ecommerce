import { Router } from "express";
import rateLimit from "express-rate-limit";
import { guestCheckout, guestCheckoutSchema, trackOrder, trackParamsSchema, trackQuerySchema } from "../controllers/guestOrder.controller";
import { validate } from "../middleware/validate";

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Çox sayda cəhd. Bir az sonra yenidən yoxlayın." },
});

const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Çox sayda sorğu. Bir az sonra yenidən yoxlayın." },
});

export const guestOrderRouter = Router();

guestOrderRouter.post("/guest-orders", checkoutLimiter, validate({ body: guestCheckoutSchema }), guestCheckout);
guestOrderRouter.get("/track/:orderNumber", trackLimiter, validate({ params: trackParamsSchema, query: trackQuerySchema }), trackOrder);
