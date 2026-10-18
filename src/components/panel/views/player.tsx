"use client";
/** Player panel pages: dashboard, my bookings, wallet and profile. */
import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { useSession } from "@/lib/store";
import { CANCEL_RULES, COURTS, NOTIFS, TXS, seedBookings } from "@/lib/mock";
import { fa, faNum, hm, jFull, pad2, toman } from "@/lib/format";
import { PageHead } from "../PanelShell";
import { Button3D } from "../../ui/Buttons";
import { toast } from "../../ui/Toast";
import { TransactionTable } from "./shared";

const WALLET_TOPUPS = [200_000, 500_000, 1_000_000, 2_000_000];

const courtName = (id: string) => COURTS.find((c) => c.id === id)?.name;

/** Signed-in player's upcoming bookings (sample data, first 8). */
function useMyBookings() {
  const user = useSession((s) => s.user)!;
  const all = useMemo(() => seedBookings(), []);
  const fullName = `${user.first} ${user.last}`;
  return all.filter((b) => b.userName === fullName || b.userName.startsWith(user.first)).slice(0, 8);
}

/** Refund percentage if a booking were cancelled now, from CANCEL_RULES. */
function refundPercent(date: string, hour: number) {
  const hoursLeft = (new Date(`${date}T${pad2(hour)}:00:00`).getTime() - Date.now()) / 36e5;
  return CANCEL_RULES.find((r) => hoursLeft >= r.hours)?.percent ?? 0;
}

export function PlayerDashboard() {
  const user = useSession((s) => s.user)!;
  const next = useMyBookings()[0];
  return (
    <>
      <PageHead title={`سلام ${user.first}، خوش آمدید`} />
      <div className="grid cols2e">
        <div className="card next stack">
          <span className="small muted">رزرو بعدی شما</span>
          {next ? (
            <>
              <h3>{courtName(next.courtId)}</h3>
              <p>{jFull(next.date)} · ساعت {hm(next.hour)} تا {hm(next.hour + 1)}</p>
            </>
          ) : (
            <p>رزرو فعالی ندارید.</p>
          )}
          <div><Button3D href="/sport">+ رزرو زمین</Button3D></div>
        </div>
        <div className="card wallet-card stack">
          <span className="small muted">موجودی کیف پول</span>
          <h2 style={{ fontWeight: 300 }}>{toman(user.wallet)}</h2>
          <div><Link className="btn" href="/panel/wallet">شارژ کیف پول</Link></div>
        </div>
      </div>
      <div className="grid cols2" style={{ marginTop: 16 }}>
        <div className="card stack">
          <h3>رزروهای پیش رو</h3>
          <BookingList />
        </div>
        <div className="card stack">
          <h3>آخرین اعلان‌ها</h3>
          <div className="list">
            {NOTIFS.map((n) => (
              <div key={n.id} className="li small">
                <span><b>{n.title}</b><br /><span className="muted">{n.text}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/** Upcoming bookings; with `cancellable` each row gets a cancel button. */
function BookingList({ cancellable }: { cancellable?: boolean }) {
  const mine = useMyBookings();
  return (
    <div className="list">
      {!mine.length && <p className="muted small">رزروی ندارید.</p>}
      {mine.map((b) => (
        <div className="li" key={b.id}>
          <span><b>{courtName(b.courtId)} · {hm(b.hour)}</b><br /><span className="xs muted">{jFull(b.date)}</span></span>
          <span className="row">
            <span className="pill green">فعال</span>
            {cancellable && (
              <button className="btn ghost sm" onClick={() => toast(`لغو با بازگشت ${fa(refundPercent(b.date, b.hour))}٪ مبلغ به کیف پول`)}>لغو</button>
            )}
            <b className="small">{toman(b.price)}</b>
          </span>
        </div>
      ))}
    </div>
  );
}

export function MyBookingsView() {
  return (
    <>
      <PageHead
        title="رزروهای من"
        sub={`لغو تا ${fa(24)} ساعت قبل: بازگشت ۱۰۰٪ · تا ${fa(6)} ساعت قبل: ۵۰٪`}
        action={<Button3D href="/sport" size="sm">رزرو جدید</Button3D>}
      />
      <div className="card"><BookingList cancellable /></div>
    </>
  );
}

export function WalletView() {
  const user = useSession((s) => s.user)!;
  const [amount, setAmount] = useState(500_000);
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
          <div className="chips">
            {WALLET_TOPUPS.map((v) => (
              <button key={v} className={clsx("chip", amount === v && "on")} onClick={() => setAmount(v)}>{toman(v)}</button>
            ))}
          </div>
          <Button3D onClick={() => toast("انتقال به درگاه پرداخت…")}>پرداخت {toman(amount)}</Button3D>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <TransactionTable rows={TXS.filter((t) => t.phone === user.phone)} />
      </div>
    </>
  );
}

export function ProfileView() {
  const user = useSession((s) => s.user)!;
  return (
    <>
      <PageHead title="پروفایل" />
      <div className="card stack" style={{ maxWidth: 560 }}>
        <label className="f">نام<input className="input" defaultValue={user.first} /></label>
        <label className="f">نام خانوادگی<input className="input" defaultValue={user.last} /></label>
        <label className="f">موبایل<input className="input ltr" defaultValue={user.phone} disabled /></label>
        <label className="f">
          سطح بازی پدل
          <select className="input"><option>مبتدی</option><option>متوسط</option><option>پیشرفته</option></select>
        </label>
        <div><button className="btn" onClick={() => toast("پروفایل ذخیره شد")}>ذخیره</button></div>
      </div>
    </>
  );
}
