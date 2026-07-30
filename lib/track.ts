// Fixed set of client-triggered funnel events — keeps /api/track from
// accepting arbitrary event names, and doubles as the reference both the
// client callers and lib/analytics.ts's funnel query build against.
export const TRACKABLE_EVENTS = ["scroll_50", "add_to_cart"] as const;
export type TrackableEvent = (typeof TRACKABLE_EVENTS)[number];

// Fire-and-forget client helper — never throws, never blocks the caller.
export function track(name: TrackableEvent) {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
    keepalive: true,
  }).catch(() => {});
}
