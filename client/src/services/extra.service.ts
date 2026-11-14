import { AdminCampaign, AuditEntry, Campaign, CampaignShowcase, CampaignStats, Coupon, CouponCheck, Paginated, Product, SalesReport, SavedAddress, ShippingAddress } from "../types";
import { api } from "./api";

export type AddressInput = ShippingAddress & { label: string; isDefault?: boolean };
export type CouponInput = Pick<Coupon, "code" | "type" | "isActive"> & {
  value: number;
  minTotal: number;
  maxUses: number | null;
  expiresAt: string | null;
};

export type CampaignInput = {
  name: string;
  description: string | null;
  bannerUrl: string | null;
  fridayOnly: boolean;
  discountPercent: number;
  categoryId: string | null;
  products: { productId: string; specialPrice: number | null }[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};
export type BulkAction = "setStock" | "adjustStock" | "adjustPrice" | "activate" | "deactivate" | "setCategory";

export const extraService = {
  checkCoupon: (code: string) => api.post<CouponCheck>("/coupons/check", { code }).then((r) => r.data),
  addresses: () => api.get<SavedAddress[]>("/addresses").then((r) => r.data),
  createAddress: (body: AddressInput) => api.post<SavedAddress>("/addresses", body).then((r) => r.data),
  updateAddress: (id: string, body: Partial<AddressInput>) => api.patch<SavedAddress>(`/addresses/${id}`, body).then((r) => r.data),
  deleteAddress: (id: string) => api.delete(`/addresses/${id}`),
  stockAlert: (productId: string) => api.post<{ message: string }>(`/products/${productId}/stock-alert`).then((r) => r.data),
  coupons: () => api.get<Coupon[]>("/admin/coupons").then((r) => r.data),
  createCoupon: (body: CouponInput) => api.post<Coupon>("/admin/coupons", body).then((r) => r.data),
  updateCoupon: (id: string, body: Partial<CouponInput>) => api.patch<Coupon>(`/admin/coupons/${id}`, body).then((r) => r.data),
  deleteCoupon: (id: string) => api.delete(`/admin/coupons/${id}`),
  activeCampaigns: () => api.get<Campaign[]>("/campaigns/active").then((r) => r.data),
  related: (productId: string) => api.get<{ boughtTogether: boolean; items: Product[] }>(`/products/${productId}/related`).then((r) => r.data),
  campaigns: () => api.get<AdminCampaign[]>("/admin/campaigns").then((r) => r.data),
  campaignStats: (id: string) => api.get<CampaignStats>(`/admin/campaigns/${id}/stats`).then((r) => r.data),
  fridayCampaign: () => api.get<CampaignShowcase>("/campaigns/friday").then((r) => r.data),
  campaign: (id: string) => api.get<CampaignShowcase>(`/campaigns/${id}`).then((r) => r.data),
  createCampaign: (body: CampaignInput) => api.post<Campaign>("/admin/campaigns", body).then((r) => r.data),
  updateCampaign: (id: string, body: Partial<CampaignInput>) => api.patch<Campaign>(`/admin/campaigns/${id}`, body).then((r) => r.data),
  deleteCampaign: (id: string) => api.delete(`/admin/campaigns/${id}`),
  bulkProducts: (body: { ids: string[]; action: BulkAction; value?: number | string }) =>
    api.post<{ updated: number }>("/admin/products/bulk", body).then((r) => r.data),
  salesReport: (params: { from?: string; to?: string }) => api.get<SalesReport>("/admin/reports/sales", { params }).then((r) => r.data),
  salesCsv: (params: { from?: string; to?: string }) =>
    api.get<Blob>("/admin/reports/sales.csv", { params, responseType: "blob" }).then((r) => r.data),
  audit: (params: { entity?: string; page?: number }) => api.get<Paginated<AuditEntry>>("/admin/audit", { params }).then((r) => r.data),
  linkGoogle: (credential: string) => api.post("/auth/google/link", { credential }).then((r) => r.data),
  googleLogin: (credential: string) => api.post("/auth/google", { credential }).then((r) => r.data),
  uploadModel: (file: File) =>
    api
      .post<{ id: string; url: string; size: number }>("/uploads/model", file, { headers: { "Content-Type": "model/gltf-binary" }, timeout: 120000 })
      .then((r) => r.data),
  upload: (dataUrl: string) => api.post<{ id: string; url: string }>("/uploads", { dataUrl }).then((r) => r.data),
};

export const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
