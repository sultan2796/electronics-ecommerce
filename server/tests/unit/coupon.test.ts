import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { assertCouponUsable, calculateDiscount, normalizeCode } from "../../src/services/coupon.service";

const coupon = (over: Record<string, unknown> = {}) =>
  ({ id: "c1", code: "YAY10", type: "PERCENT", value: new Prisma.Decimal(10), minTotal: new Prisma.Decimal(0), maxUses: null, usedCount: 0, expiresAt: null, isActive: true, createdAt: new Date(), ...over }) as never;

describe("kuponlar", () => {
  it("kodu normallaşdırır", () => expect(normalizeCode(" yay10 ")).toBe("YAY10"));
  it("faizli endirim", () => expect(calculateDiscount(coupon(), new Prisma.Decimal(250)).toNumber()).toBe(25));
  it("sabit endirim məbləği keçmir", () =>
    expect(calculateDiscount(coupon({ type: "FIXED", value: new Prisma.Decimal(500) }), new Prisma.Decimal(120)).toNumber()).toBe(120));
  it("müddəti bitmiş kodu rədd edir", () =>
    expect(() => assertCouponUsable(coupon({ expiresAt: new Date(2000, 0, 1) }), new Prisma.Decimal(100))).toThrow("müddəti"));
  it("limiti dolmuş kodu rədd edir", () =>
    expect(() => assertCouponUsable(coupon({ maxUses: 1, usedCount: 1 }), new Prisma.Decimal(100))).toThrow("limiti"));
  it("minimum məbləği yoxlayır", () =>
    expect(() => assertCouponUsable(coupon({ minTotal: new Prisma.Decimal(200) }), new Prisma.Decimal(100))).toThrow("ən az"));
  it("deaktiv kodu tapmır", () => expect(() => assertCouponUsable(coupon({ isActive: false }), new Prisma.Decimal(100))).toThrow("tapılmadı"));
});
