import { z } from "zod";
import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  googleLogin,
  login,
  logout,
  me,
  refresh,
  register,
  resetPassword,
  updateProfile,
  uploadAvatar,
  removeAvatar,
  validateResetToken,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";
import { validate } from "../middleware/validate";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  resetTokenQuerySchema,
  updateProfileSchema,
} from "../models/auth.model";

const avatarSchema = z.object({ dataUrl: z.string().max(1_500_000) });

export const authRouter = Router();

authRouter.post("/register", authLimiter, validate({ body: registerSchema }), register);
authRouter.post("/login", authLimiter, validate({ body: loginSchema }), login);
authRouter.post("/refresh", authLimiter, refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", authenticate, me);
authRouter.patch("/me", authenticate, validate({ body: updateProfileSchema }), updateProfile);
authRouter.put("/me/avatar", authLimiter, authenticate, validate({ body: avatarSchema }), uploadAvatar);
authRouter.delete("/me/avatar", authenticate, removeAvatar);
authRouter.post("/change-password", authLimiter, authenticate, validate({ body: changePasswordSchema }), changePassword);
authRouter.post("/google", authLimiter, validate({ body: z.object({ credential: z.string().min(20).max(5000) }) }), googleLogin);
authRouter.post("/forgot-password", authLimiter, validate({ body: forgotPasswordSchema }), forgotPassword);
authRouter.get("/reset-password/validate", authLimiter, validate({ query: resetTokenQuerySchema }), validateResetToken);
authRouter.post("/reset-password", authLimiter, validate({ body: resetPasswordSchema }), resetPassword);
