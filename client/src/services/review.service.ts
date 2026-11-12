import { MyReviewStatus, Review, ReviewPage, ReviewSort } from "../types";
import { api } from "./api";

export const reviewService = {
  list: (productId: string, params: { sort?: ReviewSort; page?: number }) =>
    api.get<ReviewPage>(`/products/${productId}/reviews`, { params }).then((r) => r.data),
  mine: (productId: string) => api.get<MyReviewStatus>(`/products/${productId}/reviews/me`).then((r) => r.data),
  save: (productId: string, body: { rating: number; title?: string; comment: string }) =>
    api.post<Review>(`/products/${productId}/reviews`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/reviews/${id}`),
};
