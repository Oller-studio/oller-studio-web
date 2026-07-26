"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  DashboardIcon,
  ProductionIcon,
  OrdersIcon,
  CustomersIcon,
  ProductsIcon,
  OffersIcon,
  FinanceIcon,
  AnalyticsIcon,
  SupportIcon,
} from "./NavIcons";

type Section = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
  comingSoon?: boolean;
  children?: { href: string; label: string }[];
};

const sections: Section[] = [
  { href: "/admin", label: "Dashboard", icon: DashboardIcon },
  {
    href: "/admin/production",
    label: "Production",
    icon: ProductionIcon,
    children: [{ href: "/admin/production/packaging", label: "Packaging" }],
  },
  { href: "/admin/orders", label: "Orders", icon: OrdersIcon },
  { href: "/admin/customers", label: "Customers", icon: CustomersIcon },
  { href: "/admin/products", label: "Products", icon: ProductsIcon },
  { href: "/admin/offers", label: "Offers", icon: OffersIcon, comingSoon: true },
  { href: "/admin/finance", label: "Finance", icon: FinanceIcon },
  { href: "/admin/analytics", label: "Analytics", icon: AnalyticsIcon, comingSoon: true },
  { href: "/admin/support", label: "Support", icon: SupportIcon, comingSoon: true },
];

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      className={`shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
      aria-hidden="true"
    >
      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function AdminNav({ name }: { name: string }) {
  const { signOut } = useClerk();
  const pathname = usePathname();
  const [manuallyOpen, setManuallyOpen] = useState<Record<string, boolean>>({});

  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r border-border px-4 py-8">
      <p className="mb-6 truncate px-2 text-xs uppercase tracking-wide text-muted">
        Hi, {name}
      </p>
      {sections.map((s) => {
        if (s.comingSoon) {
          return (
            <span
              key={s.href}
              title="Coming soon"
              className="flex cursor-not-allowed items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted/50"
            >
              <s.icon />
              {s.label}
            </span>
          );
        }

        if (!s.children) {
          return (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium hover:bg-border/40"
            >
              <s.icon />
              {s.label}
            </Link>
          );
        }

        const isOpen = manuallyOpen[s.href] ?? pathname.startsWith(s.href);

        return (
          <div key={s.href} className="flex flex-col">
            <div className="flex items-center rounded-lg hover:bg-border/40">
              <Link href={s.href} className="flex flex-1 items-center gap-2 px-2 py-2 text-sm font-medium">
                <s.icon />
                {s.label}
              </Link>
              <button
                type="button"
                onClick={() => setManuallyOpen((m) => ({ ...m, [s.href]: !isOpen }))}
                aria-label={isOpen ? `Collapse ${s.label}` : `Expand ${s.label}`}
                className="px-2 py-2 text-muted"
              >
                <Chevron open={isOpen} />
              </button>
            </div>
            {isOpen && (
              <div className="ml-2 flex flex-col gap-1 border-l border-border pl-3">
                {s.children.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    className="rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-border/40 hover:text-foreground"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
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
