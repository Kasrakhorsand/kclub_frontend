"use client";
/** Admin › Finance reports (/panel/rfin). */
import { useMemo } from "react";
import { fa } from "@/engine/format";
import { TXS } from "@/engine/mock";
import { revenueSeries, revenueTotal } from "@/engine/panel/stats";
import { KpiGrid, type Kpi } from "@/ui/panel/parts/KpiGrid";
import { TransactionTable } from "@/ui/panel/parts/TransactionTable";
import { SPORTS } from "@/engine/venue";
import { PageHead } from "@/ui/panel/shell/PageHead";

export function FinanceReportsView() {
  const series = useMemo(() => revenueSeries(30), []);
  const total = revenueTotal(series);
  const millions = (n: number) => `${fa(Math.round(n))} میلیون`;
  return (
    <>
      <PageHead title="گزارش‌های مالی" sub="۳۰ روز اخیر" />
      <KpiGrid
        items={[
          ["کل درآمد", millions(total)],
          ...SPORTS.map((s): Kpi => [s.name, millions(revenueTotal(series, s.id))]),
          ["میانگین روزانه", `${fa((total / 30).toFixed(1))} میلیون`],
        ]}
      />
      <div style={{ marginTop: 16 }}><TransactionTable rows={TXS} showUser /></div>
    </>
  );
}
