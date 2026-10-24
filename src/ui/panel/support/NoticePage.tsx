"use client";
/**
 * Support › Site notice (/panel/notice): write, preview and publish the
 * banner every visitor sees at the top of the site (e.g. "the bank gateway
 * is down; pay with the wallet"), with an optional end time.
 */
import clsx from "clsx";
import { fa } from "@/engine/format";
import { NOTICE_LIMIT, useNoticeEditor } from "@/engine/support/useSiteOps";
import type { SiteNotice } from "@/engine/types";
import { Button3D } from "@/ui/kit/Buttons";
import { SiteNoticeBar } from "@/ui/layout/SiteNotice";
import { PageHead } from "@/ui/panel/shell/PageHead";

const TONES: { id: SiteNotice["tone"]; label: string }[] = [
  { id: "info", label: "اطلاع‌رسانی" },
  { id: "warn", label: "هشدار" },
  { id: "down", label: "قطعی" },
];

const SAMPLES = [
  "درگاه بانک موقتاً در دسترس نیست؛ می‌توانید با کیف پول پرداخت کنید.",
  "سایت امشب از ساعت ۲ تا ۳ برای به‌روزرسانی در دسترس نیست.",
  "ارسال پیامک کد تأیید با تأخیر انجام می‌شود؛ چند دقیقه صبر کنید.",
];

/** <input type="datetime-local"> value ↔ ISO. */
const toLocal = (iso?: string) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "");

export function SupportNoticeView() {
  const n = useNoticeEditor();
  const v = n.value;
  const live = n.current?.active && n.current.text;

  return (
    <div className="ad sd">
      <PageHead title="اطلاعیه‌ی سایت" sub="نواری که بالای همه‌ی صفحه‌های سایت و پنل‌ها دیده می‌شود. کوتاه و روشن بنویسید و راه جایگزین را بگویید." />
      <p className={clsx("sd-banner", live ? "bad" : "ok")} role="status">
        {live ? "یک اطلاعیه الان روی سایت است." : "الان اطلاعیه‌ای روی سایت نیست."}
        {n.current?.updatedBy && ` · آخرین تغییر: ${n.current.updatedBy}`}
      </p>

      <div className="sd-grid">
        <section className="ad-card sd-form">
          <div className="chips" role="radiogroup" aria-label="نوع">
            {TONES.map((t) => <button key={t.id} type="button" role="radio" aria-checked={v.tone === t.id} className={clsx("chip", v.tone === t.id && "on")} onClick={() => n.set({ tone: t.id })}>{t.label}</button>)}
          </div>
          <label className="f">
            متن <small className="muted">{fa(v.text.length)} از {fa(NOTICE_LIMIT)}</small>
            <textarea className="input" rows={3} maxLength={NOTICE_LIMIT} value={v.text} onChange={(e) => n.set({ text: e.target.value })} />
          </label>
          <div className="sd-canned">
            {SAMPLES.map((s) => <button key={s} type="button" className="chip" onClick={() => n.set({ text: s })}>{s.slice(0, 28)}…</button>)}
          </div>
          <label className="f">
            پیوند «بیشتر بدانید» <small className="muted">اختیاری، مسیر داخل سایت</small>
            <input className="input" dir="ltr" value={v.link ?? ""} onChange={(e) => n.set({ link: e.target.value.trim() || undefined })} placeholder="/terms" />
          </label>
          <label className="f">
            پایان خودکار <small className="muted">اختیاری</small>
            <input className="input" type="datetime-local" dir="ltr" value={toLocal(v.until)} onChange={(e) => n.set({ until: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
          </label>
          {n.error && <p className="su-err" role="alert">{n.error}</p>}
          {n.flash && <p className="sd-flash" role="status">{n.flash}</p>}
          <div className="tc-actions">
            {live && <button type="button" className="btn ghost sm" disabled={n.busy} onClick={n.takeDown}>برداشتن اطلاعیه</button>}
            {n.dirty && <button type="button" className="btn ghost sm" disabled={n.busy} onClick={n.reset}>انصراف</button>}
            <Button3D size="sm" disabled={n.busy || !v.text.trim()} onClick={n.publish}>{live ? "به‌روزرسانی روی سایت" : "انتشار روی سایت"}</Button3D>
          </div>
        </section>

        <section className="ad-card">
          <header><h3>پیش‌نمایش</h3></header>
          {v.text.trim() ? <SiteNoticeBar notice={v} /> : <p className="muted small">متن را بنویسید تا اینجا ببینید.</p>}
        </section>
      </div>
    </div>
  );
}
