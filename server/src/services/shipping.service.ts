import { Prisma } from "@prisma/client";
import { env } from "../config/env";

export const shippingConfig = () => ({ shippingFee: env.SHIPPING_FEE, freeShippingMin: env.FREE_SHIPPING_MIN });

export const shippingFor = (amount: Prisma.Decimal) => {
  if (env.SHIPPING_FEE <= 0 || amount.gte(env.FREE_SHIPPING_MIN)) return new Prisma.Decimal(0);
  return new Prisma.Decimal(env.SHIPPING_FEE).toDecimalPlaces(2);
};
