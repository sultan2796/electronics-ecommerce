import { RequestHandler } from "express";
import { Permission, hasPermission, permissionsFor } from "../config/permissions";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { verifyAccessToken } from "../utils/jwt";

export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "Giriş tələb olunur"));
    return;
  }

  let userId: string;
  try {
    userId = verifyAccessToken(header.slice(7)).sub;
  } catch {
    next(new AppError(401, "Token etibarsızdır və ya vaxtı bitib"));
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, isBlocked: true, extraPermissions: true, revokedPermissions: true } });
    if (!user) {
      next(new AppError(401, "İstifadəçi tapılmadı"));
      return;
    }
    if (user.isBlocked) {
      next(new AppError(403, "Hesabınız bloklanıb"));
      return;
    }
    req.user = { id: user.id, role: user.role, permissions: permissionsFor(user) };
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }
  try {
    const userId = verifyAccessToken(header.slice(7)).sub;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, isBlocked: true, extraPermissions: true, revokedPermissions: true } });
    if (user && !user.isBlocked) req.user = { id: user.id, role: user.role, permissions: permissionsFor(user) };
  } catch {
    req.user = undefined;
  }
  next();
};

export const requirePermission =
  (...required: Permission[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(new AppError(401, "Giriş tələb olunur"));
      return;
    }
    const user = req.user;
    if (!required.every((permission) => hasPermission(user, permission))) {
      next(new AppError(403, "Bu əməliyyat üçün icazəniz yoxdur"));
      return;
    }
    next();
  };
