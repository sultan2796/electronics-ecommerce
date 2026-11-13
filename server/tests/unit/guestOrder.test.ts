import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = vi.hoisted(() => ({
  product: { findMany: vi.fn(), updateMany: vi.fn() },
  productVariant: { count: vi.fn().mockResolvedValue(0), findFirst: vi.fn(), updateMany: vi.fn() },
  order: { create: vi.fn(), findUnique: vi.fn().mockResolvedValue(null) },
}));
const db = vi.hoisted(() => ({
  order: { findUnique: vi.fn(), count: vi.fn().mockResolvedValue(0) },
  orderItem: { groupBy: vi.fn().mockResolvedValue([]) },
  emailLog: { create: vi.fn().mockResolvedValue({ id: "e1" }), update: vi.fn().mockResolvedValue({}) },
  product: { findMany: vi.fn().mockResolvedValue([]) },
  $transaction: vi.fn(),
}));

vi.mock("../../src/config/prisma", () => ({ prisma: db }));

const { createApp } = await import("../../src/app");
const app = createApp();

const product = (id: string, price: number, stock = 10) => ({
  id,
  name: `Məhsul ${id}`,
  price: new Prisma.Decimal(price),
  salePrice: null,
  categoryId: "c1",
  stock,
  isActive: true,
});

const body = {
  email: "Qonaq@Example.com",
  shippingAddress: { fullName: "Aysel Məmmədova", phone: "+994501234567", line1: "Nizami küç. 10", city: "Bakı", postalCode: "AZ1000", country: "Azərbaycan" },
  items: [
    { productId: "p1", quantity: 2, price: 0.01 },
    { productId: "p2", quantity: 1 },
  ],
};

describe("qonaq kimi sifariş", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (fn: (client: typeof tx) => unknown) => fn(tx));
    tx.order.findUnique.mockResolvedValue(null);
    tx.product.findMany.mockResolvedValue([product("p1", 100), product("p2", 49.5)]);
    tx.product.updateMany.mockResolvedValue({ count: 1 });
    tx.order.create.mockImplementation(async ({ data }) => ({ id: "o1", ...data, items: data.items.create }));
  });

  it("qiyməti serverdə hesablayır, tokeni yalnız hash kimi saxlayır", async () => {
    const response = await request(app).post("/api/guest-orders").send(body);
    expect(response.status).toBe(201);
    const data = tx.order.create.mock.calls[0][0].data;
    expect(Number(data.subtotal)).toBe(249.5);
    expect(data.userId).toBeUndefined();
    expect(data.guestEmail).toBe("qonaq@example.com");
    expect(data.items.create.find((item: { productId: string }) => item.productId === "p1").unitPrice.toNumber()).toBe(100);
    expect(response.body.trackingToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(data.trackingTokenHash).toBe(createHash("sha256").update(response.body.trackingToken).digest("hex"));
    expect(JSON.stringify(data)).not.toContain(response.body.trackingToken);
    expect(response.body.orderNumber).toMatch(/^ES-\d{6}-/);
  });

  it("stok çatmayanda 409 qaytarır və sifariş yaratmır", async () => {
    tx.product.updateMany.mockResolvedValueOnce({ count: 0 });
    const response = await request(app).post("/api/guest-orders").send(body);
    expect(response.status).toBe(409);
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it("yalnız qapıda ödənişə icazə verir və e-poçtu yoxlayır", async () => {
    expect((await request(app).post("/api/guest-orders").send({ ...body, paymentMethod: "CARD" })).status).toBe(400);
    expect((await request(app).post("/api/guest-orders").send({ ...body, email: "yanlış" })).status).toBe(400);
    expect((await request(app).post("/api/guest-orders").send({ ...body, items: [] })).status).toBe(400);
  });

  it("bir e-poçtda çoxlu açıq sifarişi və böyük miqdarı rədd edir", async () => {
    db.order.count.mockResolvedValueOnce(3);
    expect((await request(app).post("/api/guest-orders").send(body)).status).toBe(429);
    expect((await request(app).post("/api/guest-orders").send({ ...body, items: [{ productId: "p1", quantity: 6 }] })).status).toBe(400);
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it("izləmə yalnız düzgün tokenlə açılır", async () => {
    const token = "a".repeat(32);
    db.order.findUnique.mockResolvedValue({
      orderNumber: "ES-261113-AB2CD7",
      trackingTokenHash: createHash("sha256").update(token).digest("hex"),
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod: "CASH_ON_DELIVERY",
      subtotal: 10,
      shippingFee: 0,
      total: 10,
      createdAt: new Date(),
      items: [],
      statusHistory: [],
      shippingAddress: { fullName: "Aysel", phone: "+994501234567" },
      guestEmail: "gizli@example.com",
    });
    const ok = await request(app).get(`/api/track/ES-261113-AB2CD7?token=${token}`);
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe("PENDING");
    expect(JSON.stringify(ok.body)).not.toContain("gizli@example.com");
    expect(ok.body.shippingAddress.phone).toBe("•••••••••4567");
    expect((await request(app).get(`/api/track/ES-261113-AB2CD7?token=${"b".repeat(32)}`)).status).toBe(404);
    expect((await request(app).get("/api/track/ES-261113-AB2CD7?token=qisa")).status).toBe(400);
  });
});

describe("qonaq sifarişində stok bloklanmasına qarşı limit", () => {
  it("bir məhsul üçün təsdiqlənməmiş qonaq sifarişləri limiti keçəndə 429 qaytarır", async () => {
    db.orderItem.groupBy.mockResolvedValueOnce([{ productId: "p1", _sum: { quantity: 14 } }]);
    const response = await request(createApp())
      .post("/api/guest-orders")
      .send({
        email: "limit@example.com",
        shippingAddress: { fullName: "Test User", phone: "+994501234567", line1: "Nizami 10", city: "Bakı", postalCode: "AZ1000", country: "Azərbaycan" },
        items: [{ productId: "p1", quantity: 2 }],
      });
    expect(response.status).toBe(429);
    expect(tx.order.create).not.toHaveBeenCalled();
  });
});
