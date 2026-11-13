import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { campaignFor, discounted, effectivePrice, setActiveCampaigns, withPricing } from "../../src/services/campaign.service";
import { pointsEarnedFor, pointsToMoney, redeemablePoints } from "../../src/services/loyalty.service";

const now = Date.now();
const campaign = (over: Record<string, unknown> = {}) =>
  ({ id: "k1", name: "Black Friday", discountPercent: 20, categoryId: null, startsAt: new Date(now - 1000), endsAt: new Date(now + 60_000), isActive: true, createdAt: new Date(), ...over }) as never;

describe("kampaniyalar", () => {
  it("endirimli qiyməti hesablayır", () => expect(discounted(new Prisma.Decimal(199.99), 20).toNumber()).toBe(159.99));
  it("ümumi kampaniya bütün kateqoriyalara tətbiq olunur", () => {
    setActiveCampaigns([campaign()]);
    const priced = withPricing({ price: new Prisma.Decimal(100), categoryId: "c1" });
    expect(priced.price.toNumber()).toBe(80);
    expect(priced.compareAtPrice?.toNumber()).toBe(100);
  });
  it("kateqoriya kampaniyası digər kateqoriyaya tətbiq olunmur", () => {
    setActiveCampaigns([campaign({ categoryId: "laptops" })]);
    expect(campaignFor("phones")).toBeNull();
    expect(withPricing({ price: new Prisma.Decimal(100), categoryId: "phones" }).campaign).toBeNull();
  });
  it("vaxtı bitmiş kampaniya tətbiq olunmur", () => {
    setActiveCampaigns([campaign({ endsAt: new Date(now - 10) })]);
    expect(campaignFor("c1")).toBeNull();
  });
});

describe("bonus balları", () => {
  it("hər 1 ₼ üçün 1 bal", () => expect(pointsEarnedFor(new Prisma.Decimal(149.99))).toBe(149));
  it("ballar sifarişin yarısından çox ödəyə bilməz", () => expect(redeemablePoints(100000, 100)).toBe(5000));
  it("mövcud baldan çox xərclənmir", () => expect(redeemablePoints(300, 100)).toBe(300));
  it("bal pula çevrilir", () => expect(pointsToMoney(250).toNumber()).toBe(2.5));
});

describe("məhsul endirimi", () => {
  it("endirimli qiymət səbət və sifarişdə istifadə olunur", () => {
    setActiveCampaigns([]);
    const product = { price: new Prisma.Decimal(100), salePrice: new Prisma.Decimal(85), categoryId: "c1" };
    expect(effectivePrice(product).toNumber()).toBe(85);
    const priced = withPricing(product);
    expect(priced.price.toNumber()).toBe(85);
    expect(priced.compareAtPrice?.toNumber()).toBe(100);
    expect(priced.campaign).toBeNull();
  });
  it("kampaniya daha ucuzdursa kampaniya qiyməti seçilir", () => {
    setActiveCampaigns([campaign()]);
    const priced = withPricing({ price: new Prisma.Decimal(100), salePrice: new Prisma.Decimal(90), categoryId: "c1" });
    expect(priced.price.toNumber()).toBe(80);
    expect(priced.campaign?.discountPercent).toBe(20);
  });
  it("əsas qiymətdən yüksək endirim qiyməti nəzərə alınmır", () => {
    setActiveCampaigns([]);
    expect(withPricing({ price: new Prisma.Decimal(100), salePrice: new Prisma.Decimal(120), categoryId: "c1" }).compareAtPrice).toBeNull();
  });
});
