/*
  Warnings:

  - You are about to drop the column `printMinutes` on the `ProductCost` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN "printMinutes" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductCost" (
    "colorwaySlug" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "costCents" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ProductCost" ("colorwaySlug", "costCents", "name", "updatedAt") SELECT "colorwaySlug", "costCents", "name", "updatedAt" FROM "ProductCost";
DROP TABLE "ProductCost";
ALTER TABLE "new_ProductCost" RENAME TO "ProductCost";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
