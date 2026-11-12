import { Request } from "express";
import { AppError } from "./AppError";

export const currentUser = (req: Request) => {
  if (!req.user) {
    throw new AppError(401, "Giriş tələb olunur");
  }
  return req.user;
};
