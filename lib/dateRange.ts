export type DateRangeKey = "24h" | "7d" | "14d" | "30d" | "90d" | "12m";

export const DATE_RANGES: { key: DateRangeKey; label: string }[] = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7 days" },
  { key: "14d", label: "14 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "12m", label: "12 months" },
];

export function resolveDateRange(key: string | undefined) {
  const normalized = DATE_RANGES.find((r) => r.key === key)?.key ?? "30d";
  const since = new Date();
  switch (normalized) {
    case "24h":
      since.setHours(since.getHours() - 24);
      break;
    case "7d":
      since.setDate(since.getDate() - 7);
      break;
    case "14d":
      since.setDate(since.getDate() - 14);
      break;
    case "30d":
      since.setDate(since.getDate() - 30);
      break;
    case "90d":
      since.setDate(since.getDate() - 90);
      break;
    case "12m":
      since.setMonth(since.getMonth() - 12);
      break;
  }
  return { key: normalized, since };
}
