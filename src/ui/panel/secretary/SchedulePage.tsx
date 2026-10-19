"use client";
/** Front desk + Admin › Schedule (/panel/sched): two-week day picker and the full-day board. */
import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { jDay, jFull, jMonth, weekday } from "@/engine/format";
import { nextDays, todayKey } from "@/engine/panel/stats";
import { LiveBoard } from "@/ui/panel/parts/LiveBoard";
import { PageHead } from "@/ui/panel/shell/PageHead";

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
