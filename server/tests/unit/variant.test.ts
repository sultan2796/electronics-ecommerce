import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { lineName, pricedSource, releaseStock, reserveStock, resolveVariant } from "../../src/services/variant.service";

const D = (value: number) => new Prisma.Decimal(value);
const product = { id: "p1", name: "Telefon", price: D(1000), salePrice: D(900), categoryId: "c1", isActive: true };
const variant = { id: "v1", productId: "p1", name: "Qara / 256GB", price: D(1200), salePrice: null, isActive: true };

const makeTx = () => ({
  productVariant: {
    count: vi.fn().mockResolvedValue(2),
    findFirst: vi.fn().mockResolvedValue({ ...variant, stock: 3 }),
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    findMany: vi.fn().mockResolvedValue([{ stock: 2 }, { stock: 5 }]),
  },
  product: { updateMany: vi.fn().mockResolvedValue({ count: 1 }), update: vi.fn().mockResolvedValue({}) },
});

describe("variant service", () => {
  it("uses the variant price when it has one, otherwise the product price", () => {
    expect(pricedSource(product, variant).price.toNumber()).toBe(1200);
    expect(pricedSource(product, variant).salePrice).toBeNull();
    expect(pricedSource(product, { ...variant, price: null }).salePrice?.toNumber()).toBe(900);
    expect(lineName(product, variant)).toBe("Telefon — Qara / 256GB");
  });

  it("requires a variant when the product has active variants", async () => {
    const tx = makeTx();
    await expect(resolveVariant(tx as never, product, undefined)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects a variant from another product or an inactive one", async () => {
    const tx = makeTx();
    tx.productVariant.findFirst.mockResolvedValueOnce(null);
    await expect(resolveVariant(tx as never, product, "x")).rejects.toMatchObject({ statusCode: 409 });
    tx.productVariant.findFirst.mockResolvedValueOnce({ ...variant, isActive: false });
    await expect(resolveVariant(tx as never, product, "v1")).rejects.toMatchObject({ statusCode: 409 });
  });

  it("reserves variant stock atomically and syncs the product total", async () => {
    const tx = makeTx();
    await reserveStock(tx as never, product, variant, 2);
    expect(tx.productVariant.updateMany).toHaveBeenCalledWith({
      where: { id: "v1", productId: "p1", isActive: true, stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
    expect(tx.product.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { stock: 7 } });
    tx.productVariant.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(reserveStock(tx as never, product, variant, 99)).rejects.toMatchObject({ statusCode: 409 });
  });

  it("returns stock to the variant on cancel and falls back to the product when the variant is gone", async () => {
    const tx = makeTx();
    await releaseStock(tx as never, "p1", "v1", 1);
    expect(tx.productVariant.updateMany).toHaveBeenCalledWith({ where: { id: "v1", productId: "p1" }, data: { stock: { increment: 1 } } });
    tx.productVariant.updateMany.mockResolvedValueOnce({ count: 0 });
    tx.product.update.mockClear();
    await releaseStock(tx as never, "p1", "gone", 4);
    expect(tx.product.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { stock: { increment: 4 } } });
  });
});
