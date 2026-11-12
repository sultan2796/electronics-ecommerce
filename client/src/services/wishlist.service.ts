import { WishlistItem } from "../types";
import { api } from "./api";

export const wishlistService = {
  get: () => api.get<WishlistItem[]>("/wishlist").then((r) => r.data),
  add: (productId: string) => api.post<WishlistItem[]>(`/wishlist/${productId}`).then((r) => r.data),
  remove: (productId: string) => api.delete<WishlistItem[]>(`/wishlist/${productId}`).then((r) => r.data),
};
