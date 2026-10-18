"use client";
/** Front-desk pages (also reused by admin): dashboard, schedule, walk-in booking, users and daily cash. */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { useSession } from "@/lib/store";
import { isPast, takenSync } from "@/lib/api";
import { COURTS, HOLD_MINUTES, HOURS, MAX_DAYS_AHEAD, TICKETS, TXS, USERS, priceOf } from "@/lib/mock";
import { addDays, dayKey, fa, hm, jDate, jDay, jFull, jMonth, toman, weekday } from "@/lib/format";
import { PageHead } from "../PanelShell";
import { LiveBoard } from "../LiveBoard";
import { Button3D } from "../../ui/Buttons";
import { toast } from "../../ui/Toast";
import { KpiGrid, TransactionTable, millions, todayKey, useTodayStats } from "./shared";

/** Next `count` day keys starting today. */
const nextDays = (count: number) => Array.from({ length: count }, (_, i) => dayKey(addDays(new Date(), i)));

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

/** Two-week day picker above the live board for the chosen day. */
export function ScheduleView() {
  const [date, setDate] = useState(todayKey());
  return (
    <>
      <PageHead title="جدول رزروها" sub="همه‌ی زمین‌ها در یک روز" action={<Link className="btn" href={`/panel/newb?date=${date}`}>رزرو جدید</Link>} />
      <div className="dsr" style={{ marginBottom: 14 }}>
        {nextDays(14).map((day, i) => (
          <button key={day} className={clsx("dc ok", day === date && "on")} onClick={() => setDate(day)}>
            <span className="w">{i === 0 ? "امروز" : weekday(day)}</span>
            <b>{jDay(day)}</b>
            <span className="mo">{jMonth(day)}</span>
          </button>
        ))}
      </div>
      <LiveBoard date={date} title={`جدول ${jFull(date)}`} />
    </>
  );
}

/** Walk-in or phone booking entered by staff; ?date, ?hour and ?court prefill the form. */
export function NewBookingView() {
  const params = useSearchParams();
  const [date, setDate] = useState(params.get("date") ?? todayKey());
  const [hour, setHour] = useState(Number(params.get("hour") ?? 18));
  const [courtId, setCourtId] = useState(params.get("court") ?? "P1");
  const [phone, setPhone] = useState("");
  const court = COURTS.find((c) => c.id === courtId)!;
  const taken = !!takenSync(date, courtId, hour);
  const customer = USERS[phone];
  const phoneComplete = phone.length === 11;

  return (
    <>
      <PageHead title="رزرو جدید" sub="ثبت رزرو حضوری یا تلفنی برای کاربر" />
      <div className="grid cols2">
        <div className="card stack">
          <div className="grid f2">
            <label className="f">
              زمین
              <select className="input" value={courtId} onChange={(e) => setCourtId(e.target.value)}>
                {COURTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="f">
              تاریخ
              <select className="input" value={date} onChange={(e) => setDate(e.target.value)}>
                {nextDays(MAX_DAYS_AHEAD).map((day) => <option key={day} value={day}>{jFull(day)}</option>)}
              </select>
            </label>
            <label className="f">
              ساعت
              <select className="input" value={hour} onChange={(e) => setHour(Number(e.target.value))}>
                {HOURS.map((h) => <option key={h} value={h} disabled={isPast(date, h)}>{hm(h)} تا {hm(h + 1)}</option>)}
              </select>
            </label>
            <label className="f">
              موبایل کاربر
              <input className="input ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09121234567" />
            </label>
          </div>
          {phoneComplete && (
            <p className="small">
              {customer ? <>کاربر: <b>{customer.first} {customer.last}</b> · کیف پول {toman(customer.wallet)}</> : "کاربر جدید است؛ با ثبت رزرو حسابش ساخته می‌شود."}
            </p>
          )}
          <label className="f">
            روش پرداخت
            <select className="input"><option>کارتخوان</option><option>کیف پول کاربر</option><option>ارسال لینک درگاه</option></select>
          </label>
          <div>
            <Button3D disabled={taken || !phoneComplete} onClick={() => toast("رزرو ثبت شد و پیامک تأیید ارسال شد")}>
              {taken ? "این سانس رزرو شده است" : `ثبت رزرو · ${toman(priceOf(court.sport, hour))}`}
            </Button3D>
          </div>
        </div>
        <div className="card stack">
          <h3>خلاصه</h3>
          <p>{court.name} · {court.surface}</p>
          <p>{jFull(date)} · {hm(hour)} تا {hm(hour + 1)}</p>
          <p className="muted small">نگه‌داشت زمین برای پرداخت درگاه: {fa(HOLD_MINUTES)} دقیقه</p>
        </div>
      </div>
    </>
  );
}

export function UsersView() {
  const role = useSession((s) => s.role);
  return (
    <>
      <PageHead title={role === "admin" ? "کاربران و نقش‌ها" : "کاربران"} />
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>نام</th><th>موبایل</th><th>نقش</th><th>کیف پول</th><th>VIP</th></tr></thead>
          <tbody>
            {Object.values(USERS).map((u) => (
              <tr key={u.phone}>
                <td>{u.first} {u.last}</td>
                <td>{fa(u.phone)}</td>
                <td>{u.roles.join("، ")}</td>
                <td>{toman(u.wallet)}</td>
                <td>{u.vip ? <span className="pill ball">VIP</span> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** All transactions, used for the front-desk wallet page and the admin transactions page. */
export function AllTransactionsView({ title }: { title: string }) {
  return (
    <>
      <PageHead title={title} />
      <TransactionTable rows={TXS} showUser />
    </>
  );
}

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
