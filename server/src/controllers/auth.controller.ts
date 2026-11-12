import crypto from "crypto";
import { CookieOptions, Response } from "express";
import bcrypt from "bcryptjs";
import { Role, User } from "@prisma/client";
import { clientUrl, env, isProduction } from "../config/env";
import { permissionsFor } from "../config/permissions";
import { prisma } from "../config/prisma";
import { ChangePasswordInput, LoginInput, RegisterInput } from "../models/auth.model";
import { queueEmail } from "../services/email";
import { passwordChangedEmail, passwordResetEmail, welcomeEmail } from "../services/email/templates";
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
  queueEmail({ ...welcomeEmail(user), to: user.email, userId: user.id });
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
  queueEmail({ ...passwordChangedEmail(updated), to: updated.email, userId: updated.id });
  res.json({ user: toPublicUser(updated), accessToken });
});

const RESET_MESSAGE = "Əgər bu e-poçt qeydiyyatdadırsa, şifrə bərpası linki göndərildi. Poçt qutunuzu yoxlayın.";

const findValidResetToken = async (token: string) => {
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;
  return record;
};

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body as { email: string };
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && !user.isBlocked) {
    const token = crypto.randomBytes(32).toString("hex");
    const ttl = env.PASSWORD_RESET_TTL_MINUTES;
    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
      prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + ttl * 60 * 1000) },
      }),
    ]);
    queueEmail({ ...passwordResetEmail(user, `${clientUrl}/reset-password?token=${token}`, ttl), to: user.email, userId: user.id });
  }

  res.json({ message: RESET_MESSAGE });
});

export const validateResetToken = asyncHandler(async (req, res) => {
  const { token } = req.query as { token: string };
  res.json({ valid: Boolean(await findValidResetToken(token)) });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body as { token: string; password: string };
  const record = await findValidResetToken(token);
  if (!record) throw new AppError(400, "Link etibarsızdır və ya vaxtı bitib. Yeni link istəyin.");
  if (record.user.isBlocked) throw new AppError(403, BLOCKED_MESSAGE);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await bcrypt.hash(password, 12) } }),
    prisma.passwordResetToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.refreshToken.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  queueEmail({ ...passwordChangedEmail(record.user), to: record.user.email, userId: record.userId });

  res.json({ message: "Şifrəniz yeniləndi. İndi yeni şifrə ilə daxil ola bilərsiniz." });
});
