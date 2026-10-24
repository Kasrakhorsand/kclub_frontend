"use client";
/**
 * Support › Find a user (/panel/lookup): by mobile number — name, roles,
 * active bookings and every report they sent. Booking and wallet changes
 * stay with the front desk; support only looks.
 */
import Link from "next/link";
import { fa, jDate } from "@/engine/format";
import { ROLE_FA } from "@/engine/panel/menus";
import { useSupportLookup } from "@/engine/support/useSiteOps";
import { Button3D } from "@/ui/kit/Buttons";
import { PageHead } from "@/ui/panel/shell/PageHead";
import { SeverityPill, StatusPill } from "@/ui/panel/support/parts";

export function SupportLookupView() {
  const l = useSupportLookup();
  const u = l.user;
  return (
    <div className="ad sd">
      <PageHead title="جستجوی کاربر" sub="برای دیدن همه‌ی گزارش‌های یک نفر. تغییر رزرو و کیف پول با پذیرش مجموعه است." />
      <form
        className="ad-card sd-search"
        onSubmit={(e) => {
          e.preventDefault();
          l.search();
        }}
      >
        <label className="f">
          شماره‌ی موبایل
          <input className="input ltr" inputMode="numeric" maxLength={11} value={l.phone} onChange={(e) => l.setPhone(e.target.value)} placeholder="09121234567" />
        </label>
        <Button3D type="submit" size="sm" disabled={l.searching}>{l.searching ? "در حال جستجو…" : "جستجو"}</Button3D>
      </form>
      {l.error && <p className="su-err" role="alert">{l.error}</p>}
      {l.searched && !l.searching && !u && !l.error && <p className="ad-none muted">کاربری با این شماره پیدا نشد.</p>}

      {u && (
        <section className="ad-card">
          <header>
            <h3>{u.name}</h3>
            <small dir="ltr">{u.phone}</small>
          </header>
          <p className="sd-meta">{u.roles.map((r) => ROLE_FA[r]).join("، ")} · {fa(u.activeBookings)} رزرو فعال · {fa(u.tickets.length)} گزارش فنی</p>
          <ul className="ad-list">
            {u.tickets.map((t) => (
              <li key={t.id}>
                <Link href={`/panel/queue?id=${encodeURIComponent(t.id)}`}>{t.subject}</Link>
                <small className="sd-meta"><span dir="ltr">{t.ref}</span> <SeverityPill severity={t.severity} /> <StatusPill status={t.status} /> {jDate(t.date)}</small>
              </li>
            ))}
            {!u.tickets.length && <li className="muted small">گزارشی نفرستاده است.</li>}
          </ul>
        </section>
      )}
    </div>
  );
}
