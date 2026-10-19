"use client";
/**
 * Player › My bookings (/panel/res): upcoming games as tickets with a
 * live countdown and cancel (refund preview + confirmation), and the last
 * 30 days of played games with "book again". Styles: player.css ("pb-").
 */
import Link from "next/link";
import clsx from "clsx";
import { fa, hm, jDay, jFull, jMonth, timeUntil, toman, weekday } from "@/engine/format";
import { useMyBookingsManager } from "@/engine/panel/useMyBookingsManager";
import { CANCEL_RULES, bookingHref, courtById, sportById } from "@/engine/venue";
import type { Booking } from "@/engine/types";
import { Button3D } from "@/ui/kit/Buttons";
import { Icon3D } from "@/ui/kit/Icon3D";
import { toast } from "@/ui/kit/Toast";
import { PageHead } from "@/ui/panel/shell/PageHead";

/** "تا ۲۴ ساعت قبل ۱۰۰٪ · تا ۶ ساعت قبل ۵۰٪" from the venue rules. */
const rulesText = CANCEL_RULES.filter((r) => r.percent > 0)
  .map((r) => `تا ${fa(r.hours)} ساعت قبل: ${fa(r.percent)}٪`)
  .join(" · ");

function DateBlock({ date }: { date: string }) {
  return (
    <span className="pb-date">
      <b>{jDay(date)}</b>
      <span>{jMonth(date)}</span>
      <small>{weekday(date)}</small>
    </span>
  );
}

function UpcomingCard({ booking, onCancel }: { booking: Booking; onCancel: () => void }) {
  const court = courtById(booking.courtId);
  const sport = court ? sportById(court.sport) : undefined;
  const left = timeUntil(booking.date, booking.hour);
  return (
    <li className="pb-card" style={{ ["--floor" as string]: court?.floor }}>
      <DateBlock date={booking.date} />
      <span className="pb-main">
        <span className="pb-tags">
          <span className="pb-sport">{sport?.name}</span>
          {left && <span className="pb-left">{left} مانده</span>}
        </span>
        <b>{court?.name}</b>
        <small>ساعت {hm(booking.hour)} تا {hm(booking.hour + 1)} · {court?.surface}</small>
      </span>
      <span className="pb-side">
        <b>{toman(booking.price)}</b>
        <button type="button" className="pb-cancel" onClick={onCancel}>لغو رزرو</button>
      </span>
    </li>
  );
}

function PastRow({ booking }: { booking: Booking }) {
  const court = courtById(booking.courtId);
  const sport = court ? sportById(court.sport) : undefined;
  return (
    <li className="pb-past" style={{ ["--floor" as string]: court?.floor }}>
      <DateBlock date={booking.date} />
      <span className="pb-main">
        <b>{court?.name}</b>
        <small>{sport?.name} · ساعت {hm(booking.hour)}</small>
      </span>
      <span className="pb-side">
        <small>{toman(booking.price)}</small>
        {court && <Link className="pb-again" href={bookingHref(court.sport)}>رزرو دوباره</Link>}
      </span>
    </li>
  );
}

export function MyBookingsView() {
  const m = useMyBookingsManager();
  const cancelledCount = Object.keys(m.cancelled).length;

  const confirm = async () => {
    const result = await m.confirmCancel();
    if (result) toast(result.refundAmount ? `رزرو لغو شد؛ ${toman(result.refundAmount)} به کیف پول برگشت` : "رزرو لغو شد؛ این لغو بازگشت وجه نداشت");
  };

  return (
    <div className="pb">
      <PageHead title="رزروهای من" sub="بازی‌های پیش رو و تاریخچه‌ی ۳۰ روز اخیر" action={<Button3D href="/sport" size="sm">رزرو جدید</Button3D>} />

      <div className="pb-bar">
        <div className="pb-tabs" role="tablist" aria-label="نوع رزرو">
          <button role="tab" aria-selected={m.tab === "upcoming"} className={clsx(m.tab === "upcoming" && "on")} onClick={() => m.setTab("upcoming")}>
            پیش رو <i>{fa(m.upcoming.length)}</i>
          </button>
          <button role="tab" aria-selected={m.tab === "past"} className={clsx(m.tab === "past" && "on")} onClick={() => m.setTab("past")}>
            بازی‌شده <i>{fa(m.past.length)}</i>
          </button>
        </div>
        <p className="pb-rules"><Icon3D name="clock" /> بازگشت وجه لغو: {rulesText}؛ بعد از آن بازگشتی ندارد.</p>
      </div>

      {m.tab === "upcoming" ? (
        m.upcoming.length ? (
          <ul className="pb-list">
            {m.upcoming.map((b) => <UpcomingCard key={b.id} booking={b} onCancel={() => m.askCancel(b)} />)}
          </ul>
        ) : (
          <div className="pb-empty">
            <Icon3D name="cal" />
            <h3>رزرو فعالی ندارید</h3>
            <p className="muted small">{cancelledCount ? `${fa(cancelledCount)} رزرو در این بازدید لغو شد.` : "سانس‌های خالی را ببینید و زمین بگیرید."}</p>
            <Button3D href="/sport">رزرو زمین</Button3D>
          </div>
        )
      ) : m.past.length ? (
        <ul className="pb-list past">
          {m.past.map((b) => <PastRow key={b.id} booking={b} />)}
        </ul>
      ) : (
        <div className="pb-empty">
          <Icon3D name="hist" />
          <h3>در ۳۰ روز گذشته بازی نکرده‌اید</h3>
        </div>
      )}

      {m.pending && (
        <div className="pb-modal" role="dialog" aria-modal="true" aria-labelledby="pb-modal-title" onClick={m.dismiss}>
          <div className="pb-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 id="pb-modal-title">لغو این رزرو؟</h3>
            <p>
              {courtById(m.pending.booking.courtId)?.name} · {jFull(m.pending.booking.date)} · ساعت {hm(m.pending.booking.hour)}
            </p>
            <div className={clsx("pb-refund", m.pending.refundPercent === 0 && "none")}>
              <span>بازگشت به کیف پول</span>
              <b>{m.pending.refundPercent ? `${toman(m.pending.refundAmount)} (${fa(m.pending.refundPercent)}٪)` : "بدون بازگشت وجه"}</b>
            </div>
            <div className="pb-modal-actions">
              <button type="button" className="btn ghost" onClick={m.dismiss} disabled={m.busy}>منصرف شدم</button>
              <button type="button" className="btn danger" onClick={confirm} disabled={m.busy}>{m.busy ? "در حال لغو…" : "بله، لغو شود"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
