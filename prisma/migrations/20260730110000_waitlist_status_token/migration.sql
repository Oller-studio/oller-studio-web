-- Add status/private-link tracking to WaitlistEntry
ALTER TABLE "WaitlistEntry" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'waiting';
ALTER TABLE "WaitlistEntry" ADD COLUMN "accessToken" TEXT;
ALTER TABLE "WaitlistEntry" ADD COLUMN "invitedAt" DATETIME;
ALTER TABLE "WaitlistEntry" ADD COLUMN "purchasedAt" DATETIME;

-- Backfill a unique token for any rows that predate this column.
UPDATE "WaitlistEntry" SET "accessToken" = lower(hex(randomblob(12))) WHERE "accessToken" IS NULL;

CREATE UNIQUE INDEX "WaitlistEntry_accessToken_key" ON "WaitlistEntry"("accessToken");
