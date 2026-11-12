import { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ message: `${req.originalUrl} ünvanı tapılmadı` });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message, details: err.details });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ message: "Bu resurs artıq mövcuddur", details: err.meta });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ message: "Resurs tapılmadı" });
      return;
    }
  }
  console.error(err);
  res.status(500).json({ message: "Daxili server xətası" });
};
