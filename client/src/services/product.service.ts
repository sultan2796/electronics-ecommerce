import { serializeFilters } from "../utils/filters";
import { Category, Facets, Paginated, Product, ProductFilters } from "../types";
import { api } from "./api";

export const productService = {
  list: (filters: ProductFilters, limit = 12) => {
    const params = serializeFilters(filters);
    params.set("page", String(filters.page));
    params.set("limit", String(limit));
    return api.get<Paginated<Product>>("/products", { params }).then((r) => r.data);
  },
  get: (slugOrId: string) => api.get<Product>(`/products/${slugOrId}`).then((r) => r.data),
  facets: (category?: string) =>
    api.get<Facets>("/products/facets", { params: category ? { category } : {} }).then((r) => r.data),
  compare: (ids: string[]) =>
    api.get<{ items: Product[] }>("/products/compare", { params: { ids: ids.join(",") } }).then((r) => r.data.items),
  featured: (limit = 3) => api.get<Product[]>("/products/featured", { params: { limit } }).then((r) => r.data),
  categories: () => api.get<Category[]>("/categories").then((r) => r.data),
};
