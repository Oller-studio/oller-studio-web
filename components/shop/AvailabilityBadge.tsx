import type { ShopBadge } from "@/lib/types";

type AvailabilityBadgeProps = {
  shopBadge: ShopBadge;
  piecesRemaining?: number;
  totalPieces?: number;
  stockOnHand?: number;
};

export function AvailabilityBadge({
  shopBadge,
  piecesRemaining,
  totalPieces,
  stockOnHand,
}: AvailabilityBadgeProps) {
  const isNumbered = totalPieces !== undefined && piecesRemaining !== undefined;

  if (shopBadge.kind === "sold_out" || (isNumbered && piecesRemaining! <= 0)) {
    return (
      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground/40">
        {isNumbered ? "Sold out — drop closed" : "Sold out"}
      </span>
    );
  }

  if (shopBadge.kind === "coming_soon") {
    return (
      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">
        Coming Soon
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

  if (shopBadge.kind === "new") {
    return (
      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">New</span>
    );
  }

  if (shopBadge.kind === "in_stock") {
    return (
      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">
        {stockOnHand ?? 0} in stock
      </span>
    );
  }

  if (shopBadge.kind === "limited_edition") {
    return (
      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">
        Limited Edition
      </span>
    );
  }

  return (
    <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">
      Available
    </span>
  );
}
