"use client";

import { useState } from "react";
import { RichTextEditor } from "./RichTextEditor";

// Kept as literals (not imported from lib/emailTemplates.ts) so this client
// component doesn't pull the Prisma-backed module into the browser bundle.
const FOUND_KEY = "contact_confirmation_order_status";
const NOT_FOUND_KEY = "contact_confirmation_order_status_not_found";

function EditorFields({
  label,
  helpText,
  subject,
  setSubject,
  message,
  setMessage,
  onSave,
  onPreview,
  status,
  previewError,
}: {
  label: string;
  helpText: string;
  subject: string;
  setSubject: (v: string) => void;
  message: string;
  setMessage: (v: string) => void;
  onSave: () => void;
  onPreview: () => void;
  status: "idle" | "saving" | "saved" | "error";
  previewError: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-xs text-muted">{helpText}</p>
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
          onClick={onSave}
          disabled={status === "saving"}
          className="w-fit rounded-full border border-foreground bg-foreground px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-background hover:opacity-90 disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onPreview}
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

export function OrderStatusConfirmationEditor({
  initialFoundSubject,
  initialFoundMessage,
  initialNotFoundSubject,
  initialNotFoundMessage,
}: {
  initialFoundSubject: string;
  initialFoundMessage: string;
  initialNotFoundSubject: string;
  initialNotFoundMessage: string;
}) {
  const [foundSubject, setFoundSubject] = useState(initialFoundSubject);
  const [foundMessage, setFoundMessage] = useState(initialFoundMessage);
  const [foundStatus, setFoundStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [foundPreviewError, setFoundPreviewError] = useState(false);

  const [notFoundSubject, setNotFoundSubject] = useState(initialNotFoundSubject);
  const [notFoundMessage, setNotFoundMessage] = useState(initialNotFoundMessage);
  const [notFoundStatus, setNotFoundStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [notFoundPreviewError, setNotFoundPreviewError] = useState(false);

  async function saveTemplate(
    key: string,
    subject: string,
    message: string,
    setStatus: (s: "idle" | "saving" | "saved" | "error") => void,
  ) {
    setStatus("saving");
    const res = await fetch("/api/admin/email-templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, subject, message }),
    }).catch(() => null);
    setStatus(res && res.ok ? "saved" : "error");
  }

  async function previewTemplate(
    key: string,
    subject: string,
    message: string,
    setPreviewError: (v: boolean) => void,
  ) {
    setPreviewError(false);
    const win = window.open("", "_blank");
    const res = await fetch("/api/admin/email-templates/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, subject, message }),
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
    <div className="flex w-full max-w-4xl flex-col gap-4 rounded-xl border border-border bg-background p-4 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide">Contact form — Order Status</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <EditorFields
          label="When an order is found"
          helpText="Sent when the contact form is submitted as Order Status, with status info if found."
          subject={foundSubject}
          setSubject={setFoundSubject}
          message={foundMessage}
          setMessage={setFoundMessage}
          onSave={() => saveTemplate(FOUND_KEY, foundSubject, foundMessage, setFoundStatus)}
          onPreview={() => previewTemplate(FOUND_KEY, foundSubject, foundMessage, setFoundPreviewError)}
          status={foundStatus}
          previewError={foundPreviewError}
        />
        <EditorFields
          label="When no order is found"
          helpText="Sent when the contact form is submitted as Order Status, and info couldn't be found."
          subject={notFoundSubject}
          setSubject={setNotFoundSubject}
          message={notFoundMessage}
          setMessage={setNotFoundMessage}
          onSave={() => saveTemplate(NOT_FOUND_KEY, notFoundSubject, notFoundMessage, setNotFoundStatus)}
          onPreview={() =>
            previewTemplate(NOT_FOUND_KEY, notFoundSubject, notFoundMessage, setNotFoundPreviewError)
          }
          status={notFoundStatus}
          previewError={notFoundPreviewError}
        />
      </div>
    </div>
  );
}
