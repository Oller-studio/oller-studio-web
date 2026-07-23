"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";

const sections: { href: string; label: string; comingSoon?: boolean }[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/colorways", label: "Colorways", comingSoon: true },
  { href: "/admin/offers", label: "Ofertas", comingSoon: true },
  { href: "/admin/orders", label: "Pedidos", comingSoon: true },
  { href: "/admin/analytics", label: "Analíticas", comingSoon: true },
  { href: "/admin/support", label: "Soporte", comingSoon: true },
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
            title="Próximamente"
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
