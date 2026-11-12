import { describe, expect, it } from "vitest";
import { allPermissions, hasPermission, permissionsFor } from "../../src/config/permissions";

describe("RBAC icazələri", () => {
  it("ADMIN bütün icazələrə malikdir", () => {
    expect(permissionsFor("ADMIN")).toEqual([...allPermissions]);
  });

  it("CUSTOMER heç bir admin icazəsinə malik deyil", () => {
    expect(permissionsFor("CUSTOMER")).toEqual([]);
    for (const permission of allPermissions) expect(hasPermission("CUSTOMER", permission)).toBe(false);
  });

  it("MANAGER məhsulları idarə edir, amma istifadəçiləri dəyişə bilmir", () => {
    expect(hasPermission("MANAGER", "products:write")).toBe(true);
    expect(hasPermission("MANAGER", "catalog:import")).toBe(true);
    expect(hasPermission("MANAGER", "users:write")).toBe(false);
    expect(hasPermission("MANAGER", "orders:write")).toBe(false);
  });

  it("SUPPORT sifarişləri idarə edir, amma məhsulları dəyişə bilmir", () => {
    expect(hasPermission("SUPPORT", "orders:write")).toBe(true);
    expect(hasPermission("SUPPORT", "users:read")).toBe(true);
    expect(hasPermission("SUPPORT", "products:write")).toBe(false);
    expect(hasPermission("SUPPORT", "emails:read")).toBe(false);
  });

  it("rəy moderasiyası bütün işçilərə açıqdır", () => {
    for (const role of ["ADMIN", "MANAGER", "SUPPORT"] as const) expect(hasPermission(role, "reviews:moderate")).toBe(true);
  });

  it("permissionsFor surət qaytarır, orijinal siyahını dəyişmək olmur", () => {
    const list = permissionsFor("SUPPORT");
    list.push("users:write");
    expect(hasPermission("SUPPORT", "users:write")).toBe(false);
  });
});
