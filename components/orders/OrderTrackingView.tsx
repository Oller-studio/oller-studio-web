"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuthModal } from "@/components/auth/auth-modal-context";
import { formatMoneyCents } from "@/lib/format";

const STAGES = ["Ordered", "Printing", "Packaging", "Sending", "Completed"];

type TrackedOrder = {
  orderNumber: string;
  createdAt: string;
  amountCents: number;
  currency: string;
  status: string;
  items: { id: string; name: string; quantity: number; unitAmountCents: number }[];
};

export function OrderTrackingView({ orderId }: { orderId: string }) {
  const { isLoaded, isSignedIn } = useUser();
  const { open } = useAuthModal();
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<"not_found" | "not_yours" | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch(`/api/orders/track/${orderId}`)
      .then(async (res) => {
        if (res.status === 403) {
          setError("not_yours");
          return;
        }
        if (!res.ok) {
          setError("not_found");
          return;
        }
        const data = await res.json();
        setOrder(data.order);
      })
      .catch(() => setError("not_found"));
  }, [isSignedIn, orderId]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Sign in or create an account</h1>
        <p className="text-muted">
          See your order move through each stage of its journey — printing, packaging, and on its
          way to you. Sign in with the same email you used to pay, or create an account in
          seconds.
        </p>
        <button
          type="button"
          onClick={open}
          className="rounded-full bg-foreground px-6 py-3 text-sm font-semibold uppercase tracking-wide text-background hover:opacity-90"
        >
          Sign in
        </button>
        <p className="text-xs text-muted">
          Prefer not to? We&apos;ll email you as soon as your order ships.
        </p>
      </main>
    );
  }

  if (error === "not_yours") {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-muted">
          This order isn&apos;t linked to your account. If you think that&apos;s wrong, reach out
          to hello@oller.studio.
        </p>
      </main>
    );
  }

  if (error === "not_found") {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-muted">We couldn&apos;t find that order.</p>
      </main>
    );
  }

  if (!order) return null;

  const currentStep = STAGES.indexOf(order.status);

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="font-display text-4xl font-bold">Order {order.orderNumber}</h1>
      <p className="mt-2 text-muted">Placed {new Date(order.createdAt).toLocaleDateString()}</p>

      {order.status === "Refunded" ? (
        <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted">Refunded</p>
      ) : (
        <div className="mt-10 flex items-center justify-between gap-1">
          {STAGES.map((stage, i) => (
            <div key={stage} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`h-2 w-full ${
                  i <= currentStep ? "bg-foreground" : "bg-border"
                } ${i === 0 ? "rounded-l-full" : ""} ${i === STAGES.length - 1 ? "rounded-r-full" : ""}`}
              />
              <span
                className={`text-xs uppercase tracking-wide ${
                  i === currentStep ? "font-semibold text-foreground" : "text-muted"
                }`}
              >
                {stage}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Items</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between border-b border-border pb-3 text-sm">
            <span>
              {item.name} &times; {item.quantity}
            </span>
            <span className="text-muted">
              {formatMoneyCents(item.unitAmountCents * item.quantity, order.currency)}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-1 text-sm font-semibold">
          <span>Total</span>
          <span>{formatMoneyCents(order.amountCents, order.currency)}</span>
        </div>
      </div>
    </main>
  );
}
