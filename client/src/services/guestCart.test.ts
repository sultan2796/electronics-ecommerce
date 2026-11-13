import { beforeEach, describe, expect, it } from "vitest";
import { clearGuestLines, guestItemId, parseGuestItemId, readGuestLines, upsertGuestLine, writeGuestLines } from "./guestCart";

describe("qonaq səbəti", () => {
  beforeEach(() => localStorage.clear());

  it("əlavə edir, miqdarı toplayır və 5 ilə məhdudlaşdırır", () => {
    let lines = upsertGuestLine([], "p1", 2, "add");
    lines = upsertGuestLine(lines, "p1", 3, "add");
    expect(lines).toEqual([{ productId: "p1", quantity: 5 }]);
    lines = upsertGuestLine(lines, "p1", 50, "add");
    expect(lines[0].quantity).toBe(5);
  });

  it("miqdarı 0 edəndə məhsulu silir", () => {
    const lines = upsertGuestLine([{ productId: "p1", quantity: 2 }], "p1", 0, "set");
    expect(lines).toEqual([]);
  });

  it("brauzerdə saxlayır və zədələnmiş məlumatı atır", () => {
    writeGuestLines([{ productId: "p1", quantity: 1 }]);
    expect(readGuestLines()).toEqual([{ productId: "p1", quantity: 1 }]);
    localStorage.setItem("electroshop:guest-cart", JSON.stringify([{ productId: "p2", quantity: -1 }, { productId: 5, quantity: 1 }, "x"]));
    expect(readGuestLines()).toEqual([]);
    clearGuestLines();
    expect(localStorage.getItem("electroshop:guest-cart")).toBeNull();
  });

  it("10 fərqli məhsuldan çoxunu qəbul etmir", () => {
    const lines = Array.from({ length: 10 }, (_, index) => ({ productId: `p${index}`, quantity: 1 }));
    expect(() => upsertGuestLine(lines, "yeni", 1, "add")).toThrow();
  });

  it("eyni məhsulun fərqli variantlarını ayrı sətir kimi saxlayır", () => {
    let lines = upsertGuestLine([], "p1", 1, "add", "v1");
    lines = upsertGuestLine(lines, "p1", 2, "add", "v2");
    lines = upsertGuestLine(lines, "p1", 1, "add", "v1");
    expect(lines).toEqual([
      { productId: "p1", variantId: "v1", quantity: 2 },
      { productId: "p1", variantId: "v2", quantity: 2 },
    ]);
    expect(upsertGuestLine(lines, "p1", 0, "set", "v1")).toEqual([{ productId: "p1", variantId: "v2", quantity: 2 }]);
    expect(parseGuestItemId(guestItemId("p1", "v2"))).toEqual({ productId: "p1", variantId: "v2" });
    expect(parseGuestItemId(guestItemId("p1"))).toEqual({ productId: "p1", variantId: undefined });
  });
});
