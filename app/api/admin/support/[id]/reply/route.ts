import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { sendSupportReply } from "@/lib/resend";
import { addSupportMessage } from "@/lib/inquiries";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { id } = await params;
  const json = (await request.json().catch(() => null)) as { body?: string } | null;
  const body = json?.body;
  if (!body?.trim()) {
    return NextResponse.json({ ok: false, reason: "missing body" }, { status: 400 });
  }

  const inquiry = await prisma.inquiry.findUnique({ where: { id } });
  if (!inquiry) {
    return NextResponse.json({ ok: false, reason: "not found" }, { status: 404 });
  }

  const subject = inquiry.subject ? `Re: ${inquiry.subject}` : "Re: your message to OLLER";
  const resendId = await sendSupportReply(inquiry.email, subject, body);
  if (!resendId) {
    return NextResponse.json({ ok: false, reason: "send failed" }, { status: 502 });
  }

  const message = await addSupportMessage({
    inquiryId: inquiry.id,
    direction: "outbound",
    fromEmail: "hello@oller.studio",
    subject,
    body,
    resendId,
  });

  return NextResponse.json({ ok: true, message });
}
