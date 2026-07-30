"use client";

import { useFavorites } from "@/lib/useFavorites";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function FavoriteButton({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  if (!clerkConfigured) return null;
  return <FavoriteButtonInner slug={slug} className={className} />;
}

function FavoriteButtonInner({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const { isLoaded, isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(slug);

  if (!isLoaded) return null;

  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(slug);
      }}
      className={`group/fav transition-opacity duration-200 ${
        active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      } ${className ?? ""}`}
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors group-hover/fav:fill-current"
      >
        <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  );
}
