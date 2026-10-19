"use client";
/** Admin-only pages: dashboard, courts, closures, pricing, rules, finance reports and audit log. */
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AUDIT, TICKETS, TXS, seedBookings } from "@/modules/core/mock";
import { CANCEL_RULES, COURTS, HOLD_MINUTES, HOURS, MAX_DAYS_AHEAD, PRICING, SPORTS, courtById, sportById, sportTitle } from "@/modules/core/venue";
import type { Court } from "@/modules/core/types";
import { addDays, dayKey, fa, hm, jDate, jDay, jFull } from "@/modules/core/format";
import { PageHead } from "@/modules/panel/PanelShell";
import { LiveBoard } from "@/modules/panel/LiveBoard";
import { toast } from "@/modules/ui/Toast";
import { KpiGrid, TransactionTable, todayKey, useTodayStats, type Kpi } from "@/modules/panel/views/shared";

/** One day of revenue: Jalali day label plus millions of toman per sport id. */
type DayRevenue = { day: string } & Record<string, number | string>;

/** Chart colours cycled across sports. */
const SERIES_COLORS = ["var(--c2)", "var(--c1)", "var(--c3)"];
const colorOf = (i: number) => SERIES_COLORS[i % SERIES_COLORS.length];

/** Daily revenue in millions of toman for the last `days` days, one key per sport. */
function revenueSeries(days = 30): DayRevenue[] {
  const start = addDays(new Date(), -days + 1);
  // seedBookings covers two weeks from its start date, so stitch three windows together.
  const bookings = [0, 14, 28].flatMap((offset) => seedBookings(addDays(start, offset)));
  return Array.from({ length: days }, (_, i) => {
    const key = dayKey(addDays(start, i));
    const ofDay = bookings.filter((b) => b.date === key);
    const row: DayRevenue = { day: jDay(key) };
    for (const sport of SPORTS) {
      row[sport.id] = ofDay.filter((b) => courtById(b.courtId)?.sport === sport.id).reduce((a, b) => a + b.price, 0) / 1e6;
    }
    return row;
  });
}

/** Total of one sport, or of all sports, across the series (millions of toman). */
const totalOf = (series: DayRevenue[], sport?: string) =>
  series.reduce((sum, d) => sum + SPORTS.filter((s) => !sport || s.id === sport).reduce((a, s) => a + Number(d[s.id]), 0), 0);

