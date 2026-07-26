"use client";

import { useEffect, useRef } from "react";

export function AutoTextarea({
  value,
  onChange,
  className,
  rows = 2,
  placeholder,
  fill = false,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  rows?: number;
  placeholder?: string;
  // Instead of growing to fit its content, stretch to fill the parent's
  // height — for boxes that already got taller to align with a neighbor.
  fill?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (fill) return;
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value, fill]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className={`${className ?? ""} resize-none overflow-hidden ${fill ? "h-full flex-1" : ""}`}
    />
  );
}
