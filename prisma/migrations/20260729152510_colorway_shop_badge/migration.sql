-- Consolidate availabilityStatus + isNew + showStockOnStorefront into one
-- shopBadge field (plus its two conditional companions), per the redesign:
-- one single admin control decides what customers see, decoupled from the
-- internal-only stockOnHand count.
ALTER TABLE "Colorway" DROP COLUMN "availabilityStatus";
ALTER TABLE "Colorway" DROP COLUMN "availabilityShipsFrom";
ALTER TABLE "Colorway" DROP COLUMN "isNew";
ALTER TABLE "Colorway" DROP COLUMN "showStockOnStorefront";
ALTER TABLE "Colorway" ADD COLUMN "shopBadge" TEXT NOT NULL DEFAULT 'available';
ALTER TABLE "Colorway" ADD COLUMN "shopBadgeShipsFrom" TEXT;
ALTER TABLE "Colorway" ADD COLUMN "shopBadgeStockCount" INTEGER;
