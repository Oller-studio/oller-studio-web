"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoneyCents } from "@/lib/format";
import type { SourcePerformance } from "@/lib/analytics";
import type { PartnerType } from "@/lib/partners";
import { slugifyUtmSource } from "@/lib/utmSlug";

type LinkRow = { id: string; platform: string; utmSource: string };

type PartnerRow = {
  id: string;
  type: string;
  firstName: string;
  lastName: string | null;
  couponCode: string | null;
  active: boolean;
  links: LinkRow[];
  overall: SourcePerformance;
  byLink: Record<string, SourcePerformance>;
};

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="3" cy="8" r="1.3" fill="currentColor" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" />
      <circle cx="13" cy="8" r="1.3" fill="currentColor" />
    </svg>
  );
}

const TYPE_LABELS: Record<string, string> = {
  influencer: "Influencer",
  referral: "Referral",
  collaborator: "Collaborator",
};

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

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={`shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
      aria-hidden="true"
    >
      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(link).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-full border border-border px-2 py-1 text-xs font-semibold hover:bg-border/40"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}

function linkUrl(utmSource: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/?utm_source=${utmSource}`;
}

function PartnerDetail({
  partner,
  channels,
}: {
  partner: PartnerRow;
  channels: { id: string; name: string }[];
}) {
  const [removing, setRemoving] = useState(false);
  const [addingLink, setAddingLink] = useState(false);
  const [newPlatform, setNewPlatform] = useState("");
  const [editingCoupon, setEditingCoupon] = useState(false);
  const [couponInput, setCouponInput] = useState(partner.couponCode ?? "");
  const [savingCoupon, setSavingCoupon] = useState(false);
  const router = useRouter();
  const fullName = [partner.firstName, partner.lastName].filter(Boolean).join(" ");
  const p = partner.overall;
  const unusedChannels = channels.filter((c) => !partner.links.some((l) => l.platform === c.name));

  async function remove() {
    if (!confirm(`Remove ${fullName}? Their past sessions/orders stay in Analytics either way.`)) {
      return;
    }
    setRemoving(true);
    await fetch(`/api/admin/partners/${partner.id}`, { method: "DELETE" }).catch(() => {});
    router.refresh();
  }

  async function addLink(platform: string) {
    if (!platform.trim()) return;
    await fetch(`/api/admin/partners/${partner.id}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: platform.trim() }),
    }).catch(() => {});
    setNewPlatform("");
    setAddingLink(false);
    router.refresh();
  }

  async function removeLink(linkId: string) {
    await fetch(`/api/admin/partners/${partner.id}/links/${linkId}`, { method: "DELETE" }).catch(
      () => {}
    );
    router.refresh();
  }

  async function saveCoupon(next: string | null) {
    setSavingCoupon(true);
    await fetch(`/api/admin/partners/${partner.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ couponCode: next }),
    }).catch(() => {});
    setSavingCoupon(false);
    setEditingCoupon(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
      {editingCoupon ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Coupon code:</span>
          <input
            type="text"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder="MARIA10"
            className="w-32 rounded-lg border border-border bg-background px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => saveCoupon(couponInput.trim() || null)}
            disabled={savingCoupon}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:bg-border/40 disabled:opacity-50"
          >
            {savingCoupon ? "Saving…" : "Save"}
          </button>
          {partner.couponCode && (
            <button
              type="button"
              onClick={() => {
                setCouponInput("");
                saveCoupon(null);
              }}
              disabled={savingCoupon}
              className="text-xs text-red-600 underline underline-offset-2 disabled:opacity-50"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setCouponInput(partner.couponCode ?? "");
              setEditingCoupon(false);
            }}
            className="text-xs text-muted underline underline-offset-2"
          >
            Cancel
          </button>
        </div>
      ) : (
        <p className="text-sm">
          Coupon code:{" "}
          <span className="font-semibold">{partner.couponCode ?? "None"}</span>{" "}
          <span className="text-xs text-muted">
            {partner.couponCode ? "— not applied at checkout yet" : ""}
          </span>{" "}
          <button
            type="button"
            onClick={() => setEditingCoupon(true)}
            className="text-xs font-semibold underline underline-offset-2 hover:text-foreground"
          >
            Edit
          </button>
        </p>
      )}

      <div className="grid grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted">Sessions</p>
          <p className="font-semibold">{p.sessions}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Orders</p>
          <p className="font-semibold">{p.orders}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Conv. rate</p>
          <p className="font-semibold">{p.conversionRate.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-muted">Revenue</p>
          <p className="font-semibold">{formatMoneyCents(p.revenueCents, "EUR")}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Links by channel</p>
        {partner.links.map((l) => {
          const stats = partner.byLink[l.id];
          return (
            <div
              key={l.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-2 text-sm"
            >
              <span className="font-medium">{l.platform}</span>
              <code className="rounded bg-border/20 px-2 py-0.5 text-xs">{linkUrl(l.utmSource)}</code>
              <CopyLinkButton link={linkUrl(l.utmSource)} />
              <span className="text-xs text-muted">
                {stats.sessions} sessions · {stats.orders} orders ·{" "}
                {formatMoneyCents(stats.revenueCents, "EUR")}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeLink(l.id);
                }}
                className="ml-auto text-xs text-red-600 underline underline-offset-2"
              >
                Remove
              </button>
            </div>
          );
        })}

        {addingLink ? (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <select
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="">Pick a channel…</option>
              {unusedChannels.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => addLink(newPlatform)}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-border/40"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setAddingLink(false)}
              className="text-xs text-muted underline underline-offset-2"
            >
              Cancel
            </button>
          </div>
        ) : (
          unusedChannels.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAddingLink(true);
              }}
              className="w-fit text-xs font-semibold underline underline-offset-2 hover:text-foreground"
            >
              + Add another channel
            </button>
          )
        )}
      </div>

      {p.topProducts.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">Top bags sold</p>
          {p.topProducts.map((tp) => (
            <div key={tp.slug} className="flex items-center justify-between text-sm">
              <span>{tp.name}</span>
              <span className="text-muted">{tp.sales}</span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          remove();
        }}
        disabled={removing}
        className="w-fit text-xs font-semibold text-red-600 underline underline-offset-2 disabled:opacity-50"
      >
        {removing ? "Removing…" : "Remove partner"}
      </button>
    </div>
  );
}

