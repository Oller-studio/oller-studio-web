import worldMap from "@/content/world-map.json";
import { ISO_ALPHA2_TO_NUMERIC } from "@/lib/countryIso";

// Light blush -> brand accent (#d2001f), interpolated by share of the max count.
function colorForShare(share: number): string {
  if (share <= 0) return "#ececec";
  const from = { r: 0xf5, g: 0xe4, b: 0xe6 };
  const to = { r: 0xd2, g: 0x00, b: 0x1f };
  // Linear, not sqrt — sqrt compresses the gap between "1 customer" and "the
  // top country", so with only a handful of countries they all looked about
  // equally saturated instead of the top one clearly standing out.
  const t = share;
  const r = Math.round(from.r + (to.r - from.r) * t);
  const g = Math.round(from.g + (to.g - from.g) * t);
  const b = Math.round(from.b + (to.b - from.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export function WorldMap({ countryCounts }: { countryCounts: Record<string, number> }) {
  const countByNumeric = new Map<string, number>();
  for (const [alpha2, count] of Object.entries(countryCounts)) {
    const numeric = ISO_ALPHA2_TO_NUMERIC[alpha2.toUpperCase()];
    if (numeric) countByNumeric.set(numeric, count);
  }
  const maxCount = Math.max(1, ...countByNumeric.values());

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-border/10">
      <svg
        viewBox={`0 0 ${worldMap.width} ${worldMap.height}`}
        role="img"
        aria-label="Customer geographic distribution"
        className="block h-auto w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {worldMap.countries.map((c) => {
          const count = countByNumeric.get(c.id) ?? 0;
          return (
            <path
              key={c.id}
              d={c.d}
              fill={colorForShare(count / maxCount)}
              stroke="#ffffff"
              strokeWidth={0.5}
            >
              <title>
                {c.name}
                {count > 0 ? ` — ${count} customer${count === 1 ? "" : "s"}` : ""}
              </title>
            </path>
          );
        })}
      </svg>
    </div>
  );
}
