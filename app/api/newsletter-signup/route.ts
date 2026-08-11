import { NextResponse } from "next/server";
import { sendNewsletterSignup } from "@/lib/resend";
import { isRateLimited, clientIp } from "@/lib/rateLimit";
import { upsertSubscriber } from "@/lib/subscribers";

export async function POST(request: Request) {
  if (isRateLimited(`newsletter:${clientIp(request.headers)}`, 5, 60_000)) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
  }

  await upsertSubscriber(email);

  // Best-effort internal notification — the signup itself is already saved
  // above regardless of whether this send succeeds.
  await sendNewsletterSignup(email);

  return NextResponse.json({ ok: true });
}
