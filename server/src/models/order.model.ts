import { OrderStatus, PaymentMethod } from "@prisma/client";
import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).max(64).optional(),
  quantity: z.number().int().min(1).max(20).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(20),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(30),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(2).max(20),
  country: z.string().trim().min(2).max(80),
});

export const checkoutSchema = z.object({
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH_ON_DELIVERY),
  couponCode: z.string().trim().max(40).optional(),
  saveAddress: z.boolean().optional(),
  usePoints: z.boolean().optional(),
});

export const orderStatusSchema = z.object({ status: z.nativeEnum(OrderStatus) });

export const adminOrdersQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  q: z.string().trim().max(120).optional(),
  userId: z.string().trim().min(1).max(64).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const inventoryQuerySchema = z.object({
  model: z.enum(["with", "without"]).optional(),
  q: z.string().trim().optional(),
  lowStock: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const catalogImportSchema = z.object({ replaceDemo: z.boolean().default(true) });

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
