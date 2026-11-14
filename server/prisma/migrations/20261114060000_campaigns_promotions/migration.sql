CREATE TYPE "PromotionPlacement" AS ENUM ('HERO_SIDE', 'HOME_BANNER', 'FRIDAY');

ALTER TABLE "Campaign" ADD COLUMN "description" TEXT,
ADD COLUMN "bannerUrl" TEXT,
ADD COLUMN "fridayOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "CampaignProduct" (
    "campaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "specialPrice" DECIMAL(10,2),
    CONSTRAINT "CampaignProduct_pkey" PRIMARY KEY ("campaignId","productId")
);
CREATE INDEX "CampaignProduct_productId_idx" ON "CampaignProduct"("productId");
ALTER TABLE "CampaignProduct" ADD CONSTRAINT "CampaignProduct_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignProduct" ADD CONSTRAINT "CampaignProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eyebrow" TEXT,
    "imageUrl" TEXT NOT NULL,
    "ctaText" TEXT,
    "link" TEXT,
    "placement" "PromotionPlacement" NOT NULL DEFAULT 'HOME_BANNER',
    "campaignId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Promotion_placement_isActive_sortOrder_idx" ON "Promotion"("placement", "isActive", "sortOrder");
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderItem" ADD COLUMN "originalPrice" DECIMAL(10,2),
ADD COLUMN "campaignId" TEXT;
CREATE INDEX "OrderItem_campaignId_idx" ON "OrderItem"("campaignId");
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Slide" ADD COLUMN "productId" TEXT,
ADD COLUMN "startsAt" TIMESTAMP(3),
ADD COLUMN "endsAt" TIMESTAMP(3);
ALTER TABLE "Slide" ADD CONSTRAINT "Slide_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
