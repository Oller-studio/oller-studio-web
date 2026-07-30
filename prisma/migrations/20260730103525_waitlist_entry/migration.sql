-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "colorwaySlug" TEXT NOT NULL,
    "colorName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "WaitlistEntry_colorwaySlug_idx" ON "WaitlistEntry"("colorwaySlug");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_colorwaySlug_email_key" ON "WaitlistEntry"("colorwaySlug", "email");
