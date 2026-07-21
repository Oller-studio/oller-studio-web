import type { Availability } from "@/lib/types";
import { formatShipsFrom } from "@/lib/format";
import { PayPalCheckout } from "./PayPalCheckout";

type CheckoutButtonProps = {
  colorwayName: string;
  price: number;
  currency: string;
  sku: string;
  availability: Availability;
  piecesRemaining?: number;
};

export function CheckoutButton({
  colorwayName,
  price,
  currency,
  sku,
  availability,
  piecesRemaining,
}: CheckoutButtonProps) {
  const isSoldOut =
    availability.status === "sold_out" ||
    (piecesRemaining !== undefined && piecesRemaining <= 0);

  if (isSoldOut) {
    return (
      <span className="block w-full rounded-full border border-foreground/20 py-4 text-center text-sm font-semibold uppercase tracking-wide text-foreground/50">
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
      <PayPalCheckout
        colorwayName={colorwayName}
        price={price}
        currency={currency}
        sku={sku}
      />
    </div>
  );
}
