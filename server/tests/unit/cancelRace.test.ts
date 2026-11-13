import { OrderStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/config/prisma", () => ({ prisma: {} }));

const { restockAndCancel } = await import("../../src/services/order.service");

const makeTx = (claimedCount: number) => ({
  order: { updateMany: vi.fn().mockResolvedValue({ count: claimedCount }), update: vi.fn().mockResolvedValue({ id: "o1" }), findUnique: vi.fn() },
  orderItem: { findMany: vi.fn().mockResolvedValue([{ productId: "p1", variantId: null, quantity: 2 }]) },
  product: { update: vi.fn() },
  productVariant: { updateMany: vi.fn() },
  payment: { updateMany: vi.fn() },
  orderStatusHistory: { create: vi.fn() },
  user: { update: vi.fn(), updateMany: vi.fn() },
});

describe("restockAndCancel", () => {
  it("claims the status atomically before returning stock", async () => {
    const tx = makeTx(1);
    await restockAndCancel(tx as never, "o1", OrderStatus.PENDING);
    expect(tx.order.updateMany).toHaveBeenCalledWith({ where: { id: "o1", status: OrderStatus.PENDING }, data: { status: OrderStatus.CANCELLED } });
    expect(tx.product.update).toHaveBeenCalledTimes(1);
  });

  it("does not restock or refund when another request already cancelled the order", async () => {
    const tx = makeTx(0);
    await expect(restockAndCancel(tx as never, "o1", OrderStatus.PENDING)).rejects.toMatchObject({ statusCode: 409 });
    expect(tx.orderItem.findMany).not.toHaveBeenCalled();
    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
  });
});
