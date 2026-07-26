import { NextResponse } from "next/server";
import { sendNewsletterSignup } from "@/lib/resend";

export async function POST(request: Request) {
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
