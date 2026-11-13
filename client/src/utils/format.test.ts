import { describe, expect, it } from "vitest";
import { discountOf, formatDate, formatPrice, formatStorage, priceBeforeDiscount } from "./format";

describe("formatlama", () => {
  it("qiyməti Azərbaycan formatında yazır", () => {
    expect(formatPrice(14.17)).toBe("14,17 ₼");
    expect(formatPrice("1999.9")).toBe("1 999,90 ₼");
    expect(formatPrice(2500)).toBe("2 500 ₼");
  });

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

describe("sifariş kodu", () => {
  it("sifariş nömrəsi varsa onu göstərir", async () => {
    const { orderCode } = await import("./format");
    expect(orderCode({ id: "ckabc123xyz", orderNumber: "ES-261113-AB2CD" })).toBe("ES-261113-AB2CD");
    expect(orderCode({ id: "ckabc123xyz9", orderNumber: null })).toBe("#C123XYZ9");
  });
});
