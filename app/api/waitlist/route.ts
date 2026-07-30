import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addToWaitlist } from "@/lib/waitlist";

export async function POST(request: Request) {
  const { slug, email } = (await request.json().catch(() => null)) ?? {};

  if (!slug || typeof slug !== "string" || !email || typeof email !== "string") {
    return NextResponse.json({ ok: false, reason: "Missing slug or email" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, reason: "Invalid email" }, { status: 400 });
  }

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
  });

  return NextResponse.json({ ok: true });
}
