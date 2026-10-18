"use client";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { addDays, dayKey, fa, hm, jDay, jFull, jMonth, toman, weekday } from "@/lib/format";
import { freeCountSync, getCourts, getSlots } from "@/lib/api";
import { COURTS, MAX_DAYS_AHEAD, priceOf } from "@/lib/mock";
import { cartTotal, useSession } from "@/lib/store";
import type { Court, Sport } from "@/lib/types";
import { ArrowIcon, BackButton, Button3D } from "../ui/Buttons";
import { CourtMap3D } from "./CourtMap3D";

const PARTS: [string, string, number, number][] = [
  ["صبح", "Morning", 8, 12],
  ["ظهر و بعدازظهر", "Afternoon", 12, 17],
  ["عصر", "Evening", 17, 21],
  ["شب", "Night", 21, 24],
];

function DateStrip({ sport, value, onChange }: { sport: Sport; value: string; onChange: (k: string) => void }) {
  const cart = useSession((s) => s.cart);
  const row = useRef<HTMLDivElement>(null);
  const days = useMemo(() => Array.from({ length: MAX_DAYS_AHEAD }, (_, i) => dayKey(addDays(new Date(), i))), []);
  useEffect(() => {
    row.current?.querySelector(".dc.on")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, []);
  const scroll = (d: number) => row.current?.scrollBy({ left: d * row.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className="dstrip">
      <button className="dnav" onClick={() => scroll(1)} aria-label="روزهای قبل"><ArrowIcon /></button>
      <div className="dsr" ref={row}>
        {days.map((k, i) => {
          const free = freeCountSync(sport, k);
          const lvl = free === 0 ? "none" : free < 5 ? "low" : "ok";
          return (
            <button key={k} className={clsx("dc", lvl, k === value && "on")} disabled={free === 0} onClick={() => onChange(k)} aria-pressed={k === value}>
              <span className="w">{i === 0 ? "امروز" : i === 1 ? "فردا" : weekday(k)}</span>
              <b>{jDay(k)}</b>
              <span className="mo">{jMonth(k)}</span>
              <span className="av">{free === 0 ? "تکمیل" : `${fa(free)} سانس`}</span>
              {cart.some((x) => x.date === k) && <span className="ic" title="در سبد شما" />}
            </button>
          );
        })}
      </div>
      <button className="dnav nx" onClick={() => scroll(-1)} aria-label="روزهای بعد"><ArrowIcon /></button>
    </div>
  );
}

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
            {[...cart].sort((a, b) => `${a.date}${a.hour}`.localeCompare(`${b.date}${b.hour}`)).map((x) => (
              <div className="li" key={`${x.date}${x.hour}${x.courtId}`}>
                <span>{jFull(x.date)} · {hm(x.hour)} · <b>{COURTS.find((c) => c.id === x.courtId)?.name}</b></span>
                <span className="row">{toman(x.price)}<button className="btn ghost sm" onClick={() => toggleCart(x)}>حذف</button></span>
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

export function Booking({ sport }: { sport: Sport }) {
  const game = useSearchParams().get("game");
  const title = sport === "padel" ? "پدل" : game === "volley" ? "والیبال ساحلی" : game === "tennis" ? "تنیس ساحلی" : "ساحلی";
  const [date, setDate] = useState(() => dayKey(new Date()));
  const [hour, setHour] = useState<number | null>(null);
  const [weeks, setWeeks] = useState(1);
  const { cart, toggleCart } = useSession();
  const { data: slots = [] } = useQuery({ queryKey: ["slots", sport, date], queryFn: () => getSlots(sport, date) });
  const { data: courts = COURTS.filter((c) => c.sport === sport) } = useQuery({ queryKey: ["courts", sport], queryFn: () => getCourts(sport) });
  const mapRef = useRef<HTMLDivElement>(null);

  const pickHour = (h: number) => {
    setHour(h);
    setTimeout(() => mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };
  const inCart = (c: Court, d = date, h = hour) => cart.some((x) => x.date === d && x.hour === h && x.courtId === c.id);
  const slot = slots.find((s) => s.hour === hour);
  const pickCourt = (c: Court) => {
    if (hour === null) return;
    for (let w = 0; w < weeks; w++) {
      const d = dayKey(addDays(new Date(`${date}T00:00:00`), w * 7));
      toggleCart({ date: d, hour, courtId: c.id, price: priceOf(sport, hour) });
    }
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
            {PARTS.map(([t, lt, a, b]) => (
              <div className="tgrp" key={t}>
                <div className="tgh"><span>{t}</span><span className="lat">{lt}</span><span className="rng">{hm(a)} تا {hm(b)}</span></div>
                <div className="tsg">
                  {slots.filter((s) => s.hour >= a && s.hour < b).map((s) => {
                    const f = s.freeCourts.length;
                    if (s.past || !f)
                      return (
                        <button key={s.hour} className={clsx("ts", s.past ? "past" : "full")} disabled>
                          <b>{hm(s.hour)}</b><span className="to">تا {hm(s.hour + 1)}</span><span className="st">{s.past ? "گذشته" : "تکمیل"}</span>
                        </button>
                      );
                    const ic = cart.some((x) => x.date === date && x.hour === s.hour);
                    return (
                      <button key={s.hour} className={clsx("ts free", hour === s.hour && "on", ic && "incart")} onClick={() => pickHour(s.hour)}>
                        <b>{hm(s.hour)}</b><span className="to">تا {hm(s.hour + 1)}</span>
                        <span className="pr">{fa(s.price / 1000)} هزار</span>
                        <span className="dots">{[0, 1, 2].map((i) => <i key={i} className={i < f ? "f" : ""} />)}<em>{fa(f)} خالی</em></span>
                        {ic && <span className="ck">✓</span>}
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
            <Button3D size="lg" href="/checkout">ادامه و پرداخت</Button3D>
          </div>
        )}
      </main>
      <CartBar />
    </>
  );
}
