import { Role } from "@prisma/client";

export const allPermissions = [
  "dashboard:read",
  "products:write",
  "inventory:write",
  "categories:write",
  "catalog:import",
  "orders:read",
  "orders:write",
  "users:read",
  "users:write",
  "reviews:moderate",
  "emails:read",
  "settings:write",
] as const;

export type Permission = (typeof allPermissions)[number];

export const rolePermissions: Record<Role, readonly Permission[]> = {
  ADMIN: allPermissions,
  MANAGER: [
    "dashboard:read",
    "products:write",
    "inventory:write",
    "categories:write",
    "catalog:import",
    "orders:read",
    "reviews:moderate",
  ],
  SUPPORT: ["dashboard:read", "orders:read", "orders:write", "users:read", "reviews:moderate"],
  CUSTOMER: [],
};

export const hasPermission = (role: Role, permission: Permission) => rolePermissions[role].includes(permission);

export const permissionsFor = (role: Role): Permission[] => [...rolePermissions[role]];
