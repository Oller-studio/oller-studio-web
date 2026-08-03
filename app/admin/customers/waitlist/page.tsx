import Link from "next/link";
import { getAllWaitlistEntries } from "@/lib/waitlist";
import { WaitlistTable } from "@/components/admin/WaitlistTable";

export default async function AdminWaitlistPage() {
  const entries = await getAllWaitlistEntries();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold">Waitlist</h1>
      <p className="max-w-xl text-sm text-muted">
        People who asked to be notified about a color. <strong>Notify</strong> entries (Limited
        Edition sold out, or Coming Soon) get the Restock email automatically the moment you
        change that color&apos;s badge to something available — nothing to do here unless you want
        to resend one. <strong>Print request</strong> entries are regular sold-out colors someone
        wants — those don&apos;t send automatically; check the boxes below and use Send restock
        email once you&apos;ve decided you can make it, which sends a private link to buy directly
        without making the color available to everyone else. Editing what these emails say happens
        under{" "}
        <Link href="/admin/marketing/emails" className="underline underline-offset-4 hover:text-foreground">
          Marketing → Emails
        </Link>
        .
      </p>

      {entries.length === 0 ? (
        <p className="text-sm text-muted">No one has joined a waitlist yet.</p>
      ) : (
        <WaitlistTable rows={entries} />
      )}
    </div>
  );
}
