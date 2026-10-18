"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import clsx from "clsx";
import { getDayBoard, isPast } from "@/lib/api";
import { COURTS, HOURS } from "@/lib/mock";
import { dayKey, hm, jFull } from "@/lib/format";
import type { Booking, Court } from "@/lib/types";
import { toast } from "../ui/Toast";

/**
 * Court × hour board. Rows are courts grouped by sport, columns are hours.
 * `window` limits the columns to the hours around now (dashboard view).
 */
export function LiveBoard({ date = dayKey(new Date()), around, title = "جدول زنده امروز" }: { date?: string; around?: boolean; title?: string }) {
  const { data = [] } = useQuery({ queryKey: ["board", date], queryFn: () => getDayBoard(date), refetchInterval: 20_000 });
  const now = new Date().getHours();
  const today = date === dayKey(new Date());
  let hours = HOURS;
  if (around) {
    let a = Math.max(8, Math.min(23, now) - 1);
    const b = Math.min(24, a + 7);
    a = Math.max(8, b - 7);
    hours = HOURS.filter((h) => h >= a && h < b);
  }
  const find = (c: Court, h: number) => data.find((b: Booking) => b.courtId === c.id && b.hour === h);
  const isNow = (h: number) => today && h === now;

  const Row = (c: Court) => (
    <div key={c.id} style={{ display: "contents" }}>
      <div className="lb-c lb-ct">
        <span className={clsx("sw", c.sport === "padel" ? (c.turf === "black" ? "bk" : "bl") : "sd")} />
        <span>
          <b>{c.name.replace("زمین ", "")}</b>
          <small>{c.surface}</small>
        </span>
      </div>
      {hours.map((h) => {
        const b = find(c, h);
        const past = isPast(date, h) && !isNow(h);
        const cls = clsx("lb-c", isNow(h) && "now", past && "past");
        if (!b)
          return (
            <div key={h} className={cls}>
              {past ? <span className="lb-x">—</span> : <Link className="lb-free" href={`/panel/newb?date=${date}&hour=${h}&court=${c.id}`} style={{ display: "grid", placeItems: "center", textDecoration: "none" }}>+ رزرو</Link>}
            </div>
          );
        return (
          <div key={h} className={cls}>
            <button className={clsx("lb-bk", b.source === "staff" && "st")} title={b.userName} onClick={() => toast(`${b.userName} · ${c.name} · ${hm(h)}`)}>
              <span className="av">{b.userName.charAt(0)}</span>
              <span className="nm">{b.userName}</span>
              <span className="src">{b.source === "staff" ? "ثبت منشی" : "آنلاین"}</span>
            </button>
          </div>
        );
      })}
    </div>
  );

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
          {hours.map((h) => (
            <div key={h} className={clsx("lb-c lb-h", isNow(h) && "now", isPast(date, h) && !isNow(h) && "past")}>
              <b>{hm(h)}</b>
              <span>تا {hm(h + 1)}</span>
              {isNow(h) && <em>اکنون</em>}
            </div>
          ))}
          <div className="lb-g" style={{ gridColumn: "1/-1" }}>پدل</div>
          {COURTS.filter((c) => c.sport === "padel").map(Row)}
          <div className="lb-g" style={{ gridColumn: "1/-1" }}>ساحلی · تنیس و والیبال</div>
          {COURTS.filter((c) => c.sport === "beach").map(Row)}
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
