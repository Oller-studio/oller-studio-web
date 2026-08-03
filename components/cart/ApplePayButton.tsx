"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart-context";
import type { ShippingAddressInput } from "@/lib/paypal";

// PayPal's JS SDK attaches a low-level Apple Pay API to window.paypal when
// the "applepay" component is loaded (see PayPalScriptProvider's options in
// CheckoutForm.tsx) — there's no React wrapper for this the way there is
// for the regular PayPalButtons, so this talks to it directly.
type PayPalApplePay = {
  config: () => Promise<{
    isEligible: boolean;
    countryCode: string;
    currencyCode: string;
    merchantCapabilities: string[];
    supportedNetworks: string[];
  }>;
  validateMerchant: (args: { validationUrl: string }) => Promise<{ merchantSession: unknown }>;
  confirmOrder: (args: {
    orderId: string;
    token: unknown;
    billingContact?: unknown;
    shippingContact?: unknown;
  }) => Promise<void>;
};

declare global {
  interface Window {
    ApplePaySession?: {
      canMakePayments: () => boolean;
      new (version: number, request: unknown): ApplePaySessionInstance;
      STATUS_SUCCESS: number;
      STATUS_FAILURE: number;
    };
  }
}

type ApplePaySessionInstance = {
  begin: () => void;
  completeMerchantValidation: (merchantSession: unknown) => void;
  completePayment: (status: number) => void;
  onvalidatemerchant: (event: { validationURL: string }) => void;
  onpaymentauthorized: (event: { payment: { token: unknown; billingContact?: unknown; shippingContact?: unknown } }) => void;
  oncancel: () => void;
};

export function ApplePayButton({
  shipping,
  onCaptured,
}: {
  shipping: ShippingAddressInput;
  onCaptured: () => void;
}) {
  const { subtotal, items } = useCart();
  const [eligible, setEligible] = useState(false);
  const applePayRef = useRef<PayPalApplePay | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkEligibility() {
      const paypalGlobal = window.paypal as unknown as
        | { Applepay?: () => PayPalApplePay }
        | undefined;
      if (!window.ApplePaySession?.canMakePayments() || !paypalGlobal?.Applepay) return;
      const applepay = paypalGlobal.Applepay();
      applePayRef.current = applepay;
      try {
        const config = await applepay.config();
        if (!cancelled) setEligible(config.isEligible);
      } catch {
        // Not enrolled for Apple Pay yet, or the browser/device can't pay —
        // fall back to the regular PayPal button silently.
      }
    }

    checkEligibility();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!eligible) return null;

  async function pay() {
    const applepay = applePayRef.current;
    if (!applepay || !window.ApplePaySession) return;

    const config = await applepay.config();
    const currency = items[0]?.currency ?? config.currencyCode;
    const res = await fetch("/api/orders/create-applepay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency, items, shipping }),
    });
    const { orderId } = (await res.json()) as { orderId: string };

    const session = new window.ApplePaySession(4, {
      countryCode: config.countryCode,
      currencyCode: items[0]?.currency ?? config.currencyCode,
      merchantCapabilities: config.merchantCapabilities,
      supportedNetworks: config.supportedNetworks,
      requiredBillingContactFields: ["postalAddress", "name"],
      total: { label: "OLLER", amount: subtotal.toFixed(2) },
    });

    session.onvalidatemerchant = async (event) => {
      try {
        const { merchantSession } = await applepay.validateMerchant({
          validationUrl: event.validationURL,
        });
        session.completeMerchantValidation(merchantSession);
      } catch {
        session.completePayment(window.ApplePaySession!.STATUS_FAILURE);
      }
    };

    session.onpaymentauthorized = async (event) => {
      try {
        await applepay.confirmOrder({
          orderId,
          token: event.payment.token,
          billingContact: event.payment.billingContact,
          shippingContact: event.payment.shippingContact,
        });
        session.completePayment(window.ApplePaySession!.STATUS_SUCCESS);
        onCaptured();
      } catch {
        session.completePayment(window.ApplePaySession!.STATUS_FAILURE);
      }
    };

    session.begin();
  }

  return (
    <button
      type="button"
      onClick={pay}
      aria-label="Pay with Apple Pay"
      style={{
        WebkitAppearance: "-apple-pay-button" as React.CSSProperties["WebkitAppearance"],
        ApplePayButtonType: "pay",
        ApplePayButtonStyle: "black",
        width: "100%",
        height: 45,
        borderRadius: 9999,
      } as React.CSSProperties}
    />
  );
}
