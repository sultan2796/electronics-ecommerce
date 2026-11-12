import { CookieOptions, Response } from "express";
import bcrypt from "bcryptjs";
import { Role, User } from "@prisma/client";
import { env, isProduction } from "../config/env";
import { permissionsFor } from "../config/permissions";
import { prisma } from "../config/prisma";
import { ChangePasswordInput, LoginInput, RegisterInput } from "../models/auth.model";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { currentUser } from "../utils/currentUser";
import { generateRefreshToken, hashToken, signAccessToken } from "../utils/jwt";

const REFRESH_COOKIE = "refreshToken";
const refreshTtlMs = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
const BLOCKED_MESSAGE = "Hesabınız bloklanıb. Dəstək xidməti ilə əlaqə saxlayın.";

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/api/auth",
};

export const toPublicUser = (user: User) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  permissions: permissionsFor(user.role),
});

const issueTokens = async (res: Response, user: { id: string; role: Role }) => {
  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: { tokenHash: hashToken(refreshToken), userId: user.id, expiresAt: new Date(Date.now() + refreshTtlMs) },
  });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...baseCookieOptions, maxAge: refreshTtlMs });
  return signAccessToken({ sub: user.id, role: user.role });
};

export const revokeAllSessions = (userId: string) =>
  prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });

export const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body as RegisterInput;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, "Bu e-poçt artıq qeydiyyatdadır");

  const user = await prisma.user.create({
    data: { email, name, passwordHash: await bcrypt.hash(password, 12), lastLoginAt: new Date() },
  });
  const accessToken = await issueTokens(res, user);
  res.status(201).json({ user: toPublicUser(user), accessToken });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body as LoginInput;
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !valid) throw new AppError(401, "E-poçt və ya şifrə yanlışdır");
  if (user.isBlocked) throw new AppError(403, BLOCKED_MESSAGE);

  const updated = await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const accessToken = await issueTokens(res, updated);
  res.json({ user: toPublicUser(updated), accessToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const token: string | undefined = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new AppError(401, "Sessiya tapılmadı");

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date() || stored.user.isBlocked) {
    if (stored && (stored.revokedAt || stored.user.isBlocked)) await revokeAllSessions(stored.userId);
    res.clearCookie(REFRESH_COOKIE, baseCookieOptions);
    throw new AppError(401, stored?.user.isBlocked ? BLOCKED_MESSAGE : "Sessiyanın vaxtı bitib");
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  const accessToken = await issueTokens(res, stored.user);
  res.json({ user: toPublicUser(stored.user), accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  const token: string | undefined = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  res.clearCookie(REFRESH_COOKIE, baseCookieOptions);
  res.status(204).end();
});

export const me = asyncHandler(async (req, res) => {
  const { id } = currentUser(req);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(404, "İstifadəçi tapılmadı");
  res.json({ user: toPublicUser(user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { id } = currentUser(req);
  const { name } = req.body as { name: string };
  const user = await prisma.user.update({ where: { id }, data: { name } });
  res.json({ user: toPublicUser(user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { id } = currentUser(req);
  const { currentPassword, newPassword } = req.body as ChangePasswordInput;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new AppError(400, "Hazırkı şifrə yanlışdır");
  }

  const updated = await prisma.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
  await revokeAllSessions(id);
  const accessToken = await issueTokens(res, updated);
  res.json({ user: toPublicUser(updated), accessToken });
});
