import { Coupon, CouponCheck, SavedAddress, ShippingAddress } from "../types";
import { api } from "./api";

export type AddressInput = ShippingAddress & { label: string; isDefault?: boolean };
export type CouponInput = Pick<Coupon, "code" | "type" | "isActive"> & {
  value: number;
  minTotal: number;
  maxUses: number | null;
  expiresAt: string | null;
};

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
  upload: (dataUrl: string) => api.post<{ id: string; url: string }>("/uploads", { dataUrl }).then((r) => r.data),
};

export const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
