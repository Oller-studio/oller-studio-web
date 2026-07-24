"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";

const sections: { href: string; label: string; comingSoon?: boolean }[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/production", label: "Production" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/colorways", label: "Colorways", comingSoon: true },
  { href: "/admin/offers", label: "Offers", comingSoon: true },
  { href: "/admin/finance", label: "Finance" },
  { href: "/admin/analytics", label: "Analytics", comingSoon: true },
  { href: "/admin/support", label: "Support", comingSoon: true },
];

export function AdminNav({ name }: { name: string }) {
  const { signOut } = useClerk();

  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r border-border px-4 py-8">
      <p className="mb-6 truncate px-2 text-xs uppercase tracking-wide text-muted">
        Hi, {name}
      </p>
      {sections.map((s) =>
        s.comingSoon ? (
          <span
            key={s.href}
            title="Coming soon"
            className="cursor-not-allowed rounded-lg px-2 py-2 text-sm text-muted/50"
          >
            {s.label}
          </span>
        ) : (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-lg px-2 py-2 text-sm font-medium hover:bg-border/40"
          >
            {s.label}
          </Link>
        )
      )}
      <button
        type="button"
        onClick={() => signOut()}
        className="mt-6 rounded-lg px-2 py-2 text-left text-sm text-muted hover:bg-border/40"
      >
        Sign out
      </button>
    </nav>
  );
}
