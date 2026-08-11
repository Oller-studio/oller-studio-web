"use client";

import { useState } from "react";
import { RichTextEditor } from "./RichTextEditor";

export function NewsletterComposer({ activeCount }: { activeCount: number }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "confirming" | "sending" | "sent" | "error">("idle");
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  const ready = subject.trim() && message.trim();

  async function send() {
    setStatus("sending");
    const res = await fetch("/api/admin/newsletter/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (res?.ok && data) {
      setResult({ sent: data.sent, failed: data.failed });
      setStatus("sent");
    } else {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex max-w-xl flex-col gap-2 rounded-xl border border-border bg-background p-4">
        <p className="text-sm font-semibold">Sent.</p>
        <p className="text-sm text-muted">
          {result?.sent ?? 0} delivered{result && result.failed > 0 ? `, ${result.failed} failed` : ""}.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubject("");
            setMessage("");
            setResult(null);
            setStatus("idle");
          }}
          className="w-fit text-xs font-semibold uppercase tracking-wide underline underline-offset-2"
        >
          Write another
        </button>
      </div>
    );
  }

  return (
    <div className="flex max-w-xl flex-col gap-3">
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
        <RichTextEditor value={message} onChange={setMessage} rows={8} />
      </div>

      {status === "confirming" && (
        <div className="flex flex-col gap-2 rounded-lg border border-red-600 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-700">
            Send to all {activeCount} active subscriber{activeCount === 1 ? "" : "s"} now? This can&apos;t
            be undone.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={send}
              className="w-fit rounded-full border border-red-600 bg-red-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-90"
            >
              Yes, send now
            </button>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="text-xs font-semibold uppercase tracking-wide underline underline-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {(status === "idle" || status === "sending" || status === "error") && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStatus("confirming")}
            disabled={!ready || activeCount === 0 || status === "sending"}
            className="w-fit rounded-full border border-foreground bg-foreground px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-background hover:opacity-90 disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : `Send to ${activeCount} subscriber${activeCount === 1 ? "" : "s"}`}
          </button>
          {status === "error" && (
            <span className="text-xs text-red-600">Something went wrong — try again.</span>
          )}
        </div>
      )}
    </div>
  );
}
