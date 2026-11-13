ALTER TABLE "Order" ADD COLUMN "orderNumber" TEXT;

UPDATE "Order"
SET "orderNumber" = 'ES-' || to_char("createdAt", 'YYMMDD') || '-' || upper(substr(md5("id"), 1, 5))
WHERE "orderNumber" IS NULL;

CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderStatusHistory_orderId_createdAt_idx" ON "OrderStatusHistory"("orderId", "createdAt");

ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "OrderStatusHistory" ("id", "orderId", "status", "createdAt")
SELECT 'h' || md5("id" || 'created'), "id", 'PENDING'::"OrderStatus", "createdAt" FROM "Order";

INSERT INTO "OrderStatusHistory" ("id", "orderId", "status", "createdAt")
SELECT 'h' || md5("id" || 'current'), "id", "status", "updatedAt" FROM "Order" WHERE "status" <> 'PENDING';
