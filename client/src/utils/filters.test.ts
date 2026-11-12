import { describe, expect, it } from "vitest";
import { emptyFilters, parseFilters, serializeFilters } from "./filters";

describe("filtrlər", () => {
  it("boş URL default filtrləri verir", () => {
    expect(parseFilters(new URLSearchParams())).toEqual(emptyFilters);
  });

  it("URL parametrlərini oxuyur", () => {
    const filters = parseFilters(new URLSearchParams("category=laptops&brand=Apple,Dell&ram=16&inStock=true&sort=price_asc&page=3"));
    expect(filters.category).toBe("laptops");
    expect(filters.brand).toEqual(["Apple", "Dell"]);
    expect(filters.ram).toEqual(["16"]);
    expect(filters.inStock).toBe(true);
    expect(filters.sort).toBe("price_asc");
    expect(filters.page).toBe(3);
  });

  it("yanlış sort və səhifəni düzəldir", () => {
    const filters = parseFilters(new URLSearchParams("sort=hack&page=-4"));
    expect(filters.sort).toBe("newest");
    expect(filters.page).toBe(1);
  });

  it("default dəyərlər URL-ə yazılmır", () => {
    expect(serializeFilters(emptyFilters).toString()).toBe("");
  });

  it("serialize və parse bir-birinin tərsidir", () => {
    const original = { ...emptyFilters, q: "galaxy", brand: ["Samsung"], minPrice: "100", inStock: true, sort: "price_desc" as const, page: 2 };
    expect(parseFilters(serializeFilters(original))).toEqual(original);
  });
});
