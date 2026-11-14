import { Prisma } from "@prisma/client";
import { apiPublicUrl } from "../config/env";
import { AppError } from "../utils/AppError";
import { optimizeImage } from "./image.service";

const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;
const uploadPrefix = `${apiPublicUrl}/api/uploads/`;

const uploadIdOf = (url: string) => (url.startsWith(uploadPrefix) ? url.slice(uploadPrefix.length) : null);

export type PreparedPhoto = { kind: "keep"; url: string } | { kind: "new"; data: Buffer; mimeType: string };

export const prepareReviewPhotos = async (requested: string[] | undefined) => {
  if (requested === undefined) return undefined;
  const prepared: PreparedPhoto[] = [];
  for (const item of requested) {
    if (item.startsWith(uploadPrefix)) {
      prepared.push({ kind: "keep", url: item });
      continue;
    }
    const match = /^data:image\/(?:png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(item);
    if (!match) throw new AppError(400, "Rəy şəkli düzgün formatda deyil");
    const raw = Buffer.from(match[1], "base64");
    if (raw.length > MAX_PHOTO_BYTES) throw new AppError(413, "Hər şəkil 1,5 MB-dan kiçik olmalıdır");
    const { data, mimeType } = await optimizeImage(raw);
    prepared.push({ kind: "new", data, mimeType });
  }
  return prepared;
};

export const resolveReviewPhotos = async (tx: Prisma.TransactionClient, prepared: PreparedPhoto[] | undefined, previous: string[]) => {
  if (prepared === undefined) return { images: previous, removed: [] as string[] };
  const kept: string[] = [];
  const created: string[] = [];
  for (const item of prepared) {
    if (item.kind === "keep") {
      if (!previous.includes(item.url)) throw new AppError(400, "Rəy şəkli bu rəyə aid deyil");
      kept.push(item.url);
      created.push(item.url);
      continue;
    }
    const upload = await tx.upload.create({ data: { data: item.data, mimeType: item.mimeType, size: item.data.length } });
    created.push(`${uploadPrefix}${upload.id}`);
  }
  const removed = previous.filter((url) => !kept.includes(url));
  const removedIds = removed.flatMap((url) => {
    const id = uploadIdOf(url);
    return id ? [id] : [];
  });
  if (removedIds.length) await tx.upload.deleteMany({ where: { id: { in: removedIds } } });
  return { images: created, removed };
};

export const deleteReviewPhotos = async (tx: Prisma.TransactionClient, images: string[]) => {
  const ids = images.flatMap((url) => {
    const id = uploadIdOf(url);
    return id ? [id] : [];
  });
  if (ids.length) await tx.upload.deleteMany({ where: { id: { in: ids } } });
};
