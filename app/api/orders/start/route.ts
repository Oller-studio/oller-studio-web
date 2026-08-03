import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

type StartOrderBody = {
  paypalOrderId: string;
  currency: string;
  items: { slug: string; name: string; price: number; quantity: number }[];
  payerEmail?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as StartOrderBody;

  if (!body.paypalOrderId || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ ok: false, reason: "invalid body" }, { status: 400 });
  }

  const amountCents = body.items.reduce(
    (sum, i) => sum + Math.round(i.price * 100) * i.quantity,
    0
  );
  const source = (await cookies()).get("oller_src")?.value ?? null;

  // If they're signed in, we already know their email before payment even
  // starts — no reason to wait for PayPal to hand it back. Lets a signed-in
  // customer's abandoned cart still be recoverable, unlike a guest's.
  const user = await currentUser();
  const payerEmail = user?.primaryEmailAddress?.emailAddress ?? body.payerEmail ?? null;

  await prisma.order.create({
    data: {
      paypalOrderId: body.paypalOrderId,
      status: "PENDING",
      amountCents,
      currency: body.currency,
      source,
      payerEmail,
      items: {
        create: body.items.map((i) => ({
          colorwaySlug: i.slug,
          name: i.name,
          quantity: i.quantity,
          unitAmountCents: Math.round(i.price * 100),
        })),
      },
    },
  });

  return NextResponse.json({ ok: true });
}
