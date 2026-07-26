"use client";

import Image from "next/image";
import { useState } from "react";
import type { Colorway } from "@/lib/types";
import { FavoriteButton } from "./FavoriteButton";

export function ColorwayGallery({ colorway }: { colorway: Colorway }) {
  const [active, setActive] = useState(0);
  const images = colorway.images;

  const hasImages = images.length > 0;

  return (
    <div className="flex gap-3">
      <div className="relative aspect-[4/5] flex-1 overflow-hidden bg-background">
        <FavoriteButton
          slug={colorway.slug}
          className="absolute left-3 top-3 z-10 text-foreground"
        />
        {hasImages ? (
          <Image
            src={images[active]}
            alt={`${colorway.name} — photo ${active + 1}`}
            fill
            priority
            className="object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-border text-sm text-muted">
            Photos coming soon
          </div>
        )}
      </div>
      <div className="flex w-20 flex-shrink-0 flex-col gap-3 sm:w-24">
        {hasImages &&
          images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              className={`aspect-[4/5] overflow-hidden bg-background transition-opacity ${
                i === active ? "opacity-100" : "opacity-50 hover:opacity-80"
              }`}
            >
              <Image
                src={src}
                alt={`${colorway.name} thumbnail ${i + 1}`}
                width={200}
                height={250}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
      </div>
    </div>
  );
}
