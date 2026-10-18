"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import clsx from "clsx";
import { useSession } from "@/lib/store";
import { getDayBoard, isPast, takenSync } from "@/lib/api";
import { AUDIT, CANCEL_RULES, COURTS, HOLD_MINUTES, HOURS, MAX_DAYS_AHEAD, NOTIFS, PRICING, TICKETS, TXS, USERS, priceOf, seedBookings } from "@/lib/mock";
import { addDays, dayKey, fa, faNum, hm, jDate, jDay, jFull, jMonth, toman, weekday } from "@/lib/format";
import { PageHead } from "./PanelShell";
import { LiveBoard } from "./LiveBoard";
import { Button3D } from "../ui/Buttons";
import { toast } from "../ui/Toast";

const today = () => dayKey(new Date());
const M = (n: number) => `${fa(Math.round(n / 1e5) / 10)} میلیون`;

/* ---------------- shared ---------------- */
export function Soon({ title, lines }: { title: string; lines: string[] }) {
  return (
    <>
      <PageHead title={title} />
      <div className="card soonbox">
        <span className="pill ball">فاز بعد</span>
        {lines.map((l) => <p key={l} className="muted">{l}</p>)}
      </div>
    </>
  );
}

function TxTable({ rows, showUser }: { rows: typeof TXS; showUser?: boolean }) {
  const label = { charge: ["شارژ", "green"], pay: ["پرداخت", "red"], refund: ["بازگشت وجه", "info"] } as const;
  return (
    <div className="tbl-wrap">
      <table>
        <thead><tr><th>تاریخ</th>{showUser && <th>کاربر</th>}<th>نوع</th><th>شرح</th><th>روش</th><th>ثبت توسط</th><th>مبلغ</th></tr></thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td>{jDate(t.date)}</td>
              {showUser && <td>{USERS[t.phone] ? `${USERS[t.phone].first} ${USERS[t.phone].last}` : fa(t.phone)}</td>}
              <td><span className={`pill ${label[t.type][1]}`}>{label[t.type][0]}</span></td>
              <td>{t.desc}</td><td>{t.method}</td><td>{t.actor}</td>
              <td className={t.amount > 0 ? "pos" : "neg"} style={{ direction: "ltr", textAlign: "right" }}>{faNum(t.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TicketsView() {
  const role = useSession((s) => s.role);
  const [sel, setSel] = useState<string | null>(null);
  const t = TICKETS.find((x) => x.id === sel);
  const st = { open: ["باز", "warn"], answered: ["پاسخ داده شد", "green"], escalated: ["ارجاع به ادمین", "red"], closed: ["بسته", ""] } as const;
  return (
    <>
      <PageHead title="تیکت‌ها" sub={role === "player" ? "پیام به پذیرش مجموعه" : "درخواست‌ها و پیام‌های کاربران"} />
      <div className="grid cols2">
        <div className="card list">
          {TICKETS.map((x) => (
            <button key={x.id} className="li" style={{ background: "none", border: 0, borderBottom: "1px solid var(--line)", textAlign: "right", cursor: "pointer" }} onClick={() => setSel(x.id)}>
              <span><b>{x.title}</b><br /><span className="xs muted">{x.id} · {jDate(x.date)}</span></span>
              <span className={`pill ${st[x.status][1]}`}>{st[x.status][0]}</span>
            </button>
          ))}
        </div>
        <div className="card stack">
          {!t && <p className="muted">یک تیکت را انتخاب کنید.</p>}
          {t && (
            <>
              <h3>{t.title}</h3>
              <div className="stack" style={{ gap: 4 }}>
                {t.messages.map((m, i) => <div key={i} className={`msg ${m.by === "user" ? "u" : m.by === "admin" ? "a" : "s"}`}>{m.text}</div>)}
              </div>
              <textarea className="input" rows={3} placeholder="پاسخ خود را بنویسید" />
              <div className="row">
                <button className="btn" onClick={() => toast("پاسخ ارسال شد")}>ارسال</button>
                {role === "secretary" && <button className="btn ghost" onClick={() => toast("به ادمین ارجاع شد")}>ارجاع به ادمین</button>}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function NotifView() {
  return (
    <>
      <PageHead title="اعلان‌ها" />
      <div className="card list">
        {NOTIFS.map((n) => (
          <div className="li" key={n.id}>
            <span><b>{n.title}</b><br /><span className="small muted">{n.text}</span></span>
            {!n.read && <span className="pill red">جدید</span>}
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------------- player ---------------- */
function useMyBookings() {
  const user = useSession((s) => s.user)!;
  const all = useMemo(() => seedBookings(), []);
  const name = `${user.first} ${user.last}`;
  return all.filter((b) => b.userName === name || b.userName.startsWith(user.first)).slice(0, 8);
}

function PlayerDash() {
  const user = useSession((s) => s.user)!;
  const mine = useMyBookings();
  const next = mine[0];
  return (
    <>
      <PageHead title={`سلام ${user.first}، خوش آمدید`} />
      <div className="grid cols2e">
        <div className="card next stack">
          <span className="small muted">رزرو بعدی شما</span>
          {next ? <><h3>{COURTS.find((c) => c.id === next.courtId)?.name}</h3><p>{jFull(next.date)} · ساعت {hm(next.hour)} تا {hm(next.hour + 1)}</p></> : <p>رزرو فعالی ندارید.</p>}
          <div><Button3D href="/sport">+ رزرو زمین</Button3D></div>
        </div>
        <div className="card wallet-card stack">
          <span className="small muted">موجودی کیف پول</span>
          <h2 style={{ fontWeight: 300 }}>{toman(user.wallet)}</h2>
          <div><Link className="btn" href="/panel/wallet">شارژ کیف پول</Link></div>
        </div>
      </div>
      <div className="grid cols2" style={{ marginTop: 16 }}>
        <div className="card stack"><h3>رزروهای پیش رو</h3><Reservations compact /></div>
        <div className="card stack"><h3>آخرین اعلان‌ها</h3><div className="list">{NOTIFS.map((n) => <div key={n.id} className="li small"><span><b>{n.title}</b><br /><span className="muted">{n.text}</span></span></div>)}</div></div>
      </div>
    </>
  );
}

function Reservations({ compact }: { compact?: boolean }) {
  const mine = useMyBookings();
  const refund = (date: string, hour: number) => {
    const h = (new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`).getTime() - Date.now()) / 36e5;
    return CANCEL_RULES.find((r) => h >= r.hours)?.percent ?? 0;
  };
  const list = (
    <div className="list">
      {!mine.length && <p className="muted small">رزروی ندارید.</p>}
      {mine.map((b) => (
        <div className="li" key={b.id}>
          <span><b>{COURTS.find((c) => c.id === b.courtId)?.name} · {hm(b.hour)}</b><br /><span className="xs muted">{jFull(b.date)}</span></span>
          <span className="row">
            <span className="pill green">فعال</span>
            {!compact && <button className="btn ghost sm" onClick={() => toast(`لغو با بازگشت ${fa(refund(b.date, b.hour))}٪ مبلغ به کیف پول`)}>لغو</button>}
            <b className="small">{toman(b.price)}</b>
          </span>
        </div>
      ))}
    </div>
  );
  if (compact) return list;
  return (
    <>
      <PageHead title="رزروهای من" sub={`لغو تا ${fa(24)} ساعت قبل: بازگشت ۱۰۰٪ · تا ${fa(6)} ساعت قبل: ۵۰٪`} action={<Button3D href="/sport" size="sm">رزرو جدید</Button3D>} />
      <div className="card">{list}</div>
    </>
  );
}

function WalletView() {
  const user = useSession((s) => s.user)!;
  const [amt, setAmt] = useState(500_000);
  return (
    <>
      <PageHead title="کیف پول" />
      <div className="grid cols2e">
        <div className="wcard">
          <div className="top"><span className="lbl">کیف پول کی کلاب</span><span className="chipg" /></div>
          <div><div className="lbl">موجودی</div><div className="bal">{faNum(user.wallet)} <small>تومان</small></div></div>
          <div className="own"><span>{user.first} {user.last}</span><span>{fa(user.phone)}</span></div>
        </div>
        <div className="card stack">
          <h3>شارژ کیف پول</h3>
          <div className="chips">{[200_000, 500_000, 1_000_000, 2_000_000].map((v) => <button key={v} className={clsx("chip", amt === v && "on")} onClick={() => setAmt(v)}>{toman(v)}</button>)}</div>
          <Button3D onClick={() => toast("انتقال به درگاه پرداخت…")}>پرداخت {toman(amt)}</Button3D>
        </div>
      </div>
      <div style={{ marginTop: 16 }}><TxTable rows={TXS.filter((t) => t.phone === user.phone)} /></div>
    </>
  );
}

function ProfileView() {
  const user = useSession((s) => s.user)!;
  return (
    <>
      <PageHead title="پروفایل" />
      <div className="card stack" style={{ maxWidth: 560 }}>
        <label className="f">نام<input className="input" defaultValue={user.first} /></label>
        <label className="f">نام خانوادگی<input className="input" defaultValue={user.last} /></label>
        <label className="f">موبایل<input className="input ltr" defaultValue={user.phone} disabled /></label>
        <label className="f">سطح بازی پدل<select className="input"><option>مبتدی</option><option>متوسط</option><option>پیشرفته</option></select></label>
        <div><button className="btn" onClick={() => toast("پروفایل ذخیره شد")}>ذخیره</button></div>
      </div>
    </>
  );
}

/* ---------------- secretary ---------------- */
function Kpis({ items }: { items: [string, string, string?][] }) {
  return (
    <div className="grid kpis">
      {items.map(([l, v, d]) => (
        <div className="card kpi" key={l}><span className="small muted">{l}</span><span className="v">{v}</span>{d && <span className="d muted">{d}</span>}</div>
      ))}
    </div>
  );
}

function useTodayStats() {
  const { data = [] } = useQuery({ queryKey: ["board", today()], queryFn: () => getDayBoard(today()) });
  const total = COURTS.length * HOURS.length;
  return { booked: data.length, occ: Math.round((data.length / total) * 100), total, revenue: data.reduce((a, b) => a + b.price, 0) };
}

function SecDash() {
  const s = useTodayStats();
  const now = new Date().getHours();
  return (
    <>
      <PageHead title="داشبورد منشی" sub={jFull(today())} action={<Link className="btn soft" href="/panel/newb">رزرو جدید</Link>} />
      <Kpis items={[["رزروهای امروز", fa(s.booked), `از ${fa(s.total)} سانس`], ["پر بودن زمین‌ها", `${fa(s.occ)}٪`], ["فروش امروز", M(s.revenue)], ["تیکت‌های باز", fa(TICKETS.filter((t) => t.status === "open").length), "نیازمند پاسخ"]]} />
      <LiveBoard around />
      <div className="grid cols2e" style={{ marginTop: 16 }}>
        <div className="card stack">
          <h3>الان و سانس بعد</h3>
          <div className="list">
            {COURTS.map((c) => {
              const a = takenSync(today(), c.id, now), b = takenSync(today(), c.id, now + 1);
              return <div className="li small" key={c.id}><b>{c.name}</b><span className="muted">{a?.userName ?? "خالی"} ← {b?.userName ?? "خالی"}</span></div>;
            })}
          </div>
        </div>
        <div className="card stack">
          <div className="row between"><h3>تیکت‌های بی‌پاسخ</h3><Link className="btn ghost sm" href="/panel/tickets">همه</Link></div>
          <div className="list">{TICKETS.filter((t) => t.status === "open").map((t) => <div className="li small" key={t.id}><span><b>{t.title}</b><br /><span className="xs muted">{jDate(t.date)}</span></span></div>)}</div>
        </div>
      </div>
    </>
  );
}

function SchedView() {
  const [date, setDate] = useState(today());
  const days = Array.from({ length: 14 }, (_, i) => dayKey(addDays(new Date(), i)));
  return (
    <>
      <PageHead title="جدول رزروها" sub="همه‌ی زمین‌ها در یک روز" action={<Link className="btn" href={`/panel/newb?date=${date}`}>رزرو جدید</Link>} />
      <div className="dsr" style={{ marginBottom: 14 }}>
        {days.map((k, i) => (
          <button key={k} className={clsx("dc ok", k === date && "on")} onClick={() => setDate(k)}>
            <span className="w">{i === 0 ? "امروز" : weekday(k)}</span><b>{jDay(k)}</b><span className="mo">{jMonth(k)}</span>
          </button>
        ))}
      </div>
      <LiveBoard date={date} title={`جدول ${jFull(date)}`} />
    </>
  );
}

function NewBooking() {
  const q = useSearchParams();
  const [date, setDate] = useState(q.get("date") ?? today());
  const [hour, setHour] = useState(Number(q.get("hour") ?? 18));
  const [court, setCourt] = useState(q.get("court") ?? "P1");
  const [phone, setPhone] = useState("");
  const c = COURTS.find((x) => x.id === court)!;
  const busy = !!takenSync(date, court, hour);
  const u = USERS[phone];
  return (
    <>
      <PageHead title="رزرو جدید" sub="ثبت رزرو حضوری یا تلفنی برای کاربر" />
      <div className="grid cols2">
        <div className="card stack">
          <div className="grid f2">
            <label className="f">زمین<select className="input" value={court} onChange={(e) => setCourt(e.target.value)}>{COURTS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
            <label className="f">تاریخ<select className="input" value={date} onChange={(e) => setDate(e.target.value)}>{Array.from({ length: MAX_DAYS_AHEAD }, (_, i) => dayKey(addDays(new Date(), i))).map((k) => <option key={k} value={k}>{jFull(k)}</option>)}</select></label>
            <label className="f">ساعت<select className="input" value={hour} onChange={(e) => setHour(Number(e.target.value))}>{HOURS.map((h) => <option key={h} value={h} disabled={isPast(date, h)}>{hm(h)} تا {hm(h + 1)}</option>)}</select></label>
            <label className="f">موبایل کاربر<input className="input ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09121234567" /></label>
          </div>
          {phone.length === 11 && <p className="small">{u ? <>کاربر: <b>{u.first} {u.last}</b> · کیف پول {toman(u.wallet)}</> : "کاربر جدید است؛ با ثبت رزرو حسابش ساخته می‌شود."}</p>}
          <label className="f">روش پرداخت<select className="input"><option>کارتخوان</option><option>کیف پول کاربر</option><option>ارسال لینک درگاه</option></select></label>
          <div>
            <Button3D disabled={busy || phone.length !== 11} onClick={() => toast("رزرو ثبت شد و پیامک تأیید ارسال شد")}>
              {busy ? "این سانس رزرو شده است" : `ثبت رزرو · ${toman(priceOf(c.sport, hour))}`}
            </Button3D>
          </div>
        </div>
        <div className="card stack"><h3>خلاصه</h3><p>{c.name} · {c.surface}</p><p>{jFull(date)} · {hm(hour)} تا {hm(hour + 1)}</p><p className="muted small">نگه‌داشت زمین برای پرداخت درگاه: {fa(HOLD_MINUTES)} دقیقه</p></div>
      </div>
    </>
  );
}

function UsersView() {
  const role = useSession((s) => s.role);
  return (
    <>
      <PageHead title={role === "admin" ? "کاربران و نقش‌ها" : "کاربران"} />
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>نام</th><th>موبایل</th><th>نقش</th><th>کیف پول</th><th>VIP</th></tr></thead>
          <tbody>{Object.values(USERS).map((u) => <tr key={u.phone}><td>{u.first} {u.last}</td><td>{fa(u.phone)}</td><td>{u.roles.join("، ")}</td><td>{toman(u.wallet)}</td><td>{u.vip ? <span className="pill ball">VIP</span> : "—"}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}

function CashView() {
  const rows = TXS.filter((t) => t.date === today() && t.actor.startsWith("منشی"));
  const sum = rows.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  return (
    <>
      <PageHead title="گزارش صندوق روزانه" sub={jFull(today())} />
      <Kpis items={[["دریافتی شما", toman(sum)], ["تعداد تراکنش", fa(rows.length)]]} />
      <div style={{ marginTop: 16 }}><TxTable rows={rows} showUser /></div>
    </>
  );
}

/* ---------------- admin ---------------- */
function revenueSeries(days = 30) {
  const start = addDays(new Date(), -days + 1);
  const all = [0, 14, 28].flatMap((o) => seedBookings(addDays(start, o)));
  return Array.from({ length: days }, (_, i) => {
    const k = dayKey(addDays(new Date(), -days + 1 + i));
    const d = all.filter((b) => b.date === k);
    const padel = d.filter((b) => b.courtId.startsWith("P")).reduce((a, b) => a + b.price, 0);
    const beach = d.filter((b) => b.courtId.startsWith("B")).reduce((a, b) => a + b.price, 0);
    return { day: jDay(k), padel: padel / 1e6, beach: beach / 1e6 };
  });
}

function AdminDash() {
  const s = useTodayStats();
  const series = useMemo(() => revenueSeries(), []);
  const month = series.reduce((a, d) => a + d.padel + d.beach, 0);
  return (
    <>
      <PageHead title="داشبورد مدیریت" sub={jFull(today())} />
      <Kpis items={[["درآمد ۳۰ روز", `${fa(Math.round(month))} میلیون`], ["رزروهای امروز", fa(s.booked), `از ${fa(s.total)} سانس`], ["پر بودن امروز", `${fa(s.occ)}٪`], ["تیکت‌های ارجاعی", fa(TICKETS.filter((t) => t.status === "escalated").length)]]} />
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
        <div className="lg"><span><i style={{ background: "var(--c2)" }} />پدل</span><span><i style={{ background: "var(--c1)" }} />ساحلی</span></div>
      </div>
      <div style={{ marginTop: 16 }}><LiveBoard around /></div>
    </>
  );
}

function CourtsView() {
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

function CloseView() {
  return (
    <>
      <PageHead title="بستن زمین" sub="برای تعمیرات یا مسابقه؛ رزروهای این بازه لغو و وجه برگردانده می‌شود" />
      <div className="card stack" style={{ maxWidth: 620 }}>
        <div className="grid f2">
          <label className="f">زمین<select className="input">{COURTS.map((c) => <option key={c.id}>{c.name}</option>)}</select></label>
          <label className="f">تاریخ<select className="input">{Array.from({ length: 14 }, (_, i) => dayKey(addDays(new Date(), i))).map((k) => <option key={k}>{jFull(k)}</option>)}</select></label>
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

function PricingView() {
  return (
    <>
      <PageHead title="قیمت‌گذاری" sub="بازه‌های زمانی و قیمت هر سانس به تفکیک رشته" action={<button className="btn" onClick={() => toast("قیمت‌ها ذخیره شد")}>ذخیره تغییرات</button>} />
      <div className="grid cols2e">
        {(["padel", "beach"] as const).map((s) => (
          <div className="card stack" key={s}>
            <h3>{s === "padel" ? "پدل" : "ساحلی"}</h3>
            {PRICING[s].map((b) => (
              <div className="row" key={b.from}>
                <span className="small" style={{ minWidth: 110 }}>{hm(b.from)} تا {hm(b.to)}</span>
                <input className="input ltr" defaultValue={b.price} style={{ maxWidth: 180 }} />
                <span className="small muted">تومان</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function SettingsView() {
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
          <div className="tbl-wrap"><table><thead><tr><th>ساعت مانده تا شروع</th><th>درصد بازگشت</th></tr></thead><tbody>{CANCEL_RULES.map((r) => <tr key={r.hours}><td>بیش از {fa(r.hours)} ساعت</td><td>{fa(r.percent)}٪</td></tr>)}</tbody></table></div>
        </div>
      </div>
    </>
  );
}

function ReportsView() {
  const series = useMemo(() => revenueSeries(30), []);
  const total = series.reduce((a, d) => a + d.padel + d.beach, 0);
  const padel = series.reduce((a, d) => a + d.padel, 0);
  return (
    <>
      <PageHead title="گزارش‌های مالی" sub="۳۰ روز اخیر" />
      <Kpis items={[["کل درآمد", `${fa(Math.round(total))} میلیون`], ["پدل", `${fa(Math.round(padel))} میلیون`], ["ساحلی", `${fa(Math.round(total - padel))} میلیون`], ["میانگین روزانه", `${fa((total / 30).toFixed(1))} میلیون`]]} />
      <div style={{ marginTop: 16 }}><TxTable rows={TXS} showUser /></div>
    </>
  );
}

function AuditView() {
  return (
    <>
      <PageHead title="تاریخچه تغییرات" />
      <div className="tbl-wrap"><table><thead><tr><th>تاریخ</th><th>کاربر</th><th>عملیات</th><th>مورد</th><th>جزئیات</th></tr></thead><tbody>{AUDIT.map((a, i) => <tr key={i}><td>{jDate(a.date)}</td><td>{a.actor}</td><td>{a.action}</td><td>{a.target}</td><td>{a.detail}</td></tr>)}</tbody></table></div>
    </>
  );
}

/* ---------------- router ---------------- */
const SOON: Record<string, [string, string[]]> = {
  match: ["هم‌بازی", ["پیدا کردن هم‌بازی هم‌سطح برای پدل و ساحلی."]],
  tour: ["مسابقات", ["ثبت‌نام و جدول مسابقات کی کلاب."]],
  coach: ["پکیج مربی", ["خرید پکیج جلسات با مربیان پدل."]],
  cafe: ["کافه", ["سفارش از کافه‌ی مجموعه و پرداخت با کیف پول."]],
  shop: ["فروشگاه", ["خرید تجهیزات و پرداخت با کیف پول."]],
};

export function PanelView({ section }: { section: string }) {
  const role = useSession((s) => s.role);
  if (!role) return null;
  if (SOON[section]) return <Soon title={SOON[section][0]} lines={SOON[section][1]} />;
  const common: Record<string, () => React.ReactNode> = { tickets: () => <TicketsView />, notif: () => <NotifView /> };
  const byRole: Record<string, Record<string, () => React.ReactNode>> = {
    player: { dash: () => <PlayerDash />, res: () => <Reservations />, wallet: () => <WalletView />, profile: () => <ProfileView /> },
    secretary: { dash: () => <SecDash />, sched: () => <SchedView />, newb: () => <NewBooking />, users: () => <UsersView />, wops: () => <><PageHead title="کیف پول و تراکنش‌ها" /><TxTable rows={TXS} showUser /></>, cash: () => <CashView /> },
    admin: { dash: () => <AdminDash />, sched: () => <SchedView />, newb: () => <NewBooking />, users: () => <UsersView />, courts: () => <CourtsView />, close: () => <CloseView />, pricing: () => <PricingView />, settings: () => <SettingsView />, rfin: () => <ReportsView />, alltx: () => <><PageHead title="تراکنش‌ها" /><TxTable rows={TXS} showUser /></>, audit: () => <AuditView /> },
  };
  const view = byRole[role][section] ?? common[section] ?? byRole[role].dash;
  return <>{view()}</>;
}
