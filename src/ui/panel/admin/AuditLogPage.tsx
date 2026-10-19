"use client";
/** Admin › Audit log (/panel/audit). */
import { jDate } from "@/engine/format";
import { AUDIT } from "@/engine/mock";
import { PageHead } from "@/ui/panel/shell/PageHead";

/** Who changed what, and when. */
export function AuditLogView() {
  return (
    <>
      <PageHead title="تاریخچه تغییرات" />
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>تاریخ</th><th>کاربر</th><th>عملیات</th><th>مورد</th><th>جزئیات</th></tr></thead>
          <tbody>
            {AUDIT.map((entry, i) => (
              <tr key={i}><td>{jDate(entry.date)}</td><td>{entry.actor}</td><td>{entry.action}</td><td>{entry.target}</td><td>{entry.detail}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
