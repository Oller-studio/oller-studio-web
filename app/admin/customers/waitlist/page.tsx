import { getAllWaitlistEntries } from "@/lib/waitlist";
import { WaitlistTable } from "@/components/admin/WaitlistTable";

export default async function AdminWaitlistPage() {
  const entries = await getAllWaitlistEntries();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold">Waitlist</h1>
      <p className="max-w-xl text-sm text-muted">
        People who asked to be emailed when a sold-out color comes back. Select entries and send
        them a private link to buy directly, without making the color available to everyone else.
      </p>

      {entries.length === 0 ? (
        <p className="text-sm text-muted">No one has joined a waitlist yet.</p>
      ) : (
        <WaitlistTable rows={entries} />
      )}
    </div>
  );
}
