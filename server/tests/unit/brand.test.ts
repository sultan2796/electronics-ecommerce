import { describe, expect, it } from "vitest";
import { brandSlug } from "../../src/services/brand.service";
import { brandCreateSchema } from "../../src/models/brand.model";

describe("brandSlug", () => {
  it("normalizes names into url slugs", () => {
    expect(brandSlug("Apple Inc.")).toBe("apple-inc");
    expect(brandSlug("  Bang & Olufsen ")).toBe("bang-olufsen");
    expect(brandSlug("Ş")).toBe("s");
    expect(brandSlug("***")).toBe("brand");
  });
});

describe("brandCreateSchema", () => {
  it("rejects unsafe logo urls", () => {
    expect(brandCreateSchema.safeParse({ name: "X", logoUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(brandCreateSchema.safeParse({ name: "X", logoUrl: "http://a.b/x.png" }).success).toBe(false);
    expect(brandCreateSchema.safeParse({ name: "X", logoUrl: "https://a.b/x.png" }).success).toBe(true);
  });
});
