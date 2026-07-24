"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useFavorites } from "@/lib/useFavorites";
import { getAllColorways } from "@/lib/colorways";
import { ColorwaySwatchCard } from "@/components/shop/ColorwaySwatchCard";

export default function WishlistPage() {
  const { isLoaded } = useUser();
  const { isSignedIn, favorites } = useFavorites();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Your wishlist</h1>
        <p className="text-muted">Log in to see the pieces you&apos;ve saved.</p>
        <Link
          href="/shop"
          className="mt-2 text-sm font-semibold uppercase tracking-wide underline underline-offset-4"
        >
          Browse the collection
        </Link>
      </main>
    );
  }

  const saved = getAllColorways().filter((c) => favorites.includes(c.slug));

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold">Your wishlist</h1>

      {saved.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted">Nothing saved yet.</p>
          <Link
            href="/shop"
            className="text-sm font-semibold uppercase tracking-wide underline underline-offset-4"
          >
            Browse the collection
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((colorway) => (
            <ColorwaySwatchCard key={colorway.slug} colorway={colorway} />
          ))}
        </div>
      )}
    </main>
  );
}
