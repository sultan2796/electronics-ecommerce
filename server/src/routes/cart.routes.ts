import { Router } from "express";
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from "../controllers/cart.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { productIdParamSchema } from "../models/common.model";
import { addCartItemSchema, updateCartItemSchema } from "../models/order.model";

export const cartRouter = Router();

cartRouter.use(authenticate);
cartRouter.get("/", getCart);
cartRouter.post("/items", validate({ body: addCartItemSchema }), addCartItem);
cartRouter.patch("/items/:productId", validate({ params: productIdParamSchema, body: updateCartItemSchema }), updateCartItem);
cartRouter.delete("/items/:productId", validate({ params: productIdParamSchema }), removeCartItem);
cartRouter.delete("/", clearCart);
