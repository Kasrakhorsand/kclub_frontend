"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sendOtp, verifyOtp } from "@/lib/api";
import { useSession } from "@/lib/store";
import { fa } from "@/lib/format";
import { Button3D } from "@/components/ui/Buttons";
import type { User } from "@/lib/types";

const toLatin = (s: string) => s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
const phoneSchema = z.object({ phone: z.string().transform(toLatin).pipe(z.string().regex(/^09\d{9}$/, "شماره موبایل را به شکل ۰۹۱۲۱۲۳۴۵۶۷ وارد کنید")) });
const nameSchema = z.object({ first: z.string().min(2, "نام را وارد کنید"), last: z.string().min(2, "نام خانوادگی را وارد کنید") });

export default function LoginPage() {
  const router = useRouter();
  const { setUser, afterLogin, setAfterLogin } = useSession();
  const [step, setStep] = useState<"phone" | "otp" | "register">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const pf = useForm<{ phone: string }>({ resolver: zodResolver(phoneSchema) });
  const nf = useForm<{ first: string; last: string }>({ resolver: zodResolver(nameSchema) });

  const finish = (u: User) => {
    setUser(u);
    const to = afterLogin ?? "/panel";
    setAfterLogin(null);
    router.push(to);
  };

  return (
    <main className="auth">
      <div className="card stack-l">
        {step === "phone" && (
          <form
            className="stack"
            onSubmit={pf.handleSubmit(async ({ phone }) => {
              setBusy(true);
              await sendOtp(phone);
              setBusy(false);
              setPhone(phone);
              setStep("otp");
            })}
          >
            <h2>ورود یا ثبت‌نام</h2>
            <p className="small muted">شماره‌ی موبایل را وارد کنید تا کد تأیید پیامک شود.</p>
            <label className="f" htmlFor="ph">شماره موبایل
              <input id="ph" className="input ltr" inputMode="numeric" autoComplete="tel" placeholder="09121234567" {...pf.register("phone")} />
            </label>
            {pf.formState.errors.phone && <span className="small" style={{ color: "var(--busy)" }}>{pf.formState.errors.phone.message}</span>}
            <Button3D type="submit" block disabled={busy}>{busy ? "در حال ارسال…" : "دریافت کد"}</Button3D>
            <p className="xs muted">نمونه برای تست: ۰۹۱۲۱۲۳۴۵۶۷ بازیکن، ۰۹۱۲۰۰۰۰۰۰۱ منشی، ۰۹۱۲۰۰۰۰۰۰۲ ادمین · هر کد ۵ رقمی</p>
          </form>
        )}
        {step === "otp" && (
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setErr("");
              try {
                setBusy(true);
                const r = await verifyOtp(phone, toLatin(code));
                setBusy(false);
                if (r.user) finish(r.user);
                else setStep("register");
              } catch (ex) {
                setBusy(false);
                setErr((ex as Error).message);
              }
            }}
          >
            <h2>کد تأیید</h2>
            <p className="small muted">کد ۵ رقمی ارسال‌شده به {fa(phone)} را وارد کنید.</p>
            <input className="input otp" inputMode="numeric" maxLength={5} value={code} onChange={(e) => setCode(e.target.value)} autoFocus aria-label="کد تأیید" />
            {err && <span className="small" style={{ color: "var(--busy)" }}>{err}</span>}
            <Button3D type="submit" block disabled={busy}>تأیید و ورود</Button3D>
            <button type="button" className="btn ghost sm" onClick={() => setStep("phone")}>تغییر شماره</button>
          </form>
        )}
        {step === "register" && (
          <form className="stack" onSubmit={nf.handleSubmit(({ first, last }) => finish({ phone, first, last, roles: ["player"], wallet: 0 }))}>
            <h2>خوش آمدید</h2>
            <p className="small muted">برای ساخت حساب فقط نام و نام خانوادگی لازم است.</p>
            <label className="f">نام<input className="input" {...nf.register("first")} /></label>
            <label className="f">نام خانوادگی<input className="input" {...nf.register("last")} /></label>
            {(nf.formState.errors.first || nf.formState.errors.last) && (
              <span className="small" style={{ color: "var(--busy)" }}>{nf.formState.errors.first?.message ?? nf.formState.errors.last?.message}</span>
            )}
            <Button3D type="submit" block>ساخت حساب</Button3D>
          </form>
        )}
      </div>
    </main>
  );
}
