"use client";

import { useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

type PayPalCheckoutProps = {
  colorwayName: string;
  price: number;
  currency: string;
  sku: string;
};

export function PayPalCheckout({
  colorwayName,
  price,
  currency,
  sku,
}: PayPalCheckoutProps) {
  const [completed, setCompleted] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

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
        createOrder={(_, actions) =>
          actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
              {
                description: `ONDINE — ${colorwayName}`,
                custom_id: sku,
                amount: {
                  currency_code: currency,
                  value: price.toFixed(2),
                },
              },
            ],
          })
        }
        onApprove={async (_, actions) => {
          if (!actions.order) return;
          await actions.order.capture();
          setCompleted(true);
        }}
      />
    </PayPalScriptProvider>
  );
}
