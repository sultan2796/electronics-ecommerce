import { Cart } from "../types";
import { api } from "./api";

export const cartService = {
  get: () => api.get<Cart>("/cart").then((r) => r.data),
  add: (productId: string, quantity = 1) => api.post<Cart>("/cart/items", { productId, quantity }).then((r) => r.data),
  update: (productId: string, quantity: number) =>
    api.patch<Cart>(`/cart/items/${productId}`, { quantity }).then((r) => r.data),
  remove: (productId: string) => api.delete<Cart>(`/cart/items/${productId}`).then((r) => r.data),
  clear: () => api.delete<Cart>("/cart").then((r) => r.data),
};
