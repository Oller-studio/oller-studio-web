-- Coming soon no longer needs a hand-typed date — it was free text run
-- through Date parsing and regularly produced "Invalid Date". The
-- "Reserve Yours" button text is the only signal needed now.
ALTER TABLE "Colorway" DROP COLUMN "shopBadgeShipsFrom";
