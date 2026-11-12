import { clientUrl } from "../../config/env";
import { PaymentProvider } from "./types";

export const mockProvider: PaymentProvider = {
  name: "mock",
  testMode: true,
  async createSession(input) {
    return { redirectUrl: `${clientUrl}/payment/mock?ref=${encodeURIComponent(input.reference)}` };
  },
};
