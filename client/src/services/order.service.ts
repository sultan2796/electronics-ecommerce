import { CheckoutResult, Order, OrderStatus, PaymentMethod, ShippingAddress } from "../types";
import { api } from "./api";

export interface GuestOrderResult {
  orderNumber: string;
  trackingToken: string;
  total: string;
  subtotal: string;
  shippingFee: string;
}

export interface TrackedOrder {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: PaymentMethod;
  subtotal: string;
  shippingFee: string;
  total: string;
  createdAt: string;
  items: { productId: string | null; productName: string; quantity: number; unitPrice: string }[];
  statusHistory: { status: OrderStatus; note: string | null; createdAt: string }[];
  shippingAddress: ShippingAddress;
}

export const orderService = {
  guestCheckout: (input: { email: string; shippingAddress: ShippingAddress; items: { productId: string; variantId?: string; quantity: number }[] }) =>
    api.post<GuestOrderResult>("/guest-orders", input).then((r) => r.data),
  track: (orderNumber: string, token: string) => api.get<TrackedOrder>(`/track/${orderNumber}`, { params: { token } }).then((r) => r.data),
  checkout: (shippingAddress: ShippingAddress, paymentMethod: PaymentMethod, extra: { couponCode?: string; saveAddress?: boolean; usePoints?: boolean } = {}) =>
    api.post<CheckoutResult>("/orders/checkout", { shippingAddress, paymentMethod, ...extra }).then((r) => r.data),
  mine: () => api.get<Order[]>("/orders").then((r) => r.data),
  get: (id: string) => api.get<Order>(`/orders/${id}`).then((r) => r.data),
  cancel: (id: string) => api.post<Order>(`/orders/${id}/cancel`).then((r) => r.data),
  pay: (id: string) => api.post<{ redirectUrl: string }>(`/orders/${id}/pay`).then((r) => r.data),
};
