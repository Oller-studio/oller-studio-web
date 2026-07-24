"use client";

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

  const favorites = isSignedIn ? readFavorites(user.unsafeMetadata) : [];

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
    try {
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, favorites: next } });
      await user.reload();
    } catch (error) {
      console.error("Failed to update favorites", error);
    }
  }

  return { isLoaded, isSignedIn, favorites, isFavorite, toggleFavorite };
}
