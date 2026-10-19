"use client";
/** K Club login card: phone, SMS code and one-step sign-up, driven by the engine's useOtpLogin. */
import { fa } from "@/engine/format";
import { CODE_LENGTH, useOtpLogin } from "@/engine/auth/useOtpLogin";
import { Button3D } from "@/ui/kit/Buttons";

const ErrorText = ({ children }: { children?: string }) =>
  children ? <span className="small" style={{ color: "var(--busy)" }}>{children}</span> : null;

export function LoginPage() {
  const login = useOtpLogin();
  const nameErrors = login.nameForm.formState.errors;

  return (
    <main className="auth">
      <div className="card stack-l">
        {login.step === "phone" && (
          <form className="stack" onSubmit={login.submitPhone}>
            <h2>ورود یا ثبت‌نام</h2>
            <p className="small muted">شماره‌ی موبایل را وارد کنید تا کد تأیید پیامک شود.</p>
            <label className="f" htmlFor="ph">
              شماره موبایل
              <input id="ph" className="input ltr" inputMode="numeric" autoComplete="tel" placeholder="09121234567" {...login.phoneForm.register("phone")} />
            </label>
            <ErrorText>{login.phoneForm.formState.errors.phone?.message}</ErrorText>
            <Button3D type="submit" block disabled={login.busy}>{login.busy ? "در حال ارسال…" : "دریافت کد"}</Button3D>
            <p className="xs muted">نمونه برای تست: ۰۹۱۲۱۲۳۴۵۶۷ بازیکن، ۰۹۱۲۰۰۰۰۰۰۱ منشی، ۰۹۱۲۰۰۰۰۰۰۲ ادمین · هر کد ۵ رقمی</p>
          </form>
        )}

        {login.step === "otp" && (
          <form className="stack" onSubmit={login.submitCode}>
            <h2>کد تأیید</h2>
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
              <button type="button" className="btn ghost sm" disabled={login.resendIn > 0} onClick={login.resend}>
                {login.resendIn > 0 ? `ارسال دوباره تا ${fa(login.resendIn)} ثانیه` : "ارسال دوباره‌ی کد"}
              </button>
            </div>
          </form>
        )}

        {login.step === "register" && (
          <form className="stack" onSubmit={login.submitName}>
            <h2>خوش آمدید</h2>
            <p className="small muted">برای ساخت حساب فقط نام و نام خانوادگی لازم است.</p>
            <label className="f">نام<input className="input" {...login.nameForm.register("first")} /></label>
            <label className="f">نام خانوادگی<input className="input" {...login.nameForm.register("last")} /></label>
            <ErrorText>{nameErrors.first?.message ?? nameErrors.last?.message}</ErrorText>
            <Button3D type="submit" block>ساخت حساب</Button3D>
          </form>
        )}
      </div>
    </main>
  );
}
