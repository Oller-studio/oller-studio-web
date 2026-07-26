"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductInput } from "@/lib/products";
import { AutoTextarea } from "./AutoTextarea";
import {
  COLORWAY_STATUSES,
  STATUS_LABELS,
  STATUS_BADGE,
  type ColorwayStatus,
} from "@/lib/colorwayStatus";
import { ColorVariantsList, type VariantRow } from "./ColorVariantsList";
import { AdminBreadcrumb } from "./AdminBreadcrumb";
import { ProductsIcon } from "./NavIcons";

// Unlisted is a real status but skipped here to keep this quick bulk-toggle
// simple — it's still reachable per-color from each edition's own form.
const QUICK_STATUSES = COLORWAY_STATUSES.filter((s) => s !== "unlisted");

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type FormState = {
  slug: string;
  name: string;
  description: string;
  basePrice: string;
  compareAtPrice: string;
  unitCount: string;
  weightGrams: string;
  heightCm: string;
  widthCm: string;
  depthCm: string;
  sizeAndFitNote: string;
  material: string;
  compositionCareNote: string;
  deliveryReturnsNote: string;
  printTime: string;
  currency: string;
  leadTimeMinDays: string;
  leadTimeMaxDays: string;
  sortOrder: string;
  packagingId: string;
};

function initialState(existing?: Partial<FormState>): FormState {
  return {
    slug: existing?.slug ?? "",
    name: existing?.name ?? "",
    description: existing?.description ?? "",
    basePrice: existing?.basePrice ?? "",
    compareAtPrice: existing?.compareAtPrice ?? "",
    unitCount: existing?.unitCount || "1",
    weightGrams: existing?.weightGrams ?? "",
    heightCm: existing?.heightCm ?? "",
    widthCm: existing?.widthCm ?? "",
    depthCm: existing?.depthCm ?? "",
    sizeAndFitNote: existing?.sizeAndFitNote || "Fits an iPhone + essentials",
    material: existing?.material ?? "",
    compositionCareNote: existing?.compositionCareNote ?? "",
    deliveryReturnsNote: existing?.deliveryReturnsNote ?? "",
    printTime: existing?.printTime ?? "",
    currency: existing?.currency ?? "EUR",
    leadTimeMinDays: existing?.leadTimeMinDays ?? "5",
    leadTimeMaxDays: existing?.leadTimeMaxDays ?? "7",
    sortOrder: existing?.sortOrder ?? "0",
    packagingId: existing?.packagingId ?? "",
  };
}

// "2:30" -> 150. Missing/garbage minutes are treated as 0, so "2" or "2:"
// both work as shorthand for exactly 2 hours.
function parsePrintTime(printTime: string): number | null {
  const trimmed = printTime.trim();
  if (!trimmed) return null;
  const [h, m] = trimmed.split(":");
  const hours = Number.parseInt(h, 10) || 0;
  const minutes = Number.parseInt(m, 10) || 0;
  return hours * 60 + minutes;
}

function toInput(form: FormState): ProductInput {
  const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));
  return {
    slug: form.slug.trim(),
    name: form.name.trim(),
    description: form.description.trim(),
    // Default price — each edition can still override its own via
    // Colorway.priceCents, this is just the fallback when it doesn't.
    basePrice: form.basePrice.trim() === "" ? 0 : Number(form.basePrice),
    compareAtPrice: form.compareAtPrice.trim() === "" ? null : Number(form.compareAtPrice),
    unitCount: Math.max(1, Number.parseInt(form.unitCount, 10) || 1),
    weightGrams: numOrNull(form.weightGrams),
    heightCm: numOrNull(form.heightCm),
    widthCm: numOrNull(form.widthCm),
    depthCm: numOrNull(form.depthCm),
    sizeAndFitNote: form.sizeAndFitNote.trim() || null,
    compositionCareNote: form.compositionCareNote.trim() || null,
    deliveryReturnsNote: form.deliveryReturnsNote.trim() || null,
    material: form.material || null,
    printMinutes: parsePrintTime(form.printTime),
    currency: form.currency.trim() || "EUR",
    leadTimeMinDays: Number(form.leadTimeMinDays) || 0,
    leadTimeMaxDays: Number(form.leadTimeMaxDays) || 0,
    sortOrder: Number(form.sortOrder) || 0,
    packagingId: form.packagingId || null,
  };
}

