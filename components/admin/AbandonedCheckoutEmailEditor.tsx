"use client";

import { useState } from "react";
import { RichTextEditor } from "./RichTextEditor";
import { formatMoneyCents, formatOrderNumber } from "@/lib/format";

// Kept as literals (not imported from lib/emailTemplates.ts) so this client
// component doesn't pull the Prisma-backed module into the browser bundle.
const REMINDER_KEY = "abandoned_checkout";
const EMOTIONAL_KEY = "abandoned_checkout_emotional";
const FINAL_KEY = "abandoned_checkout_final";

type RecoveredOrder = {
  orderId: string;
  email: string;
  amountCents: number;
  currency: string;
  completedAt: Date;
};

type DelayUnit = "minutes" | "hours" | "days";

const UNIT_MINUTES: Record<DelayUnit, number> = { minutes: 1, hours: 60, days: 1440 };

// Picks the largest unit that divides the stored value evenly, so e.g. 1440
// shows as "1 day" instead of "1440 minutes" — falls back to minutes for
// anything odd (like a value someone typed in raw minutes on purpose).
function pickUnit(totalMinutes: number): DelayUnit {
  if (totalMinutes > 0 && totalMinutes % 1440 === 0) return "days";
  if (totalMinutes > 0 && totalMinutes % 60 === 0) return "hours";
  return "minutes";
}

// Storage stays in minutes (matches EmailTemplate.delayMinutes) — this is
// just a friendlier way to enter/read that number. Switching the unit
// re-reads the same total, it doesn't re-interpret the typed number.
function DelayInput({
  totalMinutes,
  onChange,
}: {
  totalMinutes: string;
  onChange: (minutes: string) => void;
}) {
  const [unit, setUnit] = useState<DelayUnit>(() => pickUnit(Number(totalMinutes) || 0));
  const displayValue = (Number(totalMinutes) || 0) / UNIT_MINUTES[unit];

  return (
    <div className="flex max-w-[14rem] gap-2">
      <input
        type="number"
        min={1}
        step="any"
        value={Number.isFinite(displayValue) ? displayValue : ""}
        onChange={(e) => onChange(String(Math.round((Number(e.target.value) || 0) * UNIT_MINUTES[unit])))}
        className="w-20 rounded-md border border-border px-3 py-2 text-sm font-normal normal-case text-foreground outline-none"
      />
      <select
        value={unit}
        onChange={(e) => setUnit(e.target.value as DelayUnit)}
        className="rounded-md border border-border px-2 py-2 text-sm font-normal normal-case text-foreground outline-none"
      >
        <option value="minutes">Minutes</option>
        <option value="hours">Hours</option>
        <option value="days">Days</option>
      </select>
    </div>
  );
}

