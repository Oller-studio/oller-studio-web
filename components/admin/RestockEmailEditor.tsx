"use client";

import { useState } from "react";

// Kept as a literal (not imported from lib/emailTemplates.ts) so this client
// component doesn't pull the Prisma-backed module into the browser bundle.
const RESTOCK_TEMPLATE_KEY = "restock";

export function RestockEmailEditor({
  initialSubject,
  initialMessage,
}: {
  initialSubject: string;
  initialMessage: string;
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [message, setMessage] = useState(initialMessage);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setStatus("saving");
    const res = await fetch("/api/admin/email-templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: RESTOCK_TEMPLATE_KEY, subject, message }),
    }).catch(() => null);
    setStatus(res && res.ok ? "saved" : "error");
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-border bg-background p-4 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide">Restock email</p>
      <p className="text-xs text-muted">
        Sent from the Waitlist page when you notify someone a sold-out color is ready for them.
        Use {"{{product}}"} and {"{{color}}"} anywhere below — they get filled in per person. The
        "Get yours" button and private link are added automatically under your message.
      </p>
      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
        Subject
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm font-normal normal-case text-foreground outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
        Message
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="rounded-md border border-border px-3 py-2 text-sm font-normal normal-case text-foreground outline-none"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="w-fit rounded-full border border-foreground bg-foreground px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-background hover:opacity-90 disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        {status === "saved" && <span className="text-xs text-green-700">Saved</span>}
        {status === "error" && <span className="text-xs text-red-600">Something went wrong</span>}
      </div>
    </div>
  );
}