// Mirrors lib/products.ts's formatDimensions/formatWeight/formatCompositionCare —
// this is just for the collapsed preview, the server computes the real thing.
function previewSizeAndFit(form: FormState): string {
  const parts: string[] = [];
  if (form.heightCm && form.widthCm && form.depthCm) {
    parts.push(`H ${form.heightCm} × W ${form.widthCm} × D ${form.depthCm} cm`);
  }
  if (form.weightGrams) parts.push(`${form.weightGrams}g`);
  if (form.sizeAndFitNote.trim()) parts.push(form.sizeAndFitNote.trim());
  return parts.join("\n") || "Not set yet — click Edit to add measurements.";
}

// Mirrors lib/products.ts's COMPOSITION_CARE_BY_MATERIAL — keep these two in sync.
const COMPOSITION_CARE_BY_MATERIAL: Record<string, string> = {
  PLA: `PLA (Polylactic Acid)\n\nSustainable — made from corn. A lightweight plant-based material known for its lower environmental impact and solid, structured finish.\n\nEach piece is 3D-printed and finished in-studio. Slight variations may occur as part of the process, making every object unique.`,
  TPU: `TPU (Thermoplastic Polyurethane)\n\nA flexible, durable material that won't crack or peel with everyday use.\n\nEach piece is 3D-printed and finished in-studio. Slight variations may occur as part of the process, making every object unique.`,
};

function previewCompositionCare(form: FormState): string {
  if (form.compositionCareNote.trim()) return form.compositionCareNote.trim();
  if (form.material && COMPOSITION_CARE_BY_MATERIAL[form.material]) {
    return COMPOSITION_CARE_BY_MATERIAL[form.material];
  }
  const material = form.material || "a durable 3D-printed material";
  return `Made from ${material}. Wipe clean with a soft, dry cloth. Avoid prolonged exposure to direct sunlight or high heat.`;
}

// Mirrors lib/products.ts's DELIVERY_RETURNS_TEXT — keep both in sync.
const DELIVERY_RETURNS_TEXT = `Most orders are shipped within 24–48 hours of purchase, subject to availability and payment verification. Once shipped, delivery typically takes 6–10 business days, depending on destination.\n\nReturns are accepted within 14 days of delivery. For any questions, please contact hello@oller.studio.\n\nFor orders shipped outside the EU, customs duties, taxes, and import fees may apply upon arrival and are the responsibility of the customer.`;

function previewDeliveryReturns(form: FormState): string {
  return form.deliveryReturnsNote.trim() || DELIVERY_RETURNS_TEXT;
}

