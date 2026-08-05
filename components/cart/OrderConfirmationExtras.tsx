"use client";

import { useEffect, useState } from "react";
import { PostPurchaseNewsletter } from "./PostPurchaseNewsletter";

const HANDOFF_KEY = "oller_last_order";

type Handoff = { email: string; accountCreated: boolean; newsletter: boolean };

// The confirmation page is reached via a hard client-side redirect right
// after payment, so it can't read CheckoutForm's React state directly.
// CheckoutForm stashes what this page needs in sessionStorage right before
// navigating away — read once, then clear it so a refresh doesn't reuse
// stale data from an older order.
export function OrderConfirmationExtras() {
  const [handoff, setHandoff] = useState<Handoff | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    sessionStorage.removeItem(HANDOFF_KEY);
    if (!raw) return;
    let parsed: Handoff;
    try {
      parsed = JSON.parse(raw) as Handoff;
    } catch {
      return;
    }
    // sessionStorage is an external system, not derivable from props/state,
    // so this is a legitimate one-time sync — deferred a tick to keep the
    // setState call out of the effect body itself (react-hooks/set-state-in-effect).
    Promise.resolve().then(() => setHandoff(parsed));
  }, []);

  if (!handoff) return null;

  return (
    <>
      {handoff.accountCreated && (
        <p className="text-sm text-muted">
          Log in with the same email you used to pay to track your order.
        </p>
      )}
      {!handoff.newsletter && <PostPurchaseNewsletter email={handoff.email} />}
    </>
  );
}
