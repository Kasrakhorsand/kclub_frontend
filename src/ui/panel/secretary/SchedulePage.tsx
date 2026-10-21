"use client";
/**
 * Front desk + Admin › Schedule (/panel/sched). Two-week day strip with how
 * full each day is, the chosen day's court × hour board (names on bookings,
 * "+" on free future slots), and a side panel for the opened booking with
 * check-in, call details and cancel. Styles: secretary.css ("sc-").
 */
import Link from "next/link";
import clsx from "clsx";
import { fa, hm, jDay, jFull, jMonth, toman, weekday } from "@/engine/format";
import { useDeskSchedule } from "@/engine/panel/useDeskSchedule";
import { RENTALS } from "@/engine/venue";
import { Button3D } from "@/ui/kit/Buttons";
import { PageHead } from "@/ui/panel/shell/PageHead";

type S = ReturnType<typeof useDeskSchedule>;

function Strip({ s }: { s: S }) {
  return (
    <div className="sc-strip" role="tablist" aria-label="روز">
      {s.strip.map((d, i) => (
        <button key={d.date} type="button" role="tab" aria-selected={d.date === s.date} className={clsx(d.date === s.date && "on")} onClick={() => s.setDate(d.date)}>
          <small>{i === 0 ? "امروز" : i === 1 ? "فردا" : weekday(d.date)}</small>
          <b>{jDay(d.date)}</b>
          <small>{jMonth(d.date)}</small>
          <span className="sc-fill" aria-label={d.occupancy === undefined ? undefined : `${fa(d.occupancy)}٪ پر`}><i style={{ width: `${d.occupancy ?? 0}%` }} /></span>
        </button>
      ))}
    </div>
  );
}

function Board({ s }: { s: S }) {
  const nowHour = new Date().getHours();
  const isToday = s.date === s.today;
  return (
    <div className="sc-board-wrap">
      <div className="sc-board" style={{ "--cols": s.hours.length } as React.CSSProperties}>
        <span />
        {s.hours.map((h) => <span key={h} className={clsx("sc-h", isToday && h === nowHour && "now")}>{hm(h)}</span>)}
        {s.courts.map((court) => (
          <div className="sc-row" key={court.id}>
            <span className="sc-court"><i style={{ background: court.floor }} />{court.name}</span>
            {s.hours.map((h) => {
              const b = s.cell(court.id, h);
              const past = s.isPast(h) && !(isToday && h === nowHour);
              if (b)
                return (
                  <button
                    key={h}
                    type="button"
                    className={clsx("sc-b", b.source, b.checkedIn && "in", past && "past", s.opened?.id === b.id && "on")}
                    onClick={() => s.open(b)}
                    title={`${b.userName} · ${court.name} · ${hm(h)}`}
                  >
                    <b>{b.userName}</b>
                    <small>{b.checkedIn ? "آمده" : b.source === "staff" ? "حضوری" : "آنلاین"}</small>
                  </button>
                );
              return past ? (
                <span key={h} className="sc-x" aria-hidden />
              ) : (
                <Link key={h} className="sc-free" href={`/panel/newb?date=${s.date}&hour=${h}&court=${court.id}`} aria-label={`رزرو ${court.name} ساعت ${hm(h)}`}>+</Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({ s }: { s: S }) {
  const b = s.opened;
  if (!b) return null;
  const rentals = Object.entries(b.rentals ?? {}).filter(([, q]) => q > 0);
  return (
    <aside className="sc-panel" aria-label="جزئیات رزرو">
      <header>
        <h3>{b.userName}</h3>
        <button type="button" className="sc-close" onClick={() => s.open(null)} aria-label="بستن">✕</button>
      </header>
      <p className="sc-phone" dir="ltr">{fa(b.userPhone)}</p>
      <dl>
        <div><dt>زمین</dt><dd>{s.openedCourt?.name}</dd></div>
        <div><dt>زمان</dt><dd>{jFull(b.date)} · <bdi>{hm(b.hour)}</bdi> تا <bdi>{hm(b.hour + 1)}</bdi></dd></div>
        <div><dt>مبلغ</dt><dd>{toman(b.price)}</dd></div>
        <div><dt>ثبت</dt><dd>{b.source === "staff" ? "حضوری در پذیرش" : "آنلاین"}</dd></div>
        {rentals.length > 0 && <div><dt>اجاره</dt><dd>{rentals.map(([id, q]) => `${fa(q)} ${RENTALS.find((r) => r.id === id)?.unit ?? id}`).join("، ")}</dd></div>}
        <div><dt>ورود</dt><dd>{b.checkedIn ? "آمده است" : "هنوز نیامده"}</dd></div>
      </dl>

      {!s.cancelling ? (
        <div className="sc-actions">
          {!b.checkedIn && b.date === s.today && <Button3D size="sm" disabled={s.busy} onClick={s.checkIn}>ثبت ورود</Button3D>}
          <Link className="btn ghost sm" href={`/panel/users?phone=${b.userPhone}`}>پرونده‌ی مشتری</Link>
          {!s.isPast(b.hour) && <button type="button" className="btn ghost sm sc-danger" onClick={s.startCancel}>لغو رزرو</button>}
        </div>
      ) : (
        <div className="sc-cancel">
          <p>طبق قوانین {fa(s.rulePercent)}٪ مبلغ ({toman(Math.round((b.price * s.rulePercent) / 100))}) به کیف پول مشتری برمی‌گردد.</p>
          <label className="f">دلیل لغو<input className="input" maxLength={120} value={s.reason} onChange={(e) => s.setReason(e.target.value)} placeholder="مثلاً: درخواست تلفنی مشتری" autoFocus /></label>
          <label className="sc-check"><input type="checkbox" checked={s.fullRefund} onChange={(e) => s.setFullRefund(e.target.checked)} />برگشت کامل مبلغ (با تأیید مدیر)</label>
          <div className="sc-actions">
            <button type="button" className="btn sm sc-danger-fill" disabled={s.busy} onClick={s.confirmCancel}>{s.busy ? "…" : "لغو رزرو"}</button>
            <button type="button" className="btn ghost sm" onClick={s.stopCancel}>انصراف</button>
          </div>
        </div>
      )}
      {s.error && <p className="sc-err" role="alert">{s.error}</p>}
    </aside>
  );
}

export function ScheduleView() {
  const s = useDeskSchedule();
  return (
    <div className="sc">
      <PageHead title="جدول رزروها" />
      <Strip s={s} />
      <div className="sc-sum">
        <b>{jFull(s.date)}</b>
        <span>{fa(s.stats.booked)} رزرو</span>
        <span>{fa(s.stats.occupancy)}٪ پر</span>
        <span>{fa(s.stats.walkIns)} حضوری</span>
        <span>{toman(s.stats.revenue)}</span>
        <span className="sc-legend"><i className="online" />آنلاین <i className="staff" />حضوری <i className="in" />آمده</span>
        <Link className="btn sm sc-new" href={`/panel/newb?date=${s.date}`}>رزرو جدید</Link>
      </div>
      {s.notice && <p className="sc-notice" role="status">{s.notice}</p>}
      <div className={clsx("sc-layout", s.opened && "has-panel")}>
        <Board s={s} />
        <Panel s={s} />
      </div>
    </div>
  );
}
