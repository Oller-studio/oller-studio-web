import Link from "next/link";
import { OrderConfirmationExtras } from "@/components/cart/OrderConfirmationExtras";

export const metadata = {
  title: "Order Confirmed",
};

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <main className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-semibold">Thank you</h1>
      <p className="rounded-xl border border-border px-5 py-4 text-sm font-medium">
        Your order is confirmed. You&apos;ll receive a receipt from PayPal by email.
      </p>
      {order && (
        <p className="text-xs uppercase tracking-wide text-muted">Order reference: {order}</p>
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
