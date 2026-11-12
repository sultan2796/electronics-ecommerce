import { describe, expect, it } from "vitest";
import { discountOf, formatDate, formatStorage, priceBeforeDiscount } from "./format";

describe("formatlama", () => {
  it("yaddaşı GB/TB ilə göstərir", () => {
    expect(formatStorage(512)).toBe("512 GB");
    expect(formatStorage(1024)).toBe("1 TB");
    expect(formatStorage(2048)).toBe("2 TB");
  });

  it("endirim faizini yuvarlaqlaşdırır, 1%-dən azı nəzərə almır", () => {
    expect(discountOf({ specs: { extra: { discountPercentage: 12.6 } } })).toBe(13);
    expect(discountOf({ specs: { extra: { discountPercentage: 0.4 } } })).toBe(0);
    expect(discountOf({ specs: null })).toBe(0);
  });

  it("endirimdən əvvəlki qiyməti hesablayır", () => {
    expect(priceBeforeDiscount(80, 20)).toBeCloseTo(100);
    expect(priceBeforeDiscount("50", 0)).toBe(50);
  });

  it("tarixi Azərbaycan dilində yazır", () => {
    expect(formatDate(new Date(2026, 10, 12, 9, 5).toISOString())).toBe("12 noyabr 2026, 09:05");
  });
});
