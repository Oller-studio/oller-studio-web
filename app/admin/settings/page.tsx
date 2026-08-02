import Link from "next/link";

const CARDS = [
  { href: "/admin/pages", label: "Pages", description: "Hero video/photo and the editorial strip." },
  { href: "/admin/marketing/emails", label: "Emails", description: "Copy for emails sent from the admin." },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-semibold">Settings</h1>
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
