import { prisma } from "@/lib/db";

export const RESTOCK_TEMPLATE_KEY = "restock";

export const DEFAULT_RESTOCK_SUBJECT = "{{product}} — {{color}} is available for you";
export const DEFAULT_RESTOCK_MESSAGE =
  "Hi {{firstName}}, the piece you were waiting for is now available. This link lets you complete the purchase:";

export const ORDER_CONFIRMATION_TEMPLATE_KEY = "order_confirmation";

export const DEFAULT_ORDER_CONFIRMATION_SUBJECT = "Your OLLER order is confirmed";
export const DEFAULT_ORDER_CONFIRMATION_MESSAGE =
  "Hi {{firstName}}, thank you for your order. Your {{pieceWord}} {{pieceVerb}} now being prepared, and we'll keep you updated as {{pieceSubject}} move{{pieceVerbSuffix}} through each stage of the journey.";

export const ORDER_SHIPPED_TEMPLATE_KEY = "order_shipped";

export const DEFAULT_ORDER_SHIPPED_SUBJECT = "Your OLLER order has shipped";
export const DEFAULT_ORDER_SHIPPED_MESSAGE =
  "Hi {{firstName}}, your order has been shipped and is now on its way to you.";

// Three-email sequence — Reminder (~60min), Emotional Reminder (~24h),
// Final Reminder (~72h, optional). Every step's own query always excludes
// completed orders, so the sequence stops on its own the moment someone
// buys — nothing extra to check.
export const ABANDONED_CHECKOUT_TEMPLATE_KEY = "abandoned_checkout";

export const DEFAULT_ABANDONED_CHECKOUT_SUBJECT = "Your OLLER piece is still waiting for you";
export const DEFAULT_ABANDONED_CHECKOUT_MESSAGE =
  "Hi {{firstName}}, your OLLER {{pieceWord}} {{pieceVerb}} still waiting for you. The {{pieceWord}} you selected {{pieceVerb}} still saved in your cart. If {{pieceSubject}} caught your eye, now is the time to make {{pieceObject}} yours.";
export const DEFAULT_ABANDONED_CHECKOUT_DELAY_MINUTES = 60;

export const ABANDONED_CHECKOUT_EMOTIONAL_TEMPLATE_KEY = "abandoned_checkout_emotional";

export const DEFAULT_ABANDONED_CHECKOUT_EMOTIONAL_SUBJECT = "Still thinking about it?";
export const DEFAULT_ABANDONED_CHECKOUT_EMOTIONAL_MESSAGE =
  "Hi {{firstName}}, still thinking about your OLLER {{pieceWord}}? Every OLLER piece begins as an obsession — a form imagined digitally and brought to life layer by layer. Your {{pieceWord}} {{pieceVerb}} still waiting for you.";
export const DEFAULT_ABANDONED_CHECKOUT_EMOTIONAL_DELAY_MINUTES = 1440;

export const ABANDONED_CHECKOUT_FINAL_TEMPLATE_KEY = "abandoned_checkout_final";

export const DEFAULT_ABANDONED_CHECKOUT_FINAL_SUBJECT = "Your OLLER selection is still waiting";
export const DEFAULT_ABANDONED_CHECKOUT_FINAL_MESSAGE =
  "Hi {{firstName}}, a final reminder that your OLLER {{pieceWord}} {{pieceVerb}} still waiting. If {{pieceSubject}} made you look twice, {{pieceSubject}} might be worth bringing home.";
export const DEFAULT_ABANDONED_CHECKOUT_FINAL_DELAY_MINUTES = 4320;

export const WELCOME_TEMPLATE_KEY = "welcome";

export const DEFAULT_WELCOME_SUBJECT = "Welcome to OLLER!";
export const DEFAULT_WELCOME_MESSAGE =
  "Hi {{firstName}}, welcome to OLLER. Your account is ready — from here you can follow each piece as it's made, revisit your favorites, and check out faster next time you're back.";

export const PRINT_REQUEST_CONFIRMATION_TEMPLATE_KEY = "print_request_confirmation";

export const DEFAULT_PRINT_REQUEST_CONFIRMATION_SUBJECT =
  "We've received your request for {{product}} — {{color}}";
export const DEFAULT_PRINT_REQUEST_CONFIRMATION_MESSAGE =
  "Hi {{firstName}}, thanks for reaching out about {{product}} — {{color}}. Our team is reviewing whether we can print you one — we'll be in touch soon.";

// These four are internal notifications (to hello@oller.studio, not the
// customer) built from structured form fields, not free copy — listed here
// for visibility/stats only, no editor (see EmailTemplatesTable).
export const CONTACT_INQUIRY_TEMPLATE_KEY = "contact_inquiry";
export const COLLAB_INQUIRY_TEMPLATE_KEY = "collab_inquiry";
export const NEWSLETTER_SIGNUP_TEMPLATE_KEY = "newsletter_signup";
export const PRINT_REQUEST_INTERNAL_TEMPLATE_KEY = "print_request_internal";

