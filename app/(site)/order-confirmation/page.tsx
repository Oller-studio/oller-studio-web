import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getColorwayBySlug } from "@/lib/colorways";
import { formatOrderNumber, formatPrice } from "@/lib/format";
import { site } from "@/content/site";
import { OrderConfirmationExtras } from "@/components/cart/OrderConfirmationExtras";

export const metadata = {
  title: "Order Confirmed",
};

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: paypalOrderId } = await searchParams;

  const order = paypalOrderId
    ? await prisma.order.findUnique({
        where: { paypalOrderId },
        include: { items: true },
      })
    : null;

  const itemsWithImages = order
    ? await Promise.all(
        order.items.map(async (item) => ({
          ...item,
          image: (await getColorwayBySlug(item.colorwaySlug))?.images[0] ?? null,
        }))
      )
    : [];

  const shippingLines = order
    ? [order.shippingName, order.shippingAddress, order.shippingCity].filter(Boolean)
    : [];

  return (
    <main className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-semibold">Thank you</h1>
      <p className="rounded-xl border border-border px-5 py-4 text-sm font-medium">
        Your order is confirmed. You&apos;ll receive a receipt from PayPal by email.
      </p>

      {order && (
        <div className="flex w-full flex-col gap-4 text-left">
          <p className="text-center text-xs uppercase tracking-wide text-muted">
            Order {formatOrderNumber(order.id)}
          </p>

          <ul className="flex flex-col divide-y divide-border">
            {itemsWithImages.map((item) => (
              <li key={item.id} className="flex gap-4 py-4 first:pt-0">
                <div className="h-20 w-16 flex-shrink-0 overflow-hidden bg-border">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-1 items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide">ONDINE</p>
                    <p className="mt-1 text-sm text-muted">
                      {item.name} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {formatPrice((item.unitAmountCents * item.quantity) / 100, order.currency)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-border pt-4 text-sm font-semibold uppercase tracking-wide">
            <span>Total</span>
            <span>{formatPrice(order.amountCents / 100, order.currency)}</span>
          </div>

          {shippingLines.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Shipping to
              </p>
              <p className="mt-1 text-sm">{shippingLines.join(", ")}</p>
            </div>
          )}

          <p className="text-center text-sm text-muted">{site.deliveryPolicy[0]}</p>
        </div>
      )}

      <OrderConfirmationExtras />

      <Link
        href="/shop"
        className="mt-2 rounded-full border border-foreground px-8 py-3 text-sm font-semibold uppercase tracking-wide hover:bg-foreground hover:text-background"
      >
        Continue Shopping
      </Link>
    </main>
  );
}
