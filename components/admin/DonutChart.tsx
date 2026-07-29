// Plain SVG donut — stacked stroke-dasharray segments, no charting library.

const COLORS = ["#0a0a0a", "#8a8a8a", "#c7c7c7"];

export function DonutChart({
  segments,
}: {
  segments: { label: string; value: number }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <circle cx="18" cy="18" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="4" />
          {total > 0 &&
            segments.map((s, i) => {
              if (s.value === 0) return null;
              const dash = (s.value / total) * circumference;
              const circle = (
                <circle
                  key={s.label}
                  cx="18"
                  cy="18"
                  r={radius}
                  fill="none"
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth="4"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return circle;
            })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold">
          {total}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {segments.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span>{s.label}</span>
            <span className="text-muted">
              {s.value} ({total > 0 ? Math.round((s.value / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
