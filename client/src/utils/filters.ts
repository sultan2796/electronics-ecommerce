import { ProductFilters, ProductSort } from "../types";

const sortOptions: ProductSort[] = ["newest", "price_asc", "price_desc", "name_asc", "bestsellers", "rating"];

const list = (value: string | null) => (value ? value.split(",").filter(Boolean) : []);

export const emptyFilters: ProductFilters = {
  q: "",
  category: "",
  brand: [],
  ram: [],
  storage: [],
  storageType: [],
  os: [],
  minPrice: "",
  maxPrice: "",
  minScreen: "",
  maxScreen: "",
  inStock: false,
  sort: "newest",
  page: 1,
};

export const parseFilters = (params: URLSearchParams): ProductFilters => {
  const sort = params.get("sort") as ProductSort | null;
  return {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    brand: list(params.get("brand")),
    ram: list(params.get("ram")),
    storage: list(params.get("storage")),
    storageType: list(params.get("storageType")),
    os: list(params.get("os")),
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    minScreen: params.get("minScreen") ?? "",
    maxScreen: params.get("maxScreen") ?? "",
    inStock: params.get("inStock") === "true",
    sort: sort && sortOptions.includes(sort) ? sort : "newest",
    page: Math.max(1, Number(params.get("page")) || 1),
  };
};

export const serializeFilters = (filters: ProductFilters): URLSearchParams => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(","));
    } else if (typeof value === "boolean") {
      if (value) params.set(key, "true");
    } else if (key === "page") {
      if (Number(value) > 1) params.set(key, String(value));
    } else if (key === "sort") {
      if (value !== "newest") params.set(key, String(value));
    } else if (String(value).trim()) {
      params.set(key, String(value).trim());
    }
  });
  return params;
};

export const countActiveFilters = (filters: ProductFilters) =>
  filters.brand.length +
  filters.ram.length +
  filters.storage.length +
  filters.storageType.length +
  filters.os.length +
  [filters.minPrice, filters.maxPrice, filters.minScreen, filters.maxScreen].filter(Boolean).length +
  (filters.inStock ? 1 : 0);
