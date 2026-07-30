// Shopify-style "hover the title, get the definition" tooltip — used on
// every metric/chart title across the Analytics dashboard so it's clear
// exactly what's being counted (e.g. is "visitors" sessions or page views?).
export function MetricLabel({
  label,
  description,
  size = "sm",
}: {
  label: string;
  description: string;
  size?: "sm" | "xs";
}) {
  return (
    <div className="group relative w-fit">
      <p
        className={`${
          size === "xs" ? "text-xs font-semibold uppercase tracking-wide" : "text-sm font-semibold"
        } cursor-help underline decoration-dotted decoration-muted underline-offset-4`}
      >
        {label}
      </p>
      <div className="pointer-events-none invisible absolute left-0 top-full z-30 mt-2 w-56 rounded-lg border border-border bg-background p-3 text-xs normal-case text-muted opacity-0 shadow-xl transition-opacity group-hover:visible group-hover:opacity-100">
        {description}
      </div>
    </div>
  );
}
