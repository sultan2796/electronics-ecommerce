import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

type Client = Prisma.TransactionClient | typeof prisma;

export const brandSlug = (name: string) => {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return base || "brand";
};

export const resolveBrand = async (rawName: string, client: Client = prisma) => {
  const name = rawName.trim();
  const existing = await client.brand.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  if (existing) return { brand: existing.name, brandId: existing.id };
  const slugBase = brandSlug(name);
  const taken = await client.brand.findUnique({ where: { slug: slugBase }, select: { id: true } });
  const slug = taken ? `${slugBase}-${randomBytes(3).toString("hex")}` : slugBase;
  try {
    const created = await client.brand.create({ data: { name, slug } });
    return { brand: created.name, brandId: created.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await client.brand.findFirstOrThrow({ where: { name: { equals: name, mode: "insensitive" } } });
      return { brand: raced.name, brandId: raced.id };
    }
    throw error;
  }
};
