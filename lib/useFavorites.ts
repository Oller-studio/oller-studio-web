"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuthModal } from "@/components/auth/auth-modal-context";

function readFavorites(unsafeMetadata: unknown): string[] {
  const favorites = (unsafeMetadata as { favorites?: unknown } | null | undefined)
    ?.favorites;
  return Array.isArray(favorites) ? favorites.filter((f): f is string => typeof f === "string") : [];
}

export function useFavorites() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { open } = useAuthModal();
  // Applied immediately on click so the heart flips without waiting on the
  // Clerk round-trip; cleared once that round-trip settles (success or not).
  const [optimistic, setOptimistic] = useState<string[] | null>(null);

  const serverFavorites = isSignedIn ? readFavorites(user.unsafeMetadata) : [];
  const favorites = optimistic ?? serverFavorites;

  function isFavorite(slug: string) {
    return favorites.includes(slug);
  }

  async function toggleFavorite(slug: string) {
    if (!isSignedIn) {
      open();
      return;
    }
    const next = isFavorite(slug)
      ? favorites.filter((s) => s !== slug)
      : [...favorites, slug];

    setOptimistic(next);
    try {
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, favorites: next } });
      await user.reload();
    } catch (error) {
      console.error("Failed to update favorites", error);
    } finally {
      setOptimistic(null);
    }
  }

  return { isLoaded, isSignedIn, favorites, isFavorite, toggleFavorite };
}
