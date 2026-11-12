import { describe, expect, it } from "vitest";
import { productQuerySchema } from "../../src/models/product.model";
import { buildProductOrderBy, buildProductWhere } from "../../src/services/product.service";

const parse = (query: Record<string, string>) => productQuerySchema.parse(query);

describe("məhsul filtrləri", () => {
  it("default olaraq yalnız aktiv məhsulları qaytarır", () => {
    expect(buildProductWhere(parse({}))).toEqual({ isActive: true });
  });

  it("kateqoriya, brend və qiymət filtrlərini qurur", () => {
    const where = buildProductWhere(parse({ category: "laptops", brand: "Apple,Dell", minPrice: "500", maxPrice: "2000" }));
    expect(where.category).toEqual({ slug: "laptops" });
    expect(where.brand).toEqual({ in: ["Apple", "Dell"], mode: "insensitive" });
    expect(where.price).toEqual({ gte: 500, lte: 2000 });
  });

  it("stokda olanlar filtri", () => {
    expect(buildProductWhere(parse({ inStock: "true" })).stock).toEqual({ gt: 0 });
    expect(buildProductWhere(parse({ inStock: "false" })).stock).toBeUndefined();
  });

  it("axtarış ad, brend və təsvirdə aparılır", () => {
    const where = buildProductWhere(parse({ q: "  galaxy " }));
    expect(where.OR).toHaveLength(3);
    expect(where.OR?.[0]).toEqual({ name: { contains: "galaxy", mode: "insensitive" } });
  });

  it("texniki xüsusiyyət filtrləri specs.AND-ə düşür", () => {
    const where = buildProductWhere(parse({ ram: "8,16", storageType: "SSD,FAKE", minRefreshRate: "120" }));
    const and = (where.specs as { is: { AND: unknown[] } }).is.AND;
    expect(and).toContainEqual({ ramGb: { in: [8, 16] } });
    expect(and).toContainEqual({ storageType: { in: ["SSD"] } });
    expect(and).toContainEqual({ refreshRateHz: { gte: 120 } });
  });

  it("çeşidləmə parametrləri", () => {
    expect(buildProductOrderBy("price_asc")).toEqual({ price: "asc" });
    expect(buildProductOrderBy("price_desc")).toEqual({ price: "desc" });
  });

  it("limit 60-dan böyük ola bilməz", () => {
    expect(() => parse({ limit: "500" })).toThrow();
  });
});
