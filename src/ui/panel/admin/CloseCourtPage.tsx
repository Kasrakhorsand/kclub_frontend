"use client";
/**
 * Admin › Close a court (/panel/close) for maintenance or a tournament.
 * Pick courts, day and hours, see exactly which bookings will be cancelled,
 * then confirm; upcoming closures are listed beside and can be reopened.
 * Styles: admin.css ("cl-").
 */
import clsx from "clsx";
import { useClosures } from "@/engine/admin/useCourtsAdmin";
import { fa, hm, jDate, jFull, toman } from "@/engine/format";
import { CLOSE_HOUR, HOURS, courtById } from "@/engine/venue";
import { useCourts } from "@/engine/useCourts";
import { Button3D } from "@/ui/kit/Buttons";
import { PageHead } from "@/ui/panel/shell/PageHead";

export function CloseCourtView() {
  const courts = useCourts();
  const c = useClosures();
  return (
    <div className="ad">
      <PageHead title="بستن زمین" sub="برای تعمیرات یا مسابقه؛ رزروهای این بازه لغو، وجهشان برگشت و به رزروکنندگان پیامک می‌شود." />
      <div className="cl-layout">
        <section className="ad-card cl-form">
          <div className="cl-field">
            <span>زمین‌ها</span>
            <div className="cl-chips">
              {courts.map((court) => (
                <button key={court.id} type="button" aria-pressed={c.courtIds.includes(court.id)} className={clsx(c.courtIds.includes(court.id) && "on")} onClick={() => c.toggleCourt(court.id)}>
                  <i style={{ background: court.floor }} />{court.name}
                </button>
              ))}
            </div>
          </div>
          <div className="cl-row">
            <label className="f">روز
              <select className="input" value={c.date} onChange={(e) => c.setDate(e.target.value)}>
                {c.days.map((d) => <option key={d} value={d}>{jFull(d)}</option>)}
              </select>
            </label>
            <label className="f">از ساعت
              <select className="input" value={c.from} onChange={(e) => c.setFrom(Number(e.target.value))}>
                {HOURS.map((h) => <option key={h} value={h}>{hm(h)}</option>)}
              </select>
            </label>
            <label className="f">تا ساعت
              <select className="input" value={c.to} onChange={(e) => c.setTo(Number(e.target.value))}>
                {[...HOURS.map((h) => h + 1)].filter((h) => h > c.from && h <= CLOSE_HOUR).map((h) => <option key={h} value={h}>{hm(h)}</option>)}
              </select>
            </label>
          </div>
          <label className="f">دلیل<input className="input" maxLength={120} value={c.reason} onChange={(e) => c.setReason(e.target.value)} placeholder="مثلاً: تعویض چمن یا مسابقه‌ی داخلی" /></label>
          <label className="cl-check"><input type="checkbox" checked={c.fullRefund} onChange={(e) => c.setFullRefund(e.target.checked)} />برگشت کامل وجه به کیف پول رزروکنندگان</label>

          {!c.preview ? (
            <Button3D disabled={c.busy} onClick={c.check}>{c.busy ? "…" : "بررسی رزروهای این بازه"}</Button3D>
          ) : (
            <div className="cl-preview">
              {c.preview.length ? (
                <>
                  <b>{fa(c.preview.length)} رزرو لغو می‌شود:</b>
                  <ul>
                    {c.preview.map((b) => (
                      <li key={b.id}><span>{b.userName}</span><small>{courtById(b.courtId)?.name} · <bdi>{hm(b.hour)}</bdi></small><span>{toman(b.price)}</span></li>
                    ))}
                  </ul>
                </>
              ) : <b>در این بازه رزروی نیست.</b>}
              <div className="cl-actions">
                <button type="button" className="btn danger" disabled={c.busy} onClick={c.confirm}>{c.busy ? "…" : c.preview.length ? "بستن و لغو این رزروها" : "بستن زمین"}</button>
              </div>
            </div>
          )}
          {c.error && <p className="ad-err" role="alert">{c.error}</p>}
          {c.done && <p className="ad-ok" role="status">{c.done}</p>}
        </section>

        <aside className="ad-card">
          <header><h3>بسته‌شدن‌های پیش رو</h3></header>
          {c.closures.length ? (
            <ul className="ad-list">
              {c.closures.map((x) => (
                <li key={x.id}>
                  <b>{x.courtIds.map((id) => courtById(id)?.name ?? id).join("، ")}</b>
                  <small>{jDate(x.date)} · <bdi>{hm(x.from)}</bdi> تا <bdi>{hm(x.to)}</bdi> · {x.reason}{x.affected ? ` · ${fa(x.affected)} رزرو لغو شد` : ""}</small>
                  <button type="button" className="cl-reopen" onClick={() => c.reopen(x.id)}>باز کردن دوباره</button>
                </li>
              ))}
            </ul>
          ) : <p className="ad-none">بستن برنامه‌ریزی‌شده‌ای نیست.</p>}
        </aside>
      </div>
    </div>
  );
}
