"use client";

import { useEffect, useMemo, useState } from "react";

export type InquiryRow = {
  id: string;
  kind: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  resolved: boolean | null;
  tag: string | null;
  read: boolean;
  starred: boolean;
  createdAt: Date;
};

type ThreadMessage = {
  id: string;
  direction: string;
  fromEmail: string;
  fromName: string | null;
  subject: string | null;
  body: string;
  createdAt: string;
};

type ThreadDetail = InquiryRow & { messages: ThreadMessage[] };

const TAGS = ["collab", "contact", "order_status", "returns", "newsletter", "spam"] as const;

const TAG_LABELS: Record<string, string> = {
  collab: "Collab",
  contact: "Contact",
  order_status: "Order Status",
  returns: "Returns",
  newsletter: "Newsletter",
  spam: "Spam",
};

const TAG_COLORS: Record<string, string> = {
  collab: "bg-pink-50 text-pink-700",
  contact: "bg-border/40 text-muted",
  order_status: "bg-blue-50 text-blue-700",
  returns: "bg-orange-50 text-orange-700",
  newsletter: "bg-purple-50 text-purple-700",
  spam: "bg-red-50 text-red-700",
};

function TagBadge({ tag }: { tag: string | null }) {
  if (!tag) {
    return <span className="rounded-full bg-border/40 px-2 py-0.5 text-xs text-muted">Untagged</span>;
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${TAG_COLORS[tag] ?? "bg-border/40 text-muted"}`}>
      {TAG_LABELS[tag] ?? tag}
    </span>
  );
}

function relativeTime(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

// Same 3-way split as the counts pills above the list — a dot's color
// always matches what its ticket is counted as up there, regardless of
// whether it has the customer-facing poll (Order Status/Returns) or was
// set by hand via "Mark resolved"/"Reopen".
function StatusDot({ resolved }: { resolved: boolean | null }) {
  if (resolved === true) return <span className="h-2 w-2 rounded-full bg-green-500" title="Resolved" />;
  if (resolved === false) return <span className="h-2 w-2 rounded-full bg-red-500" title="Needs review" />;
  return <span className="h-2 w-2 rounded-full bg-amber-400" title="Open" />;
}

function ThreadView({
  row,
  onUpdate,
}: {
  row: InquiryRow;
  onUpdate: (patch: Partial<Pick<InquiryRow, "resolved" | "tag" | "read" | "starred">>) => void;
}) {
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/support/${row.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setThread(data.inquiry as ThreadDetail);
      })
      .finally(() => setLoading(false));
    // Opening a ticket marks it read server-side too (see the GET route) —
    // reflect that locally so the list's bold/dot styling clears right away.
    onUpdate({ read: true });
    // Runs once per mount — the parent remounts this component fresh
    // (key={row.id}) whenever a different ticket is selected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function patch(body: { resolved?: boolean; tag?: string | null; starred?: boolean }) {
    onUpdate(body);
    await fetch(`/api/admin/support/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  }

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true);
    setError(null);
    const res = await fetch(`/api/admin/support/${row.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (res?.ok && data?.message) {
      setThread((t) => (t ? { ...t, messages: [...t.messages, data.message] } : t));
      setReply("");
    } else {
      setError("Couldn't send — check RESEND_API_KEY is configured, then try again.");
    }
    setSending(false);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => patch({ starred: !row.starred })}
            aria-label={row.starred ? "Unstar" : "Star"}
            className={`text-lg leading-none ${row.starred ? "text-amber-500" : "text-muted hover:text-foreground"}`}
          >
            {row.starred ? "★" : "☆"}
          </button>
          <div>
            <p className="text-sm font-semibold">
              {row.firstName} {row.lastName}
            </p>
            <a href={`mailto:${row.email}`} className="text-xs text-muted hover:underline">
              {row.email}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={row.tag ?? ""}
            onChange={(e) => patch({ tag: e.target.value || null })}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide outline-none"
          >
            <option value="">Untagged</option>
            {TAGS.map((t) => (
              <option key={t} value={t}>
                {TAG_LABELS[t]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => patch({ resolved: !(row.resolved === true) })}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-border/40"
          >
            {row.resolved === true ? "Reopen" : "Mark resolved"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="font-semibold text-foreground">
                  {row.firstName} {row.lastName}
                </span>
                <span>{row.createdAt.toLocaleString()}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{row.message}</p>
              {row.phone && <p className="mt-2 text-xs text-muted">Phone: {row.phone}</p>}
            </div>
            {thread?.messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg border p-3 ${
                  m.direction === "outbound"
                    ? "border-foreground/20 bg-foreground/5"
                    : "border-border bg-background"
                }`}
              >
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-semibold text-foreground">
                    {m.direction === "outbound" ? "You" : m.fromName || m.fromEmail}
                  </span>
                  <span>{new Date(m.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{m.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={`Reply to ${row.email}…`}
          rows={3}
          className="rounded-md border border-border px-3 py-2 text-sm outline-none placeholder:text-muted"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={sendReply}
            disabled={sending || !reply.trim()}
            className="w-fit rounded-full border border-foreground bg-foreground px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-background hover:opacity-90 disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send reply"}
          </button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </div>
    </div>
  );
}

