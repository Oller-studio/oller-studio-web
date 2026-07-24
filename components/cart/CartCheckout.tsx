"use client";

import { useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useCart } from "./cart-context";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function CartCheckout() {
  const { items, subtotal, clear } = useCart();
  const [completed, setCompleted] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const currency = items[0]?.currency ?? "USD";

  if (completed) {
    return (
      <p className="rounded-xl border border-border px-5 py-4 text-sm font-medium">
        Thank you — your order is confirmed. You&apos;ll receive a receipt from PayPal by email.
        {accountCreated &&
          " Log in with the same email you used to pay to track your order."}
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
    <div className="flex flex-col gap-3">
      {clerkConfigured && (
        <label className="flex items-start gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={createAccount}
            onChange={(e) => setCreateAccount(e.target.checked)}
            className="mt-0.5"
          />
          Create an account to track your order on our site
        </label>
      )}
      <PayPalScriptProvider options={{ clientId, currency, intent: "capture" }}>
        <PayPalButtons
          style={{ layout: "vertical", shape: "pill", label: "pay" }}
          createOrder={(_, actions) =>
            actions.order.create({
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
            })
          }
          onApprove={async (_, actions) => {
            if (!actions.order) return;
            const capture = await actions.order.capture();

            if (createAccount) {
              const payer = (capture as { payer?: Record<string, unknown> }).payer;
              const email = (payer?.email_address as string) ?? undefined;
              const name = payer?.name as { given_name?: string; surname?: string } | undefined;
              if (email) {
                try {
                  const res = await fetch("/api/create-account", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email,
                      firstName: name?.given_name,
                      lastName: name?.surname,
                    }),
                  });
                  if (res.ok) setAccountCreated(true);
                } catch (error) {
                  console.error("Failed to create account after purchase", error);
                }
              }
            }

            setCompleted(true);
            clear();
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
