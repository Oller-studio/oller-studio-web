/*
  Warnings:

  - You are about to drop the column `name` on the `Partner` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `Partner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Partner` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Partner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "platform" TEXT,
    "utmSource" TEXT NOT NULL,
    "couponCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Partner" ("couponCode", "createdAt", "id", "platform", "type", "utmSource") SELECT "couponCode", "createdAt", "id", "platform", "type", "utmSource" FROM "Partner";
DROP TABLE "Partner";
ALTER TABLE "new_Partner" RENAME TO "Partner";
CREATE UNIQUE INDEX "Partner_utmSource_key" ON "Partner"("utmSource");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
