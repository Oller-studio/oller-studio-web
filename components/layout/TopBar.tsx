import Link from "next/link";
import { site } from "@/content/site";
import { ondine } from "@/content/ondine";
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
      <p className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap">
        Worldwide free shipping
      </p>
      <Link
        href="/shop"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 truncate text-center hover:opacity-80"
      >
        {site.campaignLine} — Shop the {ondine.name} Bag
      </Link>
      <div className="absolute right-6 top-1/2 flex -translate-y-1/2 items-center gap-4 whitespace-nowrap opacity-70">
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
