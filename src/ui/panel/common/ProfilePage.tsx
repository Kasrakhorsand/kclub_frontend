"use client";
/**
 * Profile — every role (/panel/profile): identity header, personal details
 * (name, optional email and national ID; the phone is the login), sign-in methods, and
 * setting or changing the password. Styles: common.css ("pf-").
 */
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import clsx from "clsx";
import { PASSWORD_MIN, passwordStrength } from "@/engine/auth/password";
import { useProfile } from "@/engine/auth/useProfile";
import { useSetPassword } from "@/engine/auth/useSetPassword";
import { ROLE_FA } from "@/engine/panel/menus";
import { fa } from "@/engine/format";
import { SITE } from "@/config/site";
import { Button3D } from "@/ui/kit/Buttons";
import { Icon3D } from "@/ui/kit/Icon3D";
import { PageHead } from "@/ui/panel/shell/PageHead";

const ErrorText = ({ children }: { children?: string }) =>
  children ? <span className="pf-err" role="alert">{children}</span> : null;

/** "0912 123 4567" in Persian digits. */
const prettyPhone = (p: string) => fa(p.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3"));

/** Password input with a show/hide toggle. */
function PasswordInput({ label, autoComplete, field, error }: { label: string; autoComplete: string; field: object; error?: string }) {
  const [shown, setShown] = useState(false);
  return (
    <label className="f">
      {label}
      <span className="pf-pass">
        <input className="input ltr" type={shown ? "text" : "password"} autoComplete={autoComplete} {...field} />
        <button type="button" onClick={() => setShown(!shown)} aria-label={shown ? "پنهان کردن رمز" : "نمایش رمز"}>{shown ? "پنهان" : "نمایش"}</button>
      </span>
      <ErrorText>{error}</ErrorText>
    </label>
  );
}

function IdentityHeader() {
  const { user } = useProfile();
  if (!user) return null;
  return (
    <section className="pf-hero">
      <img className="pf-emb" src={SITE.logo.emblem} alt="" aria-hidden="true" />
      <span className="pf-avatar" aria-hidden="true">{user.first[0]}</span>
      <div className="pf-who">
        <h2>{user.first} {user.last}</h2>
        <p dir="ltr">{prettyPhone(user.phone)}</p>
        <div className="pf-roles">
          {user.roles.map((r) => <span key={r}>{ROLE_FA[r]}</span>)}
          {user.vip && <span className="vip">VIP</span>}
        </div>
      </div>
    </section>
  );
}

function DetailsCard() {
  const p = useProfile();
  const errors = p.form.formState.errors;
  if (!p.user) return null;
  return (
    <form className="pf-card" onSubmit={p.submit}>
      <header>
        <Icon3D name="user" />
        <div>
          <h3>اطلاعات شخصی</h3>
          <p>نام شما روی رزروها و رسیدها نوشته می‌شود.</p>
        </div>
      </header>
      <div className="pf-grid">
        <label className="f">
          نام
          <input className="input" autoComplete="given-name" {...p.form.register("first")} />
          <ErrorText>{errors.first?.message}</ErrorText>
        </label>
        <label className="f">
          نام خانوادگی
          <input className="input" autoComplete="family-name" {...p.form.register("last")} />
          <ErrorText>{errors.last?.message}</ErrorText>
        </label>
      </div>
      <label className="f">
        ایمیل <span className="pf-opt">(اختیاری)</span>
        <input className="input ltr" type="email" autoComplete="email" placeholder="name@example.com" {...p.form.register("email")} />
        <ErrorText>{errors.email?.message}</ErrorText>
      </label>
      <label className="f">
        کد ملی <span className="pf-opt">(برای صدور فاکتور رسمی و ثبت در مسابقات)</span>
        <input className="input ltr" inputMode="numeric" maxLength={10} autoComplete="off" placeholder="۰۰۱۲۳۴۵۶۷۸" {...p.form.register("nationalId")} />
        <ErrorText>{errors.nationalId?.message}</ErrorText>
      </label>
      <label className="f">
        شماره موبایل
        <span className="pf-locked">
          <input className="input ltr" value={prettyPhone(p.user.phone)} readOnly aria-readonly="true" />
          <small>نام کاربری ورود شماست؛ برای تغییرش با پذیرش تماس بگیرید.</small>
        </span>
      </label>
      <ErrorText>{p.error}</ErrorText>
      <footer>
        {p.saved && !p.dirty && <span className="pf-ok" role="status">ذخیره شد</span>}
        <Button3D type="submit" disabled={p.busy || !p.dirty}>{p.busy ? "در حال ذخیره…" : "ذخیره‌ی تغییرات"}</Button3D>
      </footer>
    </form>
  );
}

function SecurityCard() {
  const pw = useSetPassword();
  const errors = pw.form.formState.errors;
  const strength = passwordStrength(pw.form.watch("password") ?? "");

  return (
    <form className="pf-card" onSubmit={pw.submit}>
      <header>
        <Icon3D name="lock" />
        <div>
          <h3>ورود و امنیت</h3>
          <p>ورود با کد پیامکی همیشه فعال است؛ با گذاشتن رمز، ورود با رمز هم ممکن می‌شود.</p>
        </div>
      </header>

      <ul className="pf-methods">
        <li className="on">
          <Icon3D name="phone" />
          <span><b>کد پیامکی</b><small>فعال</small></span>
        </li>
        <li className={clsx(pw.hasPassword && "on")}>
          <Icon3D name="lock" />
          <span><b>رمز عبور</b><small>{pw.hasPassword === null ? "…" : pw.hasPassword ? "فعال" : "تنظیم نشده"}</small></span>
        </li>
      </ul>

      {pw.hasPassword !== null && (
        <>
          <h4 className="pf-sub">{pw.hasPassword ? "تغییر رمز عبور" : "گذاشتن رمز عبور"}</h4>
          {pw.needsCurrent && <PasswordInput label="رمز فعلی" autoComplete="current-password" field={pw.form.register("current")} error={errors.current?.message} />}
          {pw.hasPassword && !pw.needsCurrent && <p className="pf-note">با کد پیامکی وارد شده‌اید، پس رمز فعلی لازم نیست.</p>}
          <PasswordInput label="رمز جدید" autoComplete="new-password" field={pw.form.register("password")} error={errors.password?.message} />
          <div className={clsx("pf-meter", `s${strength.score}`)} aria-live="polite">
            <span><i /><i /><i /><i /></span>
            <small>{strength.label || `حداقل ${fa(PASSWORD_MIN)} کاراکتر، شامل حرف و عدد`}</small>
          </div>
          <PasswordInput label="تکرار رمز جدید" autoComplete="new-password" field={pw.form.register("confirm")} error={errors.confirm?.message} />
          <ErrorText>{pw.error}</ErrorText>
          <footer>
            {pw.saved && <span className="pf-ok" role="status">رمز عبور ذخیره شد</span>}
            <Button3D type="submit" disabled={pw.busy}>{pw.busy ? "در حال ذخیره…" : pw.hasPassword ? "تغییر رمز" : "ذخیره‌ی رمز"}</Button3D>
          </footer>
        </>
      )}
    </form>
  );
}

export function ProfileView() {
  return (
    <div className="pf">
      <PageHead title="پروفایل و رمز عبور" />
      <IdentityHeader />
      <div className="pf-cols">
        <DetailsCard />
        <SecurityCard />
      </div>
    </div>
  );
}
