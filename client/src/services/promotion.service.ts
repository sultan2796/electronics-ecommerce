import { AdminPromotion, Promotion, PromotionInput, PromotionPlacement } from "../types";
import { api } from "./api";

const seen = new Set<string>();
const pending = { impressions: new Set<string>(), clicks: new Set<string>() };
let timer: number | undefined;

const flush = () => {
  timer = undefined;
  const impressions = [...pending.impressions].slice(0, 10);
  const clicks = [...pending.clicks].slice(0, 5);
  impressions.forEach((id) => pending.impressions.delete(id));
  clicks.forEach((id) => pending.clicks.delete(id));
  if (!impressions.length && !clicks.length) return;
  void api.post("/promotions/events", { impressions, clicks }).catch(() => undefined);
  if (pending.impressions.size || pending.clicks.size) schedule();
};

const schedule = () => {
  if (timer === undefined) timer = window.setTimeout(flush, 1500);
};

export const promotionService = {
  live: (placement: PromotionPlacement) => api.get<Promotion[]>("/promotions", { params: { placement } }).then((r) => r.data),
  trackImpression: (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    pending.impressions.add(id);
    schedule();
  },
  trackClick: (id: string) => {
    pending.clicks.add(id);
    flush();
  },
  list: () => api.get<AdminPromotion[]>("/admin/promotions").then((r) => r.data),
  create: (input: PromotionInput) => api.post<AdminPromotion>("/admin/promotions", input).then((r) => r.data),
  update: (id: string, input: Partial<PromotionInput>) => api.patch<AdminPromotion>(`/admin/promotions/${id}`, input).then((r) => r.data),
  remove: (id: string) => api.delete(`/admin/promotions/${id}`).then(() => undefined),
  reorder: (placement: PromotionPlacement, ids: string[]) => api.put("/admin/promotions/order", { placement, ids }).then(() => undefined),
};
