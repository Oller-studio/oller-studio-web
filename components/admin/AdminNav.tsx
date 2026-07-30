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
  MarketingIcon,
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
  {
    href: "/admin/customers",
    label: "Customers",
    icon: CustomersIcon,
    children: [{ href: "/admin/customers/waitlist", label: "Waitlist" }],
  },
  { href: "/admin/products", label: "Products", icon: ProductsIcon },
  {
    href: "/admin/marketing",
    label: "Marketing",
    icon: MarketingIcon,
    children: [
      { href: "/admin/marketing/partners", label: "Partners" },
      { href: "/admin/marketing/offers", label: "Offers" },
      { href: "/admin/marketing/emails", label: "Emails" },
    ],
  },
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
    <nav className="flex w-16 shrink-0 flex-col gap-1 border-r border-border px-2 py-8 lg:w-56 lg:px-4">
      <p className="mb-6 hidden truncate px-2 text-xs uppercase tracking-wide text-muted lg:block">
        Hi, {name}
      </p>
      {sections.map((s) => {
        if (s.comingSoon) {
          return (
            <span
              key={s.href}
              title="Coming soon"
              className="flex cursor-not-allowed items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm text-muted/50 lg:justify-start"
            >
              <s.icon />
              <span className="hidden lg:inline">{s.label}</span>
            </span>
          );
        }

        if (!s.children) {
          return (
            <Link
              key={s.href}
              href={s.href}
              title={s.label}
              className="flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-medium hover:bg-border/40 lg:justify-start"
            >
              <s.icon />
              <span className="hidden lg:inline">{s.label}</span>
            </Link>
          );
        }

        const isOpen = manuallyOpen[s.href] ?? pathname.startsWith(s.href);

        return (
          <div key={s.href} className="flex flex-col">
            <div className="flex items-center rounded-lg hover:bg-border/40">
              <Link
                href={s.href}
                title={s.label}
                className="flex flex-1 items-center justify-center gap-2 px-2 py-2 text-sm font-medium lg:justify-start"
              >
                <s.icon />
                <span className="hidden lg:inline">{s.label}</span>
              </Link>
              <button
                type="button"
                onClick={() => setManuallyOpen((m) => ({ ...m, [s.href]: !isOpen }))}
                aria-label={isOpen ? `Collapse ${s.label}` : `Expand ${s.label}`}
                className="hidden px-2 py-2 text-muted lg:block"
              >
                <Chevron open={isOpen} />
              </button>
            </div>
            {isOpen && (
              <div className="ml-2 hidden flex-col gap-1 border-l border-border pl-3 lg:flex">
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
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        title="View site"
        className="mt-6 flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm text-muted hover:bg-border/40 lg:justify-start"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M6 3H3v10h10v-3M9.5 2.5H13.5V6.5M13 3L7 9"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="hidden lg:inline">View site</span>
      </a>
      <button
        type="button"
        onClick={() => signOut()}
        title="Sign out"
        className="mt-6 rounded-lg px-2 py-2 text-center text-sm text-muted hover:bg-border/40 lg:text-left"
      >
        <span className="lg:hidden">⏻</span>
        <span className="hidden lg:inline">Sign out</span>
      </button>
    </nav>
  );
}
