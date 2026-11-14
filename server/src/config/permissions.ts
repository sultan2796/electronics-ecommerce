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

const known = new Set<string>(allPermissions);

export const isPermission = (value: string): value is Permission => known.has(value);

export const effectivePermissions = (role: Role, extra: readonly string[] = [], revoked: readonly string[] = []): Permission[] => {
  if (role === Role.ADMIN) return [...allPermissions];
  const granted = new Set<Permission>(rolePermissions[role]);
  for (const item of extra) if (isPermission(item)) granted.add(item);
  for (const item of revoked) if (isPermission(item)) granted.delete(item);
  if (granted.size > 0) granted.add("dashboard:read");
  return allPermissions.filter((permission) => granted.has(permission));
};

export type PermissionSubject = { role: Role; permissions?: readonly Permission[] };

export const hasPermission = (subject: PermissionSubject | Role, permission: Permission) => {
  if (typeof subject === "string") return rolePermissions[subject].includes(permission);
  return (subject.permissions ?? rolePermissions[subject.role]).includes(permission);
};

export const permissionsFor = (user: { role: Role; extraPermissions?: string[]; revokedPermissions?: string[] }): Permission[] =>
  effectivePermissions(user.role, user.extraPermissions, user.revokedPermissions);
