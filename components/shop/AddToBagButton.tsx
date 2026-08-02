"use client";

import type { ShopBadge } from "@/lib/types";
import { useCart } from "@/components/cart/cart-context";
import { track } from "@/lib/track";
import { NotifyMeForm } from "./NotifyMeForm";

type AddToBagButtonProps = {
  slug: string;
  name: string;
  productName: string;
  price: number;
  currency: string;
  image?: string;
  shopBadge: ShopBadge;
  tier: "collection" | "signature";
  piecesRemaining?: number;
  // Set when the visitor arrived via a private waitlist link — lets this one
  // person buy a sold-out color without changing the public Shop Badge.
  forceUnlocked?: boolean;
};

export function AddToBagButton({
  slug,
  name,
  productName,
  price,
  currency,
  image,
  shopBadge,
  tier,
  piecesRemaining,
  forceUnlocked,
}: AddToBagButtonProps) {
  const { addItem } = useCart();
  const wouldBeSoldOut =
    shopBadge.kind === "sold_out" || (piecesRemaining !== undefined && piecesRemaining <= 0);
  const isSoldOut = wouldBeSoldOut && !forceUnlocked;

  if (isSoldOut) {
    return (
      <div className="flex flex-col gap-3">
        <NotifyMeForm
          slug={slug}
          productName={productName}
          colorName={name}
          // Collection colors are always print-to-order, never truly gone —
          // "sold out" just means not ready right now, so this reads as a
          // request rather than a wait for restock. Signature pieces are a
          // real numbered edition that closes for good, so Notify Me (for
          // the next drop) is the honest framing there.
          mode={tier === "collection" ? "request" : "notify"}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {forceUnlocked && wouldBeSoldOut && (
        <p className="text-xs uppercase tracking-wide text-muted">
          Reserved for you — printed on request from this link.
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          addItem({ slug, name, price, currency, image });
          track("add_to_cart");
        }}
        className="block w-full border border-foreground py-3.5 text-center text-sm font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-foreground hover:text-background"
      >
        {shopBadge.kind === "coming_soon" ? "Reserve Yours" : "Add to Bag"}
      </button>
    </div>
  );
}
