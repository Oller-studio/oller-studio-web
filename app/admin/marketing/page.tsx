import Link from "next/link";

export default function AdminMarketingPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold">Marketing</h1>
      <Link
        href="/admin/marketing/emails"
        className="w-fit rounded-xl border border-border bg-background px-5 py-4 text-sm font-semibold shadow-sm hover:bg-border/20"
      >
        Emails →
      </Link>
    </div>
  );
}
