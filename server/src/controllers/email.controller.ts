import { EmailStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { emailMode } from "../services/email";
import { asyncHandler } from "../utils/asyncHandler";

export const listEmails = asyncHandler(async (req, res) => {
  const { q, status, page, limit } = req.query as unknown as { q?: string; status?: EmailStatus; page: number; limit: number };
  const where: Prisma.EmailLogWhereInput = {
    ...(status && { status }),
    ...(q && { OR: [{ to: { contains: q, mode: "insensitive" } }, { subject: { contains: q, mode: "insensitive" } }] }),
  };
  const [items, total] = await Promise.all([
    prisma.emailLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.emailLog.count({ where }),
  ]);
  res.json({ items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)), mode: emailMode() });
});
