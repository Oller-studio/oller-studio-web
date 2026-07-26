"use client";

import { useState } from "react";

const SUBJECTS = ["General Enquiry", "Order Status", "Returns & Exchanges", "Collab"];

export function ContactForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (status === "sent") {
    return (
      <p className="rounded-xl border border-border px-6 py-5 text-center text-sm font-medium">
        Thanks — your message is on its way. I&apos;ll get back to you soon.
      </p>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus("sending");
        try {
          const res = await fetch("/api/contact-inquiry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, lastName, email, subject, message }),
          });
          setStatus(res.ok ? "sent" : "error");
        } catch {
          setStatus("error");
        }
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          type="text"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
          className="rounded-none border border-border bg-transparent px-4 py-4 text-sm outline-none focus:border-foreground"
        />
        <input
          type="text"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name"
          className="rounded-none border border-border bg-transparent px-4 py-4 text-sm outline-none focus:border-foreground"
        />
      </div>

      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="rounded-none border border-border bg-transparent px-4 py-4 text-sm outline-none focus:border-foreground"
      />

      <select
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="rounded-none border border-border bg-transparent px-4 py-4 text-sm outline-none focus:border-foreground"
      >
        {SUBJECTS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <textarea
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Your message"
        rows={8}
        maxLength={2000}
        className="resize-none rounded-none border border-border bg-transparent px-4 py-4 text-sm outline-none focus:border-foreground"
      />

      <button
        type="submit"
        disabled={status === "sending"}
        className="bg-foreground py-4 text-sm font-semibold uppercase tracking-wide text-background disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>

      {status === "error" && (
        <p className="text-xs text-accent">Something went wrong — try again in a moment.</p>
      )}
    </form>
  );
}
