import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { optimizeImage } from "../../src/services/image.service";

describe("optimizeImage", () => {
  it("converts large PNG photos to resized WebP", async () => {
    const png = await sharp({ create: { width: 2400, height: 1200, channels: 3, background: { r: 200, g: 80, b: 20 } } }).png().toBuffer();
    const result = await optimizeImage(png);
    expect(result.mimeType).toBe("image/webp");
    const meta = await sharp(result.data).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(1600);
  });

  it("rejects bytes that are not an image", async () => {
    await expect(optimizeImage(Buffer.from("<svg onload=alert(1)>"))).rejects.toMatchObject({ statusCode: 400 });
  });
});
