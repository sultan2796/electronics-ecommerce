import { Router } from "express";
import { addToWishlist, getWishlist, removeFromWishlist } from "../controllers/wishlist.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { productIdParamSchema } from "../models/common.model";

export const wishlistRouter = Router();

wishlistRouter.use(authenticate);
wishlistRouter.get("/", getWishlist);
wishlistRouter.post("/:productId", validate({ params: productIdParamSchema }), addToWishlist);
wishlistRouter.delete("/:productId", validate({ params: productIdParamSchema }), removeFromWishlist);
