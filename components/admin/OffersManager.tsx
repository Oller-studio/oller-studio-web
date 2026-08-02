"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OfferType } from "@/lib/offers";

type OfferRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  active: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  partner: { id: string; firstName: string; lastName: string | null; type: string } | null;
};

function formatValue(o: { type: string; value: number }) {
  return o.type === "percentage" ? `${o.value}%` : `${(o.value / 100).toFixed(2)} €`;
}

function isExpired(o: { expiresAt: Date | null }) {
  return Boolean(o.expiresAt && new Date(o.expiresAt) < new Date());
}

function isScheduled(o: { startsAt: Date | null }) {
  return Boolean(o.startsAt && new Date(o.startsAt) > new Date());
}

function computedStatus(o: {
  active: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
}): "expired" | "inactive" | "active" {
  if (isExpired(o)) return "expired";
  if (!o.active || isScheduled(o)) return "inactive";
  return "active";
}

function toDateInputValue(d: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 2h12M3.5 7h7M6 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function OfferForm({
  editing,
  partners,
  onDone,
}: {
  editing?: OfferRow;
  partners: { id: string; firstName: string; lastName: string | null }[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valueInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    code: editing?.code ?? "",
    type: (editing?.type as OfferType) ?? "percentage",
    value: editing ? String(editing.type === "fixed" ? editing.value / 100 : editing.value) : "",
    appliesTo: (editing?.partner ? "partner" : "standalone") as "standalone" | "partner",
    partnerId: editing?.partner?.id ?? "",
    startsAt: toDateInputValue(editing?.startsAt ?? null),
    expiresAt: toDateInputValue(editing?.expiresAt ?? null),
  });

  async function saveOffer(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(form.value);
    if (!form.code.trim() || !Number.isFinite(value) || value <= 0) return;
    if (form.appliesTo === "partner" && !form.partnerId) return;
    setSaving(true);
    setError(null);
    const body = {
      code: form.code,
      type: form.type,
      value: form.type === "fixed" ? Math.round(value * 100) : value,
      partnerId: form.appliesTo === "partner" ? form.partnerId : null,
      startsAt: form.startsAt || null,
      expiresAt: form.expiresAt || null,
    };
    const res = await fetch(
      editing ? `/api/admin/offers/${editing.id}` : "/api/admin/offers",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    ).catch(() => null);
    setSaving(false);
    if (!res || !res.ok) {
      const data = res ? await res.json().catch(() => null) : null;
      setError(data?.reason ?? "Something went wrong saving this offer.");
      return;
    }
    router.refresh();
    onDone();
  }

  return (
    <form
      onSubmit={saveOffer}
      className="flex w-full max-w-md flex-col gap-3 rounded-xl border border-border bg-background p-4"
    >
      <p className="text-sm font-semibold">{editing ? "Edit offer" : "New offer"}</p>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">Discount code</span>
        <input
          type="text"
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              valueInputRef.current?.focus();
            }
          }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm uppercase"
        />
        <span className="text-xs text-muted">Customers must enter this code at checkout.</span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Discount value</span>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as OfferType }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Value</span>
          <div className="relative">
            <input
              ref={valueInputRef}
              type="number"
              min="0"
              step={form.type === "percentage" ? "1" : "0.01"}
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-7 text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
              {form.type === "percentage" ? "%" : "€"}
            </span>
          </div>
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Applies to</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, appliesTo: "standalone", partnerId: "" }))}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium hover:opacity-80 ${
              form.appliesTo === "standalone" ? "bg-foreground text-background" : "bg-border/40"
            }`}
          >
            Standalone code
          </button>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, appliesTo: "partner" }))}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium hover:opacity-80 ${
              form.appliesTo === "partner" ? "bg-foreground text-background" : "bg-border/40"
            }`}
          >
            Partner
          </button>
        </div>
        {form.appliesTo === "partner" && (
          <select
            value={form.partnerId}
            onChange={(e) => setForm((f) => ({ ...f, partnerId: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Pick a partner…
            </option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {[p.firstName, p.lastName].filter(Boolean).join(" ")}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Starts (optional)</span>
          <input
            type="date"
            value={form.startsAt}
            onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Expires (optional)</span>
          <input
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="text-sm text-muted underline underline-offset-2 hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save offer"}
        </button>
      </div>
    </form>
  );
}

export function OffersManager({
  offers,
  partners,
}: {
  offers: OfferRow[];
  partners: { id: string; firstName: string; lastName: string | null }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [addingNew, setAddingNew] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [appliesToFilter, setAppliesToFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId) return;
    // Deferred one microtask so the setState call happens in a callback
    // rather than synchronously at the top of the effect body.
    Promise.resolve().then(() => {
      const match = offers.find((o) => o.id === editId);
      if (match) setEditingOffer(match);
      router.replace("/admin/marketing/offers");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!filtersOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [filtersOpen]);

  const q = query.trim().toLowerCase();
  const advancedActive = Boolean(typeFilter || appliesToFilter || statusFilter);
  const filtered = offers.filter((o) => {
    if (typeFilter && o.type !== typeFilter) return false;
    if (appliesToFilter === "standalone" && o.partner) return false;
    if (appliesToFilter && appliesToFilter !== "standalone" && o.partner?.type !== appliesToFilter) {
      return false;
    }
    if (statusFilter && computedStatus(o) !== statusFilter) return false;
    if (!q) return true;
    return o.code.toLowerCase().includes(q);
  });

  async function toggleActive(id: string, active: boolean) {
    setBusyId(id);
    await fetch(`/api/admin/offers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    }).catch(() => {});
    setBusyId(null);
    router.refresh();
  }

  async function remove(id: string, code: string) {
    if (!confirm(`Remove code ${code}? This can't be undone.`)) return;
    setBusyId(id);
    await fetch(`/api/admin/offers/${id}`, { method: "DELETE" }).catch(() => {});
    setBusyId(null);
    router.refresh();
  }

  function openEdit(o: OfferRow) {
    setAddingNew(false);
    setEditingOffer(o);
  }

  function closeForm() {
    setAddingNew(false);
    setEditingOffer(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted">Offers</h2>

      <div className="flex w-full items-center gap-2">
        {offers.length > 0 && (
          <>
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5">
              <SearchIcon />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by code…"
                className="w-48 bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </div>
            <div ref={filtersRef} className="relative">
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-label="More filters"
                title="More filters"
                className="flex items-center gap-1 rounded-full border border-border bg-background p-2 hover:bg-border/40"
              >
                <FilterIcon />
                {advancedActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
                )}
              </button>
              {filtersOpen && (
                <div className="absolute left-0 top-full z-40 mt-2 w-56 rounded-xl border border-border bg-background p-4 shadow-xl">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide text-muted">Type</label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">All types</option>
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed amount</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide text-muted">Applies to</label>
                      <select
                        value={appliesToFilter}
                        onChange={(e) => setAppliesToFilter(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">All</option>
                        <option value="standalone">Standalone</option>
                        <option value="influencer">Influencer</option>
                        <option value="referral">Referral</option>
                        <option value="collaborator">Collaborator</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide text-muted">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">All statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                    {advancedActive && (
                      <button
                        type="button"
                        onClick={() => {
                          setTypeFilter("");
                          setAppliesToFilter("");
                          setStatusFilter("");
                        }}
                        className="self-start text-xs text-muted underline underline-offset-2 hover:text-foreground"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        <button
          type="button"
          onClick={() => {
            setEditingOffer(null);
            setAddingNew((v) => !v);
          }}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
        >
          {addingNew ? "Cancel" : "Add offer"}
        </button>
      </div>

      {(addingNew || editingOffer) && (
        <OfferForm
          key={editingOffer?.id ?? "new"}
          editing={editingOffer ?? undefined}
          partners={partners}
          onDone={closeForm}
        />
      )}

      {offers.length === 0 ? (
        <p className="text-sm text-muted">No offers yet.</p>
      ) : (
        <div className="w-fit overflow-hidden rounded-xl border border-border bg-background">
          <table className="border-collapse">
            <thead>
              <tr className="bg-border/20 text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="whitespace-nowrap py-2 pl-5 pr-7 text-left">Code</th>
                <th className="whitespace-nowrap py-2 pr-7 text-right">Value</th>
                <th className="whitespace-nowrap py-2 pr-7 text-left">Type</th>
                <th className="min-w-[8rem] whitespace-nowrap py-2 pr-7 text-left">Applies to</th>
                <th className="whitespace-nowrap py-2 pr-7 text-left">Expires</th>
                <th className="whitespace-nowrap py-2 pr-7 text-left">Status</th>
                <th className="whitespace-nowrap py-2 pr-6 text-left" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-sm text-muted">
                    No offers match &ldquo;{query}&rdquo;.
                  </td>
                </tr>
              )}
              {filtered.map((o) => {
                const status = computedStatus(o);
                return (
                  <tr
                    key={o.id}
                    className={`hover:bg-border/10 ${status !== "active" ? "opacity-50" : ""}`}
                  >
                    <td className="whitespace-nowrap py-3 pl-5 pr-7 text-sm font-semibold">
                      <button
                        type="button"
                        onClick={() => openEdit(o)}
                        className="hover:underline"
                      >
                        {o.code}
                      </button>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-right text-sm">
                      {formatValue(o)}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">
                      {o.type === "percentage" ? "Percentage" : "Fixed amount"}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-sm text-muted">
                      {o.partner ? (
                        [o.partner.firstName, o.partner.lastName].filter(Boolean).join(" ")
                      ) : (
                        "Standalone"
                      )}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-sm">
                      {o.expiresAt ? (
                        new Date(o.expiresAt).toLocaleDateString()
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          status === "expired"
                            ? "bg-amber-50 text-amber-700"
                            : status === "inactive"
                              ? "bg-border/40 text-muted"
                              : "bg-green-50 text-green-700"
                        }`}
                      >
                        {status === "expired" ? "Expired" : status === "inactive" ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-6 text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={busyId === o.id}
                          onClick={() => toggleActive(o.id, !o.active)}
                          className="font-semibold underline underline-offset-2 hover:text-foreground disabled:opacity-50"
                        >
                          {o.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === o.id}
                          onClick={() => remove(o.id, o.code)}
                          className="text-red-600 underline underline-offset-2 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
