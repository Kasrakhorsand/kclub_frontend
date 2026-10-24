"use client";
/**
 * Technical support — every role (/panel/support). Reports go to the
 * website's support team, not the venue: a guided form (area, severity,
 * steps, what happened, screenshots, device details the user can see and turn
 * off), then a status timeline and a conversation with support.
 * Shares the inbox/conversation layout with Tickets. Styles: common.css ("su-", "tc-").
 */
import { useState } from "react";
import clsx from "clsx";
import { fa, jDate, jFull } from "@/engine/format";
import { SUPPORT_AREAS, SUPPORT_LIMITS, SUPPORT_SEVERITIES, SUPPORT_WHEN, useAttachments, useSupport } from "@/engine/support/useSupport";
import type { SupportAttachment, SupportDiagnostics, SupportStatus } from "@/engine/types";
import { Button3D } from "@/ui/kit/Buttons";
import { Icon3D } from "@/ui/kit/Icon3D";
import { PageHead } from "@/ui/panel/shell/PageHead";

export const STATUS: Record<SupportStatus, { label: string; tone: string }> = {
  new: { label: "ثبت شد", tone: "warn" },
  in_progress: { label: "در حال بررسی", tone: "warn" },
  need_info: { label: "نیاز به توضیح شما", tone: "hot" },
  resolved: { label: "حل شد", tone: "ok" },
  closed: { label: "بسته", tone: "off" },
};

export const areaLabel = (id: string) => SUPPORT_AREAS.find((a) => a.id === id)?.label ?? id;
const whenLabel = (id: string) => SUPPORT_WHEN.find((w) => w.id === id)?.label ?? id;
export const kb = (n: number) => (n < 1024 * 1024 ? `${fa(Math.round(n / 1024))} کیلوبایت` : `${fa(Math.round((n / 1024 / 1024) * 10) / 10)} مگابایت`);

