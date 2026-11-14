import { z } from "zod";
import { isSafeUrl } from "./safeUrl";

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

export const safeLink = z
  .string()
  .trim()
  .max(300)
  .nullish()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || isSafeUrl(value), "Keçid / ilə və ya https:// ilə başlamalıdır");

export const optionalImageUrl = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || isSafeUrl(value), "Şəkil ünvanı / ilə və ya https:// ilə başlamalıdır");

export const requiredImageUrl = z
  .string()
  .trim()
  .min(1, "Şəkil tələb olunur")
  .max(500)
  .refine(isSafeUrl, "Şəkil ünvanı / ilə və ya https:// ilə başlamalıdır");

export const optionalDate = z
  .union([z.coerce.date(), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value instanceof Date ? value : value === undefined ? undefined : null));

export const dateOrderMessage = "Bitmə vaxtı başlanğıcdan sonra olmalıdır";

export const datesInOrder = (value: { startsAt?: Date | null; endsAt?: Date | null }) => !value.startsAt || !value.endsAt || value.endsAt > value.startsAt;

export const dateOrderIssue = { message: dateOrderMessage, path: ["endsAt"] };

export const mergedDatesInOrder = (
  next: { startsAt?: Date | null; endsAt?: Date | null },
  current: { startsAt: Date | null; endsAt: Date | null },
) =>
  datesInOrder({
    startsAt: next.startsAt === undefined ? current.startsAt : next.startsAt,
    endsAt: next.endsAt === undefined ? current.endsAt : next.endsAt,
  });
