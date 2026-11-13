import { z } from "zod";
import { prisma } from "../config/prisma";
import { audit } from "../services/audit.service";
import { asyncHandler } from "../utils/asyncHandler";
import { isSafeUrl } from "../utils/safeUrl";

export const SETTING_KEYS = ["logoUrl", "logoIconUrl", "faviconUrl"] as const;
type SettingKey = (typeof SETTING_KEYS)[number];

const assetUrl = z
  .string()
  .trim()
  .max(500)
  .nullable()
  .refine((value) => value === null || value === "" || isSafeUrl(value), "Ünvan / ilə və ya https:// ilə başlamalıdır")
  .transform((value) => (value ? value : null));

export const settingsSchema = z
  .object({ logoUrl: assetUrl.optional(), logoIconUrl: assetUrl.optional(), faviconUrl: assetUrl.optional() })
  .strict();

const readSettings = async () => {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: [...SETTING_KEYS] } } });
  const result: Record<SettingKey, string | null> = { logoUrl: null, logoIconUrl: null, faviconUrl: null };
  for (const row of rows) result[row.key as SettingKey] = row.value;
  return result;
};

export const getSettings = asyncHandler(async (_req, res) => {
  res.set("Cache-Control", "no-cache");
  res.json(await readSettings());
});

export const updateSettings = asyncHandler(async (req, res) => {
  const input = req.body as z.infer<typeof settingsSchema>;
  const operations = Object.entries(input).map(([key, value]) =>
    value
      ? prisma.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } })
      : prisma.siteSetting.deleteMany({ where: { key } }),
  );
  await prisma.$transaction(operations);
  audit(req, "settings.update", "SiteSetting", null, input);
  res.json(await readSettings());
});
