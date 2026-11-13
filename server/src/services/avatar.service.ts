import { apiPublicUrl } from "../config/env";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

export const MAX_AVATAR_BYTES = 1024 * 1024;

const signatures: { mime: string; test: (data: Buffer) => boolean }[] = [
  { mime: "image/png", test: (data) => data.length > 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: "image/jpeg", test: (data) => data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff },
  { mime: "image/webp", test: (data) => data.length > 12 && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP" },
];

export const avatarUrl = (avatarId: string | null | undefined) => (avatarId ? `${apiPublicUrl}/api/uploads/${avatarId}` : null);

export const decodeAvatar = (dataUrl: string) => {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new AppError(400, "Yalnız PNG, JPG və ya WEBP şəkil yükləmək olar");
  const data = Buffer.from(match[2], "base64");
  if (data.length > MAX_AVATAR_BYTES) throw new AppError(413, "Profil şəkli 1 MB-dan böyük olmamalıdır");
  const detected = signatures.find((signature) => signature.test(data));
  if (!detected) throw new AppError(400, "Fayl düzgün şəkil deyil");
  return { data, mimeType: detected.mime };
};

export const replaceAvatar = async (userId: string, dataUrl: string | null) => {
  const decoded = dataUrl ? decodeAvatar(dataUrl) : null;
  return prisma.$transaction(async (tx) => {
    const current = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { avatarId: true } });
    const upload = decoded ? await tx.upload.create({ data: { mimeType: decoded.mimeType, data: decoded.data, size: decoded.data.length } }) : null;
    const user = await tx.user.update({ where: { id: userId }, data: { avatarId: upload?.id ?? null } });
    if (current.avatarId) await tx.upload.deleteMany({ where: { id: current.avatarId } });
    return user;
  });
};
