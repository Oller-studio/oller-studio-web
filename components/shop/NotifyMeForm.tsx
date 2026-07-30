"use client";

import { useState } from "react";

export function NotifyMeForm({ slug }: { slug: string }) {
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

  if (status === "done") {
    return (
      <p className="text-sm text-muted">
        We&apos;ll email you at {email} when it&apos;s back.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex border border-foreground">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="w-full bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={status === "saving"}
          className="shrink-0 border-l border-foreground px-5 text-sm font-semibold uppercase tracking-wide transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
        >
          {status === "saving" ? "…" : "Notify me"}
        </button>
      </div>
      {status === "error" && (
        <p className="text-xs text-red-600">Something went wrong — try again.</p>
      )}
    </form>
  );
}
