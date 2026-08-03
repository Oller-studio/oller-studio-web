"use client";

import { useState } from "react";
import Link from "next/link";
import { site } from "@/content/site";
import { AccountControl } from "./AccountControl";
import { WishlistControl } from "./WishlistControl";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const MENU_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Our Universe", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "Collab With Us", href: "/collab-with-us" },
];

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Mobile-only: a hamburger button that opens a full-screen nav drawer, so
// the main header row can stay a single clean line (logo truly centered)
// instead of stacking a second row of nav links underneath it.
export function MobileMenu({ variant }: { variant: "solid" | "overlay" }) {
  const [open, setOpen] = useState(false);
  const text = variant === "overlay" ? "text-white" : "text-foreground";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className={`sm:hidden ${text}`}
      >
        <MenuIcon />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background px-6 py-5 sm:hidden">
          <div className="flex items-center justify-between">
            <span className="font-wordmark text-2xl font-extrabold text-foreground">
              {site.name}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="text-foreground"
            >
              <CloseIcon />
            </button>
          </div>
          <nav className="mt-12 flex flex-col gap-7 text-xl font-medium uppercase tracking-wide text-foreground">
            {MENU_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-4 border-t border-border pt-5 text-sm font-medium uppercase tracking-wide text-foreground">
            {clerkConfigured ? (
              <WishlistControl className="w-fit" label="Saved" />
            ) : (
              <span>Saved</span>
            )}
            {clerkConfigured ? (
              <AccountControl className="w-fit" variant="inline" />
            ) : (
              <span>Login</span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
