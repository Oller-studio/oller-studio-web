"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { useAuthModal } from "@/components/auth/auth-modal-context";

type AccountControlProps = {
  className?: string;
  // "dropdown" (default) is the desktop TopBar's floating menu, which
  // needs room below the button to open into. Inside the mobile drawer the
  // button sits near the bottom of the screen (mt-auto), so that same
  // absolute dropdown rendered off-screen below the viewport — nothing
  // visibly happened on tap. "inline" renders the same links directly in
  // the page flow instead, like WishlistControl already does for mobile.
  variant?: "dropdown" | "inline";
};

export function AccountControl({ className, variant = "dropdown" }: AccountControlProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const { open } = useAuthModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  // Gated by isSignedIn everywhere it's read below, so a stale `true` left
  // over from a previous session can't leak admin controls to a signed-out
  // view — no need to reset it here too.
  const effectiveIsAdmin = isSignedIn && isAdmin;

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    fetch("/api/admin/status")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setIsAdmin(Boolean(data.isAdmin));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  if (!isLoaded) {
    return <span className={className} aria-hidden="true" />;
  }

  if (isSignedIn && variant === "inline") {
    return (
      <div className={className}>
        <p className="text-xs font-normal normal-case text-muted">
          Hi, {user.firstName ?? "there"}
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {effectiveIsAdmin && (
            <Link href="/admin" className="font-medium">
              Admin
            </Link>
          )}
          <Link href="/account" className="font-medium">
            Overview
          </Link>
          <button type="button" onClick={() => signOut()} className="text-left font-medium">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div ref={containerRef} className="relative">
        <button type="button" onClick={() => setMenuOpen((v) => !v)} className={className}>
          My Account
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-40 mt-4 w-48 rounded-xl border border-border bg-background py-2 text-left text-foreground normal-case tracking-normal shadow-xl">
            <p className="px-4 py-2 text-sm font-semibold">
              Hi, {user.firstName ?? "there"}
            </p>
            {effectiveIsAdmin && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm font-normal hover:bg-border/40"
              >
                Admin
              </Link>
            )}
            <Link
              href="/account"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2 text-sm font-normal hover:bg-border/40"
            >
              Overview
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                signOut();
              }}
              className="block w-full px-4 py-2 text-left text-sm font-normal hover:bg-border/40"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button type="button" onClick={open} className={className}>
      Login
    </button>
  );
}
