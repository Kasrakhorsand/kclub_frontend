"use client";
/** K Club booking page: date strip, hour grid and 3D court map on top of the engine's booking flow. */
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { fa, hm, jDay, jFull, jMonth, toman, weekday } from "@/engine/format";
import { MAX_DAYS_AHEAD, RENTALS } from "@/engine/venue";
import { REPEAT_WEEKS, useBookingFlow, type DayAvailability } from "@/engine/booking/useBookingFlow";
import { useCart } from "@/engine/booking/useCart";
import { bookableDateParam, openingHourParam } from "@/engine/security";
import type { Sport } from "@/engine/types";
import { ArrowIcon, BackButton, Button3D } from "@/ui/kit/Buttons";
import { Icon3D } from "@/ui/kit/Icon3D";
import { CourtMap3D } from "@/ui/booking/CourtMap3D";
import { toast } from "@/ui/kit/Toast";

/** Time-of-day groups for the slot grid; `to` is exclusive. */
const DAY_PARTS = [
  { label: "صبح", latin: "Morning", from: 8, to: 12 },
  { label: "ظهر و بعدازظهر", latin: "Afternoon", from: 12, to: 17 },
  { label: "عصر", latin: "Evening", from: 17, to: 21 },
  { label: "شب", latin: "Night", from: 21, to: 24 },
];

/** Below this many free sessions a day is marked "low" in the date strip. */
const LOW_AVAILABILITY = 5;

