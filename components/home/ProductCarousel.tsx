"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { CarouselSlide } from "@/lib/media";

export function ProductCarousel({ slides }: { slides: CarouselSlide[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollByPage(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <div className="relative bg-[#f1ede6]">
      <button
        type="button"
        aria-label="Previous"
        onClick={() => scrollByPage(-1)}
        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-black shadow-sm hover:bg-white"
      >
        <ArrowIcon direction="left" />
      </button>

      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {slides.map((slide, i) => (
          <ProductSlide key={i} slide={slide} />
        ))}
      </div>

      <button
        type="button"
        aria-label="Next"
        onClick={() => scrollByPage(1)}
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-black shadow-sm hover:bg-white"
      >
        <ArrowIcon direction="right" />
      </button>
    </div>
  );
}

function ProductSlide({ slide }: { slide: CarouselSlide }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const canToggle = slide.images.length > 1;
  const current = slide.images[index];

  function toggle() {
    if (!canToggle) return;
    setIndex((i) => (i + 1) % slide.images.length);
  }

  return (
    <div
      className="flex aspect-[3/4] w-1/2 flex-shrink-0 snap-start items-center justify-center border-r border-white last:border-r-0 sm:w-1/4"
      onClick={toggle}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(delta) > 30) toggle();
        touchStartX.current = null;
      }}
    >
      {current ? (
        <Image
          src={current}
          alt={slide.alt}
          width={500}
          height={667}
          className="h-full w-full object-contain p-6"
        />
      ) : (
        <span className="text-xs uppercase tracking-widest text-neutral-400">
          {slide.alt}
        </span>
      )}
    </div>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={direction === "left" ? "" : "rotate-180"}
    >
      <path d="M15 5L8 12L15 19" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
