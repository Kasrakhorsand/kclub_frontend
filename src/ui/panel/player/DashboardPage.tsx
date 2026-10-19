"use client";
/** Player › Dashboard (/panel): next booking, wallet balance, upcoming bookings, latest notifications. */
import Link from "next/link";
import { hm, jFull, toman } from "@/engine/format";
import { NOTIFS } from "@/engine/mock";
import { useMyBookings } from "@/engine/panel/stats";
import { useSession } from "@/engine/store";
import { Button3D } from "@/ui/kit/Buttons";
import { BookingList, courtName } from "@/ui/panel/player/BookingList";
import { PageHead } from "@/ui/panel/shell/PageHead";

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
