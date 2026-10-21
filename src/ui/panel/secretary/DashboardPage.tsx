"use client";
/**
 * Front desk › Dashboard (/panel). Built for running today from the desk:
 * a black "now" scoreboard per court, the day as a timeline per court with a
 * moving now-line, and a side column with arrivals to check in, slots free
 * for walk-ins and tickets waiting. Styles: secretary.css ("fd-").
 */
import Link from "next/link";
import clsx from "clsx";
import { fa, hm, jFull, toman } from "@/engine/format";
import { todayKey } from "@/engine/panel/stats";
import { useFrontDesk } from "@/engine/panel/useFrontDesk";
import { HOURS, courtById, sportById } from "@/engine/venue";
import type { Booking } from "@/engine/types";
import { Button3D } from "@/ui/kit/Buttons";
import { PageHead } from "@/ui/panel/shell/PageHead";

const sportName = (sport: string) => sportById(sport)?.name ?? sport;

/** One line of today's numbers instead of a row of tiles. */
function Summary({ d }: { d: ReturnType<typeof useFrontDesk> }) {
  const s = d.stats;
  return (
    <div className="fd-sum">
      <p className="fd-date">
        <b>{jFull(todayKey())}</b>
        <span>ساعت {fa(`${String(d.hour).padStart(2, "0")}:${String(d.minute).padStart(2, "0")}`)}</span>
      </p>
      <dl>
        <div><dt>رزرو امروز</dt><dd>{fa(s.booked)}<small> از {fa(s.totalSlots)}</small></dd></div>
        <div><dt>پر بودن</dt><dd>{fa(s.occupancy)}٪</dd></div>
        <div><dt>آمده‌اند</dt><dd>{fa(s.checkedIn)}</dd></div>
        <div><dt>فروش امروز</dt><dd>{toman(s.revenue)}</dd></div>
      </dl>
      <div className="fd-sum-actions">
        <Link href="/panel/newb"><Button3D size="sm">رزرو حضوری</Button3D></Link>
        <Link className="btn ghost sm" href="/panel/sched">جدول کامل</Link>
      </div>
    </div>
  );
}

