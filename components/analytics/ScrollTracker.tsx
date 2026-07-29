"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

// Renders nothing — fires the "scroll_50" funnel event once per page load,
// the first time the visitor scrolls past the halfway point of the page.
export function ScrollTracker() {
  useEffect(() => {
    let fired = false;

    function onScroll() {
      if (fired) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const pct = window.scrollY / scrollable;
      if (pct > 0.5) {
        fired = true;
        track("scroll_50");
        window.removeEventListener("scroll", onScroll);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
