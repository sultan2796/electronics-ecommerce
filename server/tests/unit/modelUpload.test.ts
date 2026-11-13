import { readFileSync } from "node:fs";
import { join } from "node:path";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  upload: { create: vi.fn(), findUnique: vi.fn() },
  auditLog: { create: vi.fn().mockResolvedValue({}) },
}));

vi.mock("../../src/config/prisma", () => ({ prisma: db }));

const { createApp } = await import("../../src/app");
const { signAccessToken } = await import("../../src/utils/jwt");

const app = createApp();
const glb = readFileSync(join(__dirname, "../fixtures/box.glb"));
const asRole = (role: "ADMIN" | "CUSTOMER") => {
  db.user.findUnique.mockResolvedValue({ id: "u1", role, isBlocked: false });
  return `Bearer ${signAccessToken({ sub: "u1", role })}`;
};

describe("3D model yükləmə", () => {
  beforeEach(() => vi.clearAllMocks());

  it("admin düzgün GLB faylını yükləyir və .glb linki alır", async () => {
    db.upload.create.mockImplementation(async ({ data }) => ({ id: "m1", ...data }));
    const response = await request(app)
      .post("/api/uploads/model")
      .set("Authorization", asRole("ADMIN"))
      .set("Content-Type", "model/gltf-binary")
      .send(glb);
    expect(response.status).toBe(201);
    expect(response.body.url).toMatch(/\/api\/uploads\/m1\.glb$/);
    expect(response.body.size).toBe(glb.length);
    expect(db.upload.create.mock.calls[0][0].data.mimeType).toBe("model/gltf-binary");
  });

  it("GLB olmayan faylı rədd edir", async () => {
    const response = await request(app)
      .post("/api/uploads/model")
      .set("Authorization", asRole("ADMIN"))
      .set("Content-Type", "application/octet-stream")
      .send(Buffer.from("bu glb deyil, sadəcə mətndir ......"));
    expect(response.status).toBe(400);
    expect(db.upload.create).not.toHaveBeenCalled();
  });

  it("zədələnmiş GLB faylını rədd edir", async () => {
    const response = await request(app)
      .post("/api/uploads/model")
      .set("Authorization", asRole("ADMIN"))
      .set("Content-Type", "model/gltf-binary")
      .send(glb.subarray(0, glb.length - 8));
    expect(response.status).toBe(400);
  });

  it("müştəri model yükləyə bilmir", async () => {
    const response = await request(app)
      .post("/api/uploads/model")
      .set("Authorization", asRole("CUSTOMER"))
      .set("Content-Type", "model/gltf-binary")
      .send(glb);
    expect(response.status).toBe(403);
  });

  it("yüklənmiş model .glb linki ilə verilir", async () => {
    db.upload.findUnique.mockResolvedValue({ id: "m1", mimeType: "model/gltf-binary", data: glb });
    const response = await request(app).get("/api/uploads/m1.glb");
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("model/gltf-binary");
    expect(db.upload.findUnique.mock.calls[0][0].where.id).toBe("m1");
  });
});
