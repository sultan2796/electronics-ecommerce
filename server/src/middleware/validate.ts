import { RequestHandler } from "express";
import { ZodError, ZodTypeAny } from "zod";
import { AppError } from "../utils/AppError";

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError(400, "Validasiya xətası", error.flatten()));
        return;
      }
      next(error);
    }
  };
