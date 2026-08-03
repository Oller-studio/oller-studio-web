"use client";

import { useState } from "react";
import { RichTextEditor } from "./RichTextEditor";

// Kept as a literal (not imported from lib/emailTemplates.ts) so this client
// component doesn't pull the Prisma-backed module into the browser bundle.
const ORDER_SHIPPED_TEMPLATE_KEY = "order_shipped";

export function OrderShippedEmailEditor({
  initialSubject,
  initialMessage,
}: {
  initialSubject: string;
  initialMessage: string;
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [message, setMessage] = useState(initialMessage);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [previewError, setPreviewError] = useState(false);

  async function save() {
    setStatus("saving");
    const res = await fetch("/api/admin/email-templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: ORDER_SHIPPED_TEMPLATE_KEY, subject, message }),
    }).catch(() => null);
    setStatus(res && res.ok ? "saved" : "error");
  }

  async function preview() {
    setPreviewError(false);
    const win = window.open("", "_blank");
    const res = await fetch("/api/admin/email-templates/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: ORDER_SHIPPED_TEMPLATE_KEY, subject, message }),
    }).catch(() => null);
    if (!res || !res.ok || !win) {
      win?.close();
      setPreviewError(true);
      return;
    }
    const html = await res.text();
    win.document.write(html);
    win.document.close();
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-border bg-background p-4 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide">Order shipped</p>
      <p className="text-xs text-muted">
        Sent when you mark an order as Sent in Production. Use {"{{firstName}}"} anywhere below —
        it gets filled in per order.
      </p>
      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
        Subject
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm font-normal normal-case text-foreground outline-none"
        />
      </label>
      <div className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
        Message
        <RichTextEditor value={message} onChange={setMessage} rows={4} />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="w-fit rounded-full border border-foreground bg-foreground px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-background hover:opacity-90 disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={preview}
          className="w-fit rounded-full border border-border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide hover:bg-border/40"
        >
          Preview
        </button>
        {status === "saved" && <span className="text-xs text-green-700">Saved</span>}
        {status === "error" && <span className="text-xs text-red-600">Something went wrong</span>}
        {previewError && <span className="text-xs text-red-600">Couldn&apos;t load preview</span>}
      </div>
    </div>
  );
}
