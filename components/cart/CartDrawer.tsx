"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./cart-context";
import { CartCheckout } from "./CartCheckout";
import { formatPrice } from "@/lib/format";

export function CartDrawer() {
  const { items, isOpen, close, removeItem, setQuantity, subtotal, count } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={close} />

      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background text-foreground shadow-xl">
        <div className="relative flex items-center justify-between border-b border-border px-6 py-6">
          <button type="button" aria-label="Close bag" onClick={close} className="text-xl">
            ✕
          </button>
          <p className="font-display text-2xl font-semibold leading-tight">Your Bag</p>
          <div className="flex items-center gap-1" aria-hidden="true">
            <BagIcon />
            {count > 0 && <span className="text-sm">{count}</span>}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <p className="text-sm uppercase tracking-wide text-muted">
              Your bag is currently empty.
            </p>
            <Link
              href="/shop"
              onClick={close}
              className="rounded-full border border-foreground px-8 py-3 text-sm font-semibold uppercase tracking-wide hover:bg-foreground hover:text-background"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <ul className="flex flex-col divide-y divide-border">
                {items.map((item) => (
                  <li key={item.slug} className="flex gap-5 py-6 first:pt-0 last:pb-0">
                    <div className="h-36 w-28 flex-shrink-0 overflow-hidden bg-border">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={160}
                          height={200}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-wide">
                            ONDINE
                          </p>
                          <p className="mt-1 text-sm text-muted">{item.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.slug)}
                          className="text-xs underline underline-offset-4 text-muted hover:text-foreground"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="flex items-center gap-3 text-sm text-muted">
                          <span className="text-xs uppercase tracking-wide">Qty</span>
                          <div className="flex items-center gap-3 border border-border px-3 py-1 text-foreground">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() => setQuantity(item.slug, item.quantity - 1)}
                            >
                              –
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() => setQuantity(item.slug, item.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-medium">
                          {formatPrice(item.price * item.quantity, item.currency)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border px-6 py-6">
              <div className="mb-4 flex items-center justify-between text-sm font-semibold uppercase tracking-wide">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal, items[0]?.currency ?? "USD")}</span>
              </div>
              <CartCheckout />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BagIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8h12l1 13H5L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
