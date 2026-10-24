"use client";
/**
 * Support › Dashboard (/panel): what needs the team now — open, new and
 * blocking reports, reports with no answer yet, first-response time — plus
 * reports per day, open reports by area, and devices / browsers.
 * Styles: support.css ("sd-").
 */
import Link from "next/link";
import { fa, jDate } from "@/engine/format";
import { useSupportStats } from "@/engine/support/useSupportDesk";
import { useSiteNotice } from "@/engine/support/useSiteOps";
import { SUPPORT_AREAS } from "@/engine/support/useSupport";
import { KpiGrid } from "@/ui/panel/parts/KpiGrid";
import { PageHead } from "@/ui/panel/shell/PageHead";
import { Bars, SeverityPill, StatusPill, ago, duration } from "@/ui/panel/support/parts";

const DEVICE_FA: Record<string, string> = { mobile: "موبایل", tablet: "تبلت", desktop: "کامپیوتر", unknown: "بدون اطلاعات فنی" };

export function SupportDashboard() {
  const s = useSupportStats();
  const notice = useSiteNotice();
  const maxDay = Math.max(1, ...s.perDay.map((d) => d.count));

  return (
    <div className="ad sd">
      <PageHead title="داشبورد پشتیبانی" sub="گزارش‌های فنی همه‌ی کاربران سایت؛ هر ۳۰ ثانیه تازه می‌شود." />
      {notice && (
        <p className={`sd-live ${notice.tone}`}>
          اطلاعیه‌ی روی سایت: «{notice.text}» · <Link href="/panel/notice">ویرایش</Link>
        </p>
      )}
      <KpiGrid
        items={[
          ["گزارش باز", fa(s.open), `${fa(s.unassigned)} بدون مسئول`],
          ["تازه", fa(s.fresh), `${fa(s.waitingNoReply)} بدون پاسخ`],
          ["متوقف‌کننده", fa(s.blockers), "باز و با اولویت اول"],
          ["منتظر کاربر", fa(s.needInfo), "پاسخ کاربر لازم است"],
          ["حل‌شده در ۷ روز", fa(s.resolvedWeek)],
          ["میانه‌ی اولین پاسخ", s.medianFirstResponseMins === null ? "—" : duration(s.medianFirstResponseMins)],
        ]}
      />

      <div className="sd-grid">
        <section className="ad-card">
          <header><h3>الان رسیدگی شود</h3><Link href="/panel/queue">همه‌ی صف</Link></header>
          {!s.urgent.length && <p className="muted small">گزارش تازه یا متوقف‌کننده‌ای نیست.</p>}
          <ul className="ad-list">
            {s.urgent.map((t) => (
              <li key={t.id}>
                <Link href={`/panel/queue?id=${encodeURIComponent(t.id)}`}>{t.subject}</Link>
                <small className="sd-meta">
                  <span dir="ltr">{t.ref}</span> <SeverityPill severity={t.severity} /> <StatusPill status={t.status} /> {t.reporter.name} · {ago(t.date, t.time)}
                </small>
              </li>
            ))}
          </ul>
        </section>

        <section className="ad-card">
          <header><h3>گزارش‌ها در ۱۴ روز اخیر</h3><small>{fa(s.total)} گزارش در کل</small></header>
          <div className="sd-days" role="img" aria-label="تعداد گزارش‌های هر روز در ۱۴ روز اخیر">
            {s.perDay.map((d) => (
              <span key={d.date} title={`${jDate(d.date)}: ${fa(d.count)}`}>
                <i style={{ ["--h" as string]: `${(d.count / maxDay) * 100}%` }} />
              </span>
            ))}
          </div>
        </section>

        <section className="ad-card">
          <header><h3>گزارش‌های باز بر اساس بخش</h3></header>
          <Bars rows={SUPPORT_AREAS.map((a) => ({ label: a.label, value: s.byArea[a.id] ?? 0 })).filter((r) => r.value > 0)} empty="گزارش بازی نیست." />
        </section>

        <section className="ad-card">
          <header><h3>دستگاه و مرورگر</h3><Link href="/panel/errors">خطاهای سایت</Link></header>
          <Bars rows={Object.entries(s.byDevice).map(([k, v]) => ({ label: DEVICE_FA[k] ?? k, value: v }))} />
          <Bars rows={Object.entries(s.byBrowser).map(([k, v]) => ({ label: k, value: v }))} />
        </section>
      </div>
    </div>
  );
}
