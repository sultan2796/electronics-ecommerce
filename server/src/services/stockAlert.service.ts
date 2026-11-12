import { prisma } from "../config/prisma";
import { clientUrl } from "../config/env";
import { queueEmail } from "./email";
import { backInStockEmail } from "./email/templates";

export const notifyBackInStock = async (productId: string) => {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true, slug: true, stock: true, isActive: true } });
  if (!product || product.stock <= 0 || !product.isActive) return;
  const alerts = await prisma.stockAlert.findMany({ where: { productId, notifiedAt: null }, include: { user: true } });
  for (const alert of alerts) {
    queueEmail({ ...backInStockEmail(alert.user, product.name, `${clientUrl}/products/${product.slug}`), to: alert.user.email, userId: alert.userId });
  }
  if (alerts.length) await prisma.stockAlert.updateMany({ where: { id: { in: alerts.map((a) => a.id) } }, data: { notifiedAt: new Date() } });
};