function AddPartnerForm({
  channels,
  onDone,
}: {
  channels: { id: string; name: string }[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingChannel, setAddingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [form, setForm] = useState({
    type: "" as PartnerType | "",
    firstName: "",
    lastName: "",
    couponCode: "",
    platforms: [] as string[],
  });
  const isBrand = form.type === "collaborator";
  // A referral is word-of-mouth, not a social post — no point asking which
  // platform, it's just "organic" by definition.
  const isReferral = form.type === "referral";

  function setType(type: PartnerType) {
    setForm((f) => ({
      ...f,
      type,
      platforms: type === "referral" ? ["Organic"] : f.platforms,
    }));
  }

  async function addPartner(e: React.FormEvent) {
    e.preventDefault();
    if (!form.type || !form.firstName.trim() || form.platforms.length === 0) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).catch(() => null);
    setSaving(false);
    if (!res || !res.ok) {
      const data = res ? await res.json().catch(() => null) : null;
      setError(data?.reason ?? "Something went wrong adding this partner.");
      return;
    }
    router.refresh();
    onDone();
  }

  async function addChannel() {
    if (!newChannelName.trim()) return;
    await fetch("/api/admin/distribution-channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newChannelName.trim() }),
    }).catch(() => {});
    setNewChannelName("");
    setAddingChannel(false);
    router.refresh();
  }

  function togglePlatform(name: string) {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(name)
        ? f.platforms.filter((p) => p !== name)
        : [...f.platforms, name],
    }));
  }

  return (
    <form onSubmit={addPartner} className="flex w-full max-w-3xl flex-col gap-3 rounded-xl border border-border bg-background p-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">Type</span>
        <select
          value={form.type}
          onChange={(e) => setType(e.target.value as PartnerType)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Pick a type…
          </option>
          <option value="influencer">Influencer</option>
          <option value="referral">Referral</option>
          <option value="collaborator">Collaborator (brand)</option>
        </select>
      </label>

      {form.type && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {isBrand ? (
              <label className="col-span-2 flex flex-col gap-1">
                <span className="text-sm font-semibold">Brand or company name</span>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
            ) : (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">First name</span>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    placeholder="Maria"
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">Last name</span>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    placeholder="García"
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
              </>
            )}

            {isReferral ? (
              <p className="col-span-2 text-sm text-muted">
                Referrals are word-of-mouth, so this gets a single{" "}
                <span className="font-semibold text-foreground">Organic</span> link — no
                platform to pick.
              </p>
            ) : (
              <div className="col-span-2 flex flex-col gap-1">
                <span className="text-sm font-semibold">Distribution channels</span>
                <div className="flex flex-wrap items-center gap-2">
                  {channels.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => togglePlatform(c.name)}
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                        form.platforms.includes(c.name)
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:bg-border/40"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}

                  {addingChannel ? (
                    <span className="flex shrink-0 items-center gap-1">
                      <input
                        type="text"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        placeholder="YouTube"
                        className="w-28 rounded-full border border-border bg-background px-3 py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={addChannel}
                        className="rounded-full border border-border px-2 py-1 text-xs font-semibold hover:bg-border/40"
                      >
                        Add
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingChannel(true)}
                      className="shrink-0 rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted hover:text-foreground"
                    >
                      + New channel
                    </button>
                  )}
                </div>
                {form.firstName.trim() && form.platforms.length > 0 ? (
                  <div className="flex flex-col gap-1 rounded-lg bg-border/10 p-2">
                    <p className="text-xs font-semibold text-muted">
                      Links that will be created:
                    </p>
                    {form.platforms.map((platform) => {
                      const origin = typeof window !== "undefined" ? window.location.origin : "";
                      const utmSource = `${slugifyUtmSource(form.firstName)}_${slugifyUtmSource(platform)}`;
                      return (
                        <code key={platform} className="text-xs">
                          {platform}: {origin}/?utm_source={utmSource}
                        </code>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted">
                    Each channel picked gets its own tracked link — enter a name above to preview
                    it.
                  </p>
                )}
              </div>
            )}

            <label className="flex max-w-xs flex-col gap-1">
              <span className="text-sm font-semibold">Coupon code (optional)</span>
              <input
                type="text"
                value={form.couponCode}
                onChange={(e) => setForm((f) => ({ ...f, couponCode: e.target.value }))}
                placeholder="MARIA10"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <span className="text-xs text-muted">Not applied at checkout yet.</span>
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add partner"}
            </button>
            <button
              type="button"
              onClick={onDone}
              className="text-sm text-muted underline underline-offset-2 hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </form>
  );
}

export function PartnersManager({
  partners,
  channels,
}: {
  partners: PartnerRow[];
  channels: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [moreOpen]);

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
  const advancedActive = Boolean(typeFilter || channelFilter || statusFilter);
  const filtered = partners.filter((p) => {
    if (typeFilter && p.type !== typeFilter) return false;
    if (channelFilter && !p.links.some((l) => l.platform === channelFilter)) return false;
    if (statusFilter === "active" && !p.active) return false;
    if (statusFilter === "inactive" && p.active) return false;
    if (!q) return true;
    const fullName = `${p.firstName} ${p.lastName ?? ""}`.toLowerCase();
    return (
      fullName.includes(q) || p.links.some((l) => l.platform.toLowerCase().includes(q))
    );
  });

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map((p) => p.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runBulk(action: "activate" | "deactivate" | "delete") {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (action === "delete" && !confirm(`Remove ${ids.length} partner(s)? This can't be undone.`)) {
      return;
    }
    setBulkBusy(true);
    setMoreOpen(false);
    await fetch("/api/admin/partners/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action }),
    }).catch(() => {});
    setBulkBusy(false);
    setSelected(new Set());
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">Partners</h2>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm">
          <button
            type="button"
            onClick={toggleAll}
            className="flex h-5 w-5 items-center justify-center rounded border border-border bg-foreground text-background"
            aria-label="Clear selection"
          >
            −
          </button>
          <span className="font-medium">{selected.size} selected</span>
          <select
            aria-label="Change status"
            defaultValue=""
            disabled={bulkBusy}
            onChange={(e) => {
              const action = e.target.value as "activate" | "deactivate";
              e.target.value = "";
              if (action) runBulk(action);
            }}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold hover:bg-border/40 disabled:opacity-50"
          >
            <option value="" disabled>
              {bulkBusy ? "Updating…" : "Change status"}
            </option>
            <option value="activate">Activate</option>
            <option value="deactivate">Deactivate</option>
          </select>
          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-label="More bulk actions"
              className="rounded-full border border-border p-2 hover:bg-border/40"
            >
              <MoreIcon />
            </button>
            {moreOpen && (
              <div className="absolute left-0 top-full z-40 mt-2 w-48 rounded-lg border border-border bg-background py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => runBulk("delete")}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Delete partners
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex w-full items-center gap-2">
        {partners.length > 0 && (
          <>
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5">
              <SearchIcon />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or channel…"
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
                        <option value="influencer">Influencer</option>
                        <option value="referral">Referral</option>
                        <option value="collaborator">Collaborator</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs uppercase tracking-wide text-muted">Channel</label>
                      <select
                        value={channelFilter}
                        onChange={(e) => setChannelFilter(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">All channels</option>
                        {channels.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
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
                      </select>
                    </div>
                    {advancedActive && (
                      <button
                        type="button"
                        onClick={() => {
                          setTypeFilter("");
                          setChannelFilter("");
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
            setAddingNew((v) => !v);
            setOpenId(null);
          }}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
        >
          {addingNew ? "Cancel" : "Add partner"}
        </button>
      </div>

      {partners.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-border/20 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="whitespace-nowrap py-2 pl-5 pr-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Select all"
                      className="h-4 w-4"
                    />
                  </th>
                  <th className="whitespace-nowrap py-2 pr-3 text-left"></th>
                  <th className="whitespace-nowrap py-2 pr-7 text-left">Name</th>
                  <th className="whitespace-nowrap py-2 pr-7 text-left">Type</th>
                  <th className="whitespace-nowrap py-2 pr-7 text-left">Channels</th>
                  <th className="whitespace-nowrap py-2 pr-7 text-left">Status</th>
                  <th className="whitespace-nowrap py-2 pr-7 text-right">Sessions</th>
                  <th className="whitespace-nowrap py-2 pr-7 text-right">Orders</th>
                  <th className="whitespace-nowrap py-2 pr-6 text-right">Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-4 text-center text-sm text-muted">
                      No partners match &ldquo;{query}&rdquo;.
                    </td>
                  </tr>
                )}
                {filtered.map((p) => {
                  const open = openId === p.id;
                  const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ");
                  return (
                    <Fragment key={p.id}>
                      <tr
                        onClick={() => {
                          setOpenId(open ? null : p.id);
                          setAddingNew(false);
                        }}
                        className={`cursor-pointer hover:bg-border/10 ${
                          selected.has(p.id) ? "bg-border/10" : ""
                        } ${!p.active ? "opacity-50" : ""}`}
                      >
                        <td className="py-3 pl-5 pr-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.has(p.id)}
                            onChange={() => toggleOne(p.id)}
                            aria-label={`Select ${fullName}`}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="py-3 pr-3 text-muted">
                          <Chevron open={open} />
                        </td>
                        <td className="whitespace-nowrap py-3 pr-7 text-sm font-semibold">
                          {fullName}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">
                          {TYPE_LABELS[p.type] ?? p.type}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">
                          {p.links.map((l) => l.platform).join(", ")}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-7 text-xs">
                          <span
                            className={`rounded-full px-2 py-0.5 ${
                              p.active ? "bg-green-50 text-green-700" : "bg-border/40 text-muted"
                            }`}
                          >
                            {p.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-3 pr-7 text-right text-sm">
                          {p.overall.sessions}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-7 text-right text-sm">
                          {p.overall.orders}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-6 text-right text-sm font-medium">
                          {formatMoneyCents(p.overall.revenueCents, "EUR")}
                        </td>
                      </tr>
                      {open && (
                        <tr>
                          <td colSpan={9} className="border-t border-border bg-border/5 p-5">
                            <PartnerDetail partner={p} channels={channels} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {addingNew && <AddPartnerForm channels={channels} onDone={() => setAddingNew(false)} />}
    </div>
  );
}
