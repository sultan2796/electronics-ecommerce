import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL_SECONDS });

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

export const generateRefreshToken = (): string => crypto.randomBytes(48).toString("hex");

export const hashToken = (token: string): string => crypto.createHash("sha256").update(token).digest("hex");
