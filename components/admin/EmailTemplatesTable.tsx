"use client";

import { Fragment, useState } from "react";
import type { EmailTag } from "@/lib/emailTemplates";
import { RestockEmailEditor } from "./RestockEmailEditor";
import { OrderConfirmationEmailEditor } from "./OrderConfirmationEmailEditor";
import { OrderShippedEmailEditor } from "./OrderShippedEmailEditor";
import { AbandonedCheckoutEmailEditor } from "./AbandonedCheckoutEmailEditor";
import { WelcomeEmailEditor } from "./WelcomeEmailEditor";
import { PrintRequestConfirmationEditor } from "./PrintRequestConfirmationEditor";
import { ContactConfirmationEditor } from "./ContactConfirmationEditor";
import { OrderStatusConfirmationEditor } from "./OrderStatusConfirmationEditor";
import { CollabConfirmationEditor } from "./CollabConfirmationEditor";

export type EmailTemplateRow = {
  key: string;
  name: string;
  trigger: string;
  isAutomation: boolean;
  editable: boolean;
  tag: EmailTag;
  subject: string;
  message: string;
  active?: boolean;
  delayMinutes?: number;
  sent: number;
  opened: number;
  clicked: number;
  recoveredCount?: number;
  recoveredRevenueCents?: number;
  recoveryCurrency?: string;
  recoveredOrders?: {
    orderId: string;
    email: string;
    amountCents: number;
    currency: string;
    completedAt: Date;
  }[];
  emotionalSubject?: string;
  emotionalMessage?: string;
  emotionalActive?: boolean;
  emotionalDelayMinutes?: number;
  finalSubject?: string;
  finalMessage?: string;
  finalActive?: boolean;
  finalDelayMinutes?: number;
  notFoundSubject?: string;
  notFoundMessage?: string;
  sentTo: "customer" | "team";
};

// Kept as a literal (not imported from lib/emailTemplates.ts) so this client
// component doesn't pull the Prisma-backed module into the browser bundle.
const EMAIL_TAGS: EmailTag[] = [
  "purchase",
  "restock",
  "abandoned_checkout",
  "interest",
  "account",
  "inquiry",
];

const TAG_LABELS: Record<EmailTag, string> = {
  purchase: "Purchase",
  restock: "Restock",
  abandoned_checkout: "Abandoned Checkout",
  interest: "Interest",
  account: "Account",
  inquiry: "Inquiry",
};

const TAG_COLORS: Record<EmailTag, string> = {
  purchase: "bg-green-50 text-green-700",
  restock: "bg-blue-50 text-blue-700",
  abandoned_checkout: "bg-amber-50 text-amber-700",
  interest: "bg-purple-50 text-purple-700",
  account: "bg-indigo-50 text-indigo-700",
  inquiry: "bg-border/40 text-muted",
};

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${
        active ? "bg-green-50 text-green-700" : "bg-border/40 text-muted"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Tag({ tag }: { tag: EmailTag }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${TAG_COLORS[tag]}`}>
      {TAG_LABELS[tag]}
    </span>
  );
}

function SentTo({ sentTo }: { sentTo: "customer" | "team" }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${
        sentTo === "customer" ? "bg-teal-50 text-teal-700" : "bg-orange-50 text-orange-700"
      }`}
    >
      {sentTo === "customer" ? "Customer" : "Team"}
    </span>
  );
}

function MailIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="3" width="11" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 3.5l5 3.5 5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MailOpenIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M1.5 6.2 6.6 2.4a.7.7 0 0 1 .8 0l5.1 3.8v4.3a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V6.2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M1.7 6.4 6 9l4.3-2.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClickIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3 2.5 4 11l2-2.4L7.8 11l1-1-2.8-2.5L9 6.3 3 2.5Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function pct(count: number, total: number) {
  return total > 0 ? `${Math.round((count / total) * 100)}%` : "—";
}

