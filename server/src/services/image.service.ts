import sharp from "sharp";
import { AppError } from "../utils/AppError";

const MAX_EDGE = 1600;

const sniff = (data: Buffer) => {
  if (data.length > 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (data.length > 12 && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (data.length > 6 && (data.toString("ascii", 0, 6) === "GIF87a" || data.toString("ascii", 0, 6) === "GIF89a")) return "image/gif";
  return null;
};

export const optimizeImage = async (data: Buffer) => {
  const detected = sniff(data);
  if (!detected) throw new AppError(400, "Fayl düzgün şəkil deyil");
  if (detected === "image/gif") return { data, mimeType: detected };
  try {
    const output = await sharp(data, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
    return output.length < data.length || detected !== "image/webp" ? { data: output, mimeType: "image/webp" } : { data, mimeType: detected };
  } catch {
    throw new AppError(400, "Şəkil emal oluna bilmədi");
  }
};
