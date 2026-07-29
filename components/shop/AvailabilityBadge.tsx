import type { Availability } from "@/lib/types";
import { formatShipsFrom } from "@/lib/format";

type AvailabilityBadgeProps = {
  availability: Availability;
  piecesRemaining?: number;
  totalPieces?: number;
  isNew?: boolean;
  stockOnHand?: number;
  showStockOnStorefront?: boolean;
};

export function AvailabilityBadge({
  availability,
  piecesRemaining,
  totalPieces,
  isNew,
  stockOnHand,
  showStockOnStorefront,
}: AvailabilityBadgeProps) {
  const isNumbered = totalPieces !== undefined && piecesRemaining !== undefined;

  if (availability.status === "sold_out" || (isNumbered && piecesRemaining! <= 0)) {
    return (
      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground/40">
        {isNumbered ? "Sold out — drop closed" : "Sold out"}
      </span>
    );
  }

  if (availability.status === "away") {
    return (
      <span className="text-[11px] font-bold uppercase tracking-wide text-accent">
        {formatShipsFrom(availability.shipsFrom)}
      </span>
    );
  }

  if (isNumbered) {
    return (
      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">
        {piecesRemaining} of {totalPieces} pieces left
      </span>
    );
  }

  if (isNew) {
    return (
      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">New</span>
    );
  }

  if (showStockOnStorefront && stockOnHand !== undefined && stockOnHand > 0) {
    return (
      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">
        {stockOnHand} in stock
      </span>
    );
  }

  return (
    <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">
      Available
    </span>
  );
}
