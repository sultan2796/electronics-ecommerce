import { RequestHandler } from "express";
import { corsOrigins } from "../config/env";
import { AppError } from "../utils/AppError";

export const sameOrigin: RequestHandler = (req, _res, next) => {
  const origin = req.get("origin");
  if (!origin || corsOrigins.includes(origin)) {
    next();
    return;
  }
  next(new AppError(403, "İcazəsiz mənbə"));
};
