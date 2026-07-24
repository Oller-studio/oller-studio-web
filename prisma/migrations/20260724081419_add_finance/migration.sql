-- CreateTable
CREATE TABLE "ProductCost" (
    "colorwaySlug" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "costCents" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FixedCost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "amountCentsPerMonth" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paypalOrderId" TEXT NOT NULL,
    "captureId" TEXT,
    "status" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "refundedCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "payerEmail" TEXT,
    "payerName" TEXT,
    "payerCountry" TEXT,
    "paypalFeeCents" INTEGER NOT NULL DEFAULT 0,
    "fulfillmentStatus" TEXT NOT NULL DEFAULT 'IN_PRODUCTION',
    "rawPayload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "refundedAt" DATETIME,
    "shippedAt" DATETIME,
    "deliveredAt" DATETIME
);
INSERT INTO "new_Order" ("amountCents", "captureId", "completedAt", "createdAt", "currency", "deliveredAt", "fulfillmentStatus", "id", "payerEmail", "payerName", "paypalOrderId", "rawPayload", "refundedAt", "refundedCents", "shippedAt", "status") SELECT "amountCents", "captureId", "completedAt", "createdAt", "currency", "deliveredAt", "fulfillmentStatus", "id", "payerEmail", "payerName", "paypalOrderId", "rawPayload", "refundedAt", "refundedCents", "shippedAt", "status" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_paypalOrderId_key" ON "Order"("paypalOrderId");
CREATE UNIQUE INDEX "Order_captureId_key" ON "Order"("captureId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
