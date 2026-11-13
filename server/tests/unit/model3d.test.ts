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
