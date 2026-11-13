import { describe, expect, it } from "vitest";
import { decodeAvatar } from "../../src/services/avatar.service";

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]).toString("base64");

describe("decodeAvatar", () => {
  it("accepts real image bytes and detects the type from content", () => {
    expect(decodeAvatar(`data:image/jpeg;base64,${png}`).mimeType).toBe("image/png");
  });

  it("rejects svg, html disguised as images and oversized files", () => {
    expect(() => decodeAvatar("data:image/svg+xml;base64,PHN2Zz4=")).toThrow();
    expect(() => decodeAvatar(`data:image/png;base64,${Buffer.from("<html><script>").toString("base64")}`)).toThrow();
    const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(1024 * 1024)]).toString("base64");
    expect(() => decodeAvatar(`data:image/jpeg;base64,${big}`)).toThrow(/1 MB/);
  });
});