/** The scoreboard: what each court is doing now and what comes next. */
export function NowBoard({ d }: { d: ReturnType<typeof useFrontDesk> }) {
  const elapsed = (60 - d.board[0]?.minutesLeft) / 60 || 0;
  return (
    <section className="fd-now" aria-label="وضعیت زمین‌ها در این ساعت">
      <header>
        <h3>الان روی زمین‌ها</h3>
        <span className="fd-now-time">
          <span>سانس <bdi>{hm(d.hour)}</bdi> تا <bdi>{hm(d.hour + 1)}</bdi></span>
          <span>{fa(d.board[0]?.minutesLeft ?? 0)} دقیقه مانده</span>
        </span>
      </header>
      <ol>
        {d.board.map(({ court, current, next }) => (
          <li key={court.id} className={clsx(current ? "on" : "idle")}>
            <span className="fd-court">
              <i style={{ background: court.floor }} aria-hidden />
              {court.name}
              <small>{sportName(court.sport)}</small>
            </span>
            <b className="fd-who">{current ? current.userName : "خالی"}</b>
            {current ? (
              <span className="fd-left" role="progressbar" aria-label="گذشت سانس" aria-valuenow={Math.round(elapsed * 100)} aria-valuemin={0} aria-valuemax={100}>
                <i style={{ width: `${elapsed * 100}%` }} />
              </span>
            ) : (
              <Link className="fd-walk" href="/panel/newb">رزرو برای مراجعه‌کننده</Link>
            )}
            <span className="fd-next">
              بعدی: {next ? <b>{next.userName}</b> : <em>خالی</em>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** The whole day per court, with a line at the current time. */
export function Timeline({ d }: { d: ReturnType<typeof useFrontDesk> }) {
  const cols = HOURS.length;
  const byCourt = (id: string) => d.bookings.filter((b) => b.courtId === id);
  return (
    <section className="fd-tl" aria-label="برنامه‌ی امروز زمین‌ها">
      <header>
        <h3>برنامه‌ی امروز</h3>
        <span className="fd-legend"><i className="online" />آنلاین <i className="staff" />حضوری <i className="in" />آمده</span>
      </header>
      <div className="fd-tl-scroll">
        <div className="fd-tl-grid" style={{ "--cols": cols } as React.CSSProperties}>
          <span className="fd-tl-corner" />
          {HOURS.map((h) => (
            <span key={h} className={clsx("fd-tl-h", h === d.hour && "now")}>{fa(h)}</span>
          ))}
          {d.courts.map((court, row) => (
            <div key={court.id} className="fd-tl-row" style={{ gridRow: row + 2 }}>
              <span className="fd-tl-court"><i style={{ background: court.floor }} aria-hidden />{court.name}</span>
              <div className="fd-tl-track">
                {byCourt(court.id).map((b) => (
                  <span
                    key={b.id}
                    className={clsx("fd-tl-b", b.source, b.checkedIn && "in", b.hour < d.hour && "done")}
                    style={{ gridColumn: `${b.hour - HOURS[0] + 1} / span 1` }}
                    title={`${b.userName} · ${hm(b.hour)}`}
                  >
                    {b.userName.split(" ")[0]}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <span className="fd-tl-now" style={{ insetInlineStart: `calc(var(--court-col) + (100% - var(--court-col)) * ${d.dayProgress})` }} aria-hidden />
        </div>
      </div>
    </section>
  );
}

function Arrival({ b, d }: { b: Booking; d: ReturnType<typeof useFrontDesk> }) {
  const court = courtById(b.courtId);
  const late = b.hour === d.hour && d.minute > 10;
  return (
    <li className={clsx(late && "late")}>
      <span className="fd-at">{hm(b.hour)}</span>
      <span className="fd-ar-who">
        <b>{b.userName}</b>
        <small>{court?.name}{b.rentals && Object.values(b.rentals).some(Boolean) ? " · اجاره‌ی راکت" : ""}{late ? " · دیر کرده" : ""}</small>
      </span>
      {b.checkedIn ? (
        <span className="fd-in">آمد</span>
      ) : (
        <button type="button" className="btn sm" onClick={() => d.checkIn(b)} disabled={d.busyId === b.id}>
          {d.busyId === b.id ? "…" : "ورود"}
        </button>
      )}
    </li>
  );
}

export function FrontDeskDashboard() {
  const d = useFrontDesk();
  return (
    <div className="fd">
      <PageHead title="داشبورد پذیرش" />
      <Summary d={d} />
      <NowBoard d={d} />
      <div className="fd-cols">
        <Timeline d={d} />
        <aside className="fd-side">
          <section className="fd-box">
            <header><h3>ورودی‌های دو ساعت آینده</h3><span>{fa(d.arrivals.length)} نفر</span></header>
            {d.loading && <p className="muted small">در حال بارگذاری…</p>}
            {!d.loading && !d.arrivals.length && <p className="fd-empty">تا دو ساعت آینده کسی رزرو ندارد.</p>}
            <ul className="fd-arrivals">{d.arrivals.map((b) => <Arrival key={b.id} b={b} d={d} />)}</ul>
          </section>

          <section className="fd-box">
            <header><h3>خالی برای مراجعه‌ی حضوری</h3></header>
            {!d.freeSoon.length && <p className="fd-empty">تا چهار ساعت آینده همه‌ی زمین‌ها پر است.</p>}
            <ul className="fd-free">
              {d.freeSoon.map((s) => (
                <li key={s.hour}>
                  <span className="fd-at">{hm(s.hour)}</span>
                  <span className="fd-chips">{s.courts.map((c) => <i key={c.id}>{c.name}</i>)}</span>
                </li>
              ))}
            </ul>
            {d.freeSoon.length > 0 && <Link className="fd-link" href="/panel/newb">ثبت رزرو حضوری</Link>}
          </section>

          <section className="fd-box">
            <header><h3>تیکت‌های بی‌پاسخ</h3><span>{fa(d.openTickets.length)}</span></header>
            {!d.openTickets.length && <p className="fd-empty">همه‌ی تیکت‌ها پاسخ داده شده‌اند.</p>}
            <ul className="fd-tickets">
              {d.openTickets.slice(0, 4).map((t) => (
                <li key={t.id}><Link href="/panel/tickets">{t.title}</Link></li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
