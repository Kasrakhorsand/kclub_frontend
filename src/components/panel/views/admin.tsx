"use client";
/** Admin-only pages: dashboard, courts, closures, pricing, rules, finance reports and audit log. */
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AUDIT, CANCEL_RULES, COURTS, HOLD_MINUTES, HOURS, MAX_DAYS_AHEAD, PRICING, TICKETS, TXS, seedBookings } from "@/lib/mock";
import { addDays, dayKey, fa, hm, jDate, jDay, jFull } from "@/lib/format";
import { PageHead } from "../PanelShell";
import { LiveBoard } from "../LiveBoard";
import { toast } from "../../ui/Toast";
import { KpiGrid, TransactionTable, todayKey, useTodayStats } from "./shared";

type DayRevenue = { day: string; padel: number; beach: number };

/** Daily revenue in millions of toman for the last `days` days, split by sport. */
function revenueSeries(days = 30): DayRevenue[] {
  const start = addDays(new Date(), -days + 1);
  // seedBookings covers two weeks from its start date, so stitch three windows together.
  const bookings = [0, 14, 28].flatMap((offset) => seedBookings(addDays(start, offset)));
  return Array.from({ length: days }, (_, i) => {
    const key = dayKey(addDays(start, i));
    const ofDay = bookings.filter((b) => b.date === key);
    const sum = (prefix: string) => ofDay.filter((b) => b.courtId.startsWith(prefix)).reduce((a, b) => a + b.price, 0);
    return { day: jDay(key), padel: sum("P") / 1e6, beach: sum("B") / 1e6 };
  });
}

const totalOf = (series: DayRevenue[]) => series.reduce((sum, d) => sum + d.padel + d.beach, 0);

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
            <Bar dataKey="padel" name="پدل" stackId="a" fill="var(--c2)" />
            <Bar dataKey="beach" name="ساحلی" stackId="a" fill="var(--c1)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="lg">
        <span><i style={{ background: "var(--c2)" }} />پدل</span>
        <span><i style={{ background: "var(--c1)" }} />ساحلی</span>
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

export function CourtsView() {
  return (
    <>
      <PageHead title="زمین‌ها" />
      <div className="grid courts">
        {COURTS.map((c) => (
          <div className="card stack" key={c.id}>
            <b>{c.name}</b>
            <span className="small muted">{c.sport === "padel" ? `سرپوشیده · ${c.surface}` : "ماسه · تنیس و والیبال ساحلی"}</span>
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
        {(["padel", "beach"] as const).map((sport) => (
          <div className="card stack" key={sport}>
            <h3>{sport === "padel" ? "پدل" : "ساحلی"}</h3>
            {PRICING[sport].map((band) => (
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
  const padel = series.reduce((sum, d) => sum + d.padel, 0);
  return (
    <>
      <PageHead title="گزارش‌های مالی" sub="۳۰ روز اخیر" />
      <KpiGrid
        items={[
          ["کل درآمد", `${fa(Math.round(total))} میلیون`],
          ["پدل", `${fa(Math.round(padel))} میلیون`],
          ["ساحلی", `${fa(Math.round(total - padel))} میلیون`],
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
