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
  piecesRemaining?: number;
  totalPieces?: number;
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
  piecesRemaining,
  totalPieces,
  forceUnlocked,
}: AddToBagButtonProps) {
  const { addItem } = useCart();
  // A numbered edition (totalPieces set) is a Limited Edition — once its
  // pieces run out it's sold out for good (Notify Me / Restock). A
  // non-numbered color marked sold_out is a regular print-on-demand piece —
  // it *could* still be printed, so it gets Request This Piece instead,
  // which pings the team rather than promising a restock.
  const isNumbered = totalPieces !== undefined;
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
          variant={isNumbered ? "restock" : "print_request"}
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
      {shopBadge.kind === "coming_soon" && (
        <NotifyMeForm slug={slug} productName={productName} colorName={name} variant="coming_soon" />
      )}
    </div>
  );
}
