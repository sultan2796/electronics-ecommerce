import { OrderStatus, PaymentConfig, PaymentMethod, PaymentStatus } from "../types";
import { api } from "./api";

export interface MockPayment {
  reference: string;
  status: PaymentStatus;
  amount: string;
  currency: string;
  orderId: string;
}

export interface OrderPaymentStatus {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paidAt: string | null;
  total: string;
  paid: boolean;
}

export const paymentService = {
  config: () => api.get<PaymentConfig>("/payments/config").then((r) => r.data),
  mock: (reference: string) => api.get<MockPayment>(`/payments/mock/${reference}`).then((r) => r.data),
  completeMock: (reference: string, outcome: "succeeded" | "failed") =>
    api.post<{ orderId: string }>(`/payments/mock/${reference}/complete`, { outcome }).then((r) => r.data),
  status: (orderId: string) => api.get<OrderPaymentStatus>(`/payments/order/${orderId}`).then((r) => r.data),
};

export const goToPayment = (redirectUrl: string, navigate: (path: string) => void) => {
  const target = new URL(redirectUrl, window.location.origin);
  if (target.origin === window.location.origin) {
    navigate(`${target.pathname}${target.search}`);
  } else {
    window.location.assign(target.toString());
  }
};
