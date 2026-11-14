import { describe, expect, it } from "vitest";
import { allPermissions, effectivePermissions, hasPermission, permissionsFor } from "../../src/config/permissions";

describe("RBAC icazələri", () => {
  it("ADMIN bütün icazələrə malikdir", () => {
    expect(permissionsFor({ role: "ADMIN" })).toEqual([...allPermissions]);
  });

  it("CUSTOMER heç bir admin icazəsinə malik deyil", () => {
    expect(permissionsFor({ role: "CUSTOMER" })).toEqual([]);
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
    const list = permissionsFor({ role: "SUPPORT" });
    list.push("users:write");
    expect(hasPermission("SUPPORT", "users:write")).toBe(false);
  });
});

describe("fərdi icazələr", () => {
  it("rola əlavə icazə verir, bəzilərini geri alır və panel girişini avtomatik açır", () => {
    expect(effectivePermissions("CUSTOMER", ["orders:read"], [])).toEqual(["dashboard:read", "orders:read"]);
    const support = effectivePermissions("SUPPORT", ["emails:read"], ["users:read"]);
    expect(support).toContain("emails:read");
    expect(support).not.toContain("users:read");
    expect(effectivePermissions("CUSTOMER", ["bogus"], [])).toEqual([]);
  });

  it("admin icazələri geri alına bilməz", () => {
    expect(effectivePermissions("ADMIN", [], ["users:write"])).toContain("users:write");
  });

  it("istifadəçiyə görə yoxlama rol əvəzinə effektiv icazələrdən istifadə edir", () => {
    expect(hasPermission({ role: "CUSTOMER", permissions: ["orders:read"] }, "orders:read")).toBe(true);
    expect(hasPermission({ role: "MANAGER", permissions: [] }, "products:write")).toBe(false);
  });
});
