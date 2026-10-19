"use client";
/** Profile — every role: personal details and the password that enables password login. */
import { PASSWORD_MIN } from "@/engine/auth/password";
import { useSetPassword } from "@/engine/auth/useSetPassword";
import { fa } from "@/engine/format";
import { useSession } from "@/engine/store";
import { toast } from "@/ui/kit/Toast";
import { PageHead } from "@/ui/panel/shell/PageHead";

const ErrorText = ({ children }: { children?: string }) =>
  children ? <span className="small" role="alert" style={{ color: "var(--busy)" }}>{children}</span> : null;

/** Set or change the password; without one the user signs in with SMS codes only. */
function PasswordCard() {
  const pw = useSetPassword();
  const errors = pw.form.formState.errors;
  if (pw.hasPassword === null) return <div className="card"><p className="muted small">در حال بارگذاری…</p></div>;

  return (
    <form className="card stack" onSubmit={pw.submit}>
      <h3>{pw.hasPassword ? "تغییر رمز عبور" : "گذاشتن رمز عبور"}</h3>
      <p className="small muted">
        {pw.hasPassword
          ? "ورود هم با رمز عبور و هم با کد پیامکی ممکن است."
          : "الان فقط با کد پیامکی وارد می‌شوید. با گذاشتن رمز، ورود با رمز هم فعال می‌شود."}
      </p>
      {pw.needsCurrent && (
        <label className="f">
          رمز فعلی
          <input className="input ltr" type="password" autoComplete="current-password" {...pw.form.register("current")} />
          <ErrorText>{errors.current?.message}</ErrorText>
        </label>
      )}
      <label className="f">
        رمز جدید
        <input className="input ltr" type="password" autoComplete="new-password" {...pw.form.register("password")} />
        <span className="xs muted">حداقل {fa(PASSWORD_MIN)} کاراکتر، شامل حرف و عدد</span>
        <ErrorText>{errors.password?.message}</ErrorText>
      </label>
      <label className="f">
        تکرار رمز جدید
        <input className="input ltr" type="password" autoComplete="new-password" {...pw.form.register("confirm")} />
        <ErrorText>{errors.confirm?.message}</ErrorText>
      </label>
      <ErrorText>{pw.error}</ErrorText>
      {pw.saved && <span className="small" role="status" style={{ color: "var(--free)" }}>رمز عبور ذخیره شد.</span>}
      <div><button className="btn" type="submit" disabled={pw.busy}>{pw.busy ? "در حال ذخیره…" : "ذخیره‌ی رمز"}</button></div>
    </form>
  );
}

export function ProfileView() {
  const user = useSession((s) => s.user)!;
  const role = useSession((s) => s.role);
  return (
    <>
      <PageHead title="پروفایل" />
      <div className="grid cols2e" style={{ alignItems: "start" }}>
        <div className="card stack">
          <h3>اطلاعات شخصی</h3>
          <label className="f">نام<input className="input" defaultValue={user.first} /></label>
          <label className="f">نام خانوادگی<input className="input" defaultValue={user.last} /></label>
          <label className="f">موبایل<input className="input ltr" defaultValue={user.phone} disabled /></label>
          {role === "player" && (
            <label className="f">
              سطح بازی
              <select className="input"><option>مبتدی</option><option>متوسط</option><option>پیشرفته</option></select>
            </label>
          )}
          <div><button className="btn" onClick={() => toast("پروفایل ذخیره شد")}>ذخیره</button></div>
        </div>
        <PasswordCard />
      </div>
    </>
  );
}
