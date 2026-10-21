"use client";
/**
 * Admin › Audit log (/panel/audit). Who changed what and when: period and
 * action filters, search, grouped by day. Styles: admin.css ("au-").
 */
import clsx from "clsx";
import { AUDIT_PERIODS, useAuditLog } from "@/engine/admin/useAuditLog";
import { fa, jFull } from "@/engine/format";
import { PageHead } from "@/ui/panel/shell/PageHead";

export function AuditLogView() {
  const a = useAuditLog();
  return (
    <div className="ad">
      <PageHead title="تاریخچه تغییرات" sub="هر تغییر قیمت، تنظیمات، بستن زمین و عملیات مالی پذیرش اینجا ثبت می‌شود." />
      <div className="au-bar">
        <div className="ad-seg" role="tablist" aria-label="بازه">
          {AUDIT_PERIODS.map((p) => (
            <button key={p} type="button" role="tab" aria-selected={a.days === p} className={clsx(a.days === p && "on")} onClick={() => a.setDays(p)}>{fa(p)} روز</button>
          ))}
        </div>
        <select className="input au-action" value={a.action} onChange={(e) => a.setAction(e.target.value)} aria-label="نوع عملیات">
          <option value="all">همه‌ی عملیات</option>
          {a.actions.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <input className="input au-search" type="search" maxLength={40} value={a.q} onChange={(e) => a.setQ(e.target.value)} placeholder="کاربر، مورد یا جزئیات" aria-label="جستجو" />
        <span className="au-count">{fa(a.count)} مورد</span>
      </div>
      {a.loading && <p className="ad-none">در حال بارگذاری…</p>}
      {!a.loading && !a.groups.length && <p className="ad-none">در این بازه تغییری با این فیلتر ثبت نشده است.</p>}
      <div className="au-days">
        {a.groups.map((g) => (
          <section key={g.date} className="ad-card">
            <header><h3>{jFull(g.date)}</h3></header>
            <ol className="au-list">
              {g.items.map((x, i) => (
                <li key={i}>
                  <span className="au-time">{x.time ? fa(x.time) : ""}</span>
                  <span className="au-action-pill">{x.action}</span>
                  <span className="au-text"><b>{x.target}</b><small>{x.detail}</small></span>
                  <span className="au-actor">{x.actor}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
