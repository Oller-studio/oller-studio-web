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
  poster,
  className,
  lazy = false,
}: {
  src: string;
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
  const [shouldLoad, setShouldLoad] = useState(!lazy);

  useEffect(() => {
    if (!lazy || shouldLoad) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      // Starts loading a bit before it's actually on screen so it's ready
      // by the time the visitor scrolls to it, not starting from zero then.
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [lazy, shouldLoad]);

  useEffect(() => {
    if (!shouldLoad) return;
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    el.play().catch(() => {});

    // Mobile browsers (Safari in particular) silently pause a playing video
    // when the tab/app is backgrounded — e.g. the phone locks, or the
    // visitor switches apps — and don't resume it on their own. Without
    // this, coming back to the tab leaves the hero frozen on whatever frame
    // it stopped at instead of picking the loop back up.
    function resume() {
      if (document.visibilityState === "visible") el?.play().catch(() => {});
    }
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("pageshow", resume);
    return () => {
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("pageshow", resume);
    };
  }, [src, shouldLoad]);

  return (
    <video
      ref={ref}
      src={shouldLoad ? src : undefined}
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
