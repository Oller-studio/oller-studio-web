"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoneyCents } from "@/lib/format";
import type { SourcePerformance } from "@/lib/analytics";

type LinkRow = { id: string; platform: string; utmSource: string };

export type PartnerDetailData = {
  id: string;
  firstName: string;
  lastName: string | null;
  couponCode: string | null;
  links: LinkRow[];
  overall: SourcePerformance;
  byLink: Record<string, SourcePerformance>;
};

function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
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

export function PartnerDetailView({
  partner,
  channels,
}: {
  partner: PartnerDetailData;
  channels: { id: string; name: string }[];
}) {
  const [removing, setRemoving] = useState(false);
  const [addingLink, setAddingLink] = useState(false);
  const [newPlatform, setNewPlatform] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
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
    router.push("/admin/marketing/partners");
    router.refresh();
  }

  async function addLink(platform: string) {
    if (!platform.trim()) return;
    setLinkError(null);
    const res = await fetch(`/api/admin/partners/${partner.id}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: platform.trim() }),
    }).catch(() => null);
    if (!res || !res.ok) {
      const data = res ? await res.json().catch(() => null) : null;
      setLinkError(data?.reason ?? "Something went wrong adding this channel.");
      return;
    }
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
    <div className="flex max-w-3xl flex-col gap-4">
      <div className={`flex flex-col gap-3 rounded-xl border border-border bg-background p-4`}>
        <p className="text-sm font-semibold">Coupon code</p>
        {editingCoupon ? (
          <div className="flex items-center gap-2">
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
      </div>

      <div className="grid grid-cols-5 gap-3 rounded-xl border border-border bg-background p-4 text-sm">
        <div>
          <p className="text-xs text-muted">Sessions</p>
          <p className="font-semibold">{p.pageViews}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Unique</p>
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

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-4">
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
                onClick={() => removeLink(l.id)}
                className="ml-auto text-xs text-red-600 underline underline-offset-2"
              >
                Remove
              </button>
            </div>
          );
        })}

        {addingLink ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
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
                disabled={!newPlatform}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-border/40 disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingLink(false);
                  setLinkError(null);
                }}
                className="text-xs text-muted underline underline-offset-2"
              >
                Cancel
              </button>
            </div>
            {linkError && <p className="text-xs text-red-600">{linkError}</p>}
          </div>
        ) : (
          unusedChannels.length > 0 && (
            <button
              type="button"
              onClick={() => setAddingLink(true)}
              className="w-fit text-xs font-semibold underline underline-offset-2 hover:text-foreground"
            >
              + Add another channel
            </button>
          )
        )}
      </div>

      {p.topProducts.length > 0 && (
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-background p-4">
          <p className="text-sm font-semibold">Top bags sold</p>
          {p.topProducts.map((tp) => (
            <div key={tp.slug} className="flex items-center justify-between text-sm">
              <span>{tp.name}</span>
              <span className="text-muted">{tp.sales}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/marketing/partners")}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-border/40"
        >
          Back to Partners
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={removing}
          className="text-sm font-semibold text-red-600 underline underline-offset-2 disabled:opacity-50"
        >
          {removing ? "Removing…" : "Remove partner"}
        </button>
      </div>
    </div>
  );
}
