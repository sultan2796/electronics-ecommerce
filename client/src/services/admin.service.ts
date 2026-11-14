import { PaymentStatus, Brand, AdminReview, AdminStats, EmailLogEntry, EmailStatus, AdminUser, Category, ImportResult, Order, OrderStatus, Paginated, Product, ProductPayload, Role, AdminUserDetail } from "../types";
import { api } from "./api";

export interface AdminPayment {
  id: string;
  provider: string;
  reference: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  refundRequired?: boolean;
  createdAt: string;
  order: { id: string; orderNumber: string | null; guestEmail: string | null; guestName: string | null; user: { name: string; email: string } | null };
}

export interface AdminQuestion {
  id: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  user: { name: string; email: string };
  product: { id: string; name: string; slug: string };
  answeredBy: { name: string } | null;
}

export interface AdminNotice {
  id: string;
  kind: "order" | "stock" | "review" | "refund" | "email";
  title: string;
  detail: string;
  to: string;
  createdAt: string;
}

export interface AdminSearchResult {
  orders: { id: string; orderNumber: string | null; status: OrderStatus; total: string; guestName: string | null; user: { name: string } | null }[];
  products: { id: string; name: string; sku: string; stock: number; isActive: boolean }[];
  users: { id: string; name: string; email: string; role: Role }[];
}

export interface VariantInput {
  id?: string;
  name: string;
  color: string | null;
  colorHex: string | null;
  size: string | null;
  sku: string;
  price: number | null;
  salePrice: number | null;
  stock: number;
  images: string[];
  isActive: boolean;
}

export const adminService = {
  stats: () => api.get<AdminStats>("/admin/stats").then((r) => r.data),
  orders: (params: { status?: OrderStatus; page?: number; q?: string; userId?: string }) =>
    api.get<Paginated<Order>>("/admin/orders", { params }).then((r) => r.data),
  updateOrderStatus: (id: string, status: OrderStatus) =>
    api.patch<Order>(`/admin/orders/${id}/status`, { status }).then((r) => r.data),
  inventory: (params: { q?: string; lowStock?: boolean; page?: number; model?: "with" | "without" }) =>
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
  payments: (params: { status?: PaymentStatus; q?: string; page?: number }) =>
    api
      .get<Paginated<AdminPayment> & { summary: Partial<Record<PaymentStatus, { count: number; amount: number }>> }>("/admin/payments", { params })
      .then((r) => r.data),
  questions: (params: { status: "open" | "answered" | "all"; page: number }) =>
    api.get<Paginated<AdminQuestion> & { openCount: number }>("/admin/questions", { params }).then((r) => r.data),
  updateQuestion: (id: string, body: { answer?: string; isPublished?: boolean }) => api.patch(`/admin/questions/${id}`, body).then((r) => r.data),
  deleteQuestion: (id: string) => api.delete(`/admin/questions/${id}`),
  notifications: () => api.get<{ items: AdminNotice[] }>("/admin/notifications").then((r) => r.data),
  optimizeImages: (cursor?: string) =>
    api
      .post<{ converted: number; savedBytes: number; skipped: number; nextCursor: string | null }>("/admin/uploads/optimize", cursor ? { cursor } : {}, { timeout: 120000 })
      .then((r) => r.data),
  markPaymentRefunded: (id: string) => api.post(`/admin/payments/${id}/refunded`).then((r) => r.data),
  search: (q: string, signal?: AbortSignal) => api.get<AdminSearchResult>("/admin/search", { params: { q }, signal }).then((r) => r.data),
  brands: (all = false) => api.get<Brand[]>("/brands", { params: all ? { all: "1" } : {} }).then((r) => r.data),
  createBrand: (body: { name: string; slug?: string; logoUrl?: string | null; isActive?: boolean }) => api.post<Brand>("/brands", body).then((r) => r.data),
  updateBrand: (id: string, body: { name?: string; slug?: string; logoUrl?: string | null; isActive?: boolean }) =>
    api.patch<Brand>(`/brands/${id}`, body).then((r) => r.data),
  deleteBrand: (id: string) => api.delete(`/brands/${id}`),
  getProduct: (id: string) => api.get<Product>(`/admin/products/${id}`).then((r) => r.data),
  createProduct: (payload: ProductPayload) => api.post<Product>("/products", payload).then((r) => r.data),
  saveVariants: (id: string, variants: VariantInput[]) => api.put<Product>(`/products/${id}/variants`, { variants }).then((r) => r.data),
  updateProduct: (id: string, payload: Partial<ProductPayload>) => api.patch<Product>(`/products/${id}`, payload).then((r) => r.data),
  reviews: (params: { q?: string; rating?: number; page?: number }) =>
    api.get<Paginated<AdminReview>>("/admin/reviews", { params }).then((r) => r.data),
  deleteReview: (id: string) => api.delete(`/reviews/${id}`),
  emails: (params: { q?: string; status?: EmailStatus; page?: number }) =>
    api.get<Paginated<EmailLogEntry> & { mode: string }>("/admin/emails", { params }).then((r) => r.data),
  importCatalog: (replaceDemo: boolean) =>
    api.post<ImportResult>("/admin/import", { replaceDemo }, { timeout: 120000 }).then((r) => r.data),
};
