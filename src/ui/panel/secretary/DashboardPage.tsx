"use client";
/** Front desk › Dashboard (/panel): today's numbers, live board, now/next per court, open tickets. */
import Link from "next/link";
import { takenSync } from "@/engine/api";
import { fa, jDate, jFull } from "@/engine/format";
import { TICKETS } from "@/engine/mock";
import { todayKey, useTodayStats } from "@/engine/panel/stats";
import { COURTS } from "@/engine/venue";
import { KpiGrid } from "@/ui/panel/parts/KpiGrid";
import { LiveBoard } from "@/ui/panel/parts/LiveBoard";
import { millions } from "@/ui/panel/parts/format";
import { PageHead } from "@/ui/panel/shell/PageHead";

export function FrontDeskDashboard() {
  const stats = useTodayStats();
  const today = todayKey();
  const hour = new Date().getHours();
  const openTickets = TICKETS.filter((t) => t.status === "open");
  return (
    <>
      <PageHead title="داشبورد منشی" sub={jFull(today)} action={<Link className="btn soft" href="/panel/newb">رزرو جدید</Link>} />
      <KpiGrid
        items={[
          ["رزروهای امروز", fa(stats.booked), `از ${fa(stats.totalSlots)} سانس`],
          ["پر بودن زمین‌ها", `${fa(stats.occupancy)}٪`],
          ["فروش امروز", millions(stats.revenue)],
          ["تیکت‌های باز", fa(openTickets.length), "نیازمند پاسخ"],
        ]}
      />
      <LiveBoard around />
      <div className="grid cols2e" style={{ marginTop: 16 }}>
        <div className="card stack">
          <h3>الان و سانس بعد</h3>
          <div className="list">
            {COURTS.map((court) => {
              const now = takenSync(today, court.id, hour);
              const next = takenSync(today, court.id, hour + 1);
              return (
                <div className="li small" key={court.id}>
                  <b>{court.name}</b>
                  <span className="muted">{now?.userName ?? "خالی"} ← {next?.userName ?? "خالی"}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card stack">
          <div className="row between"><h3>تیکت‌های بی‌پاسخ</h3><Link className="btn ghost sm" href="/panel/tickets">همه</Link></div>
          <div className="list">
            {openTickets.map((t) => (
              <div className="li small" key={t.id}>
                <span><b>{t.title}</b><br /><span className="xs muted">{jDate(t.date)}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
