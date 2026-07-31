import { NextResponse } from "next/server";
import { sendNewsletterSignup } from "@/lib/resend";
import { isRateLimited, clientIp } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (isRateLimited(`newsletter:${clientIp(request.headers)}`, 5, 60_000)) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
  }

  const sent = await sendNewsletterSignup(email);
  if (!sent) {
    return NextResponse.json({ ok: false, error: "Failed to send" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
