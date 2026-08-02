// Shared chart palette — brand black/red plus a few warm, editorial accents
// so multi-series charts (channels, devices) read as distinct at a glance
// instead of falling back to a generic rainbow.
export const CHART_COLORS = [
  "#0a0a0a", // foreground (Direct / Desktop)
  "#d2001f", // brand accent (primary series)
  "#c9a24b", // muted gold
  "#5b7a6b", // sage
  "#5b7fa6", // dusty blue
  "#a3a3a3", // neutral fallback
] as const;
