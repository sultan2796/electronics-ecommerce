import { OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { hasPermission } from "../config/permissions";
import { prisma } from "../config/prisma";
import { CheckoutInput } from "../models/order.model";
import { generateOrderNumber, orderInclude, restockAndCancel } from "../services/order.service";
import { queueEmail } from "../services/email";
import { orderConfirmationEmail } from "../services/email/templates";
import { activeProvider, startPayment } from "../services/payment";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { getErrorText } from "../utils/errorText";
import { currentUser } from "../utils/currentUser";
import { redeemCoupon } from "../services/coupon.service";
import { effectivePrice } from "../services/campaign.service";
import { alertLowStock } from "../services/jobs.service";
import { pointsToMoney, redeemablePoints } from "../services/loyalty.service";

export const checkout = asyncHandler(async (req, res) => {
  const userId = currentUser(req).id;
  const { shippingAddress, paymentMethod, couponCode, saveAddress, usePoints } = req.body as CheckoutInput;

  if (paymentMethod === PaymentMethod.CARD && !activeProvider()) {
    throw new AppError(400, "Kartla ödəniş hazırda mümkün deyil. Qapıda ödəniş seçin.");
  }

  const order = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) throw new AppError(400, "Səbət boşdur");

    for (const item of cart.items) {
      if (!item.product.isActive) throw new AppError(409, `${item.product.name} artıq satışda deyil`);
      const reserved = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (reserved.count === 0) throw new AppError(409, `${item.product.name} üçün kifayət qədər stok yoxdur`);
    }

    const priced = cart.items.map((item) => ({ ...item, unitPrice: effectivePrice(item.product) }));
    const subtotal = priced.reduce((sum, item) => sum.add(item.unitPrice.mul(item.quantity)), new Prisma.Decimal(0));
    const coupon = couponCode ? await redeemCoupon(tx, couponCode, subtotal) : null;
    const couponDiscount = coupon?.discount ?? new Prisma.Decimal(0);
    const afterCoupon = subtotal.sub(couponDiscount);
    const buyer = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { points: true } });
    const pointsUsed = usePoints ? redeemablePoints(buyer.points, afterCoupon) : 0;
    if (pointsUsed > 0) {
      const taken = await tx.user.updateMany({ where: { id: userId, points: { gte: pointsUsed } }, data: { points: { decrement: pointsUsed } } });
      if (taken.count === 0) throw new AppError(409, "Bal balansı dəyişdi, yenidən cəhd edin");
    }
    const discount = couponDiscount.add(pointsToMoney(pointsUsed));
    const total = subtotal.sub(discount);

    if (saveAddress && (await tx.address.count({ where: { userId } })) < 10) {
      const isDefault = (await tx.address.count({ where: { userId } })) === 0;
      await tx.address.create({ data: { ...shippingAddress, userId, label: shippingAddress.city, isDefault } });
    }

    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        statusHistory: { create: { status: OrderStatus.PENDING } },
        userId,
        total,
        subtotal,
        discount,
        couponCode: coupon?.code ?? null,
        pointsUsed,
        paymentMethod,
        shippingAddress: shippingAddress as Prisma.InputJsonObject,
        items: {
          create: priced.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
          })),
        },
      },
      include: orderInclude,
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  const customer = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  if (customer) queueEmail({ ...orderConfirmationEmail(customer, order), to: customer.email, userId });
  void alertLowStock(order.items.map((item) => item.productId));

  if (paymentMethod !== PaymentMethod.CARD) {
    res.status(201).json({ order, payment: null });
    return;
  }

  try {
    const payment = await startPayment(order.id);
    res.status(201).json({ order, payment: { redirectUrl: payment.redirectUrl } });
  } catch (error) {
    res.status(201).json({ order, payment: null, paymentError: getErrorText(error) });
  }
});

export const payOrder = asyncHandler(async (req, res) => {
  const user = currentUser(req);
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, select: { userId: true } });
  if (!order || order.userId !== user.id) throw new AppError(404, "Sifariş tapılmadı");
  const payment = await startPayment(req.params.id);
  res.json({ redirectUrl: payment.redirectUrl });
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: currentUser(req).id },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

export const getOrder = asyncHandler(async (req, res) => {
  const user = currentUser(req);
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: orderInclude });
  if (!order || (order.userId !== user.id && !hasPermission(user.role, "orders:read"))) throw new AppError(404, "Sifariş tapılmadı");
  res.json(order);
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const user = currentUser(req);

  const order = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({ where: { id: req.params.id } });
    if (!existing || (existing.userId !== user.id && !hasPermission(user.role, "orders:write"))) throw new AppError(404, "Sifariş tapılmadı");
    if (existing.status !== OrderStatus.PENDING) throw new AppError(409, "Yalnız gözləmədə olan sifariş ləğv edilə bilər");
    return restockAndCancel(tx, existing.id);
  });

  res.json(order);
});