function EditorFields({
  label,
  helpText,
  subject,
  setSubject,
  message,
  setMessage,
  active,
  setActive,
  delayMinutes,
  setDelayMinutes,
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
  active: boolean;
  setActive: (v: boolean) => void;
  delayMinutes: string;
  setDelayMinutes: (v: string) => void;
  onSave: () => void;
  onPreview: () => void;
  status: "idle" | "saving" | "saved" | "error";
  previewError: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-xs text-muted">{helpText}</p>
      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4"
        />
        Active
      </label>
      <div className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
        Send after
        <DelayInput totalMinutes={delayMinutes} onChange={setDelayMinutes} />
      </div>
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

export function AbandonedCheckoutEmailEditor({
  initialReminderSubject,
  initialReminderMessage,
  initialReminderActive,
  initialReminderDelayMinutes,
  initialEmotionalSubject,
  initialEmotionalMessage,
  initialEmotionalActive,
  initialEmotionalDelayMinutes,
  initialFinalSubject,
  initialFinalMessage,
  initialFinalActive,
  initialFinalDelayMinutes,
  recoveredCount,
  recoveredRevenueCents,
  recoveryCurrency,
  recoveredOrders,
}: {
  initialReminderSubject: string;
  initialReminderMessage: string;
  initialReminderActive: boolean;
  initialReminderDelayMinutes: number;
  initialEmotionalSubject: string;
  initialEmotionalMessage: string;
  initialEmotionalActive: boolean;
  initialEmotionalDelayMinutes: number;
  initialFinalSubject: string;
  initialFinalMessage: string;
  initialFinalActive: boolean;
  initialFinalDelayMinutes: number;
  recoveredCount: number;
  recoveredRevenueCents: number;
  recoveryCurrency: string;
  recoveredOrders: RecoveredOrder[];
}) {
  const [reminderSubject, setReminderSubject] = useState(initialReminderSubject);
  const [reminderMessage, setReminderMessage] = useState(initialReminderMessage);
  const [reminderActive, setReminderActive] = useState(initialReminderActive);
  const [reminderDelayMinutes, setReminderDelayMinutes] = useState(
    String(initialReminderDelayMinutes),
  );
  const [reminderStatus, setReminderStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [reminderPreviewError, setReminderPreviewError] = useState(false);

  const [emotionalSubject, setEmotionalSubject] = useState(initialEmotionalSubject);
  const [emotionalMessage, setEmotionalMessage] = useState(initialEmotionalMessage);
  const [emotionalActive, setEmotionalActive] = useState(initialEmotionalActive);
  const [emotionalDelayMinutes, setEmotionalDelayMinutes] = useState(
    String(initialEmotionalDelayMinutes),
  );
  const [emotionalStatus, setEmotionalStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [emotionalPreviewError, setEmotionalPreviewError] = useState(false);

  const [finalSubject, setFinalSubject] = useState(initialFinalSubject);
  const [finalMessage, setFinalMessage] = useState(initialFinalMessage);
  const [finalActive, setFinalActive] = useState(initialFinalActive);
  const [finalDelayMinutes, setFinalDelayMinutes] = useState(String(initialFinalDelayMinutes));
  const [finalStatus, setFinalStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [finalPreviewError, setFinalPreviewError] = useState(false);

  const [showRecovered, setShowRecovered] = useState(false);

  async function saveTemplate(
    key: string,
    subject: string,
    message: string,
    active: boolean,
    delayMinutes: string,
    fallbackDelayMinutes: number,
    setStatus: (s: "idle" | "saving" | "saved" | "error") => void,
  ) {
    setStatus("saving");
    const res = await fetch("/api/admin/email-templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        subject,
        message,
        active,
        delayMinutes: Number(delayMinutes) || fallbackDelayMinutes,
      }),
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
    <div className="flex w-full max-w-6xl flex-col gap-4 rounded-xl border border-border bg-background p-4 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide">Abandoned checkout</p>
      <div className="rounded-md bg-border/20 px-3 py-2 text-xs">
        <p>
          <span className="font-semibold">{recoveredCount}</span> recovered purchase
          {recoveredCount === 1 ? "" : "s"} so far
          {recoveredCount > 0 && (
            <>
              {" "}
              (<span className="font-semibold">
                {formatMoneyCents(recoveredRevenueCents, recoveryCurrency)}
              </span>{" "}
              in revenue)
            </>
          )}{" "}
          — someone who got any email in this sequence and completed an order afterward.
        </p>
        {recoveredCount > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowRecovered((v) => !v)}
              className="mt-1.5 font-semibold underline underline-offset-2"
            >
              {showRecovered ? "Hide" : "View"} recovered customers
            </button>
            {showRecovered && (
              <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
                {recoveredOrders.map((o) => (
                  <div key={o.orderId} className="flex items-center justify-between gap-3">
                    <span>{o.email}</span>
                    <span className="text-muted">{formatOrderNumber(o.orderId)}</span>
                    <span className="text-muted">{o.completedAt.toLocaleDateString()}</span>
                    <span className="font-semibold">{formatMoneyCents(o.amountCents, o.currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <EditorFields
          label="Reminder (step 1 of 3)"
          helpText="Sent automatically — a scheduled check (external cron) looks for pending carts past the delay below and emails whoever left one, showing the actual items. Use {{firstName}} anywhere below."
          subject={reminderSubject}
          setSubject={setReminderSubject}
          message={reminderMessage}
          setMessage={setReminderMessage}
          active={reminderActive}
          setActive={setReminderActive}
          delayMinutes={reminderDelayMinutes}
          setDelayMinutes={setReminderDelayMinutes}
          onSave={() =>
            saveTemplate(
              REMINDER_KEY,
              reminderSubject,
              reminderMessage,
              reminderActive,
              reminderDelayMinutes,
              initialReminderDelayMinutes,
              setReminderStatus,
            )
          }
          onPreview={() =>
            previewTemplate(REMINDER_KEY, reminderSubject, reminderMessage, setReminderPreviewError)
          }
          status={reminderStatus}
          previewError={reminderPreviewError}
        />
        <EditorFields
          label="Emotional Reminder (step 2 of 3)"
          helpText="Only sent to carts that already got the Reminder and still haven't bought. Use {{firstName}} anywhere below."
          subject={emotionalSubject}
          setSubject={setEmotionalSubject}
          message={emotionalMessage}
          setMessage={setEmotionalMessage}
          active={emotionalActive}
          setActive={setEmotionalActive}
          delayMinutes={emotionalDelayMinutes}
          setDelayMinutes={setEmotionalDelayMinutes}
          onSave={() =>
            saveTemplate(
              EMOTIONAL_KEY,
              emotionalSubject,
              emotionalMessage,
              emotionalActive,
              emotionalDelayMinutes,
              initialEmotionalDelayMinutes,
              setEmotionalStatus,
            )
          }
          onPreview={() =>
            previewTemplate(EMOTIONAL_KEY, emotionalSubject, emotionalMessage, setEmotionalPreviewError)
          }
          status={emotionalStatus}
          previewError={emotionalPreviewError}
        />
        <EditorFields
          label="Final Reminder (step 3 of 3, optional)"
          helpText="Turn off Active if you'd rather stop at two. Only sent to carts that already got the Emotional Reminder and still haven't bought. Use {{firstName}} anywhere below."
          subject={finalSubject}
          setSubject={setFinalSubject}
          message={finalMessage}
          setMessage={setFinalMessage}
          active={finalActive}
          setActive={setFinalActive}
          delayMinutes={finalDelayMinutes}
          setDelayMinutes={setFinalDelayMinutes}
          onSave={() =>
            saveTemplate(
              FINAL_KEY,
              finalSubject,
              finalMessage,
              finalActive,
              finalDelayMinutes,
              initialFinalDelayMinutes,
              setFinalStatus,
            )
          }
          onPreview={() => previewTemplate(FINAL_KEY, finalSubject, finalMessage, setFinalPreviewError)}
          status={finalStatus}
          previewError={finalPreviewError}
        />
      </div>
    </div>
  );
}
