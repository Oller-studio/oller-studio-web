"use client";

import { useState } from "react";

export function PostPurchaseNewsletter({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

  if (!email) return null;

  async function subscribe() {
    setStatus("saving");
    const res = await fetch("/api/newsletter-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    setStatus(res && res.ok ? "done" : "error");
  }

  if (status === "done") {
    return (
      <p className="rounded-xl border border-border px-5 py-4 text-sm text-muted">
        You&apos;re on the list — we&apos;ll email you first about new drops and restocks.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border px-5 py-4 text-sm">
      <p>Want first access to new drops and restocks?</p>
      <button
        type="button"
        onClick={subscribe}
        disabled={status === "saving"}
        className="w-fit rounded-full border border-foreground bg-foreground px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-background hover:opacity-90 disabled:opacity-50"
      >
        {status === "saving" ? "Joining…" : "Join the list"}
      </button>
      {status === "error" && (
        <p className="text-xs text-red-600">Something went wrong — try again.</p>
      )}
    </div>
  );
}
