"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useCart } from "./cart-context";
import { useAuthModal } from "@/components/auth/auth-modal-context";
import { ApplePayButton } from "./ApplePayButton";
import { COUNTRIES } from "@/lib/countries";
import { DIAL_CODES } from "@/lib/dialCodes";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

type ShippingAddress = {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  countryCode: string;
  // The buyer's phone number can be from a different country than where
  // they're shipping to (e.g. living in Andorra with a Spanish number) —
  // defaults to matching countryCode but is independently editable. Empty
  // means "not yet picked, fall back to countryCode's dial code".
  phoneCountryCode: string;
  phone: string;
};

const EMPTY_SHIPPING: ShippingAddress = {
  firstName: "",
  lastName: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  city: "",
  countryCode: "",
  phoneCountryCode: "",
  phone: "",
};

function isShippingComplete(s: ShippingAddress) {
  return Boolean(
    s.firstName.trim() &&
      s.lastName.trim() &&
      s.addressLine1.trim() &&
      s.city.trim() &&
      s.postalCode.trim() &&
      s.countryCode &&
      s.phone.replace(/\D/g, "")
  );
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


// Who's paying, and where to reach them — separate from the shipping
// address below (which is where the piece goes, not who's buying it).
// Signed-in customers skip retyping this; guests get the same "Sign In"
// escape hatch the reference checkout uses.
function ContactSection({
  email,
  setEmail,
  newsletter,
  setNewsletter,
}: {
  email: string;
  setEmail: (v: string) => void;
  newsletter: boolean;
  setNewsletter: (v: boolean) => void;
}) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { open } = useAuthModal();

  if (clerkConfigured && isLoaded && isSignedIn) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Contact</p>
        <p className="text-sm">
          Signed in as {user.primaryEmailAddress?.emailAddress ?? user.firstName}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Contact</p>
        {clerkConfigured && (
          <button
            type="button"
            onClick={open}
            className="text-xs font-semibold underline underline-offset-2"
          >
            Sign In
          </button>
        )}
      </div>
      <input
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="rounded-md border border-border px-3 py-2 text-sm outline-none placeholder:text-muted"
      />
      <label className="flex items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={newsletter}
          onChange={(e) => setNewsletter(e.target.checked)}
        />
        Get first access to new drops and restocks
      </label>
    </div>
  );
}

// Collected on our own page (styled, in English, one clear form) instead of
// leaving it to PayPal's own checkout — that flow only ever asked for a
// card's billing address, never a delivery address, which isn't the same
// thing for a piece that has to physically ship somewhere.
function DeliverySection({
  value,
  onChange,
}: {
  value: ShippingAddress;
  onChange: (v: ShippingAddress) => void;
}) {
  function set<K extends keyof ShippingAddress>(key: K, v: ShippingAddress[K]) {
    onChange({ ...value, [key]: v });
  }

  const inputClass =
    "rounded-md border border-border px-3 py-2 text-sm outline-none placeholder:text-muted";

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Delivery</p>
      <select
        autoComplete="country"
        value={value.countryCode}
        onChange={(e) => set("countryCode", e.target.value)}
        className={`${inputClass} ${value.countryCode ? "" : "text-muted"}`}
      >
        <option value="" disabled>
          Country/Region
        </option>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input
          autoComplete="given-name"
          value={value.firstName}
          onChange={(e) => set("firstName", e.target.value)}
          placeholder="First name"
          className={inputClass}
        />
        <input
          autoComplete="family-name"
          value={value.lastName}
          onChange={(e) => set("lastName", e.target.value)}
          placeholder="Last name"
          className={inputClass}
        />
      </div>
      <input
        autoComplete="address-line1"
        value={value.addressLine1}
        onChange={(e) => set("addressLine1", e.target.value)}
        placeholder="Address"
        className={inputClass}
      />
      <input
        autoComplete="address-line2"
        value={value.addressLine2}
        onChange={(e) => set("addressLine2", e.target.value)}
        placeholder="Apartment, suite, etc. (optional)"
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          autoComplete="postal-code"
          value={value.postalCode}
          onChange={(e) => set("postalCode", e.target.value)}
          placeholder="Postal code"
          className={inputClass}
        />
        <input
          autoComplete="address-level2"
          value={value.city}
          onChange={(e) => set("city", e.target.value)}
          placeholder="City"
          className={inputClass}
        />
      </div>
      <div className="flex gap-2">
        <select
          aria-label="Phone country code"
          value={value.phoneCountryCode || value.countryCode}
          onChange={(e) => set("phoneCountryCode", e.target.value)}
          className={`${inputClass} w-24 shrink-0`}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} disabled={!DIAL_CODES[c.code]}>
              {DIAL_CODES[c.code] ? `+${DIAL_CODES[c.code]} ${c.code}` : c.code}
            </option>
          ))}
        </select>
        <input
          type="tel"
          autoComplete="tel"
          value={value.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="Phone"
          className={`${inputClass} w-full`}
        />
      </div>
    </div>
  );
}

