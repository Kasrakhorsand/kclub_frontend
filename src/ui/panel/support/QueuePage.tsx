"use client";
/**
 * Support › Report queue (/panel/queue, ?id= opens one): every user's
 * technical reports with views (open, mine, unassigned, waiting on user,
 * done), filters and search. A report shows the full story, screenshots,
 * device details and browser errors, the conversation, and internal notes;
 * the team changes status / severity / area / assignee and replies with
 * saved answers and screenshots. Styles: support.css ("sd-"), common.css ("tc-", "su-").
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { fa, jDate, jFull } from "@/engine/format";
import { SUPPORT_AREAS, SUPPORT_LIMITS, SUPPORT_SEVERITIES, SUPPORT_WHEN } from "@/engine/support/useSupport";
import { type QueueView, useSupportDesk } from "@/engine/support/useSupportDesk";
import { ROLE_FA } from "@/engine/panel/menus";
import type { SupportAttachment, SupportArea, SupportSeverity, SupportStatus } from "@/engine/types";
import { Button3D } from "@/ui/kit/Buttons";
import { Icon3D } from "@/ui/kit/Icon3D";
import { DiagnosticsList, Gallery, Uploader, areaLabel } from "@/ui/panel/common/SupportPage";
import { PageHead } from "@/ui/panel/shell/PageHead";
import { DESK_STATUS, SEVERITY_FA, SeverityPill, StatusPill, ago } from "@/ui/panel/support/parts";

const VIEWS: { id: QueueView; label: string }[] = [
  { id: "open", label: "باز" },
  { id: "mine", label: "مال من" },
  { id: "unassigned", label: "بدون مسئول" },
  { id: "need_info", label: "منتظر کاربر" },
  { id: "done", label: "حل و بسته" },
  { id: "all", label: "همه" },
];

export function SupportQueueView() {
  const d = useSupportDesk();
  const params = useSearchParams();
  const [lightbox, setLightbox] = useState<SupportAttachment | null>(null);
  const t = d.selected;

  // Open the report named in the address (links from the dashboard, errors and lookup pages).
  const wanted = params.get("id");
  const { select } = d;
  useEffect(() => {
    if (wanted) select(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the address changes
  }, [wanted]);

  return (
    <div className="tc su sd">
      <PageHead title="صف گزارش‌ها" sub="اول متوقف‌کننده‌ها و قدیمی‌ترها. پاسخ شما برای کاربر پیامک هم می‌شود؛ یادداشت داخلی را فقط تیم می‌بیند." />

      <div className={clsx("tc-layout", t && "has-open")}>
        <aside className="tc-inbox" aria-label="گزارش‌ها">
          <div className="sd-views" role="tablist" aria-label="نما">
            {VIEWS.map((v) => (
              <button key={v.id} type="button" role="tab" aria-selected={d.filters.view === v.id} className={clsx(d.filters.view === v.id && "on")} onClick={() => d.setFilters({ view: v.id })}>
                {v.label} <b>{fa(d.counts[v.id])}</b>
              </button>
            ))}
          </div>
          <div className="sd-filters">
            <input className="input" type="search" value={d.filters.q} onChange={(e) => d.setFilters({ q: e.target.value })} placeholder="جستجو: کد، عنوان، نام، کد رهگیری" aria-label="جستجو" />
            <select className="input" value={d.filters.severity} onChange={(e) => d.setFilters({ severity: e.target.value as SupportSeverity | "all" })} aria-label="شدت">
              <option value="all">همه‌ی شدت‌ها</option>
              {SUPPORT_SEVERITIES.map((s) => <option key={s.id} value={s.id}>{SEVERITY_FA[s.id]}</option>)}
            </select>
            <select className="input" value={d.filters.area} onChange={(e) => d.setFilters({ area: e.target.value as SupportArea | "all" })} aria-label="بخش">
              <option value="all">همه‌ی بخش‌ها</option>
              {SUPPORT_AREAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </div>
          {d.loading && <p className="muted small">در حال بارگذاری…</p>}
          {!d.loading && !d.list.length && <p className="tc-none muted small">گزارشی با این فیلتر نیست.</p>}
          <ul>
            {d.list.map((x) => (
              <li key={x.id}>
                <button type="button" className={clsx("tc-row", t?.id === x.id && "on", x.severity === "blocker" && x.status !== "closed" && x.status !== "resolved" && "attn")} onClick={() => d.select(x.id)}>
                  <span className="tc-row-top">
                    <b>{x.subject}</b>
                    <StatusPill status={x.status} />
                  </span>
                  <span className="tc-row-last">{x.messages.length ? x.messages[x.messages.length - 1].text : x.actual}</span>
                  <small className="sd-meta">
                    <span dir="ltr">{x.ref}</span> <SeverityPill severity={x.severity} /> {areaLabel(x.area)} · {x.reporter.name} · {ago(x.date, x.time)}
                    {x.assignee ? ` · ${x.assignee}` : " · بدون مسئول"}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="tc-pane">
          {t ? (
            <>
              <header className="tc-pane-head">
                <button type="button" className="tc-back" onClick={() => d.select(null)} aria-label="بازگشت به فهرست">→</button>
                <div>
                  <h3>{t.subject}</h3>
                  <small dir="auto">{t.ref} · {jFull(t.date)} · {fa(t.time)} · {ago(t.date, t.time)}</small>
                </div>
                <StatusPill status={t.status} />
              </header>

              <div className="sd-who">
                <span><b>{t.reporter.name}</b> · {ROLE_FA[t.reporter.role]}</span>
                {t.reporter.phone ? <a href={`tel:${t.reporter.phone}`} dir="ltr">{t.reporter.phone}</a> : <span className="muted small">تماس تلفنی مجاز نیست</span>}
              </div>

              <div className="sd-controls">
                <label className="f">وضعیت
                  <select className="input" value={t.status} disabled={d.busy} onChange={(e) => d.update({ status: e.target.value as SupportStatus })}>
                    {(Object.keys(DESK_STATUS) as SupportStatus[]).map((k) => <option key={k} value={k}>{DESK_STATUS[k].label}</option>)}
                  </select>
                </label>
                <label className="f">شدت
                  <select className="input" value={t.severity} disabled={d.busy} onChange={(e) => d.update({ severity: e.target.value as SupportSeverity })}>
                    {SUPPORT_SEVERITIES.map((s) => <option key={s.id} value={s.id}>{SEVERITY_FA[s.id]}</option>)}
                  </select>
                </label>
                <label className="f">بخش
                  <select className="input" value={t.area} disabled={d.busy} onChange={(e) => d.update({ area: e.target.value as SupportArea })}>
                    {SUPPORT_AREAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                </label>
                <label className="f">مسئول
                  <select className="input" value={t.assignee ?? ""} disabled={d.busy} onChange={(e) => d.update({ assignee: e.target.value || null })}>
                    <option value="">بدون مسئول</option>
                    {[...new Set([...d.agents.map((a) => a.name), ...(t.assignee ? [t.assignee] : [])])].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                {t.assignee !== d.me && <button type="button" className="btn ghost sm" disabled={d.busy} onClick={d.assignToMe}>برداشتن برای خودم</button>}
              </div>
              {d.flash && <p className="sd-flash" role="status">{d.flash}</p>}

              <dl className="su-facts">
                <div><dt>زمان مشکل</dt><dd>{SUPPORT_WHEN.find((w) => w.id === t.when)?.label}{t.whenTime ? ` · ${fa(t.whenTime)}` : ""}</dd></div>
                {t.refCode && <div><dt>کد رهگیری</dt><dd dir="ltr">{t.refCode}</dd></div>}
                <div><dt>آخرین تغییر</dt><dd>{jDate(t.updatedAt.slice(0, 10))}</dd></div>
                {t.firstResponseMins !== undefined && <div><dt>اولین پاسخ</dt><dd>{fa(t.firstResponseMins)} دقیقه</dd></div>}
              </dl>
              <div className="su-story">
                <div><b>مراحل</b><p>{t.steps}</p></div>
                <div><b>چه اتفاقی افتاد</b><p>{t.actual}</p></div>
                {t.expected && <div><b>انتظار</b><p>{t.expected}</p></div>}
              </div>
              <Gallery items={t.attachments} onOpen={setLightbox} />
              {t.diagnostics ? (
                <details className="su-details" open={t.diagnostics.recentErrors.length > 0}>
                  <summary>اطلاعات فنی دستگاه{t.diagnostics.recentErrors.length ? ` · ${fa(t.diagnostics.recentErrors.length)} خطای مرورگر` : ""}</summary>
                  <DiagnosticsList d={t.diagnostics} />
                </details>
              ) : (
                <p className="muted small">کاربر اطلاعات فنی دستگاه را نفرستاده است.</p>
              )}

              <ol className="tc-thread">
                {t.messages.map((m, i) => (
                  <li key={i} className={clsx("tc-msg", m.by === "support" ? "mine support" : "theirs")}>
                    <span className="tc-who">{m.by === "support" ? "پشتیبانی" : t.reporter.name}</span>
                    {m.text && <p>{m.text}</p>}
                    {m.attachments && <Gallery items={m.attachments} onOpen={setLightbox} />}
                    <small>{fa(m.time)}{m.date !== t.date ? ` · ${jDate(m.date)}` : ""}</small>
                  </li>
                ))}
                {!t.messages.length && <li className="su-wait">هنوز پاسخی داده نشده است.</li>}
              </ol>

              <section className="sd-notes" aria-label="یادداشت‌های داخلی">
                <b>یادداشت داخلی <small className="muted">فقط تیم پشتیبانی می‌بیند</small></b>
                {t.notes.map((n, i) => (
                  <p key={i}><span>{n.by} · {jDate(n.date)} {fa(n.time)}</span>{n.text}</p>
                ))}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    d.addNote();
                  }}
                >
                  <input className="input" maxLength={SUPPORT_LIMITS.reply} value={d.note} onChange={(e) => d.setNote(e.target.value)} placeholder="مثلاً: در Safari نسخه‌ی ۱۷ تکرار شد؛ مشکل WebGL" aria-label="متن یادداشت" />
                  <button type="submit" className="btn ghost sm" disabled={d.busy || !d.note.trim()}>ثبت یادداشت</button>
                </form>
              </section>

              {t.status !== "closed" ? (
                <form
                  className="tc-reply"
                  onSubmit={(e) => {
                    e.preventDefault();
                    d.sendReply();
                  }}
                  onPaste={(e) => {
                    const imgs = Array.from(e.clipboardData.files).filter((x) => x.type.startsWith("image/"));
                    if (imgs.length) {
                      e.preventDefault();
                      d.files.add(imgs);
                    }
                  }}
                >
                  {d.canned.length > 0 && (
                    <div className="sd-canned" aria-label="پاسخ‌های آماده">
                      {d.canned.map((c) => <button key={c.id} type="button" className="chip" onClick={() => d.insertCanned(c)}>{c.title}</button>)}
                    </div>
                  )}
                  <textarea className="input" rows={4} maxLength={SUPPORT_LIMITS.reply} value={d.reply} onChange={(e) => d.setReply(e.target.value)} placeholder={`پاسخ به ${t.reporter.name}`} aria-label="متن پاسخ" />
                  <Uploader files={d.files} compact />
                  <div className="tc-actions">
                    <button type="button" className="btn ghost sm" disabled={d.busy || !d.reply.trim()} onClick={() => d.sendReply("need_info")}>ارسال و درخواست توضیح</button>
                    <button type="button" className="btn ghost sm" disabled={d.busy || !d.reply.trim()} onClick={() => d.sendReply("resolved")}>ارسال و حل شد</button>
                    <Button3D type="submit" size="sm" disabled={d.busy || (!d.reply.trim() && !d.files.items.length)}>ارسال پاسخ</Button3D>
                  </div>
                </form>
              ) : (
                <p className="tc-closed">این گزارش بسته است. برای ادامه، وضعیت را به «در حال بررسی» برگردانید.</p>
              )}
              {d.error && <p className="su-err" role="alert">{d.error}</p>}
            </>
          ) : (
            <div className="tc-placeholder">
              <Icon3D name="gear" />
              <h3>یک گزارش را انتخاب کنید</h3>
              <p className="muted small">{fa(d.counts.open)} گزارش باز، {fa(d.counts.unassigned)} بدون مسئول.</p>
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
