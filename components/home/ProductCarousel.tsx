"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CarouselSlide } from "@/lib/media";

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M11 3.5L5.5 9l5.5 5.5" : "M7 3.5L12.5 9 7 14.5"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProductCarousel({ slides }: { slides: CarouselSlide[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -el.clientWidth / 2 : el.clientWidth / 2, behavior: "smooth" });
  }

  return (
    <div className="relative bg-background">
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {slides.map((slide, i) => (
          <ProductSlide key={i} slide={slide} />
        ))}
      </div>
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Previous"
        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow hover:bg-background"
      >
        <ArrowIcon direction="left" />
      </button>
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Next"
        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow hover:bg-background"
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
      <Link href={slide.href} className="group w-1/2 flex-shrink-0 sm:w-1/4">
        {content}
      </Link>
    );
  }

  return <div className="w-1/2 flex-shrink-0 sm:w-1/4">{content}</div>;
}
