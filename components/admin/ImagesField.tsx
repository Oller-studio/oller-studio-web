"use client";

import { useRef, useState } from "react";
import Image from "next/image";

// The first image is the hero shown large on the product page; the rest are
// the small thumbnails next to it — order here is the order shown there.
// Always renders `max` slots (filled or empty) so the order is visible and
// editable at a glance, instead of only showing filled slots + one "+".
export function ImagesField({
  images,
  onChange,
  max = 4,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetIndex = useRef<number>(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function remove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function reorder(from: number, to: number) {
    if (from === to || from >= images.length || to >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function handleDrop(i: number) {
    if (dragIndex !== null) reorder(dragIndex, i);
    setDragIndex(null);
    setOverIndex(null);
  }

  function openPicker(index: number) {
    uploadTargetIndex.current = index;
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    setUploading(true);
    setError(null);

    let next = [...images];
    let index = uploadTargetIndex.current;
    let failed = false;

    for (const file of files) {
      if (index >= max) break;

      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData }).catch(
        () => null
      );
      const data = res ? ((await res.json().catch(() => null)) as { url?: string } | null) : null;

      if (!res || !res.ok || !data?.url) {
        failed = true;
        break;
      }

      if (index < next.length) next[index] = data.url;
      else next.push(data.url);
      index += 1;
    }

    onChange(next);
    if (failed) setError("Couldn't upload one of those photos.");
    setUploading(false);
  }

  const slots = Array.from({ length: max }, (_, i) => images[i]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start gap-3">
        {slots.map((src, i) =>
          src ? (
            <div
              key={i}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault();
                if (overIndex !== i) setOverIndex(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(i);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={`group relative cursor-grab overflow-hidden rounded-xl border bg-border/10 active:cursor-grabbing ${
                i === 0 ? "h-32 w-32" : "h-20 w-20"
              } ${dragIndex === i ? "opacity-40" : ""} ${
                overIndex === i && dragIndex !== null && dragIndex !== i
                  ? "border-foreground"
                  : "border-border"
              }`}
            >
              <Image src={src} alt="" fill draggable={false} className="object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-xs font-semibold text-foreground opacity-0 shadow group-hover:opacity-100"
              >
                ×
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Main
                </span>
              )}
              <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    aria-label="Move earlier"
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-xs shadow"
                  >
                    ‹
                  </button>
                )}
                {i < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    aria-label="Move later"
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-xs shadow"
                  >
                    ›
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => openPicker(i)}
              disabled={uploading}
              aria-label="Upload photo"
              className={`flex items-center justify-center rounded-xl border border-dashed border-border text-2xl text-muted hover:border-foreground hover:text-foreground disabled:opacity-50 ${
                i === 0 ? "h-32 w-32" : "h-20 w-20"
              }`}
            >
              {uploading ? "…" : "+"}
            </button>
          )
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={handleFileSelected}
        className="hidden"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
