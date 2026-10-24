"use client";
/** K Club login card: phone, then password or SMS code, and one-step sign-up; driven by the engine's useLogin. */
import Link from "next/link";
import { fa } from "@/engine/format";
import { CODE_LENGTH, useLogin } from "@/engine/auth/useLogin";
import { Button3D } from "@/ui/kit/Buttons";

const ErrorText = ({ children }: { children?: string }) =>
  children ? <span className="small" role="alert" style={{ color: "var(--busy)" }}>{children}</span> : null;

export function LoginPage() {
  const login = useLogin();
  const nameErrors = login.nameForm.formState.errors;

  return (
    <main className="auth">
      <div className="card stack-l">
        {login.step === "phone" && (
          <form className="stack" onSubmit={login.submitPhone}>
            <h1 className="auth-h">ورود یا ثبت‌نام</h1>
            <p className="small muted">شماره‌ی موبایل را وارد کنید. اگر رمز عبور گذاشته‌اید با رمز وارد می‌شوید، وگرنه کد تأیید پیامک می‌شود.</p>
            <label className="f" htmlFor="ph">
              شماره موبایل
              <input id="ph" className="input ltr" inputMode="numeric" autoComplete="tel" placeholder="09121234567" {...login.phoneForm.register("phone")} />
            </label>
            <ErrorText>{login.phoneForm.formState.errors.phone?.message ?? login.error}</ErrorText>
            <Button3D type="submit" block disabled={login.busy}>{login.busy ? "لطفاً صبر کنید…" : "ادامه"}</Button3D>
            <p className="xs muted">نمونه برای تست: ۰۹۱۲۱۲۳۴۵۶۷ بازیکن، ۰۹۱۲۰۰۰۰۰۰۱ منشی، ۰۹۱۲۰۰۰۰۰۰۲ ادمین · هر کد ۵ رقمی</p>
          </form>
        )}

        {login.step === "password" && (
          <form className="stack" onSubmit={login.submitPassword}>
            <h1 className="auth-h">رمز عبور</h1>
            <p className="small muted">رمز عبور حساب {fa(login.phone)} را وارد کنید.</p>
            {/* Hidden username so password managers save the right account. */}
            <input type="text" name="username" autoComplete="username" value={login.phone} readOnly hidden />
            <label className="f" htmlFor="pw">
              رمز عبور
              <input id="pw" className="input ltr" type="password" autoComplete="current-password" autoFocus {...login.passwordForm.register("password")} />
            </label>
            <ErrorText>{login.passwordForm.formState.errors.password?.message ?? login.error}</ErrorText>
            <Button3D type="submit" block disabled={login.busy}>{login.busy ? "در حال ورود…" : "ورود"}</Button3D>
            <div className="row between">
              <button type="button" className="btn ghost sm" onClick={login.changePhone}>تغییر شماره</button>
              <button type="button" className="btn ghost sm" onClick={login.switchToSms} disabled={login.busy}>ورود با کد پیامکی</button>
            </div>
            <p className="xs muted">رمز را فراموش کرده‌اید؟ با کد پیامکی وارد شوید و از پروفایل رمز تازه بگذارید.</p>
          </form>
        )}

        {login.step === "otp" && (
          <form className="stack" onSubmit={login.submitCode}>
            <h1 className="auth-h">کد تأیید</h1>
            <p className="small muted">کد {fa(CODE_LENGTH)} رقمی ارسال‌شده به {fa(login.phone)} را وارد کنید.</p>
            <input
              className="input otp"
              inputMode="numeric"
              maxLength={CODE_LENGTH}
              value={login.code}
              onChange={(e) => login.setCode(e.target.value)}
              autoComplete="one-time-code"
              autoFocus
              aria-label="کد تأیید"
            />
            <ErrorText>{login.error}</ErrorText>
            <Button3D type="submit" block disabled={login.busy}>تأیید و ورود</Button3D>
            <div className="row between">
              <button type="button" className="btn ghost sm" onClick={login.changePhone}>تغییر شماره</button>
              <button type="button" className="btn ghost sm" disabled={login.resendIn > 0 || login.busy} onClick={login.resend}>
                {login.resendIn > 0 ? `ارسال دوباره تا ${fa(login.resendIn)} ثانیه` : "ارسال دوباره‌ی کد"}
              </button>
            </div>
            {login.hasPassword && (
              <button type="button" className="btn ghost sm" onClick={login.switchToPassword}>ورود با رمز عبور</button>
            )}
          </form>
        )}

        {login.step === "register" && (
          <form className="stack" onSubmit={login.submitName}>
            <h1 className="auth-h">خوش آمدید</h1>
            <p className="small muted">برای ساخت حساب فقط نام و نام خانوادگی لازم است. بعداً از پروفایل می‌توانید رمز عبور هم بگذارید.</p>
            <label className="f">نام<input className="input" autoComplete="given-name" {...login.nameForm.register("first")} /></label>
            <label className="f">نام خانوادگی<input className="input" autoComplete="family-name" {...login.nameForm.register("last")} /></label>
            <ErrorText>{nameErrors.first?.message ?? nameErrors.last?.message}</ErrorText>
            <Button3D type="submit" block>ساخت حساب</Button3D>
          </form>
        )}
        <p className="xs muted legal-note">ورود یا ساخت حساب یعنی پذیرش <Link href="/terms">قوانین</Link> و <Link href="/privacy">حریم خصوصی</Link> کی کلاب.</p>
      </div>
    </main>
  );
}
