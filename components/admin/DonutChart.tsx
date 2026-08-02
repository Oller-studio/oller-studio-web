"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS } from "@/lib/chartColors";

export function DonutChart({
  segments,
}: {
  segments: { label: string; value: number }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const data = segments.filter((s) => s.value > 0);

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-32 w-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={44}
              outerRadius={62}
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="none"
            >
              {data.map((s, i) => (
                <Cell key={s.label} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--color-background)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
                padding: "6px 10px",
              }}
              formatter={(value, name) => [
                `${value} (${total > 0 ? Math.round((Number(value) / total) * 100) : 0}%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xl font-semibold">
          {total}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {segments.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
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
