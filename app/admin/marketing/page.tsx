import Link from "next/link";

const CARDS = [
  { href: "/admin/marketing/partners", label: "Partners", description: "Referrals and influencers, with tracked links." },
  { href: "/admin/marketing/offers", label: "Offers", description: "Discount codes and promotions." },
];

export default function MarketingPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-semibold">Marketing</h1>
      <div className="flex flex-wrap gap-4">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex w-64 flex-col gap-1 rounded-xl border border-border bg-background p-4 hover:bg-border/10"
          >
            <p className="text-sm font-semibold">{c.label}</p>
            <p className="text-xs text-muted">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
