/*
  Warnings:

  - Added the required column `productSlug` to the `Colorway` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Product" (
    "slug" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "basePriceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "leadTimeMinDays" INTEGER NOT NULL,
    "leadTimeMaxDays" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "Product" ("slug", "name", "tagline", "description", "basePriceCents", "currency", "leadTimeMinDays", "leadTimeMaxDays", "sortOrder", "updatedAt")
VALUES ('ondine', 'ONDINE', 'Flowing lines. A sculptural silhouette.', 'Ondine is defined by flowing lines and an undulating, sculptural silhouette — a form built to be touched, worn, noticed. Made one at a time, entirely in my studio.', 22000, 'USD', 5, 7, 0, CURRENT_TIMESTAMP);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Colorway" (
    "slug" TEXT NOT NULL PRIMARY KEY,
    "productSlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "dropNumber" INTEGER,
    "totalPieces" INTEGER,
    "piecesRemaining" INTEGER,
    "images" TEXT NOT NULL DEFAULT '[]',
    "matchedCarMake" TEXT,
    "matchedCarModel" TEXT,
    "matchedCarColorName" TEXT,
    "matchedCarImageUrl" TEXT,
    "matchedCarOwnerNote" TEXT,
    "story" TEXT,
    "whyPoints" TEXT NOT NULL DEFAULT '[]',
    "campaignQuote" TEXT,
    "campaignName" TEXT,
    "campaignRole" TEXT,
    "availabilityStatus" TEXT NOT NULL DEFAULT 'available',
    "availabilityShipsFrom" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "launchedAt" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Colorway_productSlug_fkey" FOREIGN KEY ("productSlug") REFERENCES "Product" ("slug") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Colorway" ("availabilityShipsFrom", "availabilityStatus", "campaignName", "campaignQuote", "campaignRole", "createdAt", "dropNumber", "images", "isFeatured", "launchedAt", "matchedCarColorName", "matchedCarImageUrl", "matchedCarMake", "matchedCarModel", "matchedCarOwnerNote", "name", "piecesRemaining", "productSlug", "slug", "sortOrder", "story", "tier", "totalPieces", "updatedAt", "whyPoints") SELECT "availabilityShipsFrom", "availabilityStatus", "campaignName", "campaignQuote", "campaignRole", "createdAt", "dropNumber", "images", "isFeatured", "launchedAt", "matchedCarColorName", "matchedCarImageUrl", "matchedCarMake", "matchedCarModel", "matchedCarOwnerNote", "name", "piecesRemaining", 'ondine', "slug", "sortOrder", "story", "tier", "totalPieces", "updatedAt", "whyPoints" FROM "Colorway";
DROP TABLE "Colorway";
ALTER TABLE "new_Colorway" RENAME TO "Colorway";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