// Split into one template per Contact Form subject (General Enquiry / Order
// Status / Returns & Exchanges) instead of one shared template with a
// hidden "preview as" switch — easier to see and edit each variant on its
// own. "Collab" (the 4th subject option) reuses the General template and is
// tagged inquiry, not collab — it's still a Contact Form submission; the
// warmer collab_confirmation copy is reserved for the dedicated
// Collab-with-us form.
export const CONTACT_CONFIRMATION_GENERAL_TEMPLATE_KEY = "contact_confirmation_general";

export const DEFAULT_CONTACT_CONFIRMATION_GENERAL_SUBJECT = "We've received your message";
export const DEFAULT_CONTACT_CONFIRMATION_GENERAL_MESSAGE =
  "Hello {{firstName}}, thank you for getting in touch. Our customer care team is currently experiencing a high volume of enquiries during this busy period. Please allow 48 hrs for a response, and kindly check your spam or junk folder in case our reply is directed there. To avoid further delays, please note that sending multiple emails can create duplicate tickets and move your request down the queue. We truly appreciate your patience.";

// Order Status and Returns & Exchanges both get their actual answer
// appended below the message automatically (live order status, or the
// return policy) — and both get the "did this answer your question?" poll,
// since they're the two subjects where a real answer is actually given.
export const CONTACT_CONFIRMATION_ORDER_STATUS_TEMPLATE_KEY = "contact_confirmation_order_status";

export const DEFAULT_CONTACT_CONFIRMATION_ORDER_STATUS_SUBJECT =
  "Here's your order status";
export const DEFAULT_CONTACT_CONFIRMATION_ORDER_STATUS_MESSAGE =
  "Hi {{firstName}}, thanks for reaching out about your order.";

// Not its own row in the table — it's the fallback copy for the same
// Order Status trigger, used when the email on the contact form doesn't
// match any order (it never asks for an order number). Edited alongside
// the main Order Status template in the same editor card.
export const CONTACT_CONFIRMATION_ORDER_STATUS_NOT_FOUND_TEMPLATE_KEY =
  "contact_confirmation_order_status_not_found";

export const DEFAULT_CONTACT_CONFIRMATION_ORDER_STATUS_NOT_FOUND_SUBJECT =
  "We couldn't find your order";
export const DEFAULT_CONTACT_CONFIRMATION_ORDER_STATUS_NOT_FOUND_MESSAGE =
  "Hi {{firstName}}, thanks for reaching out about your order — we couldn't find one under this email. Reply and let us know your order number (or the email you used to pay) and we'll take a look.";

export const CONTACT_CONFIRMATION_RETURNS_TEMPLATE_KEY = "contact_confirmation_returns";

export const DEFAULT_CONTACT_CONFIRMATION_RETURNS_SUBJECT =
  "Here's our returns & exchanges policy";
export const DEFAULT_CONTACT_CONFIRMATION_RETURNS_MESSAGE =
  "Hi {{firstName}}, thanks for reaching out about returns and exchanges — here's our policy:";

export const COLLAB_CONFIRMATION_TEMPLATE_KEY = "collab_confirmation";

export const DEFAULT_COLLAB_CONFIRMATION_SUBJECT = "Thanks for reaching out";
export const DEFAULT_COLLAB_CONFIRMATION_MESSAGE =
  "Hi {{firstName}}, we're excited to take a look at your proposal — our team will review it and get back to you as soon as possible.";

const DEFAULTS: Record<
  string,
  { subject: string; message: string; active?: boolean; delayMinutes?: number }
