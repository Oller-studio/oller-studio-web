import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { sendNewsletterCampaign } from "@/lib/resend";
import { getActiveSubscribers } from "@/lib/subscribers";

export async function POST(request: Request) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const json = (await request.json().catch(() => null)) as
    | { subject?: string; message?: string }
    | null;
  const subject = json?.subject?.trim();
  const message = json?.message?.trim();
  if (!subject || !message) {
    return NextResponse.json({ ok: false, reason: "missing subject or message" }, { status: 400 });
  }

  const subscribers = await getActiveSubscribers();
  if (subscribers.length === 0) {
    return NextResponse.json({ ok: false, reason: "no active subscribers" }, { status: 400 });
  }

  const result = await sendNewsletterCampaign(subscribers, subject, message);
  return NextResponse.json({ ok: true, ...result });
}
