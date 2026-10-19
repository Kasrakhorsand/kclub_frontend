"use client";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { addDays, dayKey, fa, hm, jDay, jFull, jMonth, toman, weekday } from "@/modules/core/format";
import { freeCountSync, getCourts, getSlots, isPast, takenSync } from "@/modules/core/api";
import { COURTS, MAX_DAYS_AHEAD, gameOf, priceOf, sportById } from "@/modules/core/venue";
import { cartTotal, useSession } from "@/modules/core/store";
import type { Court, Sport } from "@/modules/core/types";
import { ArrowIcon, BackButton, Button3D } from "@/modules/ui/Buttons";
import { CourtMap3D } from "@/modules/booking/CourtMap3D";
import { toast } from "@/modules/ui/Toast";

/** Time-of-day groups for the slot grid; `to` is exclusive. */
const DAY_PARTS = [
  { label: "صبح", latin: "Morning", from: 8, to: 12 },
  { label: "ظهر و بعدازظهر", latin: "Afternoon", from: 12, to: 17 },
  { label: "عصر", latin: "Evening", from: 17, to: 21 },
  { label: "شب", latin: "Night", from: 21, to: 24 },
];

/** Below this many free sessions a day is marked "low" in the date strip. */
const LOW_AVAILABILITY = 5;

/** Same weekday `weeks` weeks after `date`. */
const plusWeeks = (date: string, weeks: number) => dayKey(addDays(new Date(`${date}T00:00:00`), weeks * 7));

