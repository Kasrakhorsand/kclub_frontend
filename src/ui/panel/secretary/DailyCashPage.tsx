"use client";
/** Front desk › Daily cash report (/panel/cash). */
import { fa, jFull, toman } from "@/engine/format";
import { TXS } from "@/engine/mock";
import { todayKey } from "@/engine/panel/stats";
import { KpiGrid } from "@/ui/panel/parts/KpiGrid";
import { TransactionTable } from "@/ui/panel/parts/TransactionTable";
import { PageHead } from "@/ui/panel/shell/PageHead";

/** Today's cash drawer: money taken by front-desk staff. */
export function DailyCashView() {
  const today = todayKey();
  const rows = TXS.filter((t) => t.date === today && t.actor.startsWith("منشی"));
  const received = rows.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  return (
    <>
      <PageHead title="گزارش صندوق روزانه" sub={jFull(today)} />
      <KpiGrid items={[["دریافتی شما", toman(received)], ["تعداد تراکنش", fa(rows.length)]]} />
      <div style={{ marginTop: 16 }}><TransactionTable rows={rows} showUser /></div>
    </>
  );
}
