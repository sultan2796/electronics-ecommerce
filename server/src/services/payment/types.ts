export interface PaymentSessionInput {
  reference: string;
  orderId: string;
  amount: string;
  currency: string;
  description: string;
}

export interface PaymentSession {
  redirectUrl: string;
  providerTransactionId?: string;
  raw?: unknown;
}

export type PaymentOutcome = "succeeded" | "failed" | "pending";

export interface PaymentStatusResult {
  outcome: PaymentOutcome;
  raw?: unknown;
}

export interface PaymentProvider {
  name: string;
  testMode: boolean;
  createSession(input: PaymentSessionInput): Promise<PaymentSession>;
  fetchStatus?(reference: string): Promise<PaymentStatusResult>;
}
