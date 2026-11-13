import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  order: { findMany: vi.fn(), count: vi.fn(), aggregate: vi.fn() },
  orderStatusHistory: { create: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("../../src/config/prisma", () => ({ prisma: db }));

const { createApp } = await import("../../src/app");
const { generateOrderNumber, recordOrderStatus } = await import("../../src/services/order.service");
const { signAccessToken } = await import("../../src/utils/jwt");

const app = createApp();
const bearer = (role: "ADMIN" | "CUSTOMER", sub = "user-1") => `Bearer ${signAccessToken({ sub, role })}`;

describe("sifariş nömrəsi", () => {
  it("ES-YYMMDD-XXXXX formatında yaranır", () => {
    expect(generateOrderNumber(new Date(2026, 10, 13))).toMatch(/^ES-261113-[A-HJ-NP-Z2-9]{5}$/);
  });

  it("təkrarlanma ehtimalı aşağıdır", () => {
    const numbers = new Set(Array.from({ length: 2000 }, () => generateOrderNumber()));
    expect(numbers.size).toBeGreaterThan(1990);
  });

  it("status dəyişikliyi tarixçəyə yazılır", async () => {
    const tx = { orderStatusHistory: { create: vi.fn().mockResolvedValue({}) } };
    await recordOrderStatus(tx as never, "order-1", "SHIPPED", "Kuryerə verildi");
    expect(tx.orderStatusHistory.create).toHaveBeenCalledWith({ data: { orderId: "order-1", status: "SHIPPED", note: "Kuryerə verildi" } });
  });
});

describe("admin səlahiyyətləri backend-də qorunur", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("müştəri admin sifarişlərinə və müştəri detallarına daxil ola bilmir", async () => {
    db.user.findUnique.mockResolvedValue({ id: "user-1", role: "CUSTOMER", isBlocked: false });
    for (const path of ["/api/admin/orders", "/api/admin/users/abc", "/api/admin/stats"]) {
      const response = await request(app).get(path).set("Authorization", bearer("CUSTOMER"));
      expect(response.status).toBe(403);
    }
    const patch = await request(app).patch("/api/admin/orders/abc/status").set("Authorization", bearer("CUSTOMER")).send({ status: "SHIPPED" });
    expect(patch.status).toBe(403);
  });

  it("admin sifarişləri nömrə ilə axtara bilir", async () => {
    db.user.findUnique.mockResolvedValue({ id: "admin-1", role: "ADMIN", isBlocked: false });
    db.$transaction.mockImplementation(async (queries: Promise<unknown>[]) => Promise.all(queries));
    db.order.findMany.mockResolvedValue([]);
    db.order.count.mockResolvedValue(0);
    const response = await request(app).get("/api/admin/orders?q=ES-261113").set("Authorization", bearer("ADMIN", "admin-1"));
    expect(response.status).toBe(200);
    const where = db.order.findMany.mock.calls[0][0].where;
    expect(where.OR[0]).toEqual({ orderNumber: { contains: "ES-261113", mode: "insensitive" } });
  });

  it("bloklanmış istifadəçi rədd edilir", async () => {
    db.user.findUnique.mockResolvedValue({ id: "user-1", role: "ADMIN", isBlocked: true });
    const response = await request(app).get("/api/admin/orders").set("Authorization", bearer("ADMIN"));
    expect([401, 403]).toContain(response.status);
  });
});
