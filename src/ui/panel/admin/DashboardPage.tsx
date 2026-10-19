"use client";
/** Admin › Dashboard (/panel): 30-day revenue, today's numbers, live board. */
import { useMemo } from "react";
import { fa, jFull } from "@/engine/format";
import { TICKETS } from "@/engine/mock";
import { revenueSeries, revenueTotal, todayKey, useTodayStats } from "@/engine/panel/stats";
import { RevenueChart } from "@/ui/panel/admin/RevenueChart";
import { KpiGrid } from "@/ui/panel/parts/KpiGrid";
import { LiveBoard } from "@/ui/panel/parts/LiveBoard";
import { PageHead } from "@/ui/panel/shell/PageHead";

export function AdminDashboard() {
  const stats = useTodayStats();
  const series = useMemo(() => revenueSeries(), []);
  return (
    <>
      <PageHead title="داشبورد مدیریت" sub={jFull(todayKey())} />
      <KpiGrid
        items={[
          ["درآمد ۳۰ روز", `${fa(Math.round(revenueTotal(series)))} میلیون`],
          ["رزروهای امروز", fa(stats.booked), `از ${fa(stats.totalSlots)} سانس`],
          ["پر بودن امروز", `${fa(stats.occupancy)}٪`],
          ["تیکت‌های ارجاعی", fa(TICKETS.filter((t) => t.status === "escalated").length)],
        ]}
      />
      <RevenueChart series={series} />
      <div style={{ marginTop: 16 }}><LiveBoard around /></div>
    </>
  );
}
