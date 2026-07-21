DO $$ BEGIN
  CREATE TYPE "BillingTier" AS ENUM ('FREE', 'PLUS', 'PRO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentOrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'FAILED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "planTier" "BillingTier" NOT NULL DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "PaymentOrder" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tier" "BillingTier" NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'VND',
  "status" "PaymentOrderStatus" NOT NULL DEFAULT 'PENDING',
  "payosOrderCode" INTEGER NOT NULL,
  "paymentLinkId" TEXT,
  "checkoutUrl" TEXT,
  "rawResponse" JSONB,
  "rawWebhook" JSONB,
  "paidAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentOrder_payosOrderCode_key" ON "PaymentOrder"("payosOrderCode");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentOrder_paymentLinkId_key" ON "PaymentOrder"("paymentLinkId");
CREATE INDEX IF NOT EXISTS "PaymentOrder_userId_createdAt_idx" ON "PaymentOrder"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "PaymentOrder_status_idx" ON "PaymentOrder"("status");

DO $$ BEGIN
  ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
