"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { useAuthModal } from "@/components/auth/auth-modal-context";

type AccountControlProps = {
  className?: string;
};

export function AccountControl({ className }: AccountControlProps) {
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

  useEffect(() => {
    if (!isSignedIn) {
      setIsAdmin(false);
      return;
    }
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
            {isAdmin && (
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
