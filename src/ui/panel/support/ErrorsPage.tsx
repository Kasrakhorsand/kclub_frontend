"use client";
/**
 * Support › Site errors (/panel/errors): browser errors users' reports
 * carried, grouped by message, with how many reports, which pages and
 * browsers, and links to the reports. Styles: support.css ("sd-").
 */
import Link from "next/link";
import { fa } from "@/engine/format";
import { useErrorGroups } from "@/engine/support/useSupportDesk";
import { PageHead } from "@/ui/panel/shell/PageHead";

export function SupportErrorsView() {
  const { groups, loading } = useErrorGroups();
  return (
    <div className="ad sd">
      <PageHead title="خطاهای سایت" sub="خطاهای مرورگر که همراه گزارش‌ها آمده‌اند، گروه‌بندی‌شده. خطایی که در چند گزارش تکرار شده، اولویت بالاتری دارد." />
      {loading && <p className="muted small">در حال بارگذاری…</p>}
      {!loading && !groups.length && <p className="ad-none muted">هیچ گزارشی خطای مرورگر نداشته است.</p>}
      <ul className="sd-errors">
        {groups.map((g) => (
          <li key={g.message} className="ad-card">
            <code dir="ltr">{g.message}</code>
            <div className="sd-meta">
              <b>{fa(g.reports.length)} گزارش</b> · {fa(g.count)} بار · آخرین: <span dir="ltr">{g.last}</span>
            </div>
            <div className="sd-meta">صفحه‌ها: <span dir="ltr">{g.pages.join("  ")}</span></div>
            <div className="sd-meta">مرورگرها: <span dir="ltr">{g.browsers.join(" | ")}</span></div>
            <div className="sd-links">
              {g.reports.map((r) => <Link key={r.id} href={`/panel/queue?id=${encodeURIComponent(r.id)}`} dir="ltr">{r.ref}</Link>)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
