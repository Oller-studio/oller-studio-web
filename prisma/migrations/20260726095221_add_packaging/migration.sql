-- CreateTable
CREATE TABLE "Packaging" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "slug" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "basePriceCents" INTEGER NOT NULL DEFAULT 0,
    "compareAtPriceCents" INTEGER,
    "unitCount" INTEGER NOT NULL DEFAULT 1,
    "weightGrams" INTEGER,
    "heightCm" REAL,
    "widthCm" REAL,
    "depthCm" REAL,
    "sizeAndFitNote" TEXT,
    "compositionCareNote" TEXT,
    "material" TEXT,
    "printMinutes" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "leadTimeMinDays" INTEGER NOT NULL,
    "leadTimeMaxDays" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "packagingId" TEXT,
    CONSTRAINT "Product_packagingId_fkey" FOREIGN KEY ("packagingId") REFERENCES "Packaging" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("basePriceCents", "compareAtPriceCents", "compositionCareNote", "createdAt", "currency", "depthCm", "description", "heightCm", "leadTimeMaxDays", "leadTimeMinDays", "material", "name", "printMinutes", "sizeAndFitNote", "slug", "sortOrder", "unitCount", "updatedAt", "weightGrams", "widthCm") SELECT "basePriceCents", "compareAtPriceCents", "compositionCareNote", "createdAt", "currency", "depthCm", "description", "heightCm", "leadTimeMaxDays", "leadTimeMinDays", "material", "name", "printMinutes", "sizeAndFitNote", "slug", "sortOrder", "unitCount", "updatedAt", "weightGrams", "widthCm" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
