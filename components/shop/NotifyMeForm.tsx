"use client";

import { useState } from "react";

type NotifyMeFormProps = {
  slug: string;
  productName: string;
  colorName: string;
};

export function NotifyMeForm({ slug, productName, colorName }: NotifyMeFormProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

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
        Notify Me
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={close} />

          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background text-foreground shadow-xl">
            <div className="relative flex items-center justify-between border-b border-border px-6 py-6">
              <button type="button" aria-label="Close" onClick={close} className="text-xl">
                ✕
              </button>
              <p className="font-display text-2xl font-semibold leading-tight">Notify Me</p>
              <span aria-hidden="true" className="w-5" />
            </div>

            <div className="flex flex-col gap-5 px-6 py-6">
              <p className="text-sm font-semibold uppercase tracking-wide">
                {productName} · {colorName}
              </p>

              {status === "done" ? (
                <p className="text-sm text-muted">
                  We&apos;ll email you at {email} as soon as this is back in stock.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted">
                    Enter your email below and we&apos;ll let you know as soon as this is back in
                    stock.
                  </p>
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
                      {status === "saving" ? "…" : "Notify Me When Available"}
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
