import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addToWaitlist } from "@/lib/waitlist";
import { isRateLimited, clientIp } from "@/lib/rateLimit";
import { sendPrintRequestConfirmation, sendPrintRequestInquiry } from "@/lib/resend";

export async function POST(request: Request) {
  if (isRateLimited(`waitlist:${clientIp(request.headers)}`, 5, 60_000)) {
    return NextResponse.json({ ok: false, reason: "Too many requests" }, { status: 429 });
  }

  const { slug, email, firstName, kind } = (await request.json().catch(() => null)) ?? {};

  if (!slug || typeof slug !== "string" || !email || typeof email !== "string") {
    return NextResponse.json({ ok: false, reason: "Missing slug or email" }, { status: 400 });
  }
  const trimmedFirstName = typeof firstName === "string" ? firstName.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, reason: "Invalid email" }, { status: 400 });
  }
  const entryKind = kind === "print_request" ? "print_request" : "notify";

  const colorway = await prisma.colorway.findUnique({
    where: { slug },
    include: { product: true },
  });
  if (!colorway) {
    return NextResponse.json({ ok: false, reason: "Color not found" }, { status: 404 });
  }

  await addToWaitlist({
    colorwaySlug: colorway.slug,
    colorName: colorway.name,
    productName: colorway.product.name,
    email,
    firstName: trimmedFirstName || undefined,
    kind: entryKind,
  });

  if (entryKind === "print_request") {
    const image = (JSON.parse(colorway.images) as string[])[0] ?? null;
    await sendPrintRequestConfirmation(
      email,
      colorway.product.name,
      colorway.name,
      image,
      trimmedFirstName || undefined,
    );
    await sendPrintRequestInquiry(colorway.product.name, colorway.name, email);
  }

  return NextResponse.json({ ok: true });
}
