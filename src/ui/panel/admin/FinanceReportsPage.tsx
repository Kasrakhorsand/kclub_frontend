"use client";
/**
 * Admin › Finance reports (/panel/rfin). Period switch, the period's numbers
 * in one line, revenue per day by sport, and a per-court table with revenue,
 * booked hours and utilisation. Wallet transactions live on their own page.
 * Styles: admin.css ("ad-", "fr-").
 */
import Link from "next/link";
import clsx from "clsx";
import { REVENUE_PERIODS, useRevenue } from "@/engine/admin/useRevenue";
import { fa, toman } from "@/engine/format";
import { sportById } from "@/engine/venue";
import { RevenueChart, colorOf } from "@/ui/panel/admin/RevenueChart";
import { PageHead } from "@/ui/panel/shell/PageHead";

const millions = (n: number) => `${fa((n / 1e6).toFixed(1))} میلیون`;

export function FinanceReportsView() {
  const rev = useRevenue(30);
  const r = rev.report;
  const maxCourt = Math.max(1, ...rev.courts.map((c) => c.revenue));
  return (
    <div className="ad fr">
      <PageHead
        title="گزارش‌های مالی"
        action={
          <div className="ad-seg" role="tablist" aria-label="بازه">
            {REVENUE_PERIODS.map((p) => (
              <button key={p} type="button" role="tab" aria-selected={rev.days === p} className={clsx(rev.days === p && "on")} onClick={() => rev.setDays(p)}>{fa(p)} روز</button>
            ))}
          </div>
        }
      />

      <div className="ad-sum">
        <dl>
          <div><dt>کل درآمد</dt><dd>{r ? toman(r.total) : "…"}</dd></div>
          <div><dt>میانگین روزانه</dt><dd>{r ? millions(rev.avgPerDay) : "…"}</dd></div>
          <div><dt>تعداد رزرو</dt><dd>{r ? fa(r.bookings) : "…"}</dd></div>
          <div><dt>میانگین هر رزرو</dt><dd>{r?.bookings ? toman(Math.round(r.total / r.bookings)) : "—"}</dd></div>
          <div><dt>آنلاین / حضوری</dt><dd>{r ? `${fa(Math.round(r.onlineShare * 100))}٪ / ${fa(100 - Math.round(r.onlineShare * 100))}٪` : "…"}</dd></div>
        </dl>
      </div>

      <section className="ad-card ad-rev">
        <header><h3>درآمد روزانه به تفکیک رشته</h3></header>
        <RevenueChart series={rev.series} height={280} />
        <ul className="ad-sports">
          {rev.sports.map(({ sport, revenue }, i) => (
            <li key={sport.id}>
              <i style={{ background: colorOf(i) }} />
              <span>{sport.name}</span>
              <b>{millions(revenue)}</b>
              <small>{r?.total ? `${fa(Math.round((revenue / r.total) * 100))}٪` : ""}</small>
            </li>
          ))}
        </ul>
      </section>

      <section className="ad-card">
        <header><h3>عملکرد زمین‌ها</h3><Link href="/panel/alltx">همه‌ی تراکنش‌ها</Link></header>
        <div className="fr-table">
          <table>
            <thead><tr><th>زمین</th><th>درآمد</th><th>ساعت رزرو</th><th>استفاده از ظرفیت</th></tr></thead>
            <tbody>
              {rev.courts.map(({ court, revenue, hours, utilisation }) => (
                <tr key={court.id}>
                  <td><i className="fr-sw" style={{ background: court.floor }} />{court.name}<small>{sportById(court.sport)?.name}</small></td>
                  <td>
                    <span className="fr-bar"><i style={{ width: `${(revenue / maxCourt) * 100}%` }} /></span>
                    {toman(revenue)}
                  </td>
                  <td>{fa(hours)}</td>
                  <td><b className={clsx(utilisation >= 60 ? "hi" : utilisation < 25 ? "lo" : "")}>{fa(utilisation)}٪</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ad-none">استفاده از ظرفیت: ساعت‌های رزروشده نسبت به همه‌ی ساعت‌های باز در این بازه.</p>
      </section>
    </div>
  );
}