function AccordionBox({
  title,
  preview,
  editable = true,
  children,
}: {
  title: string;
  preview: string;
  editable?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-xl border border-border ${editable ? "" : "bg-border/10"}`}
    >
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className={`text-sm font-semibold ${editable ? "" : "text-muted"}`}>{title}</span>
        {editable ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs font-semibold uppercase tracking-wide underline underline-offset-2 hover:text-foreground"
          >
            {open ? "Close" : "Edit"}
          </button>
        ) : (
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Fixed</span>
        )}
      </div>
      {open ? (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3">{children}</div>
      ) : (
        <p className="whitespace-pre-line border-t border-border px-4 py-2.5 text-sm text-muted">
          {preview}
        </p>
      )}
    </div>
  );
}

export function ProductForm({
  mode,
  initial,
  variantCount,
  initialStatus,
  viewUrl,
  variants,
  packagingOptions,
}: {
  mode: "create" | "edit";
  initial?: Partial<FormState>;
  variantCount?: number;
  // Most-common status across this product's colors, for the header badge —
  // there's no single "product status" in the data model, just a good guess.
  initialStatus?: ColorwayStatus;
  // Storefront link for the "View" button — the first color's page, since a
  // Product itself has no page of its own. Undefined until one exists.
  viewUrl?: string | null;
  // Rendered inline, right below Measurements — Editions has its own <form>
  // elements internally, so it can't live inside this component's <form>.
  variants?: VariantRow[];
  // Reusable box presets managed under Production → Packaging.
  packagingOptions?: { id: string; name: string }[];
}) {
  const [form, setForm] = useState<FormState>(initialState(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [displayStatus, setDisplayStatus] = useState<ColorwayStatus>(initialStatus ?? "draft");
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const router = useRouter();
  const dimensionRefs = useRef<Array<HTMLInputElement | null>>([]);
  const printHoursRef = useRef<HTMLInputElement | null>(null);
  const printMinutesRef = useRef<HTMLInputElement | null>(null);

  // Only digits/decimal point, plus the usual editing and arrow-to-next-box
  // navigation keys — blocks letters outright instead of relying on the
  // browser's inconsistent number-input key filtering.
  function handleDimensionKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      dimensionRefs.current[index + 1]?.focus();
      return;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      dimensionRefs.current[index - 1]?.focus();
      return;
    }
    if (e.key.length === 1 && !/[0-9.]/.test(e.key)) {
      e.preventDefault();
    }
  }

  async function bulkSetStatus(status: ColorwayStatus) {
    if (!confirm(`Set every color of "${form.name}" to ${STATUS_LABELS[status]}?`)) return;
    setStatusUpdating(true);
    await fetch(`/api/admin/products/${form.slug}/bulk-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
    setStatusUpdating(false);
    setDisplayStatus(status);
    router.refresh();
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setName(name: string) {
    setForm((f) => ({ ...f, name, slug: mode === "create" ? slugify(name) : f.slug }));
  }

  async function submit() {
    if (!form.name.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);

    const url = mode === "create" ? "/api/admin/products" : `/api/admin/products/${form.slug}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toInput(form)),
    }).catch(() => null);

    if (!res || !res.ok) {
      setError("Something went wrong saving this product.");
      setSaving(false);
      return;
    }

    if (mode === "create") {
      router.push(`/admin/products/${form.slug}`);
    } else {
      router.push("/admin/products");
    }
    router.refresh();
  }

  async function remove() {
    const editionsNote = variantCount
      ? ` and its ${variantCount} edition${variantCount === 1 ? "" : "s"}`
      : "";
    if (!confirm(`Delete "${form.name}"${editionsNote}? This can't be undone.`)) return;
    setSaving(true);
    await fetch(`/api/admin/products/${form.slug}`, { method: "DELETE" }).catch(() => {});
    router.push("/admin/products");
    router.refresh();
  }

  async function archive() {
    if (!confirm(`Archive "${form.name}"? This sets every color to Inactive.`)) return;
    setMoreActionsOpen(false);
    await bulkSetStatus("inactive");
  }

  async function duplicate() {
    setMoreActionsOpen(false);
    setDuplicating(true);
    const res = await fetch(`/api/admin/products/${form.slug}/duplicate`, {
      method: "POST",
    }).catch(() => null);
    const data = res && res.ok ? ((await res.json()) as { slug: string }) : null;
    setDuplicating(false);
    if (!data) {
      setError("Something went wrong duplicating this product.");
      return;
    }
    router.push(`/admin/products/${data.slug}`);
    router.refresh();
  }

  const inputClass =
    "rounded-lg border border-border bg-background px-3 py-1.5 text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
  const labelClass = "text-sm font-semibold";
  const dimLabelClass = "text-sm font-semibold text-muted";
  const sectionTitleClass = "text-sm font-semibold";
  const boxClass = "flex flex-col gap-2 rounded-xl border border-border bg-background p-3";
  const [printHoursPart, printMinutesPart = ""] = form.printTime.split(":");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <AdminBreadcrumb href="/admin/products" icon={ProductsIcon} />
        <h1 className="font-display text-2xl font-bold uppercase">
          {form.name || "New product"}
        </h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[displayStatus]}`}
        >
          {STATUS_LABELS[displayStatus]}
        </span>
      </div>

      <div className="flex gap-6">
      <div className="flex max-w-5xl flex-1 flex-col gap-4">

      <div className="flex items-stretch gap-4">
        <div className={`${boxClass} flex-1`}>
          <label className="flex w-80 flex-col gap-1">
            <span className={labelClass}>Title</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ondine"
              className="h-8 rounded-lg border border-border bg-background px-3 text-base font-semibold"
            />
          </label>

          <label className="flex flex-1 flex-col gap-1">
            <span className={labelClass}>Description</span>
            <AutoTextarea
              value={form.description}
              onChange={(v) => set("description", v)}
              rows={7}
              className={`${inputClass} flex-1`}
              fill
            />
          </label>
        </div>

        <div className="flex w-72 shrink-0 flex-col gap-4">
          {mode === "edit" && (
            <div className={boxClass}>
              <div className="flex items-center justify-between gap-2">
                <p className={sectionTitleClass}>Status</p>
                <div className="flex items-center gap-1.5">
                  {viewUrl ? (
                    <a
                      href={viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-border px-2 py-1 text-xs font-semibold hover:bg-border/40"
                    >
                      View
                    </a>
                  ) : (
                    <span
                      title="Add an edition first to have a page to view"
                      className="cursor-not-allowed rounded-full border border-border px-2 py-1 text-xs font-semibold text-muted"
                    >
                      View
                    </span>
                  )}

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMoreActionsOpen((v) => !v)}
                      className="rounded-full border border-border px-2 py-1 text-xs font-semibold hover:bg-border/40"
                    >
                      More
                    </button>
                    {moreActionsOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMoreActionsOpen(false)}
                        />
                        <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-border bg-background py-1 shadow-lg">
                          <button
                            type="button"
                            onClick={duplicate}
                            disabled={duplicating}
                            className="block w-full px-4 py-2 text-left text-sm hover:bg-border/40 disabled:opacity-50"
                          >
                            {duplicating ? "Duplicating…" : "Duplicate product"}
                          </button>
                          <button
                            type="button"
                            onClick={archive}
                            disabled={statusUpdating}
                            className="block w-full px-4 py-2 text-left text-sm hover:bg-border/40 disabled:opacity-50"
                          >
                            Archive product
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMoreActionsOpen(false);
                              remove();
                            }}
                            disabled={saving}
                            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Delete product
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <select
                aria-label="Set status for all colors"
                defaultValue=""
                disabled={statusUpdating}
                onChange={(e) => {
                  const status = e.target.value as ColorwayStatus;
                  e.target.value = "";
                  if (status) bulkSetStatus(status);
                }}
                className={`${inputClass} h-8 w-full`}
              >
                <option value="" disabled>
                  {statusUpdating ? "Updating…" : "Change status"}
                </option>
                {QUICK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={boxClass}>
            <p className={sectionTitleClass}>Product characteristics</p>
            <div className="flex items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className={dimLabelClass}>Print time</span>
              <div className={`${inputClass} flex w-20 items-center gap-1`}>
                <input
                  ref={printHoursRef}
                  type="text"
                  inputMode="numeric"
                  value={printHoursPart}
                  onChange={(e) => {
                    const h = e.target.value.replace(/\D/g, "").slice(0, 2);
                    set("printTime", `${h}:${printMinutesPart}`);
                    if (h.length === 2) printMinutesRef.current?.focus();
                  }}
                  placeholder="00"
                  className="w-5 bg-transparent text-sm outline-none"
                />
                <span className="text-sm text-muted">:</span>
                <input
                  ref={printMinutesRef}
                  type="text"
                  inputMode="numeric"
                  value={printMinutesPart}
                  onChange={(e) => {
                    const m = e.target.value.replace(/\D/g, "").slice(0, 2);
                    set("printTime", `${printHoursPart}:${m}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && printMinutesPart === "") {
                      printHoursRef.current?.focus();
                    }
                  }}
                  placeholder="00"
                  className="w-5 bg-transparent text-sm outline-none"
                />
              </div>
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className={dimLabelClass}>Material</span>
              <select
                value={form.material}
                onChange={(e) => set("material", e.target.value)}
                className={`${inputClass} w-full`}
              >
                <option value="">Not set</option>
                <option value="PLA">PLA</option>
                <option value="TPU">TPU</option>
              </select>
            </label>
            </div>
          </div>

          <div className={boxClass}>
            <p className={sectionTitleClass}>Measurements</p>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1">
                <span className={dimLabelClass}>Height (cm)</span>
                <input
                  ref={(el) => {
                    dimensionRefs.current[0] = el;
                  }}
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.heightCm}
                  onChange={(e) => set("heightCm", e.target.value)}
                  onKeyDown={(e) => handleDimensionKeyDown(e, 0)}
                  className={`${inputClass} h-9 w-full`}
                />
              </label>
              <label className="flex flex-1 flex-col gap-1">
                <span className={dimLabelClass}>Width (cm)</span>
                <input
                  ref={(el) => {
                    dimensionRefs.current[1] = el;
                  }}
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.widthCm}
                  onChange={(e) => set("widthCm", e.target.value)}
                  onKeyDown={(e) => handleDimensionKeyDown(e, 1)}
                  className={`${inputClass} h-9 w-full`}
                />
              </label>
              <label className="flex flex-1 flex-col gap-1">
                <span className={dimLabelClass}>Depth (cm)</span>
                <input
                  ref={(el) => {
                    dimensionRefs.current[2] = el;
                  }}
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.depthCm}
                  onChange={(e) => set("depthCm", e.target.value)}
                  onKeyDown={(e) => handleDimensionKeyDown(e, 2)}
                  className={`${inputClass} h-9 w-full`}
                />
              </label>
            </div>
          </div>

        </div>
      </div>

      <div className={boxClass}>
        <p className={sectionTitleClass}>Shipping</p>
        <div className="flex items-start gap-4">
        <label className="flex flex-1 flex-col gap-1">
          <span className={dimLabelClass}>Packaging</span>
          <select
            value={form.packagingId}
            onChange={(e) => set("packagingId", e.target.value)}
            className={`${inputClass} w-full`}
          >
            <option value="">Not set</option>
            {(packagingOptions ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className="w-72 shrink-0">
          <label className="flex w-28 flex-col gap-1">
            <span className={dimLabelClass}>Weight (g)</span>
            <input
              ref={(el) => {
                dimensionRefs.current[3] = el;
              }}
              type="number"
              min={0}
              value={form.weightGrams}
              onChange={(e) => set("weightGrams", e.target.value)}
              onKeyDown={(e) => handleDimensionKeyDown(e, 3)}
              className={`${inputClass} w-full`}
            />
          </label>
        </div>
        </div>
        {(packagingOptions ?? []).length === 0 && (
          <p className="text-xs italic text-muted">
            No box presets yet — add one under Production.
          </p>
        )}
      </div>

      {mode === "edit" && variants && (
        <div className={`${boxClass} max-w-full overflow-x-auto`}>
          <ColorVariantsList productSlug={form.slug} variants={variants} />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </button>
      </div>

      </div>

      <div className="flex w-96 shrink-0 flex-col gap-3">
        <AccordionBox title="Size & Fit Notes" preview={previewSizeAndFit(form)}>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Note</span>
            <input
              type="text"
              value={form.sizeAndFitNote}
              onChange={(e) => set("sizeAndFitNote", e.target.value)}
              placeholder="Fits an iPhone + essentials"
              className={inputClass}
            />
          </label>
        </AccordionBox>

        <AccordionBox title="Composition and Care" preview={previewCompositionCare(form)}>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>
              Custom text (leave blank to use the Material default above)
            </span>
            <AutoTextarea
              value={form.compositionCareNote}
              onChange={(v) => set("compositionCareNote", v)}
              rows={2}
              className={inputClass}
            />
          </label>
        </AccordionBox>

        <AccordionBox
          title="Delivery, Exchanges and Returns"
          preview={previewDeliveryReturns(form)}
        >
          <label className="flex flex-col gap-1">
            <span className={labelClass}>
              Custom text (leave blank to use the default for every product)
            </span>
            <AutoTextarea
              value={form.deliveryReturnsNote}
              onChange={(v) => set("deliveryReturnsNote", v)}
              rows={4}
              className={inputClass}
            />
          </label>
        </AccordionBox>
      </div>

      </div>
    </div>
  );
}
