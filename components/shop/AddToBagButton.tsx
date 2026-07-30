"use client";

import type { ShopBadge } from "@/lib/types";
import { useCart } from "@/components/cart/cart-context";
import { NotifyMeForm } from "./NotifyMeForm";

type AddToBagButtonProps = {
  slug: string;
  name: string;
  price: number;
  currency: string;
  image?: string;
  shopBadge: ShopBadge;
  piecesRemaining?: number;
};

export function AddToBagButton({
  slug,
  name,
  price,
  currency,
  image,
  shopBadge,
  piecesRemaining,
}: AddToBagButtonProps) {
  const { addItem } = useCart();
  const isSoldOut =
    shopBadge.kind === "sold_out" ||
    (piecesRemaining !== undefined && piecesRemaining <= 0);

  if (isSoldOut) {
    return (
      <div className="flex flex-col gap-3">
        <span className="block w-full border border-foreground/20 py-3.5 text-center text-sm font-semibold uppercase tracking-wide text-foreground/50">
          Sold out
        </span>
        <NotifyMeForm slug={slug} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => addItem({ slug, name, price, currency, image })}
        className="block w-full border border-foreground py-3.5 text-center text-sm font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-foreground hover:text-background"
      >
        {shopBadge.kind === "coming_soon" ? "Reserve Yours" : "Add to Bag"}
      </button>
    </div>
  );
}