type View = "all" | "starred" | "untagged" | (typeof TAGS)[number];

function InboxIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0" aria-hidden="true">
      <path
        d="M2 8.5h3.2l.9 1.8h3.8l.9-1.8H14M2 8.5 3.2 3h9.6L14 8.5M2 8.5v4a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill={filled ? "currentColor" : "none"}
      className="flex-shrink-0"
      aria-hidden="true"
    >
      <path
        d="M8 2.2l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6L8 2.2Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0" aria-hidden="true">
      <path
        d="M8.6 2.5H4a1 1 0 0 0-1 1v4.6a1 1 0 0 0 .3.7l6 6a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4l-6-6a1 1 0 0 0-.7-.3Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="5.5" cy="5.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

function SidebarItem({
  label,
  count,
  active,
  icon,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm ${
        active ? "bg-foreground text-background font-semibold" : "hover:bg-border/40"
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      {count > 0 && <span className={`text-xs ${active ? "text-background" : "text-muted"}`}>{count}</span>}
    </button>
  );
}

export function SupportInbox({ rows: initialRows }: { rows: InquiryRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<View>("all");
  const [statusFilter, setStatusFilter] = useState<"open" | "needs_review" | "resolved" | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const counts = useMemo(() => {
    const needsReview = rows.filter((r) => r.resolved === false).length;
    const resolved = rows.filter((r) => r.resolved === true).length;
    const open = rows.length - needsReview - resolved;
    const unread = rows.filter((r) => !r.read).length;
    const starred = rows.filter((r) => r.starred).length;
    const untagged = rows.filter((r) => !r.tag).length;
    const byTag = Object.fromEntries(TAGS.map((t) => [t, rows.filter((r) => r.tag === t).length]));
    return { needsReview, resolved, open, total: rows.length, unread, starred, untagged, byTag };
  }, [rows]);

  const filtered = useMemo(() => {
    let result = rows;
    if (view === "starred") result = result.filter((r) => r.starred);
    else if (view === "untagged") result = result.filter((r) => !r.tag);
    else if (view !== "all") result = result.filter((r) => r.tag === view);

    if (statusFilter === "open") result = result.filter((r) => r.resolved === null);
    else if (statusFilter === "needs_review") result = result.filter((r) => r.resolved === false);
    else if (statusFilter === "resolved") result = result.filter((r) => r.resolved === true);

    return result;
  }, [rows, view, statusFilter]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  function updateRow(id: string, patch: Partial<Pick<InquiryRow, "resolved" | "tag" | "read" | "starred">>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function toggleChecked(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runBulk(action: "spam" | "unspam" | "read" | "unread" | "star" | "unstar") {
    const ids = [...checkedIds];
    if (ids.length === 0) return;
    setBulkBusy(true);
    const res = await fetch("/api/admin/support/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action }),
    }).catch(() => null);
    if (res?.ok) {
      setRows((prev) =>
        prev.map((r) => {
          if (!ids.includes(r.id)) return r;
          if (action === "spam") return { ...r, tag: "spam" };
          if (action === "unspam") return { ...r, tag: null };
          if (action === "read") return { ...r, read: true };
          if (action === "unread") return { ...r, read: false };
          if (action === "star") return { ...r, starred: true };
          return { ...r, starred: false };
        })
      );
      setCheckedIds(new Set());
    }
    setBulkBusy(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <button
          type="button"
          onClick={() => setStatusFilter((f) => (f === "open" ? null : "open"))}
          className={`rounded-full px-3 py-1 font-semibold text-amber-700 ${
            statusFilter === "open" ? "bg-amber-200" : "bg-amber-50 hover:bg-amber-100"
          }`}
        >
          {counts.open} open
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter((f) => (f === "needs_review" ? null : "needs_review"))}
          className={`rounded-full px-3 py-1 font-semibold text-red-700 ${
            statusFilter === "needs_review" ? "bg-red-200" : "bg-red-50 hover:bg-red-100"
          }`}
        >
          {counts.needsReview} needs review
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter((f) => (f === "resolved" ? null : "resolved"))}
          className={`rounded-full px-3 py-1 font-semibold text-green-700 ${
            statusFilter === "resolved" ? "bg-green-200" : "bg-green-50 hover:bg-green-100"
          }`}
        >
          {counts.resolved} resolved
        </button>
        <span className="text-muted">{counts.total} total</span>
        {statusFilter && (
          <button
            type="button"
            onClick={() => setStatusFilter(null)}
            className="text-xs font-semibold uppercase tracking-wide text-muted underline underline-offset-2"
          >
            Clear
          </button>
        )}
      </div>

      {checkedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-foreground bg-foreground/5 px-4 py-2">
          <span className="text-sm font-semibold">{checkedIds.size} selected</span>
          {view === "spam" ? (
            <button
              type="button"
              onClick={() => runBulk("unspam")}
              disabled={bulkBusy}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-border/40 disabled:opacity-50"
            >
              Not spam
            </button>
          ) : (
            <button
              type="button"
              onClick={() => runBulk("spam")}
              disabled={bulkBusy}
              className="rounded-full border border-red-600 bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50"
            >
              Mark spam
            </button>
          )}
          <button
            type="button"
            onClick={() => runBulk("read")}
            disabled={bulkBusy}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-border/40 disabled:opacity-50"
          >
            Mark read
          </button>
          <button
            type="button"
            onClick={() => runBulk("unread")}
            disabled={bulkBusy}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-border/40 disabled:opacity-50"
          >
            Mark unread
          </button>
          <button
            type="button"
            onClick={() => runBulk("star")}
            disabled={bulkBusy}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-border/40 disabled:opacity-50"
          >
            Star
          </button>
          <button
            type="button"
            onClick={() => setCheckedIds(new Set())}
            className="text-xs font-semibold uppercase tracking-wide text-muted underline underline-offset-2"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex h-[70vh] overflow-hidden rounded-xl border border-border bg-background">
        <div className="flex w-52 flex-shrink-0 flex-col gap-1 overflow-y-auto border-r border-border p-3">
          <SidebarItem
            label="Inbox"
            count={counts.unread}
            active={view === "all"}
            icon={<InboxIcon />}
            onClick={() => setView("all")}
          />
          <SidebarItem
            label="Starred"
            count={counts.starred}
            active={view === "starred"}
            icon={<StarIcon filled={view === "starred"} />}
            onClick={() => setView("starred")}
          />
          <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-wide text-muted">Labels</p>
          {TAGS.map((t) => (
            <SidebarItem
              key={t}
              label={TAG_LABELS[t]}
              count={counts.byTag[t] ?? 0}
              active={view === t}
              icon={<TagIcon />}
              onClick={() => setView(t)}
            />
          ))}
          <SidebarItem
            label="Untagged"
            count={counts.untagged}
            active={view === "untagged"}
            icon={<TagIcon />}
            onClick={() => setView("untagged")}
          />
        </div>

        <div className="flex w-80 flex-shrink-0 flex-col divide-y divide-border overflow-y-auto border-r border-border">
          {filtered.length === 0 && <p className="p-4 text-sm text-muted">No tickets here.</p>}
          {filtered.map((r) => (
            <div
              key={r.id}
              className={`flex items-start gap-2 px-3 py-3 hover:bg-border/10 ${
                selectedId === r.id ? "bg-border/20" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={checkedIds.has(r.id)}
                onChange={() => toggleChecked(r.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1.5 h-3.5 w-3.5 flex-shrink-0"
              />
              <button
                type="button"
                onClick={() => setSelectedId(r.id)}
                className="flex flex-1 flex-col gap-1 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {r.starred && <span className="text-amber-500">★</span>}
                    {!r.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" title="Unread" />}
                    <StatusDot resolved={r.resolved} />
                    <span className={`text-sm ${r.read ? "font-normal" : "font-semibold"}`}>
                      {r.firstName} {r.lastName}
                    </span>
                  </div>
                  <span className="text-xs text-muted">{relativeTime(r.createdAt)}</span>
                </div>
                <p className={`truncate text-xs ${r.read ? "text-muted" : "text-foreground"}`}>
                  {r.subject ?? r.message}
                </p>
                <TagBadge tag={r.tag} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex-1">
          {selected ? (
            <ThreadView key={selected.id} row={selected} onUpdate={(patch) => updateRow(selected.id, patch)} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              Select a ticket to view it
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
