import { localeMiddleware } from "./config/locale";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { corsOrigins } from "./config/env";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { apiRouter } from "./routes";

export const createApp = () => {
  const app = express();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true, exposedHeaders: ["X-Server-Time"] }));
  app.use((_req, res, next) => {
    res.setHeader("X-Server-Time", String(Date.now()));
    next();
  });
  app.use(localeMiddleware);
  app.use(express.json({ limit: "3mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api", apiRouter);
  app.use("/", apiRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
