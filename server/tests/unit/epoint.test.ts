import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { encodeEpoint, mapEpointStatus, signEpoint, verifyEpointCallback } from "../../src/services/payment/epoint.provider";

const privateKey = process.env.EPOINT_PRIVATE_KEY as string;

describe("Epoint imzası", () => {
  it("base64(sha1(private + data + private)) formulunu istifadə edir", () => {
    const data = encodeEpoint({ order_id: "abc", amount: 10 });
    const expected = crypto.createHash("sha1").update(privateKey + data + privateKey).digest("base64");
    expect(signEpoint(data, privateKey)).toBe(expected);
  });

  it("payload-u base64 JSON kimi kodlayır", () => {
    const data = encodeEpoint({ status: "success" });
    expect(JSON.parse(Buffer.from(data, "base64").toString("utf8"))).toEqual({ status: "success" });
  });

  it("düzgün imzalı callback-i qəbul edir", () => {
    const data = encodeEpoint({ order_id: "ref-1", status: "success" });
    expect(verifyEpointCallback(data, signEpoint(data, privateKey))).toEqual({ order_id: "ref-1", status: "success" });
  });

  it("saxta imzanı rədd edir", () => {
    const data = encodeEpoint({ order_id: "ref-1", status: "success" });
    expect(verifyEpointCallback(data, signEpoint(data, "wrong-key"))).toBeNull();
    expect(verifyEpointCallback(data, "short")).toBeNull();
  });

  it("dəyişdirilmiş məlumatı rədd edir", () => {
    const data = encodeEpoint({ order_id: "ref-1", status: "failed" });
    const tampered = encodeEpoint({ order_id: "ref-1", status: "success" });
    expect(verifyEpointCallback(tampered, signEpoint(data, privateKey))).toBeNull();
  });

  it("statusları düzgün xəritələyir", () => {
    expect(mapEpointStatus("success")).toBe("succeeded");
    expect(mapEpointStatus("failed")).toBe("failed");
    expect(mapEpointStatus("returned")).toBe("failed");
    expect(mapEpointStatus("new")).toBe("pending");
    expect(mapEpointStatus(undefined)).toBe("pending");
  });
});
