import { describe, expect, it } from "vitest";
import { Product } from "../types";
import { clearRecentlyViewed, mergeRecentlyViewed, readRecentlyViewed, rememberProduct } from "./recentlyViewed";

const product = (id: string) => ({ id, name: `Məhsul ${id}`, slug: id }) as Product;

describe("son baxılanlar", () => {
  it("yeni məhsulu başa əlavə edir və təkrarı silir", () => {
    const list = [product("a"), product("b"), product("c")];
    expect(mergeRecentlyViewed(list, product("b")).map((item) => item.id)).toEqual(["b", "a", "c"]);
  });

  it("limiti aşmır", () => {
    const list = Array.from({ length: 10 }, (_, index) => product(String(index)));
    expect(mergeRecentlyViewed(list, product("new"), 10)).toHaveLength(10);
  });

  it("localStorage-də saxlayır və təmizləyir", () => {
    rememberProduct(product("x"));
    rememberProduct(product("y"));
    expect(readRecentlyViewed().map((item) => item.id)).toEqual(["y", "x"]);
    clearRecentlyViewed();
    expect(readRecentlyViewed()).toEqual([]);
  });

  it("korlanmış məlumatda çökmür", () => {
    localStorage.setItem("electroshop:recently-viewed", "{pozuq json");
    expect(readRecentlyViewed()).toEqual([]);
  });
});
