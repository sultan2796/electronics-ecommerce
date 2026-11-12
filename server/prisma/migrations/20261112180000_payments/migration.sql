CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'CASH_ON_DELIVERY');

ALTER TABLE "Order" ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH_ON_DELIVERY';
ALTER TABLE "Order" ADD COLUMN "paidAt" TIMESTAMP(3);

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AZN',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "redirectUrl" TEXT,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