/** Horizontally scrolling day cards for the booking window, with free-session counts. */
function DateStrip({ sport, value, onChange }: { sport: Sport; value: string; onChange: (k: string) => void }) {
  const cart = useSession((s) => s.cart);
  const row = useRef<HTMLDivElement>(null);
  const days = useMemo(() => Array.from({ length: MAX_DAYS_AHEAD }, (_, i) => dayKey(addDays(new Date(), i))), []);
  // Bring the selected day into view on first render.
  useEffect(() => {
    row.current?.querySelector(".dc.on")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, []);
  const scroll = (d: number) => row.current?.scrollBy({ left: d * row.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className="dstrip">
      <button className="dnav" onClick={() => scroll(1)} aria-label="روزهای قبل"><ArrowIcon /></button>
      <div className="dsr" ref={row}>
        {days.map((day, i) => {
          const free = freeCountSync(sport, day);
          const level = free === 0 ? "none" : free < LOW_AVAILABILITY ? "low" : "ok";
          return (
            <button key={day} className={clsx("dc", level, day === value && "on")} disabled={free === 0} onClick={() => onChange(day)} aria-pressed={day === value}>
              <span className="w">{i === 0 ? "امروز" : i === 1 ? "فردا" : weekday(day)}</span>
              <b>{jDay(day)}</b>
              <span className="mo">{jMonth(day)}</span>
              <span className="av">{free === 0 ? "تکمیل" : `${fa(free)} سانس`}</span>
              {cart.some((item) => item.date === day) && <span className="ic" title="در سبد شما" />}
            </button>
          );
        })}
      </div>
      <button className="dnav nx" onClick={() => scroll(-1)} aria-label="روزهای بعد"><ArrowIcon /></button>
    </div>
  );
}

/** Sticky bottom bar with the cart total; expands to list and remove items. Sends guests to login first. */
function CartBar() {
  const router = useRouter();
  const { cart, toggleCart, user, setAfterLogin } = useSession();
  const [open, setOpen] = useState(false);
  const go = () => {
    if (!user) {
      setAfterLogin("/checkout");
      router.push("/login");
    } else router.push("/checkout");
  };
  if (!cart.length)
    return (
      <div className="cartbar">
        <div className="wrap">
          <span className="muted">ساعت و زمین را انتخاب کنید تا مبلغ اینجا نمایش داده شود.</span>
          <button className="btn" disabled>پرداخت</button>
        </div>
      </div>
    );
  return (
    <div className="cartbar">
      {open && (
        <div className="wrap" style={{ paddingTop: 10 }}>
          <div className="list">
            {[...cart].sort((a, b) => `${a.date}${a.hour}`.localeCompare(`${b.date}${b.hour}`)).map((item) => (
              <div className="li" key={`${item.date}${item.hour}${item.courtId}`}>
                <span>{jFull(item.date)} · {hm(item.hour)} · <b>{COURTS.find((c) => c.id === item.courtId)?.name}</b></span>
                <span className="row">{toman(item.price)}<button className="btn ghost sm" onClick={() => toggleCart(item)}>حذف</button></span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="wrap">
        <button className="btn ghost sm" onClick={() => setOpen(!open)}>{fa(cart.length)} سانس انتخاب‌شده {open ? "▾" : "▴"}</button>
        <div className="row">
          <span>مبلغ قابل پرداخت: <b style={{ fontSize: "1.15rem" }}>{toman(cartTotal(cart))}</b></span>
          <button className="btn" onClick={go}>پرداخت</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Booking flow for one sport: pick a day, then an hour, then a court on the
 * 3D map. Picks go into the persisted cart; weekly repeat adds the same
 * court and hour on following weeks.
 */
export function Booking({ sport }: { sport: Sport }) {
  const params = useSearchParams();
  const sportDef = sportById(sport)!;
  const gameId = params.get("game");
  // ?game picks one game on a shared court (e.g. beach tennis); otherwise name the sport.
  const title = gameId || sportDef.games.length === 1 ? gameOf(sportDef, gameId).name : sportDef.name;
  // ?date=yyyy-MM-dd&hour=18 preselects a slot (links from the home page).
  const [date, setDate] = useState(() => params.get("date") ?? dayKey(new Date()));
  const [hour, setHour] = useState<number | null>(() => (params.get("hour") ? Number(params.get("hour")) : null));
  const [weeks, setWeeks] = useState(1); // weekly repeat count
  const { cart, toggleCart, user, setAfterLogin } = useSession();
  const router = useRouter();
  const { data: slots = [] } = useQuery({ queryKey: ["slots", sport, date], queryFn: () => getSlots(sport, date) });
  const { data: courts = COURTS.filter((c) => c.sport === sport) } = useQuery({ queryKey: ["courts", sport], queryFn: () => getCourts(sport) });
  const mapRef = useRef<HTMLDivElement>(null);
  // Arriving with a preselected hour: jump straight to the court map.
  useEffect(() => {
    if (!params.get("hour")) return;
    const t = setTimeout(() => mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
    return () => clearTimeout(t);
  }, [params]);

  const pickHour = (h: number) => {
    setHour(h);
    setTimeout(() => mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };
  const inCart = (c: Court, d = date, h = hour) => cart.some((x) => x.date === d && x.hour === h && x.courtId === c.id);
  const slot = slots.find((s) => s.hour === hour);
  const pickCourt = (c: Court) => {
    if (hour === null) return;
    // Removing: drop this court/hour from every repeated week already in the cart.
    if (inCart(c)) {
      for (let w = 0; w < weeks; w++) {
        const d = plusWeeks(date, w);
        if (inCart(c, d)) toggleCart({ date: d, hour, courtId: c.id, price: priceOf(sport, hour) });
      }
      return;
    }
    // Adding: only weeks inside the booking window where the court is still free.
    const last = dayKey(addDays(new Date(), MAX_DAYS_AHEAD - 1));
    let added = 0;
    for (let w = 0; w < weeks; w++) {
      const d = plusWeeks(date, w);
      if (d > last) break;
      if (isPast(d, hour) || takenSync(d, c.id, hour) || inCart(c, d)) continue;
      toggleCart({ date: d, hour, courtId: c.id, price: priceOf(sport, hour) });
      added++;
    }
    if (weeks > 1 && added < weeks) toast(`${fa(added)} از ${fa(weeks)} هفته اضافه شد؛ بقیه پر است یا خارج از بازه‌ی ${fa(MAX_DAYS_AHEAD)} روزه.`);
  };
  const goPay = () => {
    if (!user) {
      setAfterLogin("/checkout");
      router.push("/login");
    } else router.push("/checkout");
  };

  return (
    <>
      <main className="wrap stack-l" style={{ paddingBlock: "18px 30px" }}>
        <div className="row between">
          <div className="row">
            <BackButton href="/sport">تغییر رشته</BackButton>
            <h2>رزرو زمین {title}</h2>
          </div>
          <label className="row small">
            تکرار هفتگی:
            <select className="input" style={{ width: 130 }} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
              {[1, 2, 4, 8, 12].map((w) => (
                <option key={w} value={w}>{w === 1 ? "فقط همین هفته" : `${fa(w)} هفته`}</option>
              ))}
            </select>
          </label>
        </div>

        <section className="bk2">
          <div className="step"><span className="sn2">۱</span><div><h3>روز بازی</h3><p className="small muted">تا {fa(MAX_DAYS_AHEAD)} روز آینده قابل رزرو است</p></div></div>
          <DateStrip sport={sport} value={date} onChange={(k) => { setDate(k); setHour(null); }} />

          <div className="step"><span className="sn2">۲</span><div><h3>ساعت بازی · {jFull(date)}</h3><p className="small muted">هر سانس یک ساعت · صبح‌ها ارزان‌تر</p></div></div>
          <div className="tgrid">
            {DAY_PARTS.map((part) => (
              <div className="tgrp" key={part.label}>
                <div className="tgh"><span>{part.label}</span><span className="lat">{part.latin}</span><span className="rng">{hm(part.from)} تا {hm(part.to)}</span></div>
                <div className="tsg">
                  {slots.filter((s) => s.hour >= part.from && s.hour < part.to).map((s) => {
                    const freeCount = s.freeCourts.length;
                    if (s.past || !freeCount)
                      return (
                        <button key={s.hour} className={clsx("ts", s.past ? "past" : "full")} disabled>
                          <b>{hm(s.hour)}</b><span className="to">تا {hm(s.hour + 1)}</span><span className="st">{s.past ? "گذشته" : "تکمیل"}</span>
                        </button>
                      );
                    const inCartHere = cart.some((item) => item.date === date && item.hour === s.hour);
                    return (
                      <button key={s.hour} className={clsx("ts free", hour === s.hour && "on", inCartHere && "incart")} onClick={() => pickHour(s.hour)}>
                        <b>{hm(s.hour)}</b><span className="to">تا {hm(s.hour + 1)}</span>
                        <span className="pr">{fa(s.price / 1000)} هزار</span>
                        <span className="dots">{[0, 1, 2].map((i) => <i key={i} className={i < freeCount ? "f" : ""} />)}<em>{fa(freeCount)} خالی</em></span>
                        {inCartHere && <span className="ck">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="legend lg2">
            <span><i className="lf" />قابل رزرو</span><span><i className="ls" />انتخاب شما</span><span><i className="lx" />تکمیل</span><span><i className="lp" />گذشته</span>
          </div>
          {hour !== null && (
            <div className="selbar">
              <span className="lat">Selected</span><b>{jFull(date)}</b><span className="sep" /><b>ساعت {hm(hour)} تا {hm(hour + 1)}</b>
              <span className="muted small">حالا زمین را روی نقشه انتخاب کنید ↓</span>
            </div>
          )}
        </section>

        {hour !== null && slot && (
          <div ref={mapRef} style={{ scrollMarginTop: 110 }}>
            <div className="step"><span className="sn2">۳</span><div><h3>انتخاب زمین</h3></div></div>
            <CourtMap3D
              courts={courts}
              date={date}
              hour={hour}
              priceOf={(c) => priceOf(c.sport, hour)}
              stateOf={(c) => (inCart(c) ? "sel" : slot.freeCourts.includes(c.id) ? "free" : "taken")}
              onPick={pickCourt}
            />
          </div>
        )}
        {cart.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button3D size="lg" onClick={goPay}>ادامه و پرداخت</Button3D>
          </div>
        )}
      </main>
      <CartBar />
    </>
  );
}
