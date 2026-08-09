import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Body = {
  email: string;
  items: { slug: string; name: string; price: number; quantity: number }[];
  currency: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Fired best-effort from CheckoutForm once the buyer's email looks valid —
// well before they click a payment button, which is the only thing that
// creates a real Order row today. Without this, anyone who fills in their
// email/address but never clicks pay is invisible to us, with zero way to
// follow up. Upserted by email so re-typing the same address (or coming
// back later with the same cart) doesn't pile up duplicate rows.
export async function POST(request: Request) {
  const body = (await request.json()) as Body;

  if (!isValidEmail(body.email) || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await prisma.checkoutLead.upsert({
    where: { email: body.email },
    create: {
      email: body.email,
      items: JSON.stringify(body.items),
      currency: body.currency,
    },
    update: {
      items: JSON.stringify(body.items),
      currency: body.currency,
    },
  });

  return NextResponse.json({ ok: true });
}
