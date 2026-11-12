import { Router } from "express";
import { changePassword, login, logout, me, refresh, register, updateProfile } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";
import { validate } from "../middleware/validate";
import { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema } from "../models/auth.model";

export const authRouter = Router();

authRouter.post("/register", authLimiter, validate({ body: registerSchema }), register);
authRouter.post("/login", authLimiter, validate({ body: loginSchema }), login);
authRouter.post("/refresh", authLimiter, refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", authenticate, me);
authRouter.patch("/me", authenticate, validate({ body: updateProfileSchema }), updateProfile);
authRouter.post("/change-password", authLimiter, authenticate, validate({ body: changePasswordSchema }), changePassword);
