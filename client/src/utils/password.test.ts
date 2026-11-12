import { describe, expect, it } from "vitest";
import { passwordProblems, passwordStrength } from "./password";

describe("şifrə yoxlaması", () => {
  it("qısa şifrəni rədd edir", () => {
    expect(passwordProblems("abc")).toHaveLength(1);
    expect(passwordProblems("abcdefgh")).toEqual([]);
  });

  it("gücü 0-4 arası qiymətləndirir", () => {
    expect(passwordStrength("abc")).toBe(0);
    expect(passwordStrength("Abcdefgh1")).toBe(3);
    expect(passwordStrength("Abcdefgh1234!")).toBe(4);
  });
});
