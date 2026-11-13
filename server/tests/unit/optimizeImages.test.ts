import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  upload: { findMany: vi.fn(), update: vi.fn().mockResolvedValue({}) },
  auditLog: { create: vi.fn().mockResolvedValue({}) },
}));
vi.mock("../../src/config/prisma", () => ({ prisma: db }));

const { optimizeStoredImages } = await import("../../src/controllers/adminExtra.controller");

describe("optimizeStoredImages", () => {
  it("converts real photos in place and skips broken files without looping", async () => {
    const png = await sharp({ create: { width: 1800, height: 1800, channels: 3, background: { r: 10, g: 120, b: 200 } } }).png().toBuffer();
    db.upload.findMany.mockResolvedValueOnce([
      { id: "u1", data: png, size: png.length },
      { id: "u2", data: Buffer.from("not an image"), size: 12 },
    ]);
    const json = vi.fn();
    await new Promise<void>((resolve) => {
      optimizeStoredImages({ body: {}, user: { id: "a", role: "ADMIN" }, ip: "1", get: () => undefined } as never, { json: (body: unknown) => { json(body); resolve(); } } as never, () => resolve());
    });
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ converted: 1, skipped: 1, nextCursor: null }));
    expect(db.upload.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "u1" }, data: expect.objectContaining({ mimeType: "image/webp" }) }));
  });
});
