import { describe, expect, it } from "vitest";
import { resolveLocale } from "../../src/config/locale";
import { localizeCategory, localizeProduct } from "../../src/services/localize.service";

const product = {
  sku: "DJ-112",
  name: "TV Studio Camera Pedestal",
  description: "The TV Studio Camera Pedestal is a professional-grade camera support system.",
  category: { slug: "mobile-accessories", name: "Mobil aksesuarlar" },
  specs: null,
};

describe("məhsul lokalizasiyası", () => {
  it("dil başlığını tanıyır, naməlumu az qəbul edir", () => {
    expect(resolveLocale("ru")).toBe("ru");
    expect(resolveLocale("EN-us")).toBe("en");
    expect(resolveLocale("de")).toBe("az");
    expect(resolveLocale(undefined)).toBe("az");
  });

  it("azərbaycan dilində ad və təsvir verir", () => {
    const result = localizeProduct(product, "az");
    expect(result.name).toBe("TV studiya kamera postamenti");
    expect(result.description).toContain("peşəkar");
    expect(result.category?.name).toBe("Mobil aksesuarlar");
  });

  it("rus dilində ad, təsvir və kateqoriya verir", () => {
    const result = localizeProduct(product, "ru");
    expect(result.name).toContain("пьедестал");
    expect(result.category?.name).toBe("Мобильные аксессуары");
  });

  it("ingilis dilində mənbə mətni saxlayır", () => {
    const result = localizeProduct(product, "en");
    expect(result.name).toBe(product.name);
    expect(result.description).toBe(product.description);
    expect(result.category?.name).toBe("Mobile accessories");
  });

  it("admin tərəfindən verilmiş tərcümə üstündür, tərcüməsi olmayan məhsul dəyişmir", () => {
    const custom = { ...product, sku: "X-1", specs: { extra: { translations: { ru: { name: "Свой товар" } } } } };
    expect(localizeProduct(custom, "ru").name).toBe("Свой товар");
    expect(localizeProduct({ ...product, sku: "X-2" }, "ru").name).toBe(product.name);
  });

  it("az dilində kateqoriya adı bazadakı kimi qalır", () => {
    expect(localizeCategory({ slug: "laptops", name: "Admin adı" }, "az").name).toBe("Admin adı");
    expect(localizeCategory({ slug: "laptops", name: "Admin adı" }, "en").name).toBe("Laptops");
  });
});
