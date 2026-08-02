"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { site } from "@/content/site";
import { formatMoneyCents } from "@/lib/format";

type AccountOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  amountCents: number;
  currency: string;
  itemCount: number;
  status: string;
};

export default function AccountPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [orders, setOrders] = useState<AccountOrder[] | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/account/orders")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setOrders(data?.orders ?? []))
      .catch(() => setOrders([]));
  }, [isSignedIn]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-24 text-center">
        <h1 className="font-display text-4xl font-bold">My account</h1>
        <p className="text-muted">Log in to see your account overview.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-4xl font-bold">
        Hi, {user.firstName ?? "there"}
      </h1>
      <p className="mt-2 text-muted">{user.primaryEmailAddress?.emailAddress}</p>

      <div className="mt-12 flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Orders</h2>
        {orders === null ? null : orders.length === 0 ? (
          <p className="text-muted">No orders yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/orders/track/${o.id}`}
                className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm hover:opacity-70"
              >
                <span>
                  {o.orderNumber} &middot; {o.itemCount} item{o.itemCount === 1 ? "" : "s"}
                </span>
                <span className="text-muted">{o.status}</span>
                <span className="font-semibold">{formatMoneyCents(o.amountCents, o.currency)}</span>
              </Link>
            ))}
          </div>
        )}
        <p className="text-muted">
          If you need help with an order, reach out and I&apos;ll sort it.
        </p>
        <a
          href={`mailto:${site.email}`}
          className="text-sm font-semibold uppercase tracking-wide underline underline-offset-4"
        >
          {site.email}
        </a>
      </div>

      <div className="mt-12 flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Favorites</h2>
        <Link
          href="/wishlist"
          className="text-sm font-semibold uppercase tracking-wide underline underline-offset-4"
        >
          View your saved pieces
        </Link>
      </div>
    </main>
  );
}
