import Link from "next/link";
import { site } from "@/content/site";
import { AccountControl } from "./AccountControl";
import { WishlistControl } from "./WishlistControl";

type TopBarProps = {
  variant?: "solid" | "overlay";
};

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function TopBar({ variant = "solid" }: TopBarProps) {
  const isOverlay = variant === "overlay";

  return (
    <div
      className={`relative z-30 h-9 border-b px-6 text-xs font-semibold uppercase tracking-wide ${
        isOverlay
          ? "border-white/20 bg-transparent text-white"
          : "border-border bg-background text-foreground"
      }`}
    >
      <p className="absolute left-6 top-1/2 hidden -translate-y-1/2 whitespace-nowrap sm:block">
        Worldwide free shipping
      </p>
      <Link
        href="/shop"
        className="absolute left-1/2 top-1/2 max-w-[80%] -translate-x-1/2 -translate-y-1/2 truncate text-center hover:opacity-80 sm:max-w-[60%]"
      >
        {site.campaignLine} — Shop the Collection
      </Link>
      {/* Wishlist/account live in the hamburger menu on mobile instead —
          crammed in here too, they crowded out the ticker text (truncating
          it) on narrow phones. */}
      <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 items-center gap-4 whitespace-nowrap opacity-70 sm:flex">
        {clerkConfigured ? (
          <WishlistControl className="text-base leading-none hover:opacity-80" />
        ) : (
          <span aria-hidden="true" className="text-base leading-none">
            ♡
          </span>
        )}
        {clerkConfigured ? <AccountControl /> : <span>Login</span>}
      </div>
    </div>
  );
}
