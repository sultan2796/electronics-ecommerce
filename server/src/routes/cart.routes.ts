import { z } from "zod";
import { Router } from "express";
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from "../controllers/cart.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { addCartItemSchema, updateCartItemSchema } from "../models/order.model";

const cartItemParamSchema = z.object({ itemId: z.string().min(1).max(64) });

export const cartRouter = Router();

cartRouter.use(authenticate);
cartRouter.get("/", getCart);
cartRouter.post("/items", validate({ body: addCartItemSchema }), addCartItem);
cartRouter.patch("/items/:itemId", validate({ params: cartItemParamSchema, body: updateCartItemSchema }), updateCartItem);
cartRouter.delete("/items/:itemId", validate({ params: cartItemParamSchema }), removeCartItem);
cartRouter.delete("/", clearCart);
