export type Urgency = "normal" | "warning" | "urgent";

// Simplification: measures order age (since payment), not time in the
// current stage specifically — accurate for New orders, a rough proxy
// further down the pipeline. Ask if per-stage timestamps are worth adding.
export function getUrgency(daysWaiting: number): Urgency {
  if (daysWaiting >= 2) return "urgent";
  if (daysWaiting >= 1) return "warning";
  return "normal";
}

// Card background signals urgency; buttons stay neutral black regardless.
// Urgent uses a light burgundy tint rather than pure red — less alarm-red,
// more "this needs attention." Literal class names so Tailwind's scanner
// can find and generate them.
export const URGENCY_CARD_CLASSES: Record<Urgency, string> = {
  normal: "bg-green-50",
  warning: "bg-yellow-50",
  urgent: "bg-[#7A2333]/10",
};

export const URGENCY_BADGE_CLASSES: Record<Urgency, string> = {
  normal: "text-muted",
  warning: "text-yellow-700 font-semibold",
  urgent: "text-[#7A2333] font-semibold",
};
