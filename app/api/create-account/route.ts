import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ ok: false, error: "Clerk not configured" }, { status: 500 });
  }

  const { email, firstName, lastName } = await request.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
  }

  const response = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: [email],
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      skip_password_requirement: true,
      skip_password_checks: true,
    }),
  });

  if (response.ok) {
    return NextResponse.json({ ok: true, created: true });
  }

  const body = await response.json().catch(() => null);
  const alreadyExists = body?.errors?.some(
    (e: { code?: string }) => e.code === "form_identifier_exists",
  );
  if (alreadyExists) {
    // Account already exists for this email — nothing to do, buyer can just log in.
    return NextResponse.json({ ok: true, created: false });
  }

  return NextResponse.json({ ok: false, error: body }, { status: 500 });
}