export function CheckoutForm() {
  const { items, subtotal, clear } = useCart();
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  // Checked by default — this isn't marketing consent, it's a service
  // perk tied directly to the purchase (order tracking), so defaulting it
  // on is fine. The newsletter checkbox below stays unchecked by default;
  // bundling that consent into this one would violate GDPR's "specific
  // consent" requirement (see e.g. the Planet49 ruling).
  const [createAccount, setCreateAccount] = useState(true);
  const [email, setEmail] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [shipping, setShipping] = useState<ShippingAddress>(EMPTY_SHIPPING);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const currency = items[0]?.currency ?? "USD";
  const signedIn = clerkConfigured && isLoaded && isSignedIn;
  const contactEmail = signedIn ? user.primaryEmailAddress?.emailAddress ?? "" : email;

  // Stashes what the confirmation page needs (it can't read this component's
  // React state — it's reached via a full navigation) then redirects there.
  // Navigating away, rather than swapping in a "thank you" view in place,
  // means a successful order is never at the mercy of the checkout page's
  // own "cart is empty" guard once `clear()` runs.
  function goToConfirmation(orderId: string, accountCreated: boolean) {
    sessionStorage.setItem(
      "oller_last_order",
      JSON.stringify({ email: contactEmail, accountCreated, newsletter })
    );
    setRedirecting(true);
    clear();
    router.push(`/order-confirmation?order=${encodeURIComponent(orderId)}`);
  }

  if (redirecting) {
    return <p className="text-sm text-muted">Finishing up…</p>;
  }

  if (!clientId) {
    return (
      <p className="text-sm text-muted">
        Checkout isn&apos;t configured yet — add NEXT_PUBLIC_PAYPAL_CLIENT_ID to enable PayPal.
      </p>
    );
  }

  const shippingReady = isShippingComplete(shipping);
  const emailReady = signedIn || isValidEmail(email);
  const shippingName = `${shipping.firstName} ${shipping.lastName}`.trim();

  return (
    <div className="flex flex-col gap-5">
      <ContactSection
        email={email}
        setEmail={setEmail}
        newsletter={newsletter}
        setNewsletter={setNewsletter}
      />
      <DeliverySection value={shipping} onChange={setShipping} />

      {!signedIn && clerkConfigured && (
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

      {!emailReady || !shippingReady ? (
        <p className="text-xs text-muted">
          Fill in your email and shipping address to continue to payment.
        </p>
      ) : (
        <PayPalScriptProvider
          options={{
            clientId,
            currency,
            intent: "capture",
            components: "buttons,applepay",
            // Force English regardless of the buyer's browser/geolocation —
            // otherwise PayPal's own widget can render in a different
            // language than the rest of the site.
            locale: "en_US",
          }}
        >
          <div className="flex flex-col gap-3 pt-2">
            <ApplePayButton
              shipping={{
                fullName: shippingName,
                addressLine1: shipping.addressLine1,
                addressLine2: shipping.addressLine2,
                city: shipping.city,
                postalCode: shipping.postalCode,
                countryCode: shipping.countryCode,
              }}
              onCaptured={(orderId) => {
                if (newsletter && contactEmail) {
                  fetch("/api/newsletter-signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: contactEmail }),
                  }).catch(() => {});
                }
                goToConfirmation(orderId, false);
              }}
            />
            <PayPalButtons
              style={{ layout: "vertical", shape: "pill", label: "pay", height: 48 }}
            createOrder={async (_, actions) => {
              const paypalOrderId = await actions.order.create({
                intent: "CAPTURE",
                // Locks the address we already collected — PayPal's own
                // checkout won't ask for or let the buyer change shipping.
                application_context: { shipping_preference: "SET_PROVIDED_ADDRESS" },
                payer: {
                  ...(contactEmail ? { email_address: contactEmail } : {}),
                  ...(shipping.firstName || shipping.lastName
                    ? {
                        name: {
                          given_name: shipping.firstName || undefined,
                          surname: shipping.lastName || undefined,
                        },
                      }
                    : {}),
                  ...(shipping.phone.replace(/\D/g, "")
                    ? {
                        phone: {
                          phone_number: {
                            country_code: DIAL_CODES[shipping.phoneCountryCode || shipping.countryCode] ?? "",
                            national_number: shipping.phone.replace(/\D/g, ""),
                          },
                        },
                      }
                    : {}),
                },
                // We only ever collect one address/name — reused here as
                // the card's billing details too, so the guest card flow
                // isn't asking the buyer to type the same info twice.
                payment_source: {
                  card: {
                    name: shippingName || undefined,
                    billing_address: {
                      address_line_1: shipping.addressLine1,
                      address_line_2: shipping.addressLine2 || undefined,
                      admin_area_2: shipping.city,
                      postal_code: shipping.postalCode,
                      country_code: shipping.countryCode,
                    },
                  },
                },
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
                    shipping: {
                      name: { full_name: shippingName },
                      address: {
                        address_line_1: shipping.addressLine1,
                        address_line_2: shipping.addressLine2 || undefined,
                        admin_area_2: shipping.city,
                        postal_code: shipping.postalCode,
                        country_code: shipping.countryCode,
                      },
                    },
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
            onApprove={async (data, actions) => {
              if (!actions.order) return;
              const capture = await actions.order.capture();

              let accountCreated = false;
              if (createAccount) {
                const payer = (capture as { payer?: Record<string, unknown> }).payer;
                const payerEmail = (payer?.email_address as string) ?? undefined;
                const name = payer?.name as { given_name?: string; surname?: string } | undefined;
                if (payerEmail) {
                  try {
                    const res = await fetch("/api/create-account", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: payerEmail,
                        firstName: name?.given_name,
                        lastName: name?.surname,
                      }),
                    });
                    accountCreated = res.ok;
                  } catch (error) {
                    console.error("Failed to create account after purchase", error);
                  }
                }
              }

              if (newsletter && contactEmail) {
                fetch("/api/newsletter-signup", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: contactEmail }),
                }).catch(() => {});
              }

              goToConfirmation(data.orderID, accountCreated);
            }}
            />
          </div>
        </PayPalScriptProvider>
      )}
    </div>
  );
}
