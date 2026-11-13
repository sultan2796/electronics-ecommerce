import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { signAccessToken } from "../../src/utils/jwt";

const app = createApp();

describe("API (verilənlər bazası tələb etməyən yoxlamalar)", () => {
  it("GET /health işləyir", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("GET /api/health işləyir", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
  });

  it("naməlum ünvan 404 qaytarır", async () => {
    const response = await request(app).get("/api/yoxdur");
    expect(response.status).toBe(404);
  });

  it("təhlükəsizlik başlıqları əlavə olunur", async () => {
    const response = await request(app).get("/health");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("tokensiz admin sorğusu 401 qaytarır", async () => {
    for (const path of ["/api/admin/stats", "/api/admin/users", "/api/admin/emails", "/api/admin/reviews"]) {
      const response = await request(app).get(path);
      expect(response.status).toBe(401);
    }
  });

  it("saxta token 401 qaytarır", async () => {
    const response = await request(app).get("/api/auth/me").set("Authorization", "Bearer saxta.token.burada");
    expect(response.status).toBe(401);
  });

  it("başqa açarla imzalanmış token qəbul olunmur", async () => {
    const token = signAccessToken({ sub: "user-1", role: "ADMIN" });
    const response = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}x`);
    expect(response.status).toBe(401);
  });

  it("səbət və sifariş giriş tələb edir", async () => {
    expect((await request(app).get("/api/cart")).status).toBe(401);
    expect((await request(app).post("/api/orders/checkout").send({})).status).toBe(401);
    expect((await request(app).post("/api/products/abc/reviews").send({ rating: 5, comment: "əla məhsuldur" })).status).toBe(401);
  });

  it("qeydiyyat validasiyası səhv məlumatı rədd edir", async () => {
    const response = await request(app).post("/api/auth/register").send({ email: "yanlis", password: "123", name: "" });
    expect(response.status).toBe(400);
  });

  it("şifrəni unutdum validasiyası səhv e-poçtu rədd edir", async () => {
    const response = await request(app).post("/api/auth/forgot-password").send({ email: "e-poct-deyil" });
    expect(response.status).toBe(400);
  });

  it("şifrə bərpası qısa tokeni rədd edir", async () => {
    const response = await request(app).post("/api/auth/reset-password").send({ token: "qisa", password: "Yeni12345!" });
    expect(response.status).toBe(400);
  });
});

describe("giriş identifikatoru", () => {
  it("istifadəçi adı ilə girişi qəbul edir (validasiyadan keçir)", async () => {
    const { loginSchema } = await import("../../src/models/auth.model");
    expect(loginSchema.parse({ email: "Sultan", password: "x" }).email).toBe("sultan@admin.local");
    expect(loginSchema.parse({ email: " Admin@Example.com ", password: "x" }).email).toBe("admin@example.com");
    expect(loginSchema.safeParse({ email: "a b", password: "x" }).success).toBe(false);
  });
});
