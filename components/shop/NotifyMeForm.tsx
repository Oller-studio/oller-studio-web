"use client";

import { useState } from "react";

type NotifyMeVariant = "restock" | "coming_soon" | "print_request";

type NotifyMeFormProps = {
  slug: string;
  productName: string;
  colorName: string;
  variant?: NotifyMeVariant;
};

const COPY: Record<
  NotifyMeVariant,
  {
    triggerLabel: string;
    heading: string;
    intro: string;
    submitLabel: string;
    done: (email: string) => string;
  }
> = {
  restock: {
    triggerLabel: "Notify Me",
    heading: "Notify Me",
    intro: "Enter your email below and we'll let you know as soon as this is back in stock.",
    submitLabel: "Notify Me When Available",
    done: (email) => `We'll email you at ${email} as soon as this is back in stock.`,
  },
  coming_soon: {
    triggerLabel: "Notify me when it drops",
    heading: "Notify Me",
    intro: "Enter your email below and we'll let you know the moment this is available.",
    submitLabel: "Notify Me When Available",
    done: (email) => `We'll email you at ${email} the moment this is available.`,
  },
  print_request: {
    triggerLabel: "Request This Piece",
    heading: "Request This Piece",
    intro:
      "This color is sold out, but tell us you want one — our team will check if we can print it and follow up if it's possible.",
    submitLabel: "Send Request",
    done: (email) =>
      `We've sent a confirmation to ${email}. Our team is reviewing your request and will follow up if we can make it happen.`,
  },
};

export function NotifyMeForm({
  slug,
  productName,
  colorName,
  variant = "restock",
}: NotifyMeFormProps) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const copy = COPY[variant];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !firstName.trim()) return;
    setStatus("saving");
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        firstName: firstName.trim(),
        email: email.trim(),
        kind: variant === "print_request" ? "print_request" : "notify",
      }),
    }).catch(() => null);
    setStatus(res && res.ok ? "done" : "error");
  }

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full border border-foreground py-3.5 text-center text-sm font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-foreground hover:text-background"
      >
        {copy.triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={close} />

          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background text-foreground shadow-xl">
            <div className="relative flex items-center justify-between border-b border-border px-6 py-6">
              <button type="button" aria-label="Close" onClick={close} className="text-xl">
                ✕
              </button>
              <p className="font-display text-2xl font-semibold leading-tight">{copy.heading}</p>
              <span aria-hidden="true" className="w-5" />
            </div>

            <div className="flex flex-col gap-5 px-6 py-6">
              <p className="text-sm font-semibold uppercase tracking-wide">
                {productName} · {colorName}
              </p>

              {status === "done" ? (
                <p className="text-sm text-muted">{copy.done(email)}</p>
              ) : (
                <>
                  <p className="text-sm text-muted">{copy.intro}</p>
                  <form onSubmit={submit} className="flex flex-col gap-3">
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="border border-border bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-muted"
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="border border-border bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-muted"
                    />
                    <button
                      type="submit"
                      disabled={status === "saving"}
                      className="block w-full border border-foreground py-3.5 text-center text-sm font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
                    >
                      {status === "saving" ? "…" : copy.submitLabel}
                    </button>
                    {status === "error" && (
                      <p className="text-xs text-red-600">Something went wrong — try again.</p>
                    )}
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
