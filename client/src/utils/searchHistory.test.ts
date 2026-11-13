import { beforeEach, describe, expect, it } from "vitest";
import { clearSearchHistory, readSearchHistory, rememberSearch } from "./searchHistory";

describe("axtarış tarixçəsi", () => {
  beforeEach(() => localStorage.clear());

  it("son axtarışı başa qoyur, təkrarı silir və 6 ilə məhdudlaşdırır", () => {
    ["iphone", "macbook", "airpods", "ipad", "watch", "dell", "IPHONE"].forEach(rememberSearch);
    expect(readSearchHistory()).toEqual(["IPHONE", "dell", "watch", "ipad", "airpods", "macbook"]);
  });

  it("qısa sorğuları saxlamır və təmizlənir", () => {
    rememberSearch("a");
    expect(readSearchHistory()).toEqual([]);
    rememberSearch("asus");
    clearSearchHistory();
    expect(readSearchHistory()).toEqual([]);
  });

  it("zədələnmiş məlumatı boş siyahı kimi oxuyur", () => {
    localStorage.setItem("electroshop:search-history", "{xəta");
    expect(readSearchHistory()).toEqual([]);
  });
});
