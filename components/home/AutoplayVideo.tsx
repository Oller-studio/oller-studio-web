"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// Subscribes to the (max-width: 767px) media query the proper React way —
// setting state synchronously inside an effect (the previous approach) trips
// the react-hooks/set-state-in-effect lint rule and causes an extra render
// pass. useSyncExternalStore is what React actually intends for reading
// external browser state like this; the server snapshot defaults to "not
// mobile" since matchMedia doesn't exist during SSR.
function useIsMobileViewport(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia("(max-width: 767px)");
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false
  );
}

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
  const isMobile = useIsMobileViewport();
  const resolvedSrc = hasMobileVariant && isMobile ? (mobileSrc as string) : src;
  const [intersecting, setIntersecting] = useState(!lazy);

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
    if (!intersecting) return;
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    el.play().catch(() => {});
  }, [resolvedSrc, intersecting]);

  return (
    <video
      ref={ref}
      src={intersecting ? resolvedSrc : undefined}
      poster={poster}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload={intersecting ? "auto" : "none"}
      disablePictureInPicture
    />
  );
}
