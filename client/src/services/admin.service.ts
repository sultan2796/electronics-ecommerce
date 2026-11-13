import { AdminReview, AdminStats, EmailLogEntry, EmailStatus, AdminUser, Category, ImportResult, Order, OrderStatus, Paginated, Product, ProductPayload, Role, AdminUserDetail } from "../types";
import { api } from "./api";

export const adminService = {
  stats: () => api.get<AdminStats>("/admin/stats").then((r) => r.data),
  orders: (params: { status?: OrderStatus; page?: number; q?: string; userId?: string }) =>
    api.get<Paginated<Order>>("/admin/orders", { params }).then((r) => r.data),
  updateOrderStatus: (id: string, status: OrderStatus) =>
    api.patch<Order>(`/admin/orders/${id}/status`, { status }).then((r) => r.data),
  inventory: (params: { q?: string; lowStock?: boolean; page?: number }) =>
    api.get<Paginated<Product>>("/admin/inventory", { params }).then((r) => r.data),
  updateStock: (id: string, stock: number) =>
    api.patch<Product>(`/admin/products/${id}/stock`, { stock }).then((r) => r.data),
  deactivateProduct: (id: string) => api.delete(`/products/${id}`),
  user: (id: string) => api.get<AdminUserDetail>(`/admin/users/${id}`).then((r) => r.data),
  users: (params: { q?: string; role?: Role; page?: number }) =>
    api.get<Paginated<AdminUser> & { roleCounts: Partial<Record<Role, number>> }>("/admin/users", { params }).then((r) => r.data),
  updateUser: (id: string, body: { role?: Role; isBlocked?: boolean }) =>
    api.patch<AdminUser>(`/admin/users/${id}`, body).then((r) => r.data),
  createCategory: (body: { name: string; slug: string }) => api.post<Category>("/categories", body).then((r) => r.data),
  updateCategory: (id: string, body: { name?: string; slug?: string }) => api.patch<Category>(`/categories/${id}`, body).then((r) => r.data),
  deleteCategory: (id: string) => api.delete(`/categories/${id}`),
  getProduct: (id: string) => api.get<Product>(`/admin/products/${id}`).then((r) => r.data),
  createProduct: (payload: ProductPayload) => api.post<Product>("/products", payload).then((r) => r.data),
  updateProduct: (id: string, payload: Partial<ProductPayload>) => api.patch<Product>(`/products/${id}`, payload).then((r) => r.data),
  reviews: (params: { q?: string; rating?: number; page?: number }) =>
    api.get<Paginated<AdminReview>>("/admin/reviews", { params }).then((r) => r.data),
  deleteReview: (id: string) => api.delete(`/reviews/${id}`),
  emails: (params: { q?: string; status?: EmailStatus; page?: number }) =>
    api.get<Paginated<EmailLogEntry> & { mode: string }>("/admin/emails", { params }).then((r) => r.data),
  importCatalog: (replaceDemo: boolean) =>
    api.post<ImportResult>("/admin/import", { replaceDemo }, { timeout: 120000 }).then((r) => r.data),
};
