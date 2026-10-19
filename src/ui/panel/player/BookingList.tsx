"use client";
/** Player's upcoming bookings list (dashboard and My bookings). */
import { fa, hm, jFull, toman } from "@/engine/format";
import { useMyBookings } from "@/engine/panel/stats";
import { COURTS, refundPercent } from "@/engine/venue";
import { toast } from "@/ui/kit/Toast";

/** Court name for a court id. */
export const courtName = (id: string) => COURTS.find((c) => c.id === id)?.name;

/** Upcoming bookings; with `cancellable` each row gets a cancel button. */
export function BookingList({ cancellable }: { cancellable?: boolean }) {
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
