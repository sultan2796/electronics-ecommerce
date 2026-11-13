import { Prisma, Role } from "@prisma/client";
import { avatarUrl } from "../services/avatar.service";
import { prisma } from "../config/prisma";
import { UserUpdateInput } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { currentUser } from "../utils/currentUser";
import { revokeAllSessions } from "./auth.controller";
import { audit } from "../services/audit.service";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isBlocked: true,
  createdAt: true,
  lastLoginAt: true,
  avatarId: true,
  _count: { select: { orders: true } },
} satisfies Prisma.UserSelect;

const withAvatar = <T extends { avatarId: string | null }>({ avatarId, ...user }: T) => ({ ...user, avatarUrl: avatarUrl(avatarId) });

export const listUsers = asyncHandler(async (req, res) => {
  const { q, role, page, limit } = req.query as unknown as { q?: string; role?: Role; page: number; limit: number };
  const where: Prisma.UserWhereInput = {
    ...(role && { role }),
    ...(q && {
      OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }],
    }),
  };

  const [items, total, roleCounts] = await Promise.all([
    prisma.user.findMany({ where, select: userSelect, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.user.count({ where }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
  ]);

  res.json({
    items: items.map(withAvatar),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    roleCounts: Object.fromEntries(roleCounts.map((row) => [row.role, row._count._all])),
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const actor = currentUser(req);
  const { role, isBlocked } = req.body as UserUpdateInput;
  const targetId = req.params.id;

  if (targetId === actor.id) throw new AppError(403, "Öz rolunuzu və ya statusunuzu buradan dəyişə bilməzsiniz");

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw new AppError(404, "İstifadəçi tapılmadı");

  const losesAdmin = target.role === Role.ADMIN && ((role !== undefined && role !== Role.ADMIN) || isBlocked === true);
  if (losesAdmin) {
    const activeAdmins = await prisma.user.count({ where: { role: Role.ADMIN, isBlocked: false } });
    if (activeAdmins <= 1) throw new AppError(409, "Sistemdə ən azı bir aktiv admin qalmalıdır");
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { ...(role !== undefined && { role }), ...(isBlocked !== undefined && { isBlocked }) },
    select: userSelect,
  });

  if (isBlocked === true) await revokeAllSessions(targetId);

  res.json(withAvatar(updated));
  audit(req, "user.update", "User", req.params.id ?? null, req.body);
});

export const getUserDetail = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBlocked: true,
      points: true,
      createdAt: true,
      lastLoginAt: true,
      addresses: { orderBy: { isDefault: "desc" }, take: 5 },
      _count: { select: { orders: true, reviews: true, wishlist: true } },
    },
  });
  if (!user) throw new AppError(404, "İstifadəçi tapılmadı");
  const [spent, lastOrders] = await Promise.all([
    prisma.order.aggregate({ where: { userId: user.id, paymentStatus: "SUCCEEDED", status: { not: "CANCELLED" } }, _sum: { total: true } }),
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, orderNumber: true, status: true, paymentStatus: true, total: true, createdAt: true },
    }),
  ]);
  res.json({ ...user, totalSpent: spent._sum.total ?? 0, orders: lastOrders });
});
