import { allPermissions } from "../config/permissions";
import { Role } from "@prisma/client";
import { z } from "zod";

export const userQuerySchema = z.object({
  q: z.string().trim().optional(),
  role: z.nativeEnum(Role).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const userUpdateSchema = z
  .object({
    role: z.nativeEnum(Role).optional(),
    isBlocked: z.boolean().optional(),
  })
  .refine((data) => data.role !== undefined || data.isBlocked !== undefined, { message: "Dəyişiklik göstərilməyib" });

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export const userPermissionsSchema = z.object({
  extraPermissions: z.array(z.enum(allPermissions)).max(allPermissions.length),
  revokedPermissions: z.array(z.enum(allPermissions)).max(allPermissions.length),
});

export type UserPermissionsInput = z.infer<typeof userPermissionsSchema>;
