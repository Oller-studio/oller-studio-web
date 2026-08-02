"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useAuthModal } from "@/components/auth/auth-modal-context";

export function WishlistControl({
  className,
  label = "♡",
}: {
  className?: string;
  label?: string;
}) {
  const { isLoaded, isSignedIn } = useUser();
  const { open } = useAuthModal();

  if (!isLoaded) {
    return (
      <span className={className} aria-hidden="true">
        {label}
      </span>
    );
  }

  if (isSignedIn) {
    return (
      <Link href="/wishlist" className={className} aria-label="My wishlist">
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={open} className={className} aria-label="Log in to see your wishlist">
      {label}
    </button>
  );
}
