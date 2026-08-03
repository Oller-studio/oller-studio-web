"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CarouselSlide } from "@/lib/media";

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M11 3.5L5.5 9l5.5 5.5" : "M7 3.5L12.5 9 7 14.5"}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProductCarousel({ slides }: { slides: CarouselSlide[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reads the real scroll position rather than tracking an index in state,
  // so this stays correct however the last move happened — clicking an
  // arrow or swiping with a finger.
  function currentIndex(el: HTMLDivElement): number {
    const first = el.children[0] as HTMLElement | undefined;
    if (!first) return 0;
    const step = first.offsetWidth + 4; // + the gap-1 between slides
    return Math.round(el.scrollLeft / step);
  }

  function goTo(direction: -1 | 1) {
    const el = scrollRef.current;
    if (!el || slides.length === 0) return;
    const count = slides.length;
    const next = ((currentIndex(el) + direction) % count + count) % count;
    (el.children[next] as HTMLElement | undefined)?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
  }

  return (
    <div className="relative bg-background">
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-1 overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {slides.map((slide, i) => (
          <ProductSlide key={i} slide={slide} />
        ))}
      </div>
      <button
        type="button"
        onClick={() => goTo(-1)}
        aria-label="Previous"
        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-foreground drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)] hover:opacity-70"
      >
        <ArrowIcon direction="left" />
      </button>
      <button
        type="button"
        onClick={() => goTo(1)}
        aria-label="Next"
        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-foreground drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)] hover:opacity-70"
      >
        <ArrowIcon direction="right" />
      </button>
    </div>
  );
}

function ProductSlide({ slide }: { slide: CarouselSlide }) {
  const primary = slide.images[0];
  const secondary = slide.hoverImageUrl ?? slide.images[1];

  const content = (
    <div className="relative aspect-[2/3] w-full overflow-hidden bg-border">
      {primary ? (
        <>
          <Image
            src={primary}
            alt={slide.alt}
            width={500}
            height={750}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              secondary ? "group-hover:opacity-0" : ""
            }`}
          />
          {secondary && (
            <Image
              src={secondary}
              alt={slide.alt}
              width={500}
              height={750}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-center text-xs text-muted">
          Photos coming soon
        </div>
      )}
    </div>
  );

  if (slide.href) {
    return (
      <Link href={slide.href} className="group w-1/2 flex-shrink-0 snap-start sm:w-1/4">
        {content}
      </Link>
    );
  }

  return <div className="w-1/2 flex-shrink-0 snap-start sm:w-1/4">{content}</div>;
}
