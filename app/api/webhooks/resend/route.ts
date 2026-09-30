import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { prisma } from "@/lib/db";
import {
  findMostRecentInquiryByEmail,
  createInquiryFromEmail,
  addSupportMessage,
  isBlocked,
} from "@/lib/inquiries";
import { wasRecentNewsletterRecipient } from "@/lib/emailLog";

// Splits "Jane Doe <jane@example.com>" into name + address — Resend's
// inbound `from` field is a raw header value, not pre-parsed.
function parseFromHeader(from: string): { name: string | null; email: string } {
  const match = from.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    const name = match[1].trim().replace(/^"|"$/g, "");
    return { name: name || null, email: match[2].trim() };
  }
  return { name: null, email: from.trim() };
}

// Fills in EmailLog's delivered/opened/clicked/bounced timestamps as Resend
// reports them, and records inbound replies to hello@oller.studio into the
// matching Support ticket (or opens a new one). Configure this URL as a
// webhook in the Resend dashboard once deployed, subscribed to the delivery
// events plus "email.received", and set RESEND_WEBHOOK_SECRET to the
// signing secret it gives you.
export async function POST(request: Request) {
  if (!resend || !process.env.RESEND_WEBHOOK_SECRET) {
    return NextResponse.json({ received: false, reason: "not configured" }, { status: 501 });
  }

  const payload = await request.text();

  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
    });
  } catch {
    return NextResponse.json({ received: false, reason: "invalid signature" }, { status: 400 });
  }

  if (event.type === "email.received") {
    const emailId = event.data.email_id;

    // Fetch the actual body — the webhook payload is metadata-only.
    const { data: full } = await resend.emails.receiving.get(emailId);
    if (!full) {
      return NextResponse.json({ received: true, ignored: "could not fetch body" });
    }

    const { name: fromName, email: fromEmail } = parseFromHeader(full.from);
    const body = full.text ?? full.html ?? "";

    // Our own automated notifications (print requests, newsletter signups)
    // are sent hello@oller.studio -> hello@oller.studio — without this,
    // they'd loop back through inbound receiving and create a fake ticket
    // "from" ourselves.
    if (fromEmail.toLowerCase() === "hello@oller.studio") {
      return NextResponse.json({ received: true, ignored: "self-sent" });
    }

    const existing = await findMostRecentInquiryByEmail(fromEmail);
    const inquiry =
      existing ??
      (await createInquiryFromEmail({
        fromEmail,
        fromName,
        subject: full.subject,
        body,
        // Blocklist wins over "looks like a newsletter reply" — a blocked
        // sender is still spam even if they were also sent a campaign.
        tag: (await isBlocked(fromEmail))
          ? "spam"
          : (await wasRecentNewsletterRecipient(fromEmail))
            ? "newsletter"
            : null,
      }));

    // The very first message on a brand-new ticket is already captured as
    // the Inquiry's own fields above — only log it as a thread message too
    // when it landed on an existing (older) ticket, so a fresh ticket
    // doesn't show the same message twice.
    if (existing) {
      await addSupportMessage({
        inquiryId: inquiry.id,
        direction: "inbound",
        fromEmail,
        fromName,
        subject: full.subject,
        body,
        resendId: emailId,
      }).catch(() => {});
    }

    return NextResponse.json({ received: true });
  }

  const emailId = "email_id" in event.data ? event.data.email_id : undefined;
  if (!emailId) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const field =
    event.type === "email.delivered"
      ? "deliveredAt"
      : event.type === "email.opened"
        ? "openedAt"
        : event.type === "email.clicked"
          ? "clickedAt"
          : event.type === "email.bounced"
            ? "bouncedAt"
            : null;

  if (field) {
    await prisma.emailLog
      .update({ where: { resendId: emailId }, data: { [field]: new Date() } })
      .catch(() => {});
  }

  return NextResponse.json({ received: true });
}
