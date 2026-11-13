import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  API_PUBLIC_URL: z.string().optional(),
  PAYMENT_PROVIDER: z.enum(["mock", "epoint", "none"]).default("mock"),
  EPOINT_PUBLIC_KEY: z.string().optional(),
  EPOINT_PRIVATE_KEY: z.string().optional(),
  EPOINT_API_URL: z.string().default("https://epoint.az/api/1"),
  UNPAID_ORDER_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  GUEST_ORDER_TTL_HOURS: z.coerce.number().int().positive().default(48),
  EMAIL_PROVIDER: z.enum(["console", "resend"]).default("console"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("ElectroShop <onboarding@resend.dev>"),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  GOOGLE_CLIENT_ID: z.string().optional(),
  ADMIN_EMAIL: z.string().trim().min(1).optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
  SHIPPING_FEE: z.coerce.number().min(0).max(1000).default(0),
  FREE_SHIPPING_MIN: z.coerce.number().min(0).max(100000).default(100),
  AUTO_IMPORT_CATALOG: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
export const corsOrigins = env.CLIENT_URL.split(",").map((origin) => origin.trim()).filter(Boolean);
export const clientUrl = corsOrigins[0] ?? "http://localhost:5173";
export const apiPublicUrl = env.API_PUBLIC_URL ?? `http://localhost:${env.PORT}`;