/** Horizontally scrolling day cards for the booking window, with free-session counts. */
function DateStrip({ days, value, onChange }: { days: DayAvailability[]; value: string; onChange: (day: string) => void }) {
  const row = useRef<HTMLDivElement>(null);
  // Bring the selected day into view on first render.
  useEffect(() => {
    row.current?.querySelector(".dc.on")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, []);
  const scroll = (d: number) => row.current?.scrollBy({ left: d * row.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className="dstrip">
      <button className="dnav" onClick={() => scroll(1)} aria-label="روزهای قبل"><ArrowIcon /></button>
      <div className="dsr" ref={row}>
        {days.map(({ date, free, inCart }, i) => {
          const level = free === 0 ? "none" : free < LOW_AVAILABILITY ? "low" : "ok";
          return (
            <button key={date} className={clsx("dc", level, date === value && "on")} disabled={free === 0} onClick={() => onChange(date)} aria-pressed={date === value}>
              <span className="w">{i === 0 ? "امروز" : i === 1 ? "فردا" : weekday(date)}</span>
              <b>{jDay(date)}</b>
              <span className="mo">{jMonth(date)}</span>
              <span className="av">{free === 0 ? "تکمیل" : `${fa(free)} سانس`}</span>
              {inCart && <span className="ic" title="در سبد شما" />}
            </button>
          );
        })}
      </div>
      <button className="dnav nx" onClick={() => scroll(-1)} aria-label="روزهای بعد"><ArrowIcon /></button>
    </div>
  );
}

/** "۲ راکت" for a cart line's rentals, or "" when none. */
function rentalSummary(rentals?: Record<string, number>) {
  return Object.entries(rentals ?? {})
    .filter(([, q]) => q > 0)
    .map(([id, q]) => `${fa(q)} ${RENTALS.find((r) => r.id === id)?.unit ?? id}`)
    .join("، ");
}

/** Rent equipment with the court: quantity per item, priced per hour; applies to courts picked at this hour. */
function RentalPicker({ flow }: { flow: ReturnType<typeof useBookingFlow> }) {
  return (
    <div className="rentpick">
      {flow.rentalOptions.map((r) => (
        <div className="rentpick-row" key={r.id}>
          <Icon3D name="racket" />
          <span className="rentpick-text">
            <b>{r.name}</b>
            <small>{toman(r.price)} برای هر {r.unit} در هر ساعت · حداکثر {fa(r.maxPerBooking)}</small>
          </span>
          <span className="rentpick-qty" role="radiogroup" aria-label={`تعداد ${r.unit}`}>
            {Array.from({ length: r.maxPerBooking + 1 }, (_, n) => (
              <button key={n} type="button" role="radio" aria-checked={r.quantity === n} className={r.quantity === n ? "on" : undefined} onClick={() => flow.setRental(r.id, n)}>
                {n === 0 ? "ندارم" : fa(n)}
              </button>
            ))}
          </span>
        </div>
      ))}
      {flow.rentalCostPerSession > 0 && (
        <p className="rentpick-sum">
          +{toman(flow.rentalCostPerSession)} به ازای هر سانس{flow.weeks > 1 ? `، در هر یک از ${fa(flow.weeks)} هفته` : ""}؛ روی فاکتور جدا نوشته می‌شود.
        </p>
      )}
    </div>
  );
}

/** Sticky bottom bar with the cart total; expands to list and remove items. */
function CartBar() {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  if (!cart.count)
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
            {cart.lines.map((line) => (
              <div className="li" key={`${line.date}${line.hour}${line.courtId}`}>
                <span>
                  {jFull(line.date)} · {hm(line.hour)} · <b>{line.courtName}</b>
                  {rentalSummary(line.rentals) && <small className="muted"> · {rentalSummary(line.rentals)}</small>}
                </span>
                <span className="row">{toman(line.price)}<button className="btn ghost sm" onClick={() => cart.remove(line)}>حذف</button></span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="wrap">
        <button className="btn ghost sm" onClick={() => setOpen(!open)}>{fa(cart.count)} سانس انتخاب‌شده {open ? "▾" : "▴"}</button>
        <div className="row">
          <span>مبلغ قابل پرداخت: <b style={{ fontSize: "1.15rem" }}>{toman(cart.total)}</b></span>
          <button className="btn" onClick={cart.goToCheckout}>پرداخت</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Booking page for one sport: pick a day, then an hour, then a court on the
 * 3D map. ?game, ?date and ?hour preselect from links.
 */
export function Booking({ sport }: { sport: Sport }) {
  const params = useSearchParams();
  // URL parameters are user-controlled: accept only a bookable day, an opening hour and a known game.
  const presetHour = openingHourParam(params.get("hour"));
  const gameParam = params.get("game");
  const game = gameParam && /^[a-z]{2,20}$/.test(gameParam) ? gameParam : null;
  const flow = useBookingFlow(sport, { game, date: bookableDateParam(params.get("date")), hour: presetHour });
  const cart = useCart();
  const mapRef = useRef<HTMLDivElement>(null);
  const scrollToMap = (delay: number) => setTimeout(() => mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), delay);

  // Arriving with a preselected hour: jump straight to the court map.
  useEffect(() => {
    if (presetHour === null) return;
    const t = scrollToMap(400);
    return () => clearTimeout(t);
  }, [presetHour]);

  const pickHour = (h: number) => {
    flow.selectHour(h);
    scrollToMap(80);
  };

  const pickCourt: typeof flow.pickCourt = (court) => {
    const result = flow.pickCourt(court);
    if (result?.action === "added" && result.requested > 1 && result.count < result.requested)
      toast(`${fa(result.count)} از ${fa(result.requested)} هفته اضافه شد؛ بقیه پر است یا خارج از بازه‌ی ${fa(MAX_DAYS_AHEAD)} روزه.`);
    return result;
  };

  return (
    <>
      <main className="wrap stack-l" style={{ paddingBlock: "18px 30px" }}>
        <div className="row between">
          <div className="row">
            <BackButton href="/sport">تغییر رشته</BackButton>
            <h2>رزرو زمین {flow.title}</h2>
          </div>
          <label className="row small">
            تکرار هفتگی:
            <select className="input" style={{ width: 130 }} value={flow.weeks} onChange={(e) => flow.setWeeks(Number(e.target.value))}>
              {REPEAT_WEEKS.map((w) => (
                <option key={w} value={w}>{w === 1 ? "فقط همین هفته" : `${fa(w)} هفته`}</option>
              ))}
            </select>
          </label>
        </div>

        <section className="bk2">
          <div className="step"><span className="sn2">۱</span><div><h3>روز بازی</h3><p className="small muted">تا {fa(MAX_DAYS_AHEAD)} روز آینده قابل رزرو است</p></div></div>
          <DateStrip days={flow.days} value={flow.date} onChange={flow.selectDate} />

          <div className="step"><span className="sn2">۲</span><div><h3>ساعت بازی · {jFull(flow.date)}</h3><p className="small muted">هر سانس یک ساعت · صبح‌ها ارزان‌تر</p></div></div>
          <div className="tgrid">
            {DAY_PARTS.map((part) => (
              <div className="tgrp" key={part.label}>
                <div className="tgh"><span>{part.label}</span><span className="lat">{part.latin}</span><span className="rng">{hm(part.from)} تا {hm(part.to)}</span></div>
                <div className="tsg">
                  {flow.slots.filter((s) => s.hour >= part.from && s.hour < part.to).map((s) => {
                    const freeCount = s.freeCourts.length;
                    if (s.past || !freeCount)
                      return (
                        <button key={s.hour} className={clsx("ts", s.past ? "past" : "full")} disabled>
                          <b>{hm(s.hour)}</b><span className="to">تا {hm(s.hour + 1)}</span><span className="st">{s.past ? "گذشته" : "تکمیل"}</span>
                        </button>
                      );
                    const inCartHere = flow.hourInCart(s.hour);
                    return (
                      <button key={s.hour} className={clsx("ts free", flow.hour === s.hour && "on", inCartHere && "incart")} onClick={() => pickHour(s.hour)}>
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
          {flow.hour !== null && (
            <div className="selbar">
              <span className="lat">Selected</span><b>{jFull(flow.date)}</b><span className="sep" /><b>ساعت {hm(flow.hour)} تا {hm(flow.hour + 1)}</b>
              <span className="muted small">حالا زمین را روی نقشه انتخاب کنید ↓</span>
            </div>
          )}
        </section>

        {flow.hour !== null && flow.selectedSlot && (
          <div ref={mapRef} style={{ scrollMarginTop: 110 }}>
            <div className="step"><span className="sn2">۳</span><div><h3>انتخاب زمین</h3></div></div>
            <CourtMap3D courts={flow.courts} date={flow.date} hour={flow.hour} priceOf={flow.priceAt} stateOf={flow.courtState} onPick={pickCourt} />
            {flow.rentalOptions.length > 0 && <RentalPicker flow={flow} />}
          </div>
        )}
        {cart.count > 0 && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button3D size="lg" onClick={cart.goToCheckout}>ادامه و پرداخت</Button3D>
          </div>
        )}
      </main>
      <CartBar />
    </>
  );
}
