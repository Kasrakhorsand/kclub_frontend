"use client";
/**
 * Admin › Staff and permissions (/panel/staff). Give any phone the front
 * desk role, take roles away (asks first), and choose what each front desk
 * account may do with site content. Styles: admin.css ("sf-").
 */
import clsx from "clsx";
import { useStaff } from "@/engine/admin/useStaff";
import { STAFF_PERMISSIONS } from "@/engine/content/permissions";
import { fa, toman } from "@/engine/format";
import { ROLE_FA } from "@/engine/panel/menus";
import { Button3D } from "@/ui/kit/Buttons";
import { PageHead } from "@/ui/panel/shell/PageHead";

export function StaffView() {
  const s = useStaff();
  return (
    <div className="ad">
      <PageHead title="کارکنان و دسترسی‌ها" sub="نقش منشی را به هر شماره بدهید یا بردارید، و مشخص کنید هر منشی چه محتوایی از سایت را تغییر دهد." />

      <section className="ad-card sf-add">
        <header><h3>دادن نقش منشی</h3></header>
        <div className="sf-add-row">
          <label className="f sf-phone">
            موبایل
            <input className="input ltr" inputMode="tel" maxLength={14} value={s.phoneText} onChange={(e) => s.setPhoneText(e.target.value)} placeholder="0912 123 4567" />
          </label>
          {s.phoneOk && s.lookingUp && <p className="ad-none">در حال جستجو…</p>}
          {s.phoneOk && !s.lookingUp && s.found && (
            <p className="sf-found"><b>{s.found.first} {s.found.last}</b><small>حساب موجود · کیف پول {toman(s.found.wallet)}</small></p>
          )}
          {s.isNew && !s.lookingUp && (
            <div className="sf-names">
              <label className="f">نام<input className="input" maxLength={40} value={s.first} onChange={(e) => s.setFirst(e.target.value)} /></label>
              <label className="f">نام خانوادگی<input className="input" maxLength={60} value={s.last} onChange={(e) => s.setLast(e.target.value)} /></label>
            </div>
          )}
          <Button3D size="sm" disabled={!s.phoneOk || !!s.already || s.busy === "grant"} onClick={s.grant}>
            {s.already ? "این شماره منشی است" : s.busy === "grant" ? "…" : "منشی شود"}
          </Button3D>
        </div>
        {s.isNew && <p className="ad-none">این شماره هنوز حساب ندارد؛ با این نام ساخته می‌شود و با کد پیامکی وارد می‌شود.</p>}
        {s.error && <p className="ad-err" role="alert">{s.error}</p>}
        {s.done && <p className="ad-ok" role="status">{s.done}</p>}
      </section>

      <section className="ad-card">
        <header><h3>کارکنان</h3><span>{fa(s.staff.length)} نفر</span></header>
        {s.loading && <p className="ad-none">در حال بارگذاری…</p>}
        <ul className="sf-list">
          {s.staff.map((m) => {
            const isSecretary = m.roles.includes("secretary");
            const isAdmin = m.roles.includes("admin");
            const confirming = s.confirm?.phone === m.phone;
            return (
              <li key={m.phone} className="sf-row">
                <div className="sf-who">
                  <span className="cu-avatar">{(m.first || "؟")[0]}</span>
                  <span>
                    <b>{m.first} {m.last}{m.phone === s.me && <em className="sf-me">شما</em>}</b>
                    <small dir="ltr">{fa(m.phone)}</small>
                  </span>
                </div>
                <div className="sf-roles">
                  {m.roles.filter((r) => r !== "player").map((r) => (
                    <span key={r} className={clsx("sf-role", r)}>
                      {ROLE_FA[r]}
                      {!(r === "admin" && m.phone === s.me) && (
                        <button type="button" onClick={() => s.askRevoke(m.phone, r as "secretary" | "admin")} aria-label={`برداشتن نقش ${ROLE_FA[r]}`}>✕</button>
                      )}
                    </span>
                  ))}
                </div>
                <div className="sf-perms">
                  {isAdmin ? (
                    <p className="ad-none">مدیر به همه‌ی بخش‌ها دسترسی دارد.</p>
                  ) : isSecretary ? (
                    STAFF_PERMISSIONS.map((p) => (
                      <label key={p.id} className={clsx("sf-perm", m.permissions.includes(p.id) && "on")} title={p.hint}>
                        <input type="checkbox" checked={m.permissions.includes(p.id)} disabled={s.busy === `perm-${m.phone}`} onChange={() => s.togglePermission(m.phone, m.permissions, p.id)} />
                        {p.label}
                      </label>
                    ))
                  ) : null}
                </div>
                {confirming && (
                  <div className="sf-confirm" role="alertdialog" aria-label="تأیید برداشتن نقش">
                    <p>نقش {ROLE_FA[s.confirm!.role]} از {m.first} {m.last} برداشته شود؟ دیگر به پنل {ROLE_FA[s.confirm!.role]} دسترسی ندارد.</p>
                    <button type="button" className="btn sm danger" disabled={!!s.busy} onClick={s.revoke}>برداشتن نقش</button>
                    <button type="button" className="btn ghost sm" onClick={s.cancelRevoke}>انصراف</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="ad-card sf-legend">
        <header><h3>دسترسی‌های محتوا یعنی چه؟</h3></header>
        <ul>{STAFF_PERMISSIONS.map((p) => <li key={p.id}><b>{p.label}:</b> {p.hint}</li>)}</ul>
      </section>
    </div>
  );
}
