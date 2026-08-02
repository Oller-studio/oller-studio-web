"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { TimelinePoint } from "@/lib/analytics";

export function LineChart({
  points,
  color = "#d2001f",
  suffix = "",
}: {
  points: TimelinePoint[];
  color?: string;
  suffix?: string;
}) {
  const gradientId = `line-gradient-${color.replace("#", "")}`;

  return (
    <div className="flex flex-col gap-1">
      <ResponsiveContainer width="100%" height={112}>
        <AreaChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" hide />
          <Tooltip
            cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
            contentStyle={{
              background: "var(--color-background)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
              padding: "6px 10px",
            }}
            labelStyle={{ color: "var(--color-muted)", marginBottom: 2 }}
            formatter={(value) => [`${Number(value).toFixed(suffix ? 1 : 0)}${suffix}`, ""]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}
