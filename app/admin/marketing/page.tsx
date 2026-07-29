import Link from "next/link";

export default function MarketingPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-semibold">Marketing</h1>
      <div className="flex flex-wrap gap-4">
        <Link
          href="/admin/marketing/partners"
          className="flex w-64 flex-col gap-1 rounded-xl border border-border bg-background p-4 hover:bg-border/10"
        >
          <p className="text-sm font-semibold">Partners</p>
          <p className="text-xs text-muted">Referrals and influencers, with tracked links.</p>
        </Link>
        <span
          title="Coming soon"
          className="flex w-64 cursor-not-allowed flex-col gap-1 rounded-xl border border-border bg-background p-4 text-muted/50"
        >
          <p className="text-sm font-semibold">Offers</p>
          <p className="text-xs">Discount codes and promotions.</p>
        </span>
      </div>
    </div>
  );
}
