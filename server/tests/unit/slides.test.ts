import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  slide: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), aggregate: vi.fn() },
  auditLog: { create: vi.fn().mockResolvedValue({}) },
  $transaction: vi.fn(),
}));

vi.mock("../../src/config/prisma", () => ({ prisma: db }));

const { createApp } = await import("../../src/app");
const { signAccessToken } = await import("../../src/utils/jwt");

const app = createApp();
const asRole = (role: "ADMIN" | "CUSTOMER") => {
  db.user.findUnique.mockResolvedValue({ id: "u1", role, isBlocked: false });
  return `Bearer ${signAccessToken({ sub: "u1", role })}`;
};

describe("slaydlar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("ana səhifə yalnız aktiv slaydları sıra ilə alır", async () => {
    db.slide.findMany.mockResolvedValue([{ id: "s1", title: "Yay", imageUrl: "/a.jpg" }]);
    const response = await request(app).get("/api/slides");
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    const query = db.slide.findMany.mock.calls[0][0];
    expect(query.where).toEqual({ isActive: true });
    expect(query.orderBy[0]).toEqual({ sortOrder: "asc" });
  });

  it("müştəri slayd yarada bilmir", async () => {
    const response = await request(app)
      .post("/api/admin/slides")
      .set("Authorization", asRole("CUSTOMER"))
      .send({ title: "Test", imageUrl: "/a.jpg" });
    expect(response.status).toBe(403);
    expect(db.slide.create).not.toHaveBeenCalled();
  });

  it("admin slayd yaradır və sona əlavə olunur", async () => {
    db.slide.aggregate.mockResolvedValue({ _max: { sortOrder: 2 } });
    db.slide.create.mockImplementation(async ({ data }) => ({ id: "s9", ...data }));
    const response = await request(app)
      .post("/api/admin/slides")
      .set("Authorization", asRole("ADMIN"))
      .send({ title: "Qış endirimi", imageUrl: "/api/uploads/abc", buttonText: "Bax", buttonLink: "/products" });
    expect(response.status).toBe(201);
    expect(response.body.sortOrder).toBe(3);
    expect(response.body.isActive).toBe(true);
  });

  it("təhlükəli keçid ünvanını rədd edir", async () => {
    for (const buttonLink of ["javascript:alert(1)", "//evil.com", "http://evil.com", "/\\evil.com", "/ok\nx"]) {
      const response = await request(app)
        .post("/api/admin/slides")
        .set("Authorization", asRole("ADMIN"))
        .send({ title: "Test", imageUrl: "/a.jpg", buttonLink });
      expect(response.status).toBe(400);
    }
    expect(db.slide.create).not.toHaveBeenCalled();
  });

  it("köhnəlmiş sıralama siyahısını rədd edir", async () => {
    db.slide.findMany.mockResolvedValueOnce([{ id: "a" }, { id: "b" }]);
    const response = await request(app).put("/api/admin/slides/order").set("Authorization", asRole("ADMIN")).send({ ids: ["a", "x"] });
    expect(response.status).toBe(409);
    expect(db.slide.update).not.toHaveBeenCalled();
  });

  it("sıralama verilən ardıcıllıqla saxlanılır", async () => {
    db.$transaction.mockImplementation(async (queries: Promise<unknown>[]) => Promise.all(queries));
    db.slide.update.mockResolvedValue({});
    db.slide.findMany.mockResolvedValueOnce([{ id: "a" }, { id: "b" }, { id: "c" }]);
    db.slide.findMany.mockResolvedValue([]);
    const response = await request(app).put("/api/admin/slides/order").set("Authorization", asRole("ADMIN")).send({ ids: ["b", "a", "c"] });
    expect(response.status).toBe(200);
    expect(db.slide.update.mock.calls.map((call) => [call[0].where.id, call[0].data.sortOrder])).toEqual([
      ["b", 0],
      ["a", 1],
      ["c", 2],
    ]);
  });
});
