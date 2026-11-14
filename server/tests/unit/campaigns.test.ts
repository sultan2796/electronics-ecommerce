import { Prisma } from "@prisma/client";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  campaign: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  campaignProduct: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
  product: { findMany: vi.fn() },
  promotion: { findMany: vi.fn(), updateMany: vi.fn(), create: vi.fn(), aggregate: vi.fn() },
  orderItem: { findMany: vi.fn() },
  auditLog: { create: vi.fn().mockResolvedValue({}) },
  $transaction: vi.fn(async (input: unknown) => (Array.isArray(input) ? Promise.all(input) : (input as (tx: unknown) => unknown)(db))),
}));

vi.mock("../../src/config/prisma", () => ({ prisma: db }));

const { createApp } = await import("../../src/app");
const { signAccessToken } = await import("../../src/utils/jwt");
const { isLive, nextWindowStart, priceLine, setActiveCampaigns, variantPrice, windowEnd, withPricing } = await import("../../src/services/campaign.service");
const { bakuDayStart, bakuWeekday } = await import("../../src/utils/bakuTime");

const app = createApp();
const asRole = (role: "ADMIN" | "CUSTOMER") => {
  db.user.findUnique.mockResolvedValue({ id: "u1", role, isBlocked: false });
  return `Bearer ${signAccessToken({ sub: "u1", role })}`;
};

const fridayNoon = new Date("2026-11-20T08:00:00Z");
const thursdayLate = new Date("2026-11-19T19:30:00Z");
const fridayLate = new Date("2026-11-20T19:59:00Z");

const campaign = (over: Record<string, unknown> = {}) => ({
  id: "k1",
  name: "Cümə endirimi",
  description: null,
  bannerUrl: null,
  fridayOnly: false,
  discountPercent: 20,
  categoryId: null,
  startsAt: new Date("2026-11-01T00:00:00Z"),
  endsAt: new Date("2026-12-31T00:00:00Z"),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  products: [] as { productId: string; specialPrice: Prisma.Decimal | null }[],
  ...over,
});

describe("Bakı vaxtı", () => {
  it("həftənin gününü Asia/Baku üzrə hesablayır", () => {
    expect(bakuWeekday(thursdayLate)).toBe(4);
    expect(bakuWeekday(new Date("2026-11-19T20:00:00Z"))).toBe(5);
    expect(bakuWeekday(fridayLate)).toBe(5);
    expect(bakuWeekday(new Date("2026-11-20T20:00:00Z"))).toBe(6);
  });
  it("günün başlanğıcını Bakı gecə yarısına qoyur", () => {
    expect(bakuDayStart(fridayNoon).toISOString()).toBe("2026-11-19T20:00:00.000Z");
    expect(bakuDayStart(fridayNoon, 1).toISOString()).toBe("2026-11-20T20:00:00.000Z");
  });
});

describe("cümə kampaniyası", () => {
  const friday = campaign({ fridayOnly: true });
  it("yalnız Bakı vaxtı ilə cümə günü aktivdir", () => {
    expect(isLive(friday, fridayNoon)).toBe(true);
    expect(isLive(friday, thursdayLate)).toBe(false);
    expect(isLive(friday, new Date("2026-11-20T20:00:01Z"))).toBe(false);
  });
  it("geri sayım cümənin sonunda və ya kampaniyanın sonunda bitir", () => {
    expect(windowEnd(friday, fridayNoon).toISOString()).toBe("2026-11-20T20:00:00.000Z");
    const short = campaign({ fridayOnly: true, endsAt: new Date("2026-11-20T12:00:00Z") });
    expect(windowEnd(short, fridayNoon).toISOString()).toBe("2026-11-20T12:00:00.000Z");
  });
  it("növbəti cümənin başlanğıcını tapır", () => {
    expect(nextWindowStart(friday, new Date("2026-11-17T10:00:00Z"))?.toISOString()).toBe("2026-11-19T20:00:00.000Z");
    expect(nextWindowStart(campaign({ fridayOnly: true, endsAt: new Date("2026-11-19T10:00:00Z") }), new Date("2026-11-17T10:00:00Z"))).toBeNull();
  });
  it("cümədən kənar günlərdə qiymət dəyişmir", () => {
    vi.useFakeTimers();
    vi.setSystemTime(thursdayLate);
    setActiveCampaigns([friday]);
    expect(withPricing({ id: "p1", price: new Prisma.Decimal(100), categoryId: "c1" }).price.toNumber()).toBe(100);
    vi.setSystemTime(fridayNoon);
    expect(withPricing({ id: "p1", price: new Prisma.Decimal(100), categoryId: "c1" }).price.toNumber()).toBe(80);
    vi.useRealTimers();
  });
});

