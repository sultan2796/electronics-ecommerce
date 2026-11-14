ALTER TABLE "Product" ADD COLUMN "effectivePrice" DECIMAL(10,2) GENERATED ALWAYS AS (COALESCE("salePrice", "price")) STORED;
CREATE INDEX "Product_effectivePrice_idx" ON "Product"("effectivePrice");
