"use client";
/** Stacked daily revenue bars per sport (admin dashboard). */
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fa } from "@/engine/format";
import { type DayRevenue } from "@/engine/panel/stats";
import { SPORTS } from "@/engine/venue";

/** Chart colours cycled across sports. */
const SERIES_COLORS = ["var(--c2)", "var(--c1)", "var(--c3)"];

const colorOf = (i: number) => SERIES_COLORS[i % SERIES_COLORS.length];

export function RevenueChart({ series }: { series: DayRevenue[] }) {
  return (
    <div className="card stack" style={{ marginTop: 16 }}>
      <h3>درآمد ۳۰ روز اخیر (میلیون تومان)</h3>
      <div style={{ width: "100%", height: 260, direction: "ltr" }}>
        <ResponsiveContainer>
          <BarChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "var(--muted)", fontSize: 11 }} />
            <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} width={30} />
            <Tooltip contentStyle={{ background: "var(--black)", border: 0, color: "#fff" }} formatter={(v: number) => fa(v.toFixed(1))} />
            {SPORTS.map((sport, i) => (
              <Bar
                key={sport.id}
                dataKey={sport.id}
                name={sport.name}
                stackId="a"
                fill={colorOf(i)}
                radius={i === SPORTS.length - 1 ? [3, 3, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="lg">
        {SPORTS.map((sport, i) => (
          <span key={sport.id}><i style={{ background: colorOf(i) }} />{sport.name}</span>
        ))}
      </div>
    </div>
  );
}
