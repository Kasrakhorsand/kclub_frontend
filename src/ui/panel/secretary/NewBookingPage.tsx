"use client";
/**
 * Front desk + Admin › New booking (/panel/newb): walk-in or phone booking.
 * Customer by phone first, then court-hours picked straight on the day grid
 * (several at once), then game, rentals and weekly repeat; a sticky invoice
 * on the side takes the payment method and books. ?date, ?hour and ?court
 * prefill from the dashboard. Styles: secretary.css ("nb-").
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { fa, hm, jDay, jFull, jMonth, toman, weekday } from "@/engine/format";
import { DESK_PAYMENTS, DESK_REPEAT, useStaffBooking } from "@/engine/panel/useStaffBooking";
import { bookableDateParam, openingHourParam } from "@/engine/security";
import { Button3D } from "@/ui/kit/Buttons";
import { PageHead } from "@/ui/panel/shell/PageHead";

type Desk = ReturnType<typeof useStaffBooking>;

function CustomerStep({ s }: { s: Desk }) {
  return (
    <section className="nb-step">
      <h3><i>۱</i> مشتری</h3>
      <div className="nb-cust">
        <label className="f nb-phone">
          موبایل
          <input className="input ltr" inputMode="tel" autoComplete="off" maxLength={14} value={s.phoneText} onChange={(e) => s.setPhoneText(e.target.value)} placeholder="0912 123 4567" autoFocus />
        </label>
        {!s.phoneOk && <p className="nb-hint">شماره را وارد کنید تا حساب مشتری پیدا شود.</p>}
        {s.phoneOk && s.lookingUp && <p className="nb-hint">در حال جستجو…</p>}
        {s.phoneOk && !s.lookingUp && s.customer && (
          <div className="nb-found">
            <span className="nb-avatar">{s.customer.first[0]}</span>
            <span className="nb-found-who">
              <b>{s.customer.first} {s.customer.last}{s.customer.vip && <em>VIP</em>}</b>
              <small>کیف پول {toman(s.customer.wallet)} · {s.customer.upcoming ? `${fa(s.customer.upcoming)} رزرو پیش رو` : "رزرو پیش رو ندارد"}</small>
            </span>
          </div>
        )}
        {s.isNew && !s.lookingUp && (
          <div className="nb-new">
            <p className="nb-hint">این شماره حساب ندارد؛ با ثبت رزرو حسابش ساخته می‌شود.</p>
            <div className="nb-names">
              <label className="f">نام<input className="input" maxLength={40} value={s.first} onChange={(e) => s.setFirst(e.target.value)} /></label>
              <label className="f">نام خانوادگی<input className="input" maxLength={60} value={s.last} onChange={(e) => s.setLast(e.target.value)} /></label>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SlotStep({ s }: { s: Desk }) {
  return (
    <section className="nb-step">
      <h3>
        <i>۲</i> روز و سانس
        <span className="nb-legend"><b className="free" />خالی <b className="picked" />انتخاب‌شده <b className="taken" />رزرو شده</span>
      </h3>
      <div className="nb-days" role="tablist" aria-label="روز">
        {s.days.slice(0, 14).map((d, i) => (
          <button key={d} type="button" role="tab" aria-selected={d === s.date} className={clsx(d === s.date && "on")} onClick={() => s.changeDate(d)}>
            <small>{i === 0 ? "امروز" : i === 1 ? "فردا" : weekday(d)}</small>
            <b>{jDay(d)}</b>
            <small>{jMonth(d)}</small>
          </button>
        ))}
        <select className="input nb-more" aria-label="روزهای بعد" value={s.days.indexOf(s.date) >= 14 ? s.date : ""} onChange={(e) => e.target.value && s.changeDate(e.target.value)}>
          <option value="">روزهای بعد…</option>
          {s.days.slice(14).map((d) => <option key={d} value={d}>{jFull(d)}</option>)}
        </select>
      </div>

      <div className="nb-grid-wrap">
        <div className="nb-grid" style={{ "--cols": s.hours.length } as React.CSSProperties} aria-label={`سانس‌های ${jFull(s.date)}`}>
          <span className="nb-corner" />
          {s.hours.map((h) => <span key={h} className="nb-h">{fa(h)}</span>)}
          {s.cells.map((row, r) => (
            <div className="nb-row" key={s.courts[r].id}>
              <span className="nb-court"><i style={{ background: s.courts[r].floor }} />{s.courts[r].name}</span>
              {row.map((c) => (
                <button
                  key={c.hour}
                  type="button"
                  className={clsx("nb-cell", c.state)}
                  disabled={c.state === "past" || c.state === "taken"}
                  aria-pressed={c.state === "picked"}
                  aria-label={`${c.court.name} ساعت ${hm(c.hour)}${c.booking ? ` رزرو ${c.booking.userName}` : ""}`}
                  title={c.booking ? c.booking.userName : `${hm(c.hour)} · ${toman(c.price)}`}
                  onClick={() => s.toggle(c.court, c.hour)}
                >
                  {c.state === "taken" ? c.booking!.userName.split(" ")[0] : c.state === "picked" ? "✓" : ""}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      {s.selection.length > 0 && (
        <p className="nb-picked">
          {fa(s.selection.length)} سانس انتخاب شد · <button type="button" onClick={s.clearSelection}>پاک کردن</button>
        </p>
      )}
    </section>
  );
}

function ExtrasStep({ s }: { s: Desk }) {
  if (!s.selection.length) return null;
  return (
    <section className="nb-step">
      <h3><i>۳</i> جزئیات</h3>
      <div className="nb-extras">
        {s.multiGameSport && (
          <div className="nb-field">
            <span>بازی {s.multiGameSport.name}</span>
            <div className="nb-seg">
              {s.multiGameSport.games.map((g) => (
                <button key={g.id} type="button" aria-pressed={s.game === g.id} className={clsx(s.game === g.id && "on")} onClick={() => s.setGame(g.id)}>{g.name}</button>
              ))}
            </div>
          </div>
        )}
        {s.rentalOptions.map((r) => (
          <div className="nb-field" key={r.id}>
            <span>{r.name} <small>{toman(r.price)} برای هر {r.unit}</small></span>
            <div className="nb-seg">
              {Array.from({ length: r.maxPerBooking + 1 }, (_, n) => (
                <button key={n} type="button" aria-pressed={r.quantity === n} className={clsx(r.quantity === n && "on")} onClick={() => s.setRental(r.id, n)}>{n ? fa(n) : "ندارد"}</button>
              ))}
            </div>
          </div>
        ))}
        <div className="nb-field">
          <span>تکرار هفتگی <small>هفته‌های پر خودکار رد می‌شوند</small></span>
          <div className="nb-seg">
            {DESK_REPEAT.map((w) => (
              <button key={w} type="button" aria-pressed={s.weeks === w} className={clsx(s.weeks === w && "on")} onClick={() => s.setWeeks(w)}>{w === 1 ? "فقط همین" : `${fa(w)} هفته`}</button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Invoice({ s }: { s: Desk }) {
  if (s.result)
    return (
      <aside className="nb-inv done" aria-live="polite">
        <svg className="okmark" viewBox="0 0 100 100" fill="none" stroke="var(--free)" strokeWidth="6" strokeLinecap="round" aria-hidden><circle cx="50" cy="50" r="44" /><path d="M30 52l13 13 27-29" /></svg>
        <h3>رزرو ثبت شد</h3>
        <div><small>کد رهگیری</small><div className="code">{fa(s.result.tracking)}</div></div>
        <p>{fa(s.result.count)} سانس · {toman(s.result.total)}</p>
        {s.result.skipped > 0 && <p className="nb-warn">{fa(s.result.skipped)} سانس از هفته‌های تکراری پر بود یا خارج از بازه‌ی رزرو، ثبت نشد.</p>}
        <p className="nb-hint">پیامک تأیید برای مشتری ارسال شد.</p>
        <Button3D onClick={s.reset}>رزرو برای مشتری بعدی</Button3D>
        <Link className="btn ghost" href="/panel">بازگشت به داشبورد</Link>
      </aside>
    );

  const name = s.customer ? `${s.customer.first} ${s.customer.last}` : s.isNew ? `${s.first} ${s.last}`.trim() || "مشتری جدید" : "—";
  return (
    <aside className="nb-inv">
      <header>
        <h3>فاکتور</h3>
        <span>{name}</span>
      </header>
      {!s.selection.length ? (
        <p className="nb-hint">سانس‌ها را روی جدول انتخاب کنید.</p>
      ) : (
        <ul className="nb-lines">
          {s.selection.map(({ court, hour }) => (
            <li key={`${court.id}${hour}`}>
              <span><b>{court.name}</b><small>{jFull(s.date)} · <bdi>{hm(hour)}</bdi></small></span>
              <span>{toman(s.linePrice(court, hour))}</span>
            </li>
          ))}
        </ul>
      )}
      {s.weeks > 1 && s.selection.length > 0 && <p className="nb-row-sum"><span>هر هفته</span><span>{toman(s.sessionTotal)} × {fa(s.weeks)}</span></p>}
      <p className="nb-total"><span>جمع{s.weeks > 1 ? " (حداکثر)" : ""}</span><b>{toman(s.estimate)}</b></p>

      <fieldset className="nb-pay">
        <legend>روش پرداخت</legend>
        {DESK_PAYMENTS.map((p) => {
          const off = p.id === "wallet" && (!s.customer || s.customer.wallet < s.estimate);
          return (
            <label key={p.id} className={clsx(s.payment === p.id && "on", off && "off")}>
              <input type="radio" name="nb-pay" checked={s.payment === p.id} disabled={off} onChange={() => s.setPayment(p.id)} />
              <span><b>{p.label}</b><small>{p.id === "wallet" && s.customer ? `موجودی ${toman(s.customer.wallet)}` : p.hint}</small></span>
            </label>
          );
        })}
      </fieldset>

      <label className="f">
        یادداشت برای پذیرش <small className="muted">اختیاری</small>
        <textarea className="input" rows={2} maxLength={300} value={s.note} onChange={(e) => s.setNote(e.target.value)} placeholder="مثلاً: دو نفر مهمان، راکت اضافه می‌خواهند" />
      </label>

      {(s.error || (s.problem && s.selection.length > 0)) && <p className="nb-warn" role="alert">{s.error || s.problem}</p>}
      <Button3D disabled={!!s.problem || s.busy} onClick={s.submit}>
        {s.busy ? "در حال ثبت…" : s.payment === "link" ? "ثبت و ارسال لینک پرداخت" : "ثبت رزرو"}
      </Button3D>
    </aside>
  );
}

export function NewBookingView() {
  const params = useSearchParams();
  // URL parameters are user-controlled: accept only a bookable day, an opening hour and a known court.
  const s = useStaffBooking({ date: bookableDateParam(params.get("date")), hour: openingHourParam(params.get("hour")), court: params.get("court") });
  return (
    <div className="nb">
      <PageHead title="رزرو جدید" sub="رزرو حضوری یا تلفنی؛ مشتری، سانس و پرداخت در یک صفحه" />
      <div className="nb-cols">
        <div className="nb-main">
          <CustomerStep s={s} />
          <SlotStep s={s} />
          <ExtrasStep s={s} />
        </div>
        <Invoice s={s} />
      </div>
    </div>
  );
}
