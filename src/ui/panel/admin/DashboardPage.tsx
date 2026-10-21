"use client";
/**
 * Admin › Dashboard (/panel). The club at a glance: one line of today's and
 * the period's numbers, revenue per day by sport with a period switch, what
 * needs the manager (escalated tickets, closures, courts switched off), and
 * the front desk's live scoreboard and day timeline. Styles: admin.css ("ad-").
 */
import Link from "next/link";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { getTickets } from "@/engine/api";
import { REVENUE_PERIODS, useRevenue } from "@/engine/admin/useRevenue";
import { useClosures, useCourtsAdmin } from "@/engine/admin/useCourtsAdmin";
import { fa, hm, jDate, toman } from "@/engine/format";
import { useFrontDesk } from "@/engine/panel/useFrontDesk";
import { courtById } from "@/engine/venue";
import { RevenueChart, colorOf } from "@/ui/panel/admin/RevenueChart";
import { NowBoard, Timeline } from "@/ui/panel/secretary/DashboardPage";
import { PageHead } from "@/ui/panel/shell/PageHead";

const millions = (n: number) => `${fa((n / 1e6).toFixed(1))} میلیون`;

export function AdminDashboard() {
  const desk = useFrontDesk();
  const rev = useRevenue(30);
  const courts = useCourtsAdmin();
  const closures = useClosures();
  const { data: tickets = [] } = useQuery({ queryKey: ["tickets", "admin"], queryFn: () => getTickets("admin"), refetchInterval: 60_000 });
  const escalated = tickets.filter((t) => t.status === "escalated");
  const off = courts.courts.filter((c) => !c.active);
  const nextClosures = closures.closures.slice(0, 3);
  const r = rev.report;

  return (
    <div className="ad">
      <PageHead title="داشبورد مدیریت" />

      <div className="ad-sum">
        <dl>
          <div><dt>رزرو امروز</dt><dd>{fa(desk.stats.booked)}<small> از {fa(desk.stats.totalSlots)}</small></dd></div>
          <div><dt>پر بودن امروز</dt><dd>{fa(desk.stats.occupancy)}٪</dd></div>
          <div><dt>فروش امروز</dt><dd>{toman(desk.stats.revenue)}</dd></div>
        </dl>
        <dl className="ad-period">
          <div><dt>درآمد {fa(rev.days)} روز</dt><dd>{r ? millions(r.total) : "…"}</dd></div>
          <div><dt>میانگین روزانه</dt><dd>{r ? millions(rev.avgPerDay) : "…"}</dd></div>
          <div><dt>رزرو آنلاین</dt><dd>{r ? `${fa(Math.round(r.onlineShare * 100))}٪` : "…"}</dd></div>
        </dl>
      </div>

      <div className="ad-cols">
        <section className="ad-card ad-rev">
          <header>
            <h3>درآمد روزانه</h3>
            <div className="ad-seg" role="tablist" aria-label="بازه">
              {REVENUE_PERIODS.map((p) => (
                <button key={p} type="button" role="tab" aria-selected={rev.days === p} className={clsx(rev.days === p && "on")} onClick={() => rev.setDays(p)}>{fa(p)} روز</button>
              ))}
            </div>
          </header>
          <RevenueChart series={rev.series} />
          <ul className="ad-sports">
            {rev.sports.map(({ sport, revenue }, i) => (
              <li key={sport.id}>
                <i style={{ background: colorOf(i) }} />
                <span>{sport.name}</span>
                <b>{millions(revenue)}</b>
                <small>{r?.total ? `${fa(Math.round((revenue / r.total) * 100))}٪` : ""}</small>
              </li>
            ))}
            <li className="ad-more"><Link href="/panel/rfin">گزارش کامل مالی</Link></li>
          </ul>
        </section>

        <aside className="ad-side">
          <section className="ad-card">
            <header><h3>ارجاع به مدیریت</h3><span>{fa(escalated.length)}</span></header>
            {escalated.length ? (
              <ul className="ad-list">
                {escalated.slice(0, 4).map((t) => <li key={t.id}><Link href="/panel/tickets">{t.title}</Link><small>{jDate(t.date)}</small></li>)}
              </ul>
            ) : <p className="ad-none">تیکتی منتظر تصمیم شما نیست.</p>}
          </section>
          <section className="ad-card">
            <header><h3>زمین‌های بسته</h3><Link href="/panel/close">بستن زمین</Link></header>
            {nextClosures.length || off.length ? (
              <ul className="ad-list">
                {off.map((c) => <li key={c.id}><b>{c.name}</b><small>غیرفعال در رزرو آنلاین</small></li>)}
                {nextClosures.map((c) => (
                  <li key={c.id}>
                    <b>{c.courtIds.map((id) => courtById(id)?.name ?? id).join("، ")}</b>
                    <small>{jDate(c.date)} · <bdi>{hm(c.from)}</bdi> تا <bdi>{hm(c.to)}</bdi> · {c.reason}</small>
                  </li>
                ))}
              </ul>
            ) : <p className="ad-none">همه‌ی زمین‌ها باز هستند.</p>}
          </section>
        </aside>
      </div>

      <NowBoard d={desk} />
      <Timeline d={desk} />
    </div>
  );
}
