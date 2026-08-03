import { getAllInquiries } from "@/lib/inquiries";
import { InquiriesTable } from "@/components/admin/InquiriesTable";

export default async function AdminSupportPage() {
  const inquiries = await getAllInquiries();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold">Support</h1>
      <p className="max-w-xl text-sm text-muted">
        Every Contact form and Collab-with-us submission. Order Status and Returns &amp; Exchanges
        also carry a Resolved status — the customer gets asked in their confirmation email whether
        it answered their question. <strong>Needs review</strong> means they said no; everything
        else either has no poll (General Enquiry, Collab) or hasn&apos;t answered yet.
      </p>

      {inquiries.length === 0 ? (
        <p className="text-sm text-muted">No inquiries yet.</p>
      ) : (
        <InquiriesTable rows={inquiries} />
      )}
    </div>
  );
}
