"use client";

import type { Availability } from "@/lib/types";
import { formatShipsFrom } from "@/lib/format";
import { useCart } from "@/components/cart/cart-context";

type AddToBagButtonProps = {
  slug: string;
  name: string;
  price: number;
  currency: string;
  image?: string;
  availability: Availability;
  piecesRemaining?: number;
};

export function AddToBagButton({
  slug,
  name,
  price,
  currency,
  image,
  availability,
  piecesRemaining,
}: AddToBagButtonProps) {
  const { addItem } = useCart();
  const isSoldOut =
    availability.status === "sold_out" ||
    (piecesRemaining !== undefined && piecesRemaining <= 0);

  if (isSoldOut) {
    return (
      <span className="block w-full border border-foreground/20 py-3.5 text-center text-sm font-semibold uppercase tracking-wide text-foreground/50">
        Sold out
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {availability.status === "away" && (
        <p className="text-sm font-medium text-accent">
          {formatShipsFrom(availability.shipsFrom)}
        </p>
      )}
      <button
        type="button"
        onClick={() => addItem({ slug, name, price, currency, image })}
        className="block w-full border border-foreground py-3.5 text-center text-sm font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-foreground hover:text-background"
      >
        Add to Bag
      </button>
    </div>
  );
}
