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
    "status" TEXT NOT NULL DEFAULT 'active',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "launchedAt" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Colorway_productSlug_fkey" FOREIGN KEY ("productSlug") REFERENCES "Product" ("slug") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Colorway" ("availabilityShipsFrom", "availabilityStatus", "campaignName", "campaignQuote", "campaignRole", "createdAt", "dropNumber", "images", "isFeatured", "launchedAt", "matchedCarColorName", "matchedCarImageUrl", "matchedCarMake", "matchedCarModel", "matchedCarOwnerNote", "name", "piecesRemaining", "productSlug", "slug", "sortOrder", "story", "tier", "totalPieces", "updatedAt", "whyPoints") SELECT "availabilityShipsFrom", "availabilityStatus", "campaignName", "campaignQuote", "campaignRole", "createdAt", "dropNumber", "images", "isFeatured", "launchedAt", "matchedCarColorName", "matchedCarImageUrl", "matchedCarMake", "matchedCarModel", "matchedCarOwnerNote", "name", "piecesRemaining", "productSlug", "slug", "sortOrder", "story", "tier", "totalPieces", "updatedAt", "whyPoints" FROM "Colorway";
DROP TABLE "Colorway";
ALTER TABLE "new_Colorway" RENAME TO "Colorway";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
