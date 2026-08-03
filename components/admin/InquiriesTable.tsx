"use client";

import { Fragment, useState } from "react";

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
  createdAt: Date;
};

const KIND_LABELS: Record<string, string> = {
  contact: "Contact",
  collab: "Collab",
};

const KIND_COLORS: Record<string, string> = {
  contact: "bg-border/40 text-muted",
  collab: "bg-pink-50 text-pink-700",
};

function hasPoll(row: InquiryRow) {
  return row.kind === "contact" && (row.subject === "Order Status" || row.subject === "Returns & Exchanges");
}

function ResolvedBadge({ row }: { row: InquiryRow }) {
  if (!hasPoll(row)) {
    return <span className="text-xs text-muted">—</span>;
  }
  if (row.resolved === true) {
    return <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">Resolved</span>;
  }
  if (row.resolved === false) {
    return <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">Needs review</span>;
  }
  return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Pending</span>;
}

export function InquiriesTable({ rows }: { rows: InquiryRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-background">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-border/20 text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="whitespace-nowrap py-2 pl-5 pr-7 text-left">Name</th>
            <th className="whitespace-nowrap py-2 pr-7 text-left">Kind</th>
            <th className="whitespace-nowrap py-2 pr-7 text-left">Subject</th>
            <th className="whitespace-nowrap py-2 pr-7 text-left">Email</th>
            <th className="whitespace-nowrap py-2 pr-7 text-left">Resolved</th>
            <th className="whitespace-nowrap py-2 pr-7 text-left">Received</th>
            <th className="whitespace-nowrap py-2 pr-6 text-left" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => {
            const expanded = expandedId === r.id;
            return (
              <Fragment key={r.id}>
                <tr
                  onClick={() => setExpandedId(expanded ? null : r.id)}
                  className={`cursor-pointer hover:bg-border/10 ${expanded ? "bg-border/10" : ""}`}
                >
                  <td className="whitespace-nowrap py-3 pl-5 pr-7 text-sm font-semibold">
                    {r.firstName} {r.lastName}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-7 text-xs">
                    <span className={`rounded-full px-2 py-0.5 ${KIND_COLORS[r.kind] ?? ""}`}>
                      {KIND_LABELS[r.kind] ?? r.kind}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-3 pr-7 text-sm text-muted">
                    {r.subject ?? "—"}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">
                    <a href={`mailto:${r.email}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                      {r.email}
                    </a>
                  </td>
                  <td className="whitespace-nowrap py-3 pr-7 text-xs">
                    <ResolvedBadge row={r} />
                  </td>
                  <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">
                    {r.createdAt.toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-6 text-xs">
                    <span className="font-semibold underline underline-offset-2">
                      {expanded ? "Close" : "View"}
                    </span>
                  </td>
                </tr>
                {expanded && (
                  <tr>
                    <td colSpan={7} className="bg-border/5 p-4">
                      <p className="max-w-xl whitespace-pre-wrap text-sm">{r.message}</p>
                      {r.phone && <p className="mt-2 text-xs text-muted">Phone: {r.phone}</p>}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
