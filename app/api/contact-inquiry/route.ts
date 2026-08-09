import { NextResponse } from "next/server";
import { sendContactInquiry, sendContactConfirmation } from "@/lib/resend";
import { isRateLimited, clientIp } from "@/lib/rateLimit";
import { prisma } from "@/lib/db";
import { defaultTagFor } from "@/lib/inquiries";

export async function POST(request: Request) {
  if (isRateLimited(`contact:${clientIp(request.headers)}`, 5, 60_000)) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  const { firstName, lastName, email, subject, message } = await request.json();

  if (
    !firstName ||
    typeof firstName !== "string" ||
    !lastName ||
    typeof lastName !== "string" ||
    !email ||
    typeof email !== "string" ||
    !subject ||
    typeof subject !== "string" ||
    !message ||
    typeof message !== "string"
  ) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }

  const sent = await sendContactInquiry(firstName, lastName, email, subject, message);
  if (!sent) {
    return NextResponse.json({ ok: false, error: "Failed to send" }, { status: 500 });
  }

  const inquiry = await prisma.inquiry.create({
    data: { kind: "contact", firstName, lastName, email, subject, message, tag: defaultTagFor("contact", subject) },
  });

  await sendContactConfirmation(firstName, email, subject, inquiry.id);

  return NextResponse.json({ ok: true });
}
