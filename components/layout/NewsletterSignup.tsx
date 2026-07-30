"use client";

import { useRef, useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  if (status === "sent") {
    return <p className="text-sm font-medium">Thanks — you&apos;re on the list.</p>;
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus("sending");
        try {
          const res = await fetch("/api/newsletter-signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          setStatus(res.ok ? "sent" : "error");
        } catch {
          setStatus("error");
        }
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target !== inputRef.current && !target.closest("button")) {
          inputRef.current?.focus();
        }
      }}
      className="flex cursor-text items-center gap-3 border-b border-foreground/30 pb-2"
    >
      <MailIcon />
      <input
        ref={inputRef}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Sign Up For Exclusive Access"
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="shrink-0 text-xs font-semibold uppercase tracking-wide underline-offset-4 hover:underline disabled:opacity-50"
      >
        {status === "sending" ? "…" : "Submit"}
      </button>
      {status === "error" && (
        <p className="text-xs text-accent">Try again</p>
      )}
    </form>
  );
}

function MailIcon() {
  return (
    <svg
      width="30"
      height="22"
      viewBox="0 0 32 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="1" width="30" height="22" rx="1" />
      <path d="M1 2.5 16 15 31 2.5" />
    </svg>
  );
}
