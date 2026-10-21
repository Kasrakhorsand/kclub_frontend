"use client";
/** Stacked daily revenue bars per sport, in millions of toman (admin dashboard and finance reports). */
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fa, jDay } from "@/engine/format";
import { SPORTS } from "@/engine/venue";

/** Chart colours cycled across sports. */
const SERIES_COLORS = ["var(--c1)", "var(--c2)", "var(--c3)"];
export const colorOf = (i: number) => SERIES_COLORS[i % SERIES_COLORS.length];

type Row = { date: string } & Record<string, number | string>;

export function RevenueChart({ series, height = 240 }: { series: Row[]; height?: number }) {
  const rows = series.map((r) => ({ ...r, day: jDay(r.date) }));
  return (
    <div className="rv-chart" style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "var(--muted)", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "var(--line)" }} interval="preserveStartEnd" minTickGap={10} />
          <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} width={34} tickLine={false} axisLine={false} tickFormatter={(v: number) => fa(v)} />
          <Tooltip
            cursor={{ fill: "var(--court-soft)" }}
            contentStyle={{ background: "var(--black)", border: 0, borderRadius: 10, color: "#fff", fontSize: 12 }}
            labelFormatter={(_, p) => (p?.[0]?.payload?.date ? jDay(p[0].payload.date as string) : "")}
            formatter={(v: number, name: string) => [`${fa(v.toFixed(1))} میلیون`, name]}
          />
          {SPORTS.map((sport, i) => (
            <Bar key={sport.id} dataKey={sport.id} name={sport.name} stackId="a" fill={colorOf(i)} isAnimationActive={false} radius={i === SPORTS.length - 1 ? [3, 3, 0, 0] : undefined} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
