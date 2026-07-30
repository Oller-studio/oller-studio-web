"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { site } from "@/content/site";

export default function AccountPage() {
  const { isLoaded, isSignedIn, user } = useUser();

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
        <p className="text-muted">
          Order tracking isn&apos;t connected here yet — checkout runs through
          PayPal, so your receipt and shipping updates arrive by email from
          PayPal directly. If you need help with an order, reach out and
          I&apos;ll sort it.
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
