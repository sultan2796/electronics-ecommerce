import { Product } from "../types";

const KEY = "electroshop:recently-viewed";
export const RECENT_LIMIT = 10;

export const readRecentlyViewed = (): Product[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed.filter((item) => item && typeof item === "object" && "id" in item) as Product[]) : [];
  } catch {
    return [];
  }
};

export const mergeRecentlyViewed = (list: Product[], product: Product, limit = RECENT_LIMIT) =>
  [product, ...list.filter((item) => item.id !== product.id)].slice(0, limit);

export const rememberProduct = (product: Product) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(mergeRecentlyViewed(readRecentlyViewed(), product)));
  } catch {
    return;
  }
};

export const clearRecentlyViewed = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    return;
  }
};
