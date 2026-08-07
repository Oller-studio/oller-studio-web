"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { formatPrice } from "@/lib/format";

export function CheckoutPageClient() {
  const { items, subtotal, hydrated } = useCart();

  // Cart state comes from localStorage, read in an effect after mount — on
  // the very first render items is always [], hydrated or not. Waiting
  // avoids flashing "Your bag is empty" for a frame on every fresh
  // navigation here (a full-page redirect, e.g. after Google sign-in,
  // rather than an in-app Link click) before the real cart loads in.
  if (!hydrated) return null;

  if (items.length === 0) {
    return (
      <main className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-24 text-center">
        <p className="text-sm uppercase tracking-wide text-muted">Your bag is empty.</p>
        <Link
          href="/shop"
          className="rounded-full border border-foreground px-8 py-3 text-sm font-semibold uppercase tracking-wide hover:bg-foreground hover:text-background"
        >
          Continue Shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-6 py-16 lg:grid-cols-2">
      <div className="order-2 flex flex-col gap-4 lg:order-1">
        <h1 className="font-display text-2xl font-semibold">Checkout</h1>
        <CheckoutForm />
      </div>

      <div className="order-1 flex flex-col gap-4 lg:order-2">
        <h2 className="font-display text-lg font-semibold">Order summary</h2>
        <ul className="flex flex-col divide-y divide-border">
          {items.map((item) => (
            <li key={item.slug} className="flex gap-4 py-4 first:pt-0">
              <div className="h-24 w-20 flex-shrink-0 overflow-hidden bg-border">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={80}
                    height={100}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide">ONDINE</p>
                  <p className="mt-1 text-sm text-muted">
                    {item.name} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium">
                  {formatPrice(item.price * item.quantity, item.currency)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-border pt-4 text-sm font-semibold uppercase tracking-wide">
          <span>Total</span>
          <span>{formatPrice(subtotal, items[0]?.currency ?? "USD")}</span>
        </div>
      </div>
    </main>
  );
}