function RevenueChart({ series }: { series: DayRevenue[] }) {
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

export function AdminDashboard() {
  const stats = useTodayStats();
  const series = useMemo(() => revenueSeries(), []);
  return (
    <>
      <PageHead title="داشبورد مدیریت" sub={jFull(todayKey())} />
      <KpiGrid
        items={[
          ["درآمد ۳۰ روز", `${fa(Math.round(totalOf(series)))} میلیون`],
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

/** e.g. "سرپوشیده · چمن آبی" or "ماسه · تنیس ساحلی و والیبال ساحلی". */
function courtDescription(court: Court) {
  const sport = sportById(court.sport);
  if (!sport) return court.surface;
  return sport.games.length > 1 ? `${court.surface} · ${sportTitle(sport)}` : `${sport.indoor ? "سرپوشیده" : "روباز"} · ${court.surface}`;
}

export function CourtsView() {
  return (
    <>
      <PageHead title="زمین‌ها" />
      <div className="grid courts">
        {COURTS.map((c) => (
          <div className="card stack" key={c.id}>
            <b>{c.name}</b>
            <span className="small muted">{courtDescription(c)}</span>
            <label className="row small"><input type="checkbox" defaultChecked={c.active} /> فعال</label>
          </div>
        ))}
      </div>
    </>
  );
}

/** Close a court for a time range (maintenance, tournament); affected bookings are refunded. */
export function CloseCourtView() {
  const days = Array.from({ length: 14 }, (_, i) => dayKey(addDays(new Date(), i)));
  return (
    <>
      <PageHead title="بستن زمین" sub="برای تعمیرات یا مسابقه؛ رزروهای این بازه لغو و وجه برگردانده می‌شود" />
      <div className="card stack" style={{ maxWidth: 620 }}>
        <div className="grid f2">
          <label className="f">زمین<select className="input">{COURTS.map((c) => <option key={c.id}>{c.name}</option>)}</select></label>
          <label className="f">تاریخ<select className="input">{days.map((d) => <option key={d}>{jFull(d)}</option>)}</select></label>
          <label className="f">از ساعت<select className="input">{HOURS.map((h) => <option key={h}>{hm(h)}</option>)}</select></label>
          <label className="f">تا ساعت<select className="input">{HOURS.map((h) => <option key={h}>{hm(h + 1)}</option>)}</select></label>
        </div>
        <label className="f">دلیل<input className="input" placeholder="مثلاً تعویض چمن" /></label>
        <label className="row small"><input type="checkbox" defaultChecked /> بازگشت کامل وجه به کیف پول رزروکنندگان</label>
        <div><button className="btn danger" onClick={() => toast("زمین بسته شد و به کاربران پیامک ارسال شد")}>بستن زمین</button></div>
      </div>
    </>
  );
}

/** Price per session for each time band, per sport. */
export function PricingView() {
  return (
    <>
      <PageHead
        title="قیمت‌گذاری"
        sub="بازه‌های زمانی و قیمت هر سانس به تفکیک رشته"
        action={<button className="btn" onClick={() => toast("قیمت‌ها ذخیره شد")}>ذخیره تغییرات</button>}
      />
      <div className="grid cols2e">
        {SPORTS.map((sport) => (
          <div className="card stack" key={sport.id}>
            <h3>{sport.name}</h3>
            {(PRICING[sport.id] ?? []).map((band) => (
              <div className="row" key={band.from}>
                <span className="small" style={{ minWidth: 110 }}>{hm(band.from)} تا {hm(band.to)}</span>
                <input className="input ltr" defaultValue={band.price} style={{ maxWidth: 180 }} />
                <span className="small muted">تومان</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

/** Booking window, payment hold and cancellation refund rules. */
export function SettingsView() {
  return (
    <>
      <PageHead title="تنظیمات و قوانین" action={<button className="btn" onClick={() => toast("تنظیمات ذخیره شد")}>ذخیره</button>} />
      <div className="grid cols2e">
        <div className="card stack">
          <label className="f">حداکثر روزهای آینده برای رزرو<input className="input ltr" defaultValue={MAX_DAYS_AHEAD} /></label>
          <label className="f">مدت نگه‌داشت زمین هنگام پرداخت (دقیقه)<input className="input ltr" defaultValue={HOLD_MINUTES} /></label>
        </div>
        <div className="card stack">
          <h3>قوانین لغو و بازگشت وجه</h3>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>ساعت مانده تا شروع</th><th>درصد بازگشت</th></tr></thead>
              <tbody>
                {CANCEL_RULES.map((r) => <tr key={r.hours}><td>بیش از {fa(r.hours)} ساعت</td><td>{fa(r.percent)}٪</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export function FinanceReportsView() {
  const series = useMemo(() => revenueSeries(30), []);
  const total = totalOf(series);
  const millions = (n: number) => `${fa(Math.round(n))} میلیون`;
  return (
    <>
      <PageHead title="گزارش‌های مالی" sub="۳۰ روز اخیر" />
      <KpiGrid
        items={[
          ["کل درآمد", millions(total)],
          ...SPORTS.map((s): Kpi => [s.name, millions(totalOf(series, s.id))]),
          ["میانگین روزانه", `${fa((total / 30).toFixed(1))} میلیون`],
        ]}
      />
      <div style={{ marginTop: 16 }}><TransactionTable rows={TXS} showUser /></div>
    </>
  );
}

/** Who changed what, and when. */
export function AuditLogView() {
  return (
    <>
      <PageHead title="تاریخچه تغییرات" />
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>تاریخ</th><th>کاربر</th><th>عملیات</th><th>مورد</th><th>جزئیات</th></tr></thead>
          <tbody>
            {AUDIT.map((entry, i) => (
              <tr key={i}><td>{jDate(entry.date)}</td><td>{entry.actor}</td><td>{entry.action}</td><td>{entry.target}</td><td>{entry.detail}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