> = {
  [RESTOCK_TEMPLATE_KEY]: { subject: DEFAULT_RESTOCK_SUBJECT, message: DEFAULT_RESTOCK_MESSAGE },
  [ORDER_CONFIRMATION_TEMPLATE_KEY]: {
    subject: DEFAULT_ORDER_CONFIRMATION_SUBJECT,
    message: DEFAULT_ORDER_CONFIRMATION_MESSAGE,
  },
  [ORDER_SHIPPED_TEMPLATE_KEY]: {
    subject: DEFAULT_ORDER_SHIPPED_SUBJECT,
    message: DEFAULT_ORDER_SHIPPED_MESSAGE,
  },
  [ABANDONED_CHECKOUT_TEMPLATE_KEY]: {
    subject: DEFAULT_ABANDONED_CHECKOUT_SUBJECT,
    message: DEFAULT_ABANDONED_CHECKOUT_MESSAGE,
    active: true,
    delayMinutes: DEFAULT_ABANDONED_CHECKOUT_DELAY_MINUTES,
  },
  [ABANDONED_CHECKOUT_EMOTIONAL_TEMPLATE_KEY]: {
    subject: DEFAULT_ABANDONED_CHECKOUT_EMOTIONAL_SUBJECT,
    message: DEFAULT_ABANDONED_CHECKOUT_EMOTIONAL_MESSAGE,
    active: true,
    delayMinutes: DEFAULT_ABANDONED_CHECKOUT_EMOTIONAL_DELAY_MINUTES,
  },
  [ABANDONED_CHECKOUT_FINAL_TEMPLATE_KEY]: {
    subject: DEFAULT_ABANDONED_CHECKOUT_FINAL_SUBJECT,
    message: DEFAULT_ABANDONED_CHECKOUT_FINAL_MESSAGE,
    active: true,
    delayMinutes: DEFAULT_ABANDONED_CHECKOUT_FINAL_DELAY_MINUTES,
  },
  [WELCOME_TEMPLATE_KEY]: { subject: DEFAULT_WELCOME_SUBJECT, message: DEFAULT_WELCOME_MESSAGE },
  [PRINT_REQUEST_CONFIRMATION_TEMPLATE_KEY]: {
    subject: DEFAULT_PRINT_REQUEST_CONFIRMATION_SUBJECT,
    message: DEFAULT_PRINT_REQUEST_CONFIRMATION_MESSAGE,
  },
  [CONTACT_CONFIRMATION_GENERAL_TEMPLATE_KEY]: {
    subject: DEFAULT_CONTACT_CONFIRMATION_GENERAL_SUBJECT,
    message: DEFAULT_CONTACT_CONFIRMATION_GENERAL_MESSAGE,
  },
  [CONTACT_CONFIRMATION_ORDER_STATUS_TEMPLATE_KEY]: {
    subject: DEFAULT_CONTACT_CONFIRMATION_ORDER_STATUS_SUBJECT,
    message: DEFAULT_CONTACT_CONFIRMATION_ORDER_STATUS_MESSAGE,
  },
  [CONTACT_CONFIRMATION_ORDER_STATUS_NOT_FOUND_TEMPLATE_KEY]: {
    subject: DEFAULT_CONTACT_CONFIRMATION_ORDER_STATUS_NOT_FOUND_SUBJECT,
    message: DEFAULT_CONTACT_CONFIRMATION_ORDER_STATUS_NOT_FOUND_MESSAGE,
  },
  [CONTACT_CONFIRMATION_RETURNS_TEMPLATE_KEY]: {
    subject: DEFAULT_CONTACT_CONFIRMATION_RETURNS_SUBJECT,
    message: DEFAULT_CONTACT_CONFIRMATION_RETURNS_MESSAGE,
  },
  [COLLAB_CONFIRMATION_TEMPLATE_KEY]: {
    subject: DEFAULT_COLLAB_CONFIRMATION_SUBJECT,
    message: DEFAULT_COLLAB_CONFIRMATION_MESSAGE,
  },
};

// Drives the /admin/marketing/emails table — one row per template. Only
// abandonedCheckout-style, time-delayed automations show the Active toggle
// and delay field; instant, event-triggered emails don't need them.
// `editable: false` rows (the 4 internal notifications) show stats but no
// editor — their content is structured form fields, not freeform copy.
// `tag` powers the filter — a business/lifecycle label (what this email
// means for the customer relationship), not a technical one. `sentTo`
// drives its own column so a customer-facing/internal pair reads at a
// glance instead of needing the trigger sentence spelled out.
export const EMAIL_TAGS = [
  "purchase",
  "restock",
  "abandoned_checkout",
  "interest",
  "account",
  "inquiry",
] as const;
export type EmailTag = (typeof EMAIL_TAGS)[number];

