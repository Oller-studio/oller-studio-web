"use client";

import { useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useCart } from "./cart-context";

export function CartCheckout() {
  const { items, subtotal, clear } = useCart();
  const [completed, setCompleted] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const currency = items[0]?.currency ?? "USD";

  if (completed) {
    return (
      <p className="rounded-xl border border-border px-5 py-4 text-sm font-medium">
        Thank you — your order is confirmed. You&apos;ll receive a receipt from PayPal by email.
      </p>
    );
  }

  if (!clientId) {
    return (
      <p className="text-sm text-muted">
        Checkout isn&apos;t configured yet — add NEXT_PUBLIC_PAYPAL_CLIENT_ID to enable PayPal.
      </p>
    );
  }

  return (
    <PayPalScriptProvider options={{ clientId, currency, intent: "capture" }}>
      <PayPalButtons
        style={{ layout: "vertical", shape: "pill", label: "pay" }}
        createOrder={async (_, actions) => {
          const paypalOrderId = await actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
              {
                amount: {
                  currency_code: currency,
                  value: subtotal.toFixed(2),
                  breakdown: {
                    item_total: { currency_code: currency, value: subtotal.toFixed(2) },
                  },
                },
                items: items.map((i) => ({
                  name: `ONDINE — ${i.name}`,
                  unit_amount: { currency_code: currency, value: i.price.toFixed(2) },
                  quantity: String(i.quantity),
                })),
              },
            ],
          });

          // Record the cart now, before payment — lets the admin dashboard see
          // abandoned checkouts, not just completed ones (the webhook flips
          // this to COMPLETED once PayPal confirms the capture).
          fetch("/api/orders/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paypalOrderId, currency, items }),
          }).catch(() => {});

          return paypalOrderId;
        }}
        onApprove={async (_, actions) => {
          if (!actions.order) return;
          await actions.order.capture();
          setCompleted(true);
          clear();
        }}
      />
    </PayPalScriptProvider>
  );
}
