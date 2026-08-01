"use client";

import { useEffect, useRef } from "react";

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
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    el.play().catch(() => {});
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
    />
  );
}
