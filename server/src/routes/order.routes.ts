import { Router } from "express";
import { cancelOrder, checkout, getOrder, listMyOrders, payOrder } from "../controllers/order.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../models/common.model";
import { checkoutSchema } from "../models/order.model";

export const orderRouter = Router();

orderRouter.use(authenticate);
orderRouter.post("/checkout", validate({ body: checkoutSchema }), checkout);
orderRouter.get("/", listMyOrders);
orderRouter.get("/:id", validate({ params: idParamSchema }), getOrder);
orderRouter.post("/:id/cancel", validate({ params: idParamSchema }), cancelOrder);
orderRouter.post("/:id/pay", validate({ params: idParamSchema }), payOrder);
