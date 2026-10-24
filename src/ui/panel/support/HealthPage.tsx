"use client";
/**
 * Support › System status (/panel/health): backend health and its
 * dependencies, response time of the public endpoints the site needs, the
 * site's own settings, and this browser. Styles: support.css ("sd-").
 */
import clsx from "clsx";
import { fa } from "@/engine/format";
import { useSystemHealth } from "@/engine/support/useSiteOps";
import { Button3D } from "@/ui/kit/Buttons";
import { PageHead } from "@/ui/panel/shell/PageHead";

const Dot = ({ ok, warn }: { ok: boolean; warn?: boolean }) => <i className={clsx("sd-dot", ok ? (warn ? "warn" : "ok") : "bad")} aria-label={ok ? (warn ? "کند" : "سالم") : "خطا"} />;

export function SupportHealthView() {
  const h = useSystemHealth();
  return (
    <div className="ad sd">
      <PageHead
        title="وضعیت سامانه"
        sub={h.checkedAt ? `آخرین بررسی: ${new Date(h.checkedAt).toLocaleTimeString("fa-IR")}` : "در حال بررسی…"}
        action={<Button3D size="sm" onClick={h.run} disabled={h.running}>{h.running ? "در حال بررسی…" : "بررسی دوباره"}</Button3D>}
      />
      {h.health && (
        <p className={clsx("sd-banner", h.allOk ? "ok" : "bad")} role="status">
          {h.allOk ? "همه‌ی بخش‌ها سالم پاسخ می‌دهند." : "یک یا چند بخش مشکل دارد؛ جزئیات پایین است."}
        </p>
      )}

      <div className="sd-grid">
        <section className="ad-card">
          <header><h3>بک‌اند و وابستگی‌ها</h3>{h.backend && <small dir="ltr">{h.backend.version}</small>}</header>
          <ul className="sd-checks">
            {h.health && (
              <li><Dot ok={h.health.ok} warn={h.slow(h.health.ms)} /><span>{h.health.name}</span><b>{fa(h.health.ms)} ms</b>{h.health.detail && <small>{h.health.detail}</small>}</li>
            )}
            {h.backend?.checks.map((c) => (
              <li key={c.name}><Dot ok={c.ok} /><span>{c.name}</span>{c.detail && <small>{c.detail}</small>}</li>
            ))}
          </ul>
        </section>

        <section className="ad-card">
          <header><h3>سرویس‌های عمومی سایت</h3><small>زمان پاسخ از همین مرورگر</small></header>
          <ul className="sd-checks">
            {h.endpoints.map((e) => (
              <li key={e.name}><Dot ok={e.ok} warn={h.slow(e.ms)} /><span>{e.name}</span><b>{fa(e.ms)} ms</b>{e.detail && <small>{e.detail}</small>}</li>
            ))}
          </ul>
        </section>

        <section className="ad-card">
          <header><h3>تنظیمات سایت</h3></header>
          <ul className="sd-checks">
            {h.config.map((c) => (
              <li key={c.name}><Dot ok={c.ok} warn={!c.ok} /><span>{c.name}</span><small dir="auto">{c.value}</small></li>
            ))}
          </ul>
        </section>

        {h.browser && (
          <section className="ad-card">
            <header><h3>همین مرورگر</h3></header>
            <ul className="sd-checks">
              <li><Dot ok={h.browser.online} /><span>اینترنت</span><small>{h.browser.online ? "وصل" : "قطع"}</small></li>
              <li><Dot ok /><span>زبان</span><small dir="ltr">{h.browser.language}</small></li>
              <li><Dot ok /><span>مرورگر</span><small dir="ltr">{h.browser.ua}</small></li>
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
