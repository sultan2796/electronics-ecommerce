import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { enrichImportedSpecs, importCatalog } from "./catalogImport.service";

const ensureAdmin = async () => {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return;
  const email = env.ADMIN_EMAIL.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== Role.ADMIN) await prisma.user.update({ where: { id: existing.id }, data: { role: Role.ADMIN, isBlocked: false } });
    return;
  }
  await prisma.user.create({
    data: { email, name: "Administrator", role: Role.ADMIN, passwordHash: await bcrypt.hash(env.ADMIN_PASSWORD, 12) },
  });
  console.log(`Admin hesabı yaradıldı: ${email}`);
};

const ensureCatalog = async () => {
  if (!env.AUTO_IMPORT_CATALOG) return;
  if ((await prisma.product.count()) > 0) return;
  const result = await importCatalog({ replaceDemo: false });
  console.log("Boş baza üçün kataloq idxal edildi:", result);
};

export const bootstrap = async () => {
  try {
    await ensureAdmin();
    await ensureCatalog();
    const enriched = await enrichImportedSpecs();
    if (enriched) console.log(`${enriched} məhsulun ölçüləri mənbədən əlavə edildi`);
  } catch (error) {
    console.error("İlkin quraşdırma alınmadı", error);
  }
};
