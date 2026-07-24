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

  if (!isLoaded) return <span className={className} aria-hidden="true" />;

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
      className={className}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 21s-7.5-4.9-10-9.3C.5 8.4 2.3 5 5.7 5c1.8 0 3.3 1 4.3 2.4C11 6 12.5 5 14.3 5c3.4 0 5.2 3.4 3.7 6.7C19.5 16.1 12 21 12 21Z" />
      </svg>
    </button>
  );
}
