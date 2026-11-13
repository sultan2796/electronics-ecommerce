CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

ALTER TABLE "Product" ADD COLUMN "brandId" TEXT;
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Brand" ("id", "name", "slug", "updatedAt")
SELECT 'brand_' || md5(lower(trim(b.name))), b.name,
       COALESCE(NULLIF(trim(both '-' from regexp_replace(lower(b.name), '[^a-z0-9]+', '-', 'g')), ''), 'brand') || '-' || substr(md5(lower(trim(b.name))), 1, 6),
       CURRENT_TIMESTAMP
FROM (SELECT DISTINCT ON (lower(trim("brand"))) trim("brand") AS name FROM "Product" WHERE trim("brand") <> '' ORDER BY lower(trim("brand")), trim("brand")) b;

UPDATE "Product" p SET "brandId" = b."id", "brand" = b."name" FROM "Brand" b WHERE lower(trim(p."brand")) = lower(b."name");
