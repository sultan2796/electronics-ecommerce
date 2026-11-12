import { describe, expect, it } from "vitest";
import { translatePhrase } from "./domTranslator";

describe("dil tərcüməsi", () => {
  it("az dilində mətni dəyişmir", () => expect(translatePhrase("Səbətə at", "az")).toBe("Səbətə at"));
  it("dəqiq ifadələri tərcümə edir", () => {
    expect(translatePhrase("Səbətə at", "ru")).toBe("В корзину");
    expect(translatePhrase("Səbətə at", "en")).toBe("Add to cart");
  });
  it("kənar boşluqları saxlayır", () => expect(translatePhrase("  Cəmi ", "en")).toBe("  Total "));
  it("dəyişənli ifadələri tərcümə edir", () => {
    expect(translatePhrase("Stokda 5 ədəd var", "en")).toBe("5 in stock");
    expect(translatePhrase("Bu kod ən az 50 ₼ sifariş üçündür", "ru")).toBe("Код действует для заказа от 50 ₼");
  });
  it("tarixdə ayın adını dəyişir", () => {
    expect(translatePhrase("12 noyabr 2026, 09:05", "en")).toBe("12 November 2026, 09:05");
    expect(translatePhrase("3 mart 2026, 10:00", "ru")).toBe("3 марта 2026, 10:00");
  });
  it("naməlum mətni və rəqəmləri toxunmadan qaytarır", () => {
    expect(translatePhrase("iPhone 13 Pro", "ru")).toBe("iPhone 13 Pro");
    expect(translatePhrase("1 999,99 ₼", "en")).toBe("1 999,99 ₼");
  });
});
