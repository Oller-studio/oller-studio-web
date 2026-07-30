-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Colorway" (
    "slug" TEXT NOT NULL PRIMARY KEY,
    "productSlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "swatchColors" TEXT NOT NULL DEFAULT '[]',
    "priceCents" INTEGER,
    "compareAtPriceCents" INTEGER,
    "unitCount" INTEGER NOT NULL DEFAULT 1,
    "compositionMaterial" TEXT,
    "compositionDescription" TEXT,
    "tier" TEXT NOT NULL,
    "dropNumber" INTEGER,
    "dropEndsAt" TEXT,
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
    "stockOnHand" INTEGER NOT NULL DEFAULT 0,
    "showStockOnStorefront" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "launchedAt" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Colorway_productSlug_fkey" FOREIGN KEY ("productSlug") REFERENCES "Product" ("slug") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Colorway" ("availabilityShipsFrom", "availabilityStatus", "campaignName", "campaignQuote", "campaignRole", "compareAtPriceCents", "compositionDescription", "compositionMaterial", "createdAt", "dropEndsAt", "dropNumber", "images", "isFeatured", "launchedAt", "matchedCarColorName", "matchedCarImageUrl", "matchedCarMake", "matchedCarModel", "matchedCarOwnerNote", "name", "piecesRemaining", "priceCents", "productSlug", "showStockOnStorefront", "slug", "sortOrder", "status", "stockOnHand", "story", "swatchColors", "tier", "totalPieces", "unitCount", "updatedAt", "whyPoints") SELECT "availabilityShipsFrom", "availabilityStatus", "campaignName", "campaignQuote", "campaignRole", "compareAtPriceCents", "compositionDescription", "compositionMaterial", "createdAt", "dropEndsAt", "dropNumber", "images", "isFeatured", "launchedAt", "matchedCarColorName", "matchedCarImageUrl", "matchedCarMake", "matchedCarModel", "matchedCarOwnerNote", "name", "piecesRemaining", "priceCents", "productSlug", "showStockOnStorefront", "slug", "sortOrder", "status", "stockOnHand", "story", "swatchColors", "tier", "totalPieces", "unitCount", "updatedAt", "whyPoints" FROM "Colorway";
DROP TABLE "Colorway";
ALTER TABLE "new_Colorway" RENAME TO "Colorway";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
