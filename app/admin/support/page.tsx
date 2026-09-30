import { getAllInquiries } from "@/lib/inquiries";
import { SupportInbox } from "@/components/admin/SupportInbox";

export default async function AdminSupportPage() {
  const inquiries = await getAllInquiries();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-semibold">Support</h1>

      {inquiries.length === 0 ? (
        <p className="text-sm text-muted">No inquiries yet.</p>
      ) : (
        <SupportInbox rows={inquiries} />
      )}
    </div>
  );
}
