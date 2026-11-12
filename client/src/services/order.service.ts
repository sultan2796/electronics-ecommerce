import { CheckoutResult, Order, PaymentMethod, ShippingAddress } from "../types";
import { api } from "./api";

export const orderService = {
  checkout: (shippingAddress: ShippingAddress, paymentMethod: PaymentMethod, extra: { couponCode?: string; saveAddress?: boolean; usePoints?: boolean } = {}) =>
    api.post<CheckoutResult>("/orders/checkout", { shippingAddress, paymentMethod, ...extra }).then((r) => r.data),
  mine: () => api.get<Order[]>("/orders").then((r) => r.data),
  get: (id: string) => api.get<Order>(`/orders/${id}`).then((r) => r.data),
  cancel: (id: string) => api.post<Order>(`/orders/${id}/cancel`).then((r) => r.data),
  pay: (id: string) => api.post<{ redirectUrl: string }>(`/orders/${id}/pay`).then((r) => r.data),
};
