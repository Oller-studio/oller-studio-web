import type { TimelinePoint } from "@/lib/analytics";

// A plain SVG polyline — no charting library. Good enough for a trend line
// over a handful of days/hours; not meant to handle zooming or tooltips.
export function LineChart({ points }: { points: TimelinePoint[] }) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const height = 100;
  const stepX = points.length > 1 ? 100 / (points.length - 1) : 0;
  const coords = points
    .map((p, i) => `${(i * stepX).toFixed(2)},${(height - (p.value / max) * height).toFixed(2)}`)
    .join(" ");

  return (
    <div className="flex flex-col gap-1">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-24 w-full text-foreground">
        <polyline
          points={coords}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}
