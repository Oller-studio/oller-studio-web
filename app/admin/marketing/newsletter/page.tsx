import { getSubscriberCounts } from "@/lib/subscribers";
import { NewsletterComposer } from "@/components/admin/NewsletterComposer";

export default async function AdminNewsletterPage() {
  const counts = await getSubscriberCounts();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold">Newsletter</h1>
      <div className="flex gap-4 text-sm">
        <span className="rounded-full bg-green-50 px-3 py-1 font-semibold text-green-700">
          {counts.active} active
        </span>
        <span className="rounded-full bg-border/40 px-3 py-1 font-semibold text-muted">
          {counts.unsubscribed} unsubscribed
        </span>
        <span className="text-muted">{counts.total} total ever</span>
      </div>
      <NewsletterComposer activeCount={counts.active} />
    </div>
  );
}
