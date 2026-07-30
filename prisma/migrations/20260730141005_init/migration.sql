-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
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
    "shippingName" TEXT,
    "shippingAddress" TEXT,
    "shippingCity" TEXT,
    "source" TEXT,
    "channel" TEXT,
    "fulfillmentStatus" TEXT NOT NULL DEFAULT 'NEW_ORDER',
    "startedPrintingAt" TIMESTAMP(3),
    "rawPayload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "colorwaySlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitAmountCents" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "source" TEXT,
    "channel" TEXT,
    "device" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunnelEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FunnelEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "basePriceCents" INTEGER NOT NULL DEFAULT 0,
    "compareAtPriceCents" INTEGER,
    "unitCount" INTEGER NOT NULL DEFAULT 1,
    "weightGrams" INTEGER,
    "heightCm" DOUBLE PRECISION,
    "widthCm" DOUBLE PRECISION,
    "depthCm" DOUBLE PRECISION,
    "sizeAndFitNote" TEXT,
    "compositionCareNote" TEXT,
    "deliveryReturnsNote" TEXT,
    "material" TEXT,
    "printMinutes" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "leadTimeMinDays" INTEGER NOT NULL,
    "leadTimeMaxDays" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "packagingId" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "Packaging" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Packaging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Colorway" (
    "slug" TEXT NOT NULL,
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
    "shopBadge" TEXT NOT NULL DEFAULT 'available',
    "stockOnHand" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "launchedAt" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Colorway_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "ProductCost" (
    "colorwaySlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "costCents" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCost_pkey" PRIMARY KEY ("colorwaySlug")
);

-- CreateTable
CREATE TABLE "FixedCost" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amountCentsPerMonth" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "FixedCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "colorwaySlug" TEXT NOT NULL,
    "colorName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "accessToken" TEXT NOT NULL,
    "invitedAt" TIMESTAMP(3),
    "purchasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerLink" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "utmSource" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DistributionChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "partnerId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_paypalOrderId_key" ON "Order"("paypalOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_captureId_key" ON "Order"("captureId");

-- CreateIndex
CREATE INDEX "PageView_createdAt_idx" ON "PageView"("createdAt");

-- CreateIndex
CREATE INDEX "PageView_path_idx" ON "PageView"("path");

-- CreateIndex
CREATE INDEX "PageView_sessionId_idx" ON "PageView"("sessionId");

-- CreateIndex
CREATE INDEX "FunnelEvent_createdAt_idx" ON "FunnelEvent"("createdAt");

-- CreateIndex
CREATE INDEX "FunnelEvent_name_idx" ON "FunnelEvent"("name");

-- CreateIndex
CREATE INDEX "FunnelEvent_sessionId_idx" ON "FunnelEvent"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_accessToken_key" ON "WaitlistEntry"("accessToken");

-- CreateIndex
CREATE INDEX "WaitlistEntry_colorwaySlug_idx" ON "WaitlistEntry"("colorwaySlug");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_colorwaySlug_email_key" ON "WaitlistEntry"("colorwaySlug", "email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_key_key" ON "EmailTemplate"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerLink_utmSource_key" ON "PartnerLink"("utmSource");

-- CreateIndex
CREATE UNIQUE INDEX "DistributionChannel_name_key" ON "DistributionChannel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_code_key" ON "Offer"("code");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_packagingId_fkey" FOREIGN KEY ("packagingId") REFERENCES "Packaging"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colorway" ADD CONSTRAINT "Colorway_productSlug_fkey" FOREIGN KEY ("productSlug") REFERENCES "Product"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerLink" ADD CONSTRAINT "PartnerLink_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
