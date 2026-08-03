"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { EditorialSlot } from "@/lib/homePage";

type MediaValue = { type: "video" | "image"; url: string; href?: string } | null;

async function uploadFile(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: formData }).catch(
    () => null
  );
  const data = res && res.ok ? ((await res.json().catch(() => null)) as { url?: string } | null) : null;
  return data?.url ?? null;
}

function MediaSlot({
  label,
  accept,
  value,
  onChange,
  size = "h-40 w-40",
}: {
  label: string;
  accept: string;
  value: MediaValue;
  onChange: (next: MediaValue) => void;
  size?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    const url = await uploadFile(file);
    setUploading(false);
    if (!url) {
      setError("Couldn't upload that file.");
      return;
    }
    onChange({ type: file.type.startsWith("video") ? "video" : "image", url, href: value?.href });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div
        className={`group relative overflow-hidden rounded-xl border border-border bg-border/10 ${size}`}
      >
        {value ? (
          <>
            {value.type === "video" ? (
              <video
                src={value.url}
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <Image src={value.url} alt="" fill className="object-cover" />
            )}
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remove"
              title="Remove — falls back to the default"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background opacity-0 shadow group-hover:opacity-100"
            >
              ×
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-x-1 bottom-1 rounded-full bg-background/90 py-1 text-[10px] font-semibold uppercase tracking-wide opacity-0 shadow group-hover:opacity-100 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Replace"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-full w-full items-center justify-center text-2xl text-muted hover:text-foreground disabled:opacity-50"
          >
            {uploading ? "…" : "+"}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function HomePageForm({
  initialHeroVideoUrl,
  initialHeroPosterUrl,
  initialEditorial,
}: {
  initialHeroVideoUrl: string | null;
  initialHeroPosterUrl: string | null;
  initialEditorial: EditorialSlot[];
}) {
  const [heroVideo, setHeroVideo] = useState<MediaValue>(
    initialHeroVideoUrl ? { type: "video", url: initialHeroVideoUrl } : null
  );
  const [heroPoster, setHeroPoster] = useState<MediaValue>(
    initialHeroPosterUrl ? { type: "image", url: initialHeroPosterUrl } : null
  );
  const [editorial, setEditorial] = useState<MediaValue[]>(
    Array.from({ length: 4 }, (_, i) => initialEditorial[i] ?? null)
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function setEditorialAt(i: number, value: MediaValue) {
    setEditorial((prev) => prev.map((v, idx) => (idx === i ? value : v)));
  }

  async function save() {
    setStatus("saving");
    const res = await fetch("/api/admin/pages/home", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        heroVideoUrl: heroVideo?.url ?? null,
        heroPosterUrl: heroPoster?.url ?? null,
        editorial,
      }),
    }).catch(() => null);
    setStatus(res && res.ok ? "saved" : "error");
  }

  return (
    <div className="flex w-fit flex-col gap-8 rounded-xl border border-border bg-background p-4 shadow-sm">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Hero</p>
        <p className="max-w-md text-xs text-muted">
          The full-screen banner at the top of the homepage. Video takes priority — the poster
          shows while it loads, and instead of it if no video is set. Videos are optimized for
          the web automatically.
        </p>
        <div className="flex gap-4">
          <MediaSlot
            label="Video"
            accept="video/mp4,video/quicktime"
            value={heroVideo}
            onChange={setHeroVideo}
            size="h-40 w-32"
          />
          <MediaSlot
            label="Poster / fallback photo"
            accept="image/png,image/jpeg,image/webp"
            value={heroPoster}
            onChange={setHeroPoster}
            size="h-40 w-32"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Editorial strip</p>
        <p className="max-w-md text-xs text-muted">
          The 4-up row below the product carousel — each slot can be a photo or a short video, in
          the order shown on the site.
        </p>
        <div className="flex flex-wrap gap-4">
          {editorial.map((slot, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <MediaSlot
                label={`Slot ${i + 1}`}
                accept="video/mp4,video/quicktime,image/png,image/jpeg,image/webp"
                value={slot}
                onChange={(v) => setEditorialAt(i, v)}
              />
              <input
                type="text"
                value={slot?.href ?? ""}
                onChange={(e) =>
                  slot && setEditorialAt(i, { ...slot, href: e.target.value.trim() || undefined })
                }
                disabled={!slot}
                placeholder="/shop/color-slug"
                title="Which bag this clip/photo links to when clicked"
                className="w-40 rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none disabled:opacity-40"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="w-fit rounded-full border border-foreground bg-foreground px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-background hover:opacity-90 disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        {status === "saved" && <span className="text-xs text-green-700">Saved</span>}
        {status === "error" && <span className="text-xs text-red-600">Something went wrong</span>}
      </div>
    </div>
  );
}
