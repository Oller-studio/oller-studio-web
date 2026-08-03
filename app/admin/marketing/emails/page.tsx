import {
  getEmailTemplate,
  EMAIL_TEMPLATES,
  ABANDONED_CHECKOUT_TEMPLATE_KEY,
  DEFAULT_ABANDONED_CHECKOUT_DELAY_MINUTES,
  ABANDONED_CHECKOUT_EMOTIONAL_TEMPLATE_KEY,
  ABANDONED_CHECKOUT_FINAL_TEMPLATE_KEY,
  CONTACT_CONFIRMATION_ORDER_STATUS_TEMPLATE_KEY,
  CONTACT_CONFIRMATION_ORDER_STATUS_NOT_FOUND_TEMPLATE_KEY,
} from "@/lib/emailTemplates";
import { getEmailStatsByType } from "@/lib/emailLog";
import { getAbandonedCheckoutRecoveryStats } from "@/lib/orders";
import { EmailTemplatesTable, type EmailTemplateRow } from "@/components/admin/EmailTemplatesTable";

export default async function AdminMarketingEmailsPage() {
  const stats = await getEmailStatsByType();
  const recovery = await getAbandonedCheckoutRecoveryStats();
  const templates: EmailTemplateRow[] = await Promise.all(
    EMAIL_TEMPLATES.map(async (t) => {
      const data = await getEmailTemplate(t.key);
      const { sent, opened, clicked } = stats[t.key] ?? { sent: 0, opened: 0, clicked: 0 };
      // The Emotional and Final steps aren't their own rows — they're edited
      // side by side with the Reminder in the same card, so fetch both here
      // and carry them on the Reminder row's data (same pattern as Order
      // Status's notFoundProps below).
      const abandonedProps =
        t.key === ABANDONED_CHECKOUT_TEMPLATE_KEY
          ? await (async () => {
              const emotional = await getEmailTemplate(ABANDONED_CHECKOUT_EMOTIONAL_TEMPLATE_KEY);
              const final = await getEmailTemplate(ABANDONED_CHECKOUT_FINAL_TEMPLATE_KEY);
              return {
                emotionalSubject: emotional.subject,
                emotionalMessage: emotional.message,
                emotionalActive: emotional.active,
                emotionalDelayMinutes: emotional.delayMinutes,
                finalSubject: final.subject,
                finalMessage: final.message,
                finalActive: final.active,
                finalDelayMinutes: final.delayMinutes,
                recoveredCount: recovery.recovered,
                recoveredRevenueCents: recovery.recoveredRevenueCents,
                recoveryCurrency: recovery.currency,
                recoveredOrders: recovery.recoveredOrders,
              };
            })()
          : {};
      // Order Status has a second, fallback template (used when no order
      // matches the email) that isn't its own row — it's edited alongside
      // this one, so fetch it here and carry it on the same row's data.
      const notFoundProps =
        t.key === CONTACT_CONFIRMATION_ORDER_STATUS_TEMPLATE_KEY
          ? await (async () => {
              const notFound = await getEmailTemplate(
                CONTACT_CONFIRMATION_ORDER_STATUS_NOT_FOUND_TEMPLATE_KEY,
              );
              return { notFoundSubject: notFound.subject, notFoundMessage: notFound.message };
            })()
          : {};
      const trigger =
        t.key === ABANDONED_CHECKOUT_TEMPLATE_KEY
          ? (() => {
              const minutes = data.delayMinutes ?? DEFAULT_ABANDONED_CHECKOUT_DELAY_MINUTES;
              return `${minutes} minute${minutes === 1 ? "" : "s"} after a cart is abandoned, in up to 3 steps`;
            })()
          : t.trigger;
      return { ...t, ...data, trigger, sent, opened, clicked, ...abandonedProps, ...notFoundProps };
    })
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-semibold">Emails</h1>
      <EmailTemplatesTable templates={templates} />
    </div>
  );
}
