-- "in_stock" now displays stockOnHand directly instead of its own
-- hand-set number, so it goes down for real as pieces sell.
ALTER TABLE "Colorway" DROP COLUMN "shopBadgeStockCount";
