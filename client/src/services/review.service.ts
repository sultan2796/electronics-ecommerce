import { MyReviewStatus, ProductQuestion, Review, ReviewPage, ReviewSort } from "../types";
import { api } from "./api";

export const reviewService = {
  list: (productId: string, params: { sort?: ReviewSort; page?: number; rating?: number }) =>
    api.get<ReviewPage>(`/products/${productId}/reviews`, { params }).then((r) => r.data),
  mine: (productId: string) => api.get<MyReviewStatus>(`/products/${productId}/reviews/me`).then((r) => r.data),
  save: (productId: string, body: { rating: number; title?: string; comment: string; images?: string[] }) =>
    api.post<Review>(`/products/${productId}/reviews`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/reviews/${id}`),
  questions: (productId: string) => api.get<{ items: ProductQuestion[] }>(`/products/${productId}/questions`).then((r) => r.data.items),
  ask: (productId: string, question: string) => api.post<ProductQuestion>(`/products/${productId}/questions`, { question }).then((r) => r.data),
  removeQuestion: (id: string) => api.delete(`/reviews/questions/${id}`),
};
