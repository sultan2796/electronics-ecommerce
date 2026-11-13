import crypto from "crypto";
import { apiPublicUrl, clientUrl, env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { PaymentOutcome, PaymentProvider } from "./types";

const credentials = () => {
  if (!env.EPOINT_PUBLIC_KEY || !env.EPOINT_PRIVATE_KEY) {
    throw new AppError(503, "Kartla ödəniş hələ qurulmayıb (Epoint açarları yoxdur)");
  }
  return { publicKey: env.EPOINT_PUBLIC_KEY, privateKey: env.EPOINT_PRIVATE_KEY };
};

export const signEpoint = (data: string, privateKey: string) =>
  crypto.createHash("sha1").update(privateKey + data + privateKey).digest("base64");

export const encodeEpoint = (payload: Record<string, unknown>) => Buffer.from(JSON.stringify(payload)).toString("base64");

export const verifyEpointCallback = (data: string, signature: string) => {
  const { privateKey } = credentials();
  const expected = Buffer.from(signEpoint(data, privateKey));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;
  return JSON.parse(Buffer.from(data, "base64").toString("utf8")) as Record<string, unknown>;
};

const post = async (path: string, payload: Record<string, unknown>) => {
  const { privateKey } = credentials();
  const data = encodeEpoint(payload);
  const response = await fetch(`${env.EPOINT_API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ data, signature: signEpoint(data, privateKey) }),
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    console.error("[epoint] http error", response.status, body);
    throw new AppError(502, `Epoint xətası (HTTP ${response.status})`);
  }
  return body;
};

export const mapEpointStatus = (status: unknown): PaymentOutcome => {
  if (status === "success") return "succeeded";
  if (status === "failed" || status === "error" || status === "returned") return "failed";
  return "pending";
};

export const epointProvider: PaymentProvider = {
  name: "epoint",
  testMode: false,
  async createSession(input) {
    const { publicKey } = credentials();
    const body = await post("/request", {
      public_key: publicKey,
      amount: input.amount,
      currency: input.currency,
      language: "az",
      order_id: input.reference,
      description: input.description,
      success_redirect_url: `${clientUrl}/payment/result?order=${input.orderId}`,
      error_redirect_url: `${clientUrl}/payment/result?order=${input.orderId}`,
      result_url: `${apiPublicUrl}/api/payments/epoint/callback`,
    });
    if (body.status !== "success" || typeof body.redirect_url !== "string") {
      console.error("[epoint] session error", body);
      throw new AppError(502, "Epoint ödəniş sessiyası yaratmadı");
    }
    return { redirectUrl: body.redirect_url, providerTransactionId: String(body.transaction ?? ""), raw: body };
  },
  async fetchStatus(reference) {
    const { publicKey } = credentials();
    const body = await post("/get-status", { public_key: publicKey, order_id: reference });
    return { outcome: mapEpointStatus(body.status), raw: body };
  },
};
