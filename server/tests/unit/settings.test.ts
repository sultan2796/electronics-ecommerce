import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  siteSetting: { findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
  auditLog: { create: vi.fn().mockResolvedValue({}) },
  $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
}));

vi.mock("../../src/config/prisma", () => ({ prisma: db }));

const { createApp } = await import("../../src/app");
const { signAccessToken } = await import("../../src/utils/jwt");
const app = createApp();
const asRole = (role: "ADMIN" | "MANAGER" | "CUSTOMER") => {
  db.user.findUnique.mockResolvedValue({ id: "u1", role, isBlocked: false });
  return `Bearer ${signAccessToken({ sub: "u1", role })}`;
};

describe("sayt parametrləri (loqo)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("hamı üçün loqo parametrlərini qaytarır", async () => {
    db.siteSetting.findMany.mockResolvedValue([{ key: "logoUrl", value: "https://cdn.az/logo.png" }]);
    const response = await request(app).get("/api/settings");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ logoUrl: "https://cdn.az/logo.png", logoIconUrl: null, faviconUrl: null });
  });

  it("yalnız admin dəyişə bilər, menecer və müştəri yox", async () => {
    for (const role of ["MANAGER", "CUSTOMER"] as const) {
      const response = await request(app).put("/api/admin/settings").set("Authorization", asRole(role)).send({ logoUrl: "/a.png" });
      expect(response.status).toBe(403);
    }
    expect(db.siteSetting.upsert).not.toHaveBeenCalled();
  });

  it("admin saxlayır, boş dəyər silir", async () => {
    db.siteSetting.findMany.mockResolvedValue([]);
    const response = await request(app)
      .put("/api/admin/settings")
      .set("Authorization", asRole("ADMIN"))
      .send({ logoUrl: "https://cdn.az/logo.png", faviconUrl: null });
    expect(response.status).toBe(200);
    expect(db.siteSetting.upsert.mock.calls[0][0].where).toEqual({ key: "logoUrl" });
    expect(db.siteSetting.deleteMany.mock.calls[0][0].where).toEqual({ key: "faviconUrl" });
  });

  it("təhlükəli və naməlum açarları rədd edir", async () => {
    for (const body of [{ logoUrl: "javascript:alert(1)" }, { logoUrl: "//evil.com/x.png" }, { color: "red" }]) {
      const response = await request(app).put("/api/admin/settings").set("Authorization", asRole("ADMIN")).send(body);
      expect(response.status).toBe(400);
    }
  });
});
