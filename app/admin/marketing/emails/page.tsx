import { getEmailTemplate, RESTOCK_TEMPLATE_KEY } from "@/lib/emailTemplates";
import { RestockEmailEditor } from "@/components/admin/RestockEmailEditor";

export default async function AdminMarketingEmailsPage() {
  const template = await getEmailTemplate(RESTOCK_TEMPLATE_KEY);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold">Emails</h1>
      <p className="max-w-xl text-sm text-muted">
        Copy for emails sent from the admin. More templates land here as we add them.
      </p>
      <RestockEmailEditor initialSubject={template.subject} initialMessage={template.message} />
    </div>
  );
}