describe("məhsul seçimli kampaniya", () => {
  beforeEach(() => vi.useRealTimers());
  it("yalnız seçilmiş məhsullara və xüsusi qiymətlə tətbiq olunur", () => {
    setActiveCampaigns([campaign({ startsAt: new Date(Date.now() - 1000), discountPercent: 0, products: [{ productId: "p1", specialPrice: new Prisma.Decimal(70) }] })]);
    expect(withPricing({ id: "p1", price: new Prisma.Decimal(100), categoryId: "c1" }).price.toNumber()).toBe(70);
    expect(withPricing({ id: "p2", price: new Prisma.Decimal(100), categoryId: "c1" }).price.toNumber()).toBe(100);
  });
  it("variant qiymətinə xüsusi qiymət nisbəti ilə tətbiq olunur", () => {
    setActiveCampaigns([campaign({ startsAt: new Date(Date.now() - 1000), discountPercent: 0, products: [{ productId: "p1", specialPrice: new Prisma.Decimal(80) }] })]);
    const result = variantPrice({ id: "p1", price: new Prisma.Decimal(100), categoryId: "c1" }, { price: new Prisma.Decimal(150), salePrice: null });
    expect(result.price.toNumber()).toBe(120);
    expect(result.compareAtPrice?.toNumber()).toBe(150);
  });
  it("endirimlər toplanmır, ən sərfəli tək qiymət seçilir", () => {
    setActiveCampaigns([
      campaign({ id: "a", startsAt: new Date(Date.now() - 1000), discountPercent: 10 }),
      campaign({ id: "b", startsAt: new Date(Date.now() - 1000), discountPercent: 25 }),
    ]);
    const line = priceLine({ id: "p1", price: new Prisma.Decimal(100), salePrice: new Prisma.Decimal(80), categoryId: "c1" });
    expect(line.unitPrice.toNumber()).toBe(75);
    expect(line.originalPrice?.toNumber()).toBe(100);
    expect(line.campaignId).toBe("b");
  });
  it("endirimli qiymət kampaniyadan sərfəlidirsə kampaniya qeyd olunmur", () => {
    setActiveCampaigns([campaign({ startsAt: new Date(Date.now() - 1000), discountPercent: 10 })]);
    const line = priceLine({ id: "p1", price: new Prisma.Decimal(100), salePrice: new Prisma.Decimal(70), categoryId: "c1" });
    expect(line.unitPrice.toNumber()).toBe(70);
    expect(line.campaignId).toBeNull();
  });
});

describe("kampaniya API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("müştəri kampaniya yarada bilmir", async () => {
    const response = await request(app)
      .post("/api/admin/campaigns")
      .set("Authorization", asRole("CUSTOMER"))
      .send({ name: "Test", discountPercent: 10, startsAt: "2026-11-20T00:00:00Z", endsAt: "2026-11-21T00:00:00Z" });
    expect(response.status).toBe(403);
    expect(db.campaign.create).not.toHaveBeenCalled();
  });

  it("endirimsiz kampaniya rədd edilir", async () => {
    const response = await request(app)
      .post("/api/admin/campaigns")
      .set("Authorization", asRole("ADMIN"))
      .send({ name: "Test", discountPercent: 0, startsAt: "2026-11-20T00:00:00Z", endsAt: "2026-11-21T00:00:00Z" });
    expect(response.status).toBe(400);
  });

  it("əsas qiymətdən baha xüsusi qiymət rədd edilir", async () => {
    db.product.findMany.mockResolvedValue([{ id: "p1", name: "Telefon", price: new Prisma.Decimal(100) }]);
    const response = await request(app)
      .post("/api/admin/campaigns")
      .set("Authorization", asRole("ADMIN"))
      .send({ name: "Test", discountPercent: 0, products: [{ productId: "p1", specialPrice: 120 }], startsAt: "2026-11-20T00:00:00Z", endsAt: "2026-11-21T00:00:00Z" });
    expect(response.status).toBe(400);
    expect(db.campaign.create).not.toHaveBeenCalled();
  });

  it("aktiv cümə kampaniyası olmayanda boş cavab qaytarır", async () => {
    db.campaign.findMany.mockResolvedValue([]);
    const response = await request(app).get("/api/campaigns/friday");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("none");
    expect(response.body.serverTime).toBeTruthy();
  });

  it("reklam göstərilmə və kliklərini sayır", async () => {
    db.promotion.updateMany.mockResolvedValue({ count: 1 });
    const response = await request(app).post("/api/promotions/events").send({ impressions: ["a", "a", "b"], clicks: ["a"] });
    expect(response.status).toBe(204);
    const [first, second] = db.promotion.updateMany.mock.calls.map((call) => call[0]);
    expect(first.where.id).toEqual({ in: ["a", "b"] });
    expect(first.where.isActive).toBe(true);
    expect(JSON.stringify(first.where.AND)).toContain("endsAt");
    expect(first.data).toEqual({ impressions: { increment: 1 } });
    expect(second.where.id).toEqual({ in: ["a"] });
    expect(second.data).toEqual({ clicks: { increment: 1 } });
  });

  it("ictimai reklamlar vaxt və kampaniya filtrinə görə seçilir", async () => {
    db.promotion.findMany.mockResolvedValue([]);
    const response = await request(app).get("/api/promotions?placement=HERO_SIDE");
    expect(response.status).toBe(200);
    const query = db.promotion.findMany.mock.calls[0][0];
    expect(query.where.placement).toBe("HERO_SIDE");
    expect(query.where.isActive).toBe(true);
    expect(query.take).toBe(12);
  });

  it("yanlış yerləşdirmə rədd edilir", async () => {
    const response = await request(app).get("/api/promotions?placement=POPUP");
    expect(response.status).toBe(400);
  });
});
