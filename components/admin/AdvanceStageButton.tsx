"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getNextStage,
  getPreviousStage,
  ADVANCE_LABELS,
  FULFILLMENT_LABELS,
  type FulfillmentStage,
} from "@/lib/fulfillment";

export function AdvanceStageButton({ orderId, status }: { orderId: string; status: string }) {
  const [loading, setLoading] = useState<"next" | "prev" | null>(null);
  const [confirmingSend, setConfirmingSend] = useState(false);
  const router = useRouter();
  const nextStage = getNextStage(status);
  const previousStage = getPreviousStage(status);
  const label = ADVANCE_LABELS[status as FulfillmentStage];

  async function moveTo(stage: string, which: "next" | "prev", sendEmail = true) {
    setLoading(which);
    await fetch(`/api/orders/${orderId}/fulfillment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, sendEmail }),
    }).catch(() => {});
    router.refresh();
    setLoading(null);
    setConfirmingSend(false);
  }

  return (
    <div className="flex flex-col gap-1">
      {confirmingSend && nextStage ? (
        <div className="flex flex-col gap-1 rounded-lg border border-border p-2">
          <p className="text-xs">Send email confirmation to client?</p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => moveTo(nextStage, "next", true)}
              disabled={loading !== null}
              className="flex-1 rounded-full bg-foreground px-2 py-1 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-50"
            >
              {loading === "next" ? "…" : "Yes"}
            </button>
            <button
              type="button"
              onClick={() => moveTo(nextStage, "next", false)}
              disabled={loading !== null}
              className="flex-1 rounded-full border border-border px-2 py-1 text-xs font-semibold hover:bg-border/40 disabled:opacity-50"
            >
              Skip
            </button>
          </div>
        </div>
      ) : (
        nextStage &&
        label && (
          <button
            type="button"
            onClick={() =>
              nextStage === "SENT" ? setConfirmingSend(true) : moveTo(nextStage, "next")
            }
            disabled={loading !== null}
            className="w-full shrink-0 rounded-full border border-foreground px-3 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-foreground hover:text-background disabled:opacity-50"
          >
            {loading === "next" ? "…" : `→ ${label}`}
          </button>
        )
      )}
      {previousStage && (
        <button
          type="button"
          onClick={() => moveTo(previousStage, "prev")}
          disabled={loading !== null}
          className="text-xs text-muted underline underline-offset-2 hover:text-foreground disabled:opacity-50"
        >
          {loading === "prev" ? "…" : `← Undo (back to ${FULFILLMENT_LABELS[previousStage]})`}
        </button>
      )}
    </div>
  );
}
