import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { prisma } from "@/lib/db";

// Fills in EmailLog's delivered/opened/clicked/bounced timestamps as Resend
// reports them — capture only, nothing reads this yet. Configure this URL
// as a webhook in the Resend dashboard once deployed, and set
// RESEND_WEBHOOK_SECRET to the signing secret it gives you.
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
