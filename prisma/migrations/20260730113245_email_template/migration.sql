/*
  Warnings:

  - Made the column `accessToken` on table `WaitlistEntry` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WaitlistEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "colorwaySlug" TEXT NOT NULL,
    "colorName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "accessToken" TEXT NOT NULL,
    "invitedAt" DATETIME,
    "purchasedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_WaitlistEntry" ("accessToken", "colorName", "colorwaySlug", "createdAt", "email", "id", "invitedAt", "productName", "purchasedAt", "status") SELECT "accessToken", "colorName", "colorwaySlug", "createdAt", "email", "id", "invitedAt", "productName", "purchasedAt", "status" FROM "WaitlistEntry";
DROP TABLE "WaitlistEntry";
ALTER TABLE "new_WaitlistEntry" RENAME TO "WaitlistEntry";
CREATE UNIQUE INDEX "WaitlistEntry_accessToken_key" ON "WaitlistEntry"("accessToken");
CREATE INDEX "WaitlistEntry_colorwaySlug_idx" ON "WaitlistEntry"("colorwaySlug");
CREATE UNIQUE INDEX "WaitlistEntry_colorwaySlug_email_key" ON "WaitlistEntry"("colorwaySlug", "email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_key_key" ON "EmailTemplate"("key");
