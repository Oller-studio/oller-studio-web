import {
  getEmailTemplate,
  RESTOCK_TEMPLATE_KEY,
  ORDER_CONFIRMATION_TEMPLATE_KEY,
  ORDER_SHIPPED_TEMPLATE_KEY,
} from "@/lib/emailTemplates";
import { RestockEmailEditor } from "@/components/admin/RestockEmailEditor";
import { OrderConfirmationEmailEditor } from "@/components/admin/OrderConfirmationEmailEditor";
import { OrderShippedEmailEditor } from "@/components/admin/OrderShippedEmailEditor";

export default async function AdminMarketingEmailsPage() {
  const [restockTemplate, orderConfirmationTemplate, orderShippedTemplate] = await Promise.all([
    getEmailTemplate(RESTOCK_TEMPLATE_KEY),
    getEmailTemplate(ORDER_CONFIRMATION_TEMPLATE_KEY),
    getEmailTemplate(ORDER_SHIPPED_TEMPLATE_KEY),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold">Emails</h1>
      <p className="max-w-xl text-sm text-muted">
        Copy for emails sent from the admin. More templates land here as we add them.
      </p>
      <OrderConfirmationEmailEditor
        initialSubject={orderConfirmationTemplate.subject}
        initialMessage={orderConfirmationTemplate.message}
      />
      <OrderShippedEmailEditor
        initialSubject={orderShippedTemplate.subject}
        initialMessage={orderShippedTemplate.message}
      />
      <RestockEmailEditor
        initialSubject={restockTemplate.subject}
        initialMessage={restockTemplate.message}
      />
    </div>
  );
}