/** Drop zone + file button + paste; thumbnails with remove. */
export function Uploader({ files, compact }: { files: ReturnType<typeof useAttachments>; compact?: boolean }) {
  const [over, setOver] = useState(false);
  return (
    <div className={clsx("su-up", compact && "compact")}>
      {!files.full && (
        <label
          className={clsx("su-drop", over && "over")}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            files.add(e.dataTransfer.files);
          }}
        >
          <input
            type="file"
            accept={files.limit.types.join(",")}
            multiple
            onChange={(e) => {
              files.add(e.target.files);
              e.target.value = "";
            }}
          />
          <Icon3D name="plus" />
          <span>
            <b>{compact ? "پیوست عکس" : "عکس صفحه را اینجا بکشید یا انتخاب کنید"}</b>
            {!compact && <small>PNG، JPG یا WEBP · حداکثر {fa(files.limit.maxFiles)} عکس، هر کدام تا {fa(files.limit.maxBytes / 1024 / 1024)} مگابایت · می‌توانید اسکرین‌شات را با Ctrl+V هم بچسبانید</small>}
          </span>
        </label>
      )}
      {files.error && <p className="su-err" role="alert">{files.error}</p>}
      {files.items.length > 0 && (
        <ul className="su-thumbs">
          {files.items.map((p, i) => (
            <li key={p.preview}>
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={p.preview} alt={p.file.name} />
              <span>{kb(p.file.size)}</span>
              <button type="button" onClick={() => files.remove(i)} aria-label={`حذف ${p.file.name}`}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Attached screenshots; click opens the full image. */
export function Gallery({ items, onOpen }: { items: SupportAttachment[]; onOpen: (a: SupportAttachment) => void }) {
  if (!items.length) return null;
  return (
    <ul className="su-thumbs view">
      {items.map((a) => (
        <li key={a.id}>
          <button type="button" onClick={() => onOpen(a)} aria-label={`نمایش ${a.name}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- user upload from the API */}
            <img src={a.url} alt={a.name} />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Every device detail that is (or was) sent, in full. */
export function DiagnosticsList({ d }: { d: SupportDiagnostics }) {
  const rows: [string, string][] = [
    ["صفحه", d.page],
    ["صفحه‌های قبلی", d.recentPages.join(" ← ") || "—"],
    ["مرورگر", d.browser],
    ["سیستم‌عامل", d.os],
    ["دستگاه", d.device === "mobile" ? "موبایل" : d.device === "tablet" ? "تبلت" : "کامپیوتر"],
    ["صفحه‌نمایش", `${d.screen} · پنجره ${d.viewport} · ${d.pixelRatio}x`],
    ["زبان و منطقه‌ی زمانی", `${d.language} · ${d.timeZone}`],
    ["اینترنت", `${d.online ? "وصل" : "قطع"}${d.connection ? ` · ${d.connection}` : ""}`],
    ["تم", d.theme === "dark" ? "تیره" : "روشن"],
    ["نسخه‌ی سایت", d.appVersion],
  ];
  return (
    <div className="su-diag">
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd dir="ltr">{v}</dd></div>
        ))}
      </dl>
      <div className="su-diag-err">
        <b>خطاهای اخیر مرورگر</b>
        {d.recentErrors.length ? (
          <ul>{d.recentErrors.map((e, i) => <li key={i} dir="ltr"><span>{e.time} {e.page}</span>{e.message}</li>)}</ul>
        ) : (
          <small>خطایی ثبت نشده است.</small>
        )}
      </div>
    </div>
  );
}

/** Where a report is on its way: sent → reviewing → solved. */
function Progress({ status }: { status: SupportStatus }) {
  const steps: { id: SupportStatus[]; label: string }[] = [
    { id: ["new"], label: "ثبت" },
    { id: ["in_progress", "need_info"], label: "بررسی" },
    { id: ["resolved", "closed"], label: "حل و بسته" },
  ];
  const at = steps.findIndex((s) => s.id.includes(status));
  return (
    <ol className="su-prog" aria-label="وضعیت پیگیری">
      {steps.map((s, i) => (
        <li key={s.label} className={clsx(i < at && "done", i === at && "now")}>
          <i>{i < at ? "✓" : fa(i + 1)}</i>
          <span>{i === at && status === "need_info" ? "منتظر پاسخ شما" : s.label}</span>
        </li>
      ))}
    </ol>
  );
}

export function SupportView() {
  const s = useSupport();
  const [lightbox, setLightbox] = useState<SupportAttachment | null>(null);
  const [showDiag, setShowDiag] = useState(false);
  const f = s.form;
  const t = s.selected;

  return (
    <div className="tc su">
      <PageHead
        title="پشتیبانی فنی سایت"
        sub="خطا، کندی یا هر مشکل فنی سایت را به تیم فنی گزارش دهید. برای رزرو، لغو و امور مجموعه از «تیکت‌ها» استفاده کنید."
        action={<Button3D size="sm" onClick={s.startCompose}>گزارش مشکل جدید</Button3D>}
      />

      <div className={clsx("tc-layout", (t || s.composing) && "has-open")}>
        <aside className="tc-inbox" aria-label="گزارش‌های من">
          <div className="su-sum">
            <span><b>{fa(s.openCount)}</b> گزارش باز</span>
            {s.needInfoCount > 0 && <span className="hot"><b>{fa(s.needInfoCount)}</b> منتظر پاسخ شما</span>}
          </div>
          {s.loading && <p className="muted small">در حال بارگذاری…</p>}
          {!s.loading && !s.tickets.length && <p className="tc-none muted small">هنوز گزارشی نفرستاده‌اید.</p>}
          <ul>
            {s.tickets.map((x) => (
              <li key={x.id}>
                <button type="button" className={clsx("tc-row", t?.id === x.id && "on", x.status === "need_info" && "attn")} onClick={() => s.select(x.id)}>
                  <span className="tc-row-top">
                    <b>{x.subject}</b>
                    <span className={clsx("tc-status", STATUS[x.status].tone)}>{STATUS[x.status].label}</span>
                  </span>
                  <span className="tc-row-last">{x.messages.length ? x.messages[x.messages.length - 1].text : x.actual}</span>
                  <small dir="auto">{x.ref} · {jDate(x.date)} · {areaLabel(x.area)}</small>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="tc-pane">
          {s.composing ? (
            <form
              className="su-form"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                s.submit();
              }}
              onPaste={(e) => {
                const imgs = Array.from(e.clipboardData.files).filter((x) => x.type.startsWith("image/"));
                if (imgs.length) {
                  e.preventDefault();
                  s.files.add(imgs);
                }
              }}
            >
              <header className="tc-pane-head">
                <button type="button" className="tc-back" onClick={s.cancelCompose} aria-label="بازگشت">→</button>
                <div>
                  <h3>گزارش مشکل فنی</h3>
                  <small>هر چه دقیق‌تر بنویسید، سریع‌تر بررسی می‌شود.</small>
                </div>
              </header>

              <fieldset className="su-sec">
                <legend><i>۱</i> مشکل در کدام بخش است؟</legend>
                <div className="su-chips" role="radiogroup" aria-label="بخش">
                  {SUPPORT_AREAS.map((a) => (
                    <button key={a.id} type="button" role="radio" aria-checked={f.area === a.id} className={clsx(f.area === a.id && "on")} onClick={() => s.setForm({ area: a.id })}>{a.label}</button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="su-sec">
                <legend><i>۲</i> چقدر جدی است؟</legend>
                <div className="su-sev" role="radiogroup" aria-label="شدت">
                  {SUPPORT_SEVERITIES.map((v) => (
                    <button key={v.id} type="button" role="radio" aria-checked={f.severity === v.id} className={clsx(v.id, f.severity === v.id && "on")} onClick={() => s.setForm({ severity: v.id })}>
                      <b>{v.label}</b>
                      <small>{v.hint}</small>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="su-sec">
                <legend><i>۳</i> شرح مشکل</legend>
                <label className="f">
                  عنوان کوتاه
                  <input className="input" maxLength={SUPPORT_LIMITS.subject} value={f.subject} onChange={(e) => s.setForm({ subject: e.target.value })} placeholder="مثلاً: بعد از پرداخت صفحه سفید می‌شود" />
                </label>
                <label className="f">
                  چه کارهایی انجام دادید؟ <small className="muted">قدم به قدم</small>
                  <textarea className="input" rows={3} maxLength={SUPPORT_LIMITS.steps} value={f.steps} onChange={(e) => s.setForm({ steps: e.target.value })} placeholder={"۱. وارد رزرو پدل شدم\n۲. ساعت ۱۸ را انتخاب کردم\n۳. روی پرداخت زدم"} />
                </label>
                <label className="f">
                  چه اتفاقی افتاد؟ <small className="muted">متن خطا را اگر دیدید همان‌طور بنویسید</small>
                  <textarea className="input" rows={3} maxLength={SUPPORT_LIMITS.actual} value={f.actual} onChange={(e) => s.setForm({ actual: e.target.value })} placeholder="مثلاً: پیام «خطای سرور» آمد و دکمه کار نکرد" />
                </label>
                <label className="f">
                  انتظار داشتید چه شود؟ <small className="muted">اختیاری</small>
                  <input className="input" maxLength={SUPPORT_LIMITS.expected} value={f.expected ?? ""} onChange={(e) => s.setForm({ expected: e.target.value })} placeholder="مثلاً: نمایش کد رهگیری رزرو" />
                </label>
              </fieldset>

              <fieldset className="su-sec">
                <legend><i>۴</i> زمان و کد پیگیری</legend>
                <div className="su-row">
                  <div className="su-chips" role="radiogroup" aria-label="زمان">
                    {SUPPORT_WHEN.map((w) => (
                      <button key={w.id} type="button" role="radio" aria-checked={f.when === w.id} className={clsx(f.when === w.id && "on")} onClick={() => s.setForm({ when: w.id })}>{w.label}</button>
                    ))}
                  </div>
                  <label className="f su-time">
                    ساعت <small className="muted">اختیاری</small>
                    <input className="input" dir="ltr" inputMode="numeric" maxLength={5} value={f.whenTime ?? ""} onChange={(e) => s.setForm({ whenTime: e.target.value.replace(/[^\d:]/g, "") })} placeholder="21:30" />
                  </label>
                  <label className="f su-ref">
                    کد رهگیری یا شماره‌ی رزرو <small className="muted">اختیاری</small>
                    <input className="input" dir="ltr" maxLength={SUPPORT_LIMITS.refCode} value={f.refCode ?? ""} onChange={(e) => s.setForm({ refCode: e.target.value })} placeholder="KC-48213" />
                  </label>
                </div>
              </fieldset>

              <fieldset className="su-sec">
                <legend><i>۵</i> عکس از صفحه <small className="muted">اختیاری ولی خیلی کمک می‌کند</small></legend>
                <Uploader files={s.files} />
              </fieldset>

              <fieldset className="su-sec">
                <legend><i>۶</i> اطلاعات فنی و تماس</legend>
                <label className="su-check">
                  <input type="checkbox" checked={s.shareDiagnostics} onChange={(e) => s.setShareDiagnostics(e.target.checked)} />
                  <span>
                    <b>ارسال اطلاعات فنی دستگاه</b>
                    <small>مرورگر، اندازه‌ی صفحه، صفحه‌های اخیر و خطاهای مرورگر. نام، شماره، رمز و اطلاعات پرداخت فرستاده نمی‌شود.</small>
                  </span>
                </label>
                {s.shareDiagnostics && s.diagnostics && (
                  <>
                    <button type="button" className="su-link" onClick={() => setShowDiag(!showDiag)} aria-expanded={showDiag}>
                      {showDiag ? "پنهان کردن" : "دیدن دقیق"} اطلاعاتی که فرستاده می‌شود
                    </button>
                    {showDiag && <DiagnosticsList d={s.diagnostics} />}
                  </>
                )}
                <label className="su-check">
                  <input type="checkbox" checked={f.allowCall} onChange={(e) => s.setForm({ allowCall: e.target.checked })} />
                  <span>
                    <b>در صورت نیاز با من تماس بگیرید</b>
                    <small>با شماره‌ی حساب کاربری شما؛ نتیجه همیشه همین‌جا و با پیامک هم اطلاع داده می‌شود.</small>
                  </span>
                </label>
              </fieldset>

              {s.error && <p className="su-err" role="alert">{s.error}</p>}
              <div className="tc-actions">
                <button type="button" className="btn ghost" onClick={s.cancelCompose}>انصراف</button>
                <Button3D type="submit" disabled={s.busy}>{s.busy ? "در حال ارسال…" : "ارسال گزارش"}</Button3D>
              </div>
            </form>
          ) : t ? (
            <>
              <header className="tc-pane-head">
                <button type="button" className="tc-back" onClick={() => s.select(null)} aria-label="بازگشت به فهرست">→</button>
                <div>
                  <h3>{t.subject}</h3>
                  <small dir="auto">{t.ref} · {jFull(t.date)} · {fa(t.time)} · {areaLabel(t.area)}</small>
                </div>
                <span className={clsx("tc-status", STATUS[t.status].tone)}>{STATUS[t.status].label}</span>
              </header>

              {s.created === t.ref && (
                <div className="su-ok" role="status">
                  <b>گزارش شما ثبت شد · کد پیگیری <span dir="ltr">{t.ref}</span></b>
                  <small>تیم فنی بررسی می‌کند و نتیجه را همین‌جا و با پیامک خبر می‌دهد.</small>
                </div>
              )}

              <Progress status={t.status} />

              <dl className="su-facts">
                <div><dt>شدت</dt><dd>{SUPPORT_SEVERITIES.find((v) => v.id === t.severity)?.label}</dd></div>
                <div><dt>زمان</dt><dd>{whenLabel(t.when)}{t.whenTime ? ` · ${fa(t.whenTime)}` : ""}</dd></div>
                {t.refCode && <div><dt>کد رهگیری</dt><dd dir="ltr">{t.refCode}</dd></div>}
                <div><dt>تماس تلفنی</dt><dd>{t.allowCall ? "مجاز" : "نه"}</dd></div>
              </dl>
              <div className="su-story">
                <div><b>مراحل</b><p>{t.steps}</p></div>
                <div><b>چه اتفاقی افتاد</b><p>{t.actual}</p></div>
                {t.expected && <div><b>انتظار</b><p>{t.expected}</p></div>}
              </div>
              <Gallery items={t.attachments} onOpen={setLightbox} />
              {t.diagnostics && (
                <details className="su-details">
                  <summary>اطلاعات فنی ارسال‌شده</summary>
                  <DiagnosticsList d={t.diagnostics} />
                </details>
              )}

              <ol className="tc-thread">
                {t.messages.map((m, i) => (
                  <li key={i} className={clsx("tc-msg", m.by === "user" ? "mine" : "theirs", m.by === "support" && "support")}>
                    <span className="tc-who">{m.by === "user" ? "شما" : "پشتیبانی فنی"}</span>
                    {m.text && <p>{m.text}</p>}
                    {m.attachments && <Gallery items={m.attachments} onOpen={setLightbox} />}
                    <small>{fa(m.time)}{m.date !== t.date ? ` · ${jDate(m.date)}` : ""}</small>
                  </li>
                ))}
                {!t.messages.length && <li className="su-wait">تیم فنی هنوز پاسخ نداده است. معمولاً در کمتر از یک روز کاری پاسخ می‌دهیم.</li>}
              </ol>

              {t.status !== "closed" ? (
                <form
                  className={clsx("tc-reply", t.status === "need_info" && "attn")}
                  onSubmit={(e) => {
                    e.preventDefault();
                    s.sendReply();
                  }}
                  onPaste={(e) => {
                    const imgs = Array.from(e.clipboardData.files).filter((x) => x.type.startsWith("image/"));
                    if (imgs.length) {
                      e.preventDefault();
                      s.replyFiles.add(imgs);
                    }
                  }}
                >
                  {t.status === "need_info" && <p className="su-need">تیم فنی برای ادامه‌ی بررسی به توضیح شما نیاز دارد.</p>}
                  <textarea className="input" rows={2} maxLength={SUPPORT_LIMITS.reply} value={s.reply} onChange={(e) => s.setReply(e.target.value)} placeholder="توضیح بیشتر یا پاسخ به پشتیبانی" aria-label="متن پیام" />
                  <Uploader files={s.replyFiles} compact />
                  <div className="tc-actions">
                    {s.canClose && <button type="button" className="btn ghost sm" onClick={s.close} disabled={s.busy}>مشکل حل شد، بستن</button>}
                    <Button3D type="submit" size="sm" disabled={s.busy || (!s.reply.trim() && !s.replyFiles.items.length)}>ارسال</Button3D>
                  </div>
                  {s.error && <p className="su-err" role="alert">{s.error}</p>}
                </form>
              ) : (
                <p className="tc-closed">این گزارش بسته شده است. اگر مشکل دوباره پیش آمد، یک گزارش تازه بفرستید.</p>
              )}
            </>
          ) : (
            <div className="tc-placeholder">
              <Icon3D name="gear" />
              <h3>یک گزارش را انتخاب کنید</h3>
              <p className="muted small">یا با «گزارش مشکل جدید» مشکل فنی سایت را برای تیم فنی بفرستید.</p>
            </div>
          )}
        </section>
      </div>

      {lightbox && (
        <div className="su-lightbox" role="dialog" aria-label={lightbox.name} onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- full-size screenshot */}
          <img src={lightbox.url} alt={lightbox.name} />
          <button type="button" aria-label="بستن">✕</button>
        </div>
      )}
    </div>
  );
}
