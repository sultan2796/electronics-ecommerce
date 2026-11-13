import { Prisma } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";
import { env } from "../../src/config/env";
import { shippingFor } from "../../src/services/shipping.service";

const original = { fee: env.SHIPPING_FEE, min: env.FREE_SHIPPING_MIN };

describe("çatdırılma haqqı", () => {
  afterEach(() => {
    env.SHIPPING_FEE = original.fee;
    env.FREE_SHIPPING_MIN = original.min;
  });

  it("haqq təyin edilməyibsə hər sifariş pulsuzdur", () => {
    env.SHIPPING_FEE = 0;
    expect(shippingFor(new Prisma.Decimal(10)).toNumber()).toBe(0);
  });

  it("limitdən aşağı sifarişə haqq tətbiq olunur, limitdən yuxarı pulsuzdur", () => {
    env.SHIPPING_FEE = 5;
    env.FREE_SHIPPING_MIN = 100;
    expect(shippingFor(new Prisma.Decimal(99.99)).toNumber()).toBe(5);
    expect(shippingFor(new Prisma.Decimal(100)).toNumber()).toBe(0);
  });
});
