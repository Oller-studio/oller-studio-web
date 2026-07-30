/*
  Warnings:

  - You are about to drop the column `material` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Colorway" ADD COLUMN "compositionDescription" TEXT;
ALTER TABLE "Colorway" ADD COLUMN "compositionMaterial" TEXT;
ALTER TABLE "Colorway" ADD COLUMN "swatchColor" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "slug" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "basePriceCents" INTEGER NOT NULL,
    "weightGrams" INTEGER,
    "heightCm" REAL,
    "widthCm" REAL,
    "depthCm" REAL,
    "sizeAndFitNote" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "leadTimeMinDays" INTEGER NOT NULL,
    "leadTimeMaxDays" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("basePriceCents", "createdAt", "currency", "depthCm", "description", "heightCm", "leadTimeMaxDays", "leadTimeMinDays", "name", "slug", "sortOrder", "tagline", "updatedAt", "weightGrams", "widthCm") SELECT "basePriceCents", "createdAt", "currency", "depthCm", "description", "heightCm", "leadTimeMaxDays", "leadTimeMinDays", "name", "slug", "sortOrder", "tagline", "updatedAt", "weightGrams", "widthCm" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