export const EMAIL_TEMPLATES = [
  {
    key: ORDER_CONFIRMATION_TEMPLATE_KEY,
    name: "Order confirmation",
    trigger: "When a payment is confirmed",
    isAutomation: false,
    editable: true,
    tag: "purchase",
    sentTo: "customer",
  },
  {
    key: ORDER_SHIPPED_TEMPLATE_KEY,
    name: "Order shipped",
    trigger: "When you mark an order Sent in Production",
    isAutomation: false,
    editable: true,
    tag: "purchase",
    sentTo: "customer",
  },
  {
    key: RESTOCK_TEMPLATE_KEY,
    name: "Restock",
    trigger: "When a waitlisted color becomes available — or manually from Waitlist",
    isAutomation: false,
    editable: true,
    tag: "restock",
    sentTo: "customer",
  },
  {
    // One row for all 3 steps (Reminder / Emotional Reminder / Final
    // Reminder) — edited side by side in the same card, same reasoning as
    // Order Status's found/not-found split. The emotional/final keys aren't
    // their own rows; page.tsx fetches them and attaches them to this one.
    key: ABANDONED_CHECKOUT_TEMPLATE_KEY,
    name: "Abandoned checkout",
    trigger: "N minutes after a cart is abandoned, in up to 3 steps",
    isAutomation: true,
    editable: true,
    tag: "abandoned_checkout",
    sentTo: "customer",
  },
  {
    key: WELCOME_TEMPLATE_KEY,
    name: "Welcome",
    trigger: "When a customer creates an account",
    isAutomation: false,
    editable: true,
    tag: "account",
    sentTo: "customer",
  },
  {
    key: PRINT_REQUEST_CONFIRMATION_TEMPLATE_KEY,
    name: "Print request confirmation",
    trigger: "When someone requests a sold-out piece",
    isAutomation: false,
    editable: true,
    tag: "interest",
    sentTo: "customer",
  },
  {
    key: CONTACT_CONFIRMATION_GENERAL_TEMPLATE_KEY,
    name: "Contact form — General Enquiry",
    trigger: "When the contact form is submitted as General Enquiry (or Collab)",
    isAutomation: false,
    editable: true,
    tag: "inquiry",
    sentTo: "customer",
  },
  {
    key: CONTACT_CONFIRMATION_ORDER_STATUS_TEMPLATE_KEY,
    name: "Contact form — Order Status",
    trigger: "When the contact form is submitted as Order Status",
    isAutomation: false,
    editable: true,
    tag: "inquiry",
    sentTo: "customer",
  },
  {
    key: CONTACT_CONFIRMATION_RETURNS_TEMPLATE_KEY,
    name: "Contact form — Returns & Exchanges",
    trigger: "When the contact form is submitted as Returns & Exchanges",
    isAutomation: false,
    editable: true,
    tag: "inquiry",
    sentTo: "customer",
  },
  {
    key: COLLAB_CONFIRMATION_TEMPLATE_KEY,
    name: "Collab confirmation",
    trigger: "When the Collab-with-us form is submitted",
    isAutomation: false,
    editable: true,
    tag: "inquiry",
    sentTo: "customer",
  },
  {
    key: CONTACT_INQUIRY_TEMPLATE_KEY,
    name: "Contact form",
    trigger: "When the contact form is submitted",
    isAutomation: false,
    editable: false,
    tag: "inquiry",
    sentTo: "team",
  },
  {
    key: COLLAB_INQUIRY_TEMPLATE_KEY,
    name: "Collab inquiry",
    trigger: "When the Collab-with-us form is submitted",
    isAutomation: false,
    editable: false,
    tag: "inquiry",
    sentTo: "team",
  },
  {
    key: PRINT_REQUEST_INTERNAL_TEMPLATE_KEY,
    name: "Print request (internal)",
    trigger: "When someone requests a sold-out piece",
    isAutomation: false,
    editable: false,
    tag: "interest",
    sentTo: "team",
  },
] as const satisfies readonly {
  key: string;
  name: string;
  trigger: string;
  isAutomation: boolean;
  editable: boolean;
  tag: EmailTag;
  sentTo: "customer" | "team";
}[];

export async function getEmailTemplate(key: string) {
  const row = await prisma.emailTemplate.findUnique({ where: { key } });
  const fallback = DEFAULTS[key] ?? { subject: "", message: "" };
  if (!row) return fallback;
  return {
    subject: row.subject,
    message: row.message,
    active: row.active ?? fallback.active,
    delayMinutes: row.delayMinutes ?? fallback.delayMinutes,
  };
}

export async function saveEmailTemplate(
  key: string,
  subject: string,
  message: string,
  extra?: { active?: boolean; delayMinutes?: number }
) {
  await prisma.emailTemplate.upsert({
    where: { key },
    update: { subject, message, ...extra },
    create: { key, subject, message, ...extra },
  });
}

export function fillTemplate(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? "");
}

// Singular/plural grammar vars for messages that mention cart/order items.
// {{pieceWord}} "piece"/"pieces", {{pieceVerb}} "is"/"are",
// {{pieceSubject}}/{{pieceObject}} "it"/"they"/"them",
// {{pieceVerbSuffix}} "s"/"" for a verb conjugated with a singular subject
// noun (e.g. "move{{pieceVerbSuffix}}" -> "moves" / "move").
export function pieceVars(count: number) {
  const plural = count !== 1;
  return {
    pieceWord: plural ? "pieces" : "piece",
    pieceVerb: plural ? "are" : "is",
    pieceSubject: plural ? "they" : "it",
    pieceObject: plural ? "them" : "it",
    pieceVerbSuffix: plural ? "" : "s",
  };
}
