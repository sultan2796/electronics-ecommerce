import { describe, expect, it } from "vitest";
import { reviewBodySchema } from "../../src/models/review.model";
import { displayName } from "../../src/services/review.service";

describe("rəylər", () => {
  it("müəllif adını məxfi göstərir", () => {
    expect(displayName("Sultan Tağıyev")).toBe("Sultan T.");
    expect(displayName("  Aysel  ")).toBe("Aysel");
    expect(displayName("Ali Veli Həsənov")).toBe("Ali H.");
  });

  it("reytinq 1-5 aralığında tam ədəd olmalıdır", () => {
    expect(reviewBodySchema.safeParse({ rating: 0, comment: "çox yaxşı məhsuldur" }).success).toBe(false);
    expect(reviewBodySchema.safeParse({ rating: 6, comment: "çox yaxşı məhsuldur" }).success).toBe(false);
    expect(reviewBodySchema.safeParse({ rating: 4.5, comment: "çox yaxşı məhsuldur" }).success).toBe(false);
    expect(reviewBodySchema.safeParse({ rating: 5, comment: "çox yaxşı məhsuldur" }).success).toBe(true);
  });

  it("şərh ən az 10 simvol olmalıdır", () => {
    expect(reviewBodySchema.safeParse({ rating: 5, comment: "  əla  " }).success).toBe(false);
  });
});
