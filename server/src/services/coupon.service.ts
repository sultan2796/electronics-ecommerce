import { Coupon, CouponType, Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";

type Client = Prisma.TransactionClient;

export const normalizeCode = (code: string) => code.trim().toUpperCase();

export const calculateDiscount = (coupon: Pick<Coupon, "type" | "value">, subtotal: Prisma.Decimal) => {
  const raw = coupon.type === CouponType.PERCENT ? subtotal.mul(coupon.value).div(100) : new Prisma.Decimal(coupon.value);
  const capped = Prisma.Decimal.min(raw, subtotal);
  return capped.toDecimalPlaces(2);
};

export const assertCouponUsable = (coupon: Coupon | null, subtotal: Prisma.Decimal, now = new Date()) => {
  if (!coupon || !coupon.isActive) throw new AppError(404, "Promo kod tapılmadı");
  if (coupon.expiresAt && coupon.expiresAt < now) throw new AppError(400, "Promo kodun müddəti bitib");
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) throw new AppError(400, "Promo kodun istifadə limiti bitib");
  if (subtotal.lessThan(coupon.minTotal)) throw new AppError(400, `Bu kod ən az ${coupon.minTotal.toFixed(2)} ₼ sifariş üçündür`);
  return coupon;
};

export const redeemCoupon = async (tx: Client, code: string, subtotal: Prisma.Decimal) => {
  const coupon = assertCouponUsable(await tx.coupon.findUnique({ where: { code: normalizeCode(code) } }), subtotal);
  const claimed = await tx.coupon.updateMany({
    where: { id: coupon.id, OR: [{ maxUses: null }, { usedCount: { lt: coupon.maxUses ?? 0 } }] },
    data: { usedCount: { increment: 1 } },
  });
  if (claimed.count === 0) throw new AppError(400, "Promo kodun istifadə limiti bitib");
  return { code: coupon.code, discount: calculateDiscount(coupon, subtotal) };
};
