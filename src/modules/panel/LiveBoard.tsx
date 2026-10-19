"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Fragment } from "react";
import clsx from "clsx";
import { getDayBoard, isPast } from "@/modules/core/api";
import { CLOSE_HOUR, HOURS, OPEN_HOUR, SPORTS, courtsOf, sportTitle } from "@/modules/core/venue";
import { dayKey, hm, jFull } from "@/modules/core/format";
import type { Booking, Court } from "@/modules/core/types";
import { toast } from "@/modules/ui/Toast";

/** How many hour columns the compact (dashboard) board shows. */
const AROUND_COLUMNS = 7;

/** Hours to show: all opening hours, or a window starting one hour before now. */
function visibleHours(around: boolean, nowHour: number) {
  if (!around) return HOURS;
  const end = Math.min(CLOSE_HOUR, Math.max(OPEN_HOUR, Math.min(CLOSE_HOUR - 1, nowHour) - 1) + AROUND_COLUMNS);
  const start = Math.max(OPEN_HOUR, end - AROUND_COLUMNS);
  return HOURS.filter((h) => h >= start && h < end);
}

type CourtRowProps = {
  court: Court;
  date: string;
  hours: number[];
  bookings: Booking[];
  isNow: (hour: number) => boolean;
};

/** One court: name cell, then a cell per hour (booking, "+ book" link, or past dash). */
function CourtRow({ court, date, hours, bookings, isNow }: CourtRowProps) {
  return (
    <div style={{ display: "contents" }}>
      <div className="lb-c lb-ct">
        <span className="sw" style={{ background: court.floor }} />
        <span>
          <b>{court.name.replace("زمین ", "")}</b>
          <small>{court.surface}</small>
        </span>
      </div>
      {hours.map((hour) => {
        const booking = bookings.find((b) => b.courtId === court.id && b.hour === hour);
        const past = isPast(date, hour) && !isNow(hour);
        const cellClass = clsx("lb-c", isNow(hour) && "now", past && "past");

        if (!booking)
          return (
            <div key={hour} className={cellClass}>
              {past ? (
                <span className="lb-x">—</span>
              ) : (
                <Link
                  className="lb-free"
                  href={`/panel/newb?date=${date}&hour=${hour}&court=${court.id}`}
                  style={{ display: "grid", placeItems: "center", textDecoration: "none" }}
                >
                  + رزرو
                </Link>
              )}
            </div>
          );

        const byStaff = booking.source === "staff";
        return (
          <div key={hour} className={cellClass}>
            <button
              className={clsx("lb-bk", byStaff && "st")}
              title={booking.userName}
              onClick={() => toast(`${booking.userName} · ${court.name} · ${hm(hour)}`)}
            >
              <span className="av">{booking.userName.charAt(0)}</span>
              <span className="nm">{booking.userName}</span>
              <span className="src">{byStaff ? "ثبت منشی" : "آنلاین"}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

type LiveBoardProps = {
  /** Day to show (yyyy-MM-dd); defaults to today. */
  date?: string;
  /** Compact dashboard mode: only the hours around now, plus a link to the full day. */
  around?: boolean;
  title?: string;
};

/**
 * Court × hour board for one day. Rows are courts grouped by sport, columns
 * are hours; refreshes every 20 seconds.
 */
export function LiveBoard({ date = dayKey(new Date()), around = false, title = "جدول زنده امروز" }: LiveBoardProps) {
  const { data: bookings = [] } = useQuery({ queryKey: ["board", date], queryFn: () => getDayBoard(date), refetchInterval: 20_000 });
  const nowHour = new Date().getHours();
  const isToday = date === dayKey(new Date());
  const hours = visibleHours(around, nowHour);
  const isNow = (hour: number) => isToday && hour === nowHour;
  const rowProps = { date, hours, bookings, isNow };

  return (
    <div className="card lboard">
      <div className="row between">
        <div>
          <h3>{title}</h3>
          <p className="xs muted">{jFull(date)} · برای ثبت رزرو روی «+ رزرو» و برای جزئیات روی نام بزنید</p>
        </div>
        {around && <Link className="btn ghost sm" href="/panel/sched">جدول کامل روز</Link>}
      </div>
      <div className="lb-wrap">
        <div className="lb-grid" style={{ ["--n" as string]: hours.length }}>
          <div className="lb-c lb-corner">زمین <span>/ ساعت</span></div>
          {hours.map((hour) => (
            <div key={hour} className={clsx("lb-c lb-h", isNow(hour) && "now", isPast(date, hour) && !isNow(hour) && "past")}>
              <b>{hm(hour)}</b>
              <span>تا {hm(hour + 1)}</span>
              {isNow(hour) && <em>اکنون</em>}
            </div>
          ))}
          {SPORTS.map((sport) => (
            <Fragment key={sport.id}>
              <div className="lb-g" style={{ gridColumn: "1/-1" }}>{sport.games.length > 1 ? `${sport.name} · ${sportTitle(sport)}` : sport.name}</div>
              {courtsOf(sport.id).map((c) => <CourtRow key={c.id} court={c} {...rowProps} />)}
            </Fragment>
          ))}
        </div>
      </div>
      <div className="legend">
        <span><i style={{ background: "var(--surface)" }} />خالی</span>
        <span><i style={{ background: "var(--info-bg)" }} />رزرو آنلاین</span>
        <span><i style={{ background: "var(--court-soft)" }} />ثبت منشی</span>
        <span><i style={{ background: "var(--gold)" }} />ساعت جاری</span>
      </div>
    </div>
  );
}
