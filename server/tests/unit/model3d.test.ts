import { describe, expect, it } from "vitest";
import { productCreateSchema } from "../../src/models/product.model";

const base = { name: "Test məhsul", slug: "test-mehsul", sku: "T-1", brand: "Test", price: 100, stock: 1, categoryId: "c1" };

describe("3D model linki", () => {
  it("https .glb və .gltf linklərini qəbul edir", () => {
    for (const model3dUrl of ["https://cdn.example.com/a.glb", "https://x.az/models/b.GLTF?v=2"]) {
      expect(productCreateSchema.safeParse({ ...base, model3dUrl }).success).toBe(true);
    }
  });

  it("boş link null olur", () => {
    const parsed = productCreateSchema.parse({ ...base, model3dUrl: "  " });
    expect(parsed.model3dUrl).toBeNull();
  });

  it("təhlükəli və ya yanlış linkləri rədd edir", () => {
    for (const model3dUrl of ["http://x.az/a.glb", "javascript:alert(1)//.glb", "https://x.az/a.png", "https://x.az/a b.glb", "https://x.az\\a.glb"]) {
      expect(productCreateSchema.safeParse({ ...base, model3dUrl }).success).toBe(false);
    }
  });
});

describe("məhsul videosu linki", () => {
  it("https mp4 və webm qəbul edir, posteri saxlayır", () => {
    const parsed = productCreateSchema.parse({ ...base, videoUrl: "https://cdn.az/demo.mp4", videoPoster: "https://cdn.az/poster.jpg" });
    expect(parsed.videoUrl).toBe("https://cdn.az/demo.mp4");
    expect(productCreateSchema.safeParse({ ...base, videoUrl: "https://cdn.az/demo.webm?v=1" }).success).toBe(true);
  });

  it("yanlış və təhlükəli video linklərini rədd edir", () => {
    for (const videoUrl of ["http://cdn.az/a.mp4", "https://cdn.az/a.avi", "javascript:alert(1)//.mp4", "https://cdn.az\\a.mp4"]) {
      expect(productCreateSchema.safeParse({ ...base, videoUrl }).success).toBe(false);
    }
    expect(productCreateSchema.safeParse({ ...base, videoPoster: "//evil.com/p.jpg" }).success).toBe(false);
  });
});
