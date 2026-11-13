import { loginIdentifierToEmail } from "../utils/loginIdentifier";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { enrichImportedSpecs, importCatalog } from "./catalogImport.service";

const ensureAdmin = async () => {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return;
  if (env.ADMIN_PASSWORD.length < 8) {
    console.warn("ADMIN_PASSWORD ən az 8 simvol olmalıdır, admin hesabı yenilənmədi");
    return;
  }
  const email = loginIdentifierToEmail(env.ADMIN_EMAIL);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const passwordMatches = await bcrypt.compare(env.ADMIN_PASSWORD, existing.passwordHash);
    if (!passwordMatches || existing.role !== Role.ADMIN || existing.isBlocked) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: Role.ADMIN,
          isBlocked: false,
          ...(!passwordMatches && { passwordHash: await bcrypt.hash(env.ADMIN_PASSWORD, 12) }),
        },
      });
      if (!passwordMatches) {
        await prisma.refreshToken.deleteMany({ where: { userId: existing.id } });
        console.log(`Admin şifrəsi ADMIN_PASSWORD dəyişəninə uyğun yeniləndi: ${email}`);
      }
    }
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
