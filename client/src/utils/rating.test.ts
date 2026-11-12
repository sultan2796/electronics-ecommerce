import { describe, expect, it } from "vitest";
import { productRating, ratingPercent } from "./rating";

describe("reytinq", () => {
  it("real rəylər varsa onları üstün tutur", () => {
    expect(productRating({ ratingAverage: 4.2, reviewCount: 3, specs: null })).toEqual({ value: 4.2, count: 3, fromReviews: true });
  });

  it("rəy yoxdursa idxal edilmiş reytinqi göstərir", () => {
    const specs = { extra: { rating: 4.7 } } as never;
    expect(productRating({ ratingAverage: null, reviewCount: 0, specs })).toEqual({ value: 4.7, count: 0, fromReviews: false });
  });

  it("heç bir reytinq yoxdursa null", () => {
    expect(productRating({ ratingAverage: null, reviewCount: 0, specs: null })).toBeNull();
  });

  it("faizi hesablayır və sıfıra bölmür", () => {
    expect(ratingPercent(1, 4)).toBe(25);
    expect(ratingPercent(0, 0)).toBe(0);
  });
});
