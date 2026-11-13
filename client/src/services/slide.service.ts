import { AdminSlide, HeroSlide, SlideInput } from "../types";
import { api } from "./api";

export const slideService = {
  active: () => api.get<HeroSlide[]>("/slides").then((r) => r.data),
  list: () => api.get<AdminSlide[]>("/admin/slides").then((r) => r.data),
  create: (input: SlideInput) => api.post<AdminSlide>("/admin/slides", input).then((r) => r.data),
  update: (id: string, input: Partial<SlideInput>) => api.patch<AdminSlide>(`/admin/slides/${id}`, input).then((r) => r.data),
  remove: (id: string) => api.delete(`/admin/slides/${id}`).then(() => undefined),
  reorder: (ids: string[]) => api.put<AdminSlide[]>("/admin/slides/order", { ids }).then((r) => r.data),
};
