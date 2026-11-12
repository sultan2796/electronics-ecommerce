import { AsyncLocalStorage } from "async_hooks";
import { RequestHandler } from "express";

export type Locale = "az" | "ru" | "en";
export const locales: Locale[] = ["az", "ru", "en"];

const storage = new AsyncLocalStorage<Locale>();

export const resolveLocale = (value: unknown): Locale => {
  const raw = String(value ?? "").toLowerCase().slice(0, 2);
  return (locales as string[]).includes(raw) ? (raw as Locale) : "az";
};

export const localeMiddleware: RequestHandler = (req, _res, next) => {
  const locale = resolveLocale(req.headers["x-locale"] ?? req.query.lang);
  storage.run(locale, next);
};

export const currentLocale = (): Locale => storage.getStore() ?? "az";