function renderEditor(t: EmailTemplateRow) {
  if (!t.editable) {
    return (
      <p className="max-w-xl text-sm text-muted">
        Internal notification built from the submitted form&apos;s fields — not freeform copy, so
        there&apos;s nothing to edit here. Numbers on the left still reflect it.
      </p>
    );
  }

  switch (t.key) {
    case "order_confirmation":
      return <OrderConfirmationEmailEditor initialSubject={t.subject} initialMessage={t.message} />;
    case "order_shipped":
      return <OrderShippedEmailEditor initialSubject={t.subject} initialMessage={t.message} />;
    case "restock":
      return <RestockEmailEditor initialSubject={t.subject} initialMessage={t.message} />;
    case "welcome":
      return <WelcomeEmailEditor initialSubject={t.subject} initialMessage={t.message} />;
    case "print_request_confirmation":
      return (
        <PrintRequestConfirmationEditor initialSubject={t.subject} initialMessage={t.message} />
      );
    case "contact_confirmation_general":
      return (
        <ContactConfirmationEditor
          templateKey={t.key}
          heading="Contact form — General Enquiry"
          helpText="Sent when the contact form is submitted as General Enquiry, or Collab (that option reuses this copy too, tagged Inquiry rather than Collab). Use {{firstName}} anywhere below. No poll — this one doesn't give a specific answer, just sets expectations."
          initialSubject={t.subject}
          initialMessage={t.message}
        />
      );
    case "contact_confirmation_order_status":
      return (
        <OrderStatusConfirmationEditor
          initialFoundSubject={t.subject}
          initialFoundMessage={t.message}
          initialNotFoundSubject={t.notFoundSubject ?? ""}
          initialNotFoundMessage={t.notFoundMessage ?? ""}
        />
      );
    case "contact_confirmation_returns":
      return (
        <ContactConfirmationEditor
          templateKey={t.key}
          heading="Contact form — Returns & Exchanges"
          helpText="Sent when the contact form is submitted as Returns & Exchanges."
          initialSubject={t.subject}
          initialMessage={t.message}
        />
      );
    case "collab_confirmation":
      return <CollabConfirmationEditor initialSubject={t.subject} initialMessage={t.message} />;
    case "abandoned_checkout":
      return (
        <AbandonedCheckoutEmailEditor
          initialReminderSubject={t.subject}
          initialReminderMessage={t.message}
          initialReminderActive={t.active ?? true}
          initialReminderDelayMinutes={t.delayMinutes ?? 60}
          initialEmotionalSubject={t.emotionalSubject ?? ""}
          initialEmotionalMessage={t.emotionalMessage ?? ""}
          initialEmotionalActive={t.emotionalActive ?? true}
          initialEmotionalDelayMinutes={t.emotionalDelayMinutes ?? 1440}
          initialFinalSubject={t.finalSubject ?? ""}
          initialFinalMessage={t.finalMessage ?? ""}
          initialFinalActive={t.finalActive ?? true}
          initialFinalDelayMinutes={t.finalDelayMinutes ?? 4320}
          recoveredCount={t.recoveredCount ?? 0}
          recoveredRevenueCents={t.recoveredRevenueCents ?? 0}
          recoveryCurrency={t.recoveryCurrency ?? "USD"}
          recoveredOrders={t.recoveredOrders ?? []}
        />
      );
    default:
      return null;
  }
}

export function EmailTemplatesTable({ templates }: { templates: EmailTemplateRow[] }) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<EmailTag | "all">("all");

  const filtered = tagFilter === "all" ? templates : templates.filter((t) => t.tag === tagFilter);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {(["all", ...EMAIL_TAGS] as (EmailTag | "all")[]).map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setTagFilter(tag)}
            className={`rounded-full px-3 py-1 text-xs font-medium hover:opacity-80 ${
              tagFilter === tag ? "bg-foreground text-background" : "bg-border/40"
            }`}
          >
            {tag === "all" ? "All" : TAG_LABELS[tag]}
          </button>
        ))}
      </div>
      <div className="w-full overflow-x-auto rounded-xl border border-border bg-background">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-border/20 text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="whitespace-nowrap py-2 pl-5 pr-7 text-left">Name</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Tag</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Sent to</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Trigger</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Status</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Performance</th>
              <th className="whitespace-nowrap py-2 pr-6 text-left" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((t) => {
              const expanded = expandedKey === t.key;
              return (
                <Fragment key={t.key}>
                  <tr
                    onClick={() => setExpandedKey(expanded ? null : t.key)}
                    className={`cursor-pointer hover:bg-border/10 ${expanded ? "bg-border/10" : ""}`}
                  >
                    <td className="whitespace-nowrap py-3 pl-5 pr-7 text-sm font-semibold">
                      {t.name}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-xs">
                      <Tag tag={t.tag} />
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-xs">
                      <SentTo sentTo={t.sentTo} />
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-sm text-muted">{t.trigger}</td>
                    <td className="whitespace-nowrap py-3 pr-7 text-xs">
                      <StatusBadge active={t.isAutomation ? (t.active ?? true) : true} />
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">
                      <div className="flex items-center gap-5">
                        <span className="flex w-10 items-center gap-1.5" title="Sent">
                          <MailIcon />
                          {t.sent}
                        </span>
                        <span className="flex w-10 items-center gap-1.5" title="Open rate">
                          <MailOpenIcon />
                          {pct(t.opened, t.sent)}
                        </span>
                        <span className="flex w-10 items-center gap-1.5" title="Click rate">
                          <ClickIcon />
                          {pct(t.clicked, t.sent)}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-6 text-xs">
                      <span className="font-semibold underline underline-offset-2">
                        {expanded ? "Close" : t.editable ? "Edit" : "Info"}
                      </span>
                    </td>
                  </tr>
                  {expanded && (
                    <tr>
                      <td colSpan={7} className="bg-border/5 p-4">
                        {renderEditor(t)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
