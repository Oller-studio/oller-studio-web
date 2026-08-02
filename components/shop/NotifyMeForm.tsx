"use client";

import { useState } from "react";

type NotifyMeFormProps = {
  slug: string;
  productName: string;
  colorName: string;
  // "request" = collection tier, always print-to-order — framed as asking
  // for one to be made. "notify" = signature tier, a closed numbered
  // edition — framed as waiting to hear about the next drop.
  mode: "notify" | "request";
};

const COPY = {
  notify: {
    button: "Notify Me",
    title: "Notify Me",
    body: "Enter your email below and we'll let you know as soon as this is back in stock.",
    submit: "Notify Me When Available",
    done: (email: string) => `We'll email you at ${email} as soon as this is back in stock.`,
  },
  request: {
    button: "Request Print on Demand",
    title: "Request Print on Demand",
    body: "This color is print-to-order — leave your email and we'll get in touch about printing one for you.",
    submit: "Send Request",
    done: (email: string) => `We'll email you at ${email} about getting one printed.`,
  },
} as const;

export function NotifyMeForm({ slug, productName, colorName, mode }: NotifyMeFormProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const copy = COPY[mode];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("saving");
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, email: email.trim() }),
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
        {copy.button}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={close} />

          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background text-foreground shadow-xl">
            <div className="relative flex items-center justify-between border-b border-border px-6 py-6">
              <button type="button" aria-label="Close" onClick={close} className="text-xl">
                ✕
              </button>
              <p className="font-display text-2xl font-semibold leading-tight">{copy.title}</p>
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
                  <p className="text-sm text-muted">{copy.body}</p>
                  <form onSubmit={submit} className="flex flex-col gap-3">
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
                      {status === "saving" ? "…" : copy.submit}
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
