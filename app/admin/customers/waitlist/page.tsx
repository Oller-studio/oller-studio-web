import { getAllWaitlistEntries } from "@/lib/waitlist";
import { getEmailTemplate, RESTOCK_TEMPLATE_KEY } from "@/lib/emailTemplates";
import { WaitlistTable } from "@/components/admin/WaitlistTable";
import { RestockEmailEditor } from "@/components/admin/RestockEmailEditor";

export default async function AdminWaitlistPage() {
  const entries = await getAllWaitlistEntries();
  const template = await getEmailTemplate(RESTOCK_TEMPLATE_KEY);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold">Waitlist</h1>
      <p className="max-w-xl text-sm text-muted">
        People who asked to be emailed when a sold-out color comes back. Check the boxes below,
        then use Send restock email to send a private link to buy directly, without making the
        color available to everyone else.
      </p>

      <RestockEmailEditor initialSubject={template.subject} initialMessage={template.message} />

      {entries.length === 0 ? (
        <p className="text-sm text-muted">No one has joined a waitlist yet.</p>
      ) : (
        <WaitlistTable rows={entries} />
      )}
    </div>
  );
}
