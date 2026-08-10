"use client";

import { useEffect, useRef, useState } from "react";

// Plain <video autoPlay muted playsInline> sometimes still doesn't
// autoplay on mobile — some browsers only honor `muted` once it's set as a
// real JS property (not just the HTML attribute) before calling play().
// Doing that explicitly here is what actually gets it playing inline
// instead of falling back to the native player (which needs a tap and
// shows its own controls/mute icon).
export function AutoplayVideo({
  src,
  mobileSrc,
  poster,
  className,
  lazy = false,
}: {
  src: string;
  // A vertical/portrait cut shown instead of `src` on narrow viewports.
  // Resolved client-side after mount (via matchMedia) so only one variant
  // is ever downloaded — never both while we figure out which one to use.
  mobileSrc?: string;
  poster?: string;
  className?: string;
  // For below-the-fold videos (the homepage's editorial grid) — without
  // this, every video on the page starts downloading and playing the
  // instant the page loads, regardless of whether it's ever scrolled into
  // view. On mobile that's several videos' worth of bandwidth competing
  // with the one the visitor can actually see, which is exactly what made
  // the homepage feel slow to load. `lazy` defers both preload and src
  // until the video is about to enter the viewport.
  lazy?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const hasMobileVariant = Boolean(mobileSrc && mobileSrc !== src);

  // null until we know which variant to use — for the common case (no
  // mobile variant) that's immediately, so behavior is unchanged.
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(
    hasMobileVariant ? null : src
  );
  const [intersecting, setIntersecting] = useState(!lazy);
  const shouldLoad = resolvedSrc !== null && intersecting;

  useEffect(() => {
    if (!hasMobileVariant) return;
    const mql = window.matchMedia("(max-width: 767px)");
    setResolvedSrc(mql.matches ? (mobileSrc as string) : src);
  }, [hasMobileVariant, mobileSrc, src]);

  useEffect(() => {
    if (!lazy || intersecting) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIntersecting(true);
          observer.disconnect();
        }
      },
      // Starts loading a bit before it's actually on screen so it's ready
      // by the time the visitor scrolls to it, not starting from zero then.
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [lazy, intersecting]);

  useEffect(() => {
    if (!shouldLoad) return;
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    el.play().catch(() => {});
  }, [resolvedSrc, shouldLoad]);

  return (
    <video
      ref={ref}
      src={shouldLoad ? (resolvedSrc as string) : undefined}
      poster={poster}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload={shouldLoad ? "auto" : "none"}
      disablePictureInPicture
    />
  );
}
