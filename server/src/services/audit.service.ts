import { Prisma } from "@prisma/client";
import { Request } from "express";
import { prisma } from "../config/prisma";

export const audit = (req: Request, action: string, entity: string, entityId?: string | null, details?: Record<string, unknown>) => {
  void prisma.auditLog
    .create({
      data: {
        userId: req.user?.id ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        details: details ? (JSON.parse(JSON.stringify(details)) as Prisma.InputJsonObject) : undefined,
      },
    })
    .catch((error) => console.error("Audit yazılmadı", error));
};
