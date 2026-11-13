import { Cart } from "../types";
import { api } from "./api";

export const cartService = {
  get: () => api.get<Cart>("/cart").then((r) => r.data),
  add: (productId: string, quantity = 1, variantId?: string | null) =>
    api.post<Cart>("/cart/items", { productId, quantity, ...(variantId ? { variantId } : {}) }).then((r) => r.data),
  update: (itemId: string, quantity: number) => api.patch<Cart>(`/cart/items/${itemId}`, { quantity }).then((r) => r.data),
  remove: (itemId: string) => api.delete<Cart>(`/cart/items/${itemId}`).then((r) => r.data),
  clear: () => api.delete<Cart>("/cart").then((r) => r.data),
};
