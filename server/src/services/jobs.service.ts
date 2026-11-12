import { Role } from "@prisma/client";
import { clientUrl } from "../config/env";
import { prisma } from "../config/prisma";
import { queueEmail } from "./email";
import { abandonedCartEmail, lowStockEmail } from "./email/templates";

export const LOW_STOCK_ALERT_LEVEL = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

export const remindAbandonedCarts = async () => {
  const cutoff = new Date(Date.now() - DAY_MS);
  const carts = await prisma.cart.findMany({
    where: {
      updatedAt: { lt: cutoff, gt: new Date(Date.now() - 7 * DAY_MS) },
      remindedAt: null,
      items: { some: {} },
      user: { isBlocked: false },
    },
    include: { user: true, items: { include: { product: true } } },
    take: 50,
  });
  for (const cart of carts) {
    const items = cart.items.filter((item) => item.product.isActive && item.product.stock > 0);
    if (items.length) {
      queueEmail({
        ...abandonedCartEmail(cart.user, items.map((item) => ({ name: item.product.name, quantity: item.quantity })), `${clientUrl}/cart`),
        to: cart.user.email,
        userId: cart.userId,
      });
    }
    await prisma.cart.update({ where: { id: cart.id }, data: { remindedAt: new Date(), updatedAt: cart.updatedAt } });
  }
  return carts.length;
};

export const alertLowStock = async (productIds: string[]) => {
  const low = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true, stock: { lte: LOW_STOCK_ALERT_LEVEL } },
    select: { name: true, sku: true, stock: true },
  });
  if (!low.length) return;
  const admins = await prisma.user.findMany({ where: { role: { in: [Role.ADMIN, Role.MANAGER] }, isBlocked: false }, select: { id: true, name: true, email: true } });
  for (const admin of admins) {
    queueEmail({ ...lowStockEmail(admin, low, `${clientUrl}/admin/inventory?lowStock=true`), to: admin.email, userId: admin.id });
  }
};
