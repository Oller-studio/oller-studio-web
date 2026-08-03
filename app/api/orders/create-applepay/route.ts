import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { createOrder, type ShippingAddressInput } from "@/lib/paypal";
import { classifyDevice } from "@/lib/device";

type CreateApplePayOrderBody = {
  currency: string;
  items: { slug: string; name: string; price: number; quantity: number }[];
  shipping?: ShippingAddressInput;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CreateApplePayOrderBody;

  if (!body.currency || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ ok: false, reason: "invalid body" }, { status: 400 });
  }

  const paypalOrderId = await createOrder(body.currency, body.items, body.shipping);
  const amountCents = body.items.reduce(
    (sum, i) => sum + Math.round(i.price * 100) * i.quantity,
    0
  );
  const cookieStore = await cookies();
  const source = cookieStore.get("oller_src")?.value ?? null;
  const channel = cookieStore.get("oller_chan")?.value ?? null;
  const device = classifyDevice(request.headers.get("user-agent"));

  // Same "record before payment" pattern as the regular PayPal button's
  // /api/orders/start — lets the admin see this as an abandoned checkout if
  // the Apple Pay sheet gets dismissed before payment completes.
  await prisma.order.create({
    data: {
      paypalOrderId,
      status: "PENDING",
      amountCents,
      currency: body.currency,
      source,
      channel,
      device,
      // Known for certain here — no need to wait for the webhook's
      // payment_source parse, though that will confirm/overwrite it too.
      paymentMethod: "Apple Pay",
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

  return NextResponse.json({ ok: true, orderId: paypalOrderId });
}
