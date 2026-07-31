import { NextResponse } from "next/server";
import { sendCollabInquiry } from "@/lib/resend";
import { isRateLimited, clientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (isRateLimited(`collab:${clientIp(request.headers)}`, 5, 60_000)) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  const { firstName, lastName, email, phone, message } = await request.json();

  if (
    !firstName ||
    typeof firstName !== "string" ||
    !lastName ||
    typeof lastName !== "string" ||
    !email ||
    typeof email !== "string" ||
    !message ||
    typeof message !== "string"
  ) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }

  const sent = await sendCollabInquiry(firstName, lastName, email, phone, message);
  if (!sent) {
    return NextResponse.json({ ok: false, error: "Failed to send" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
