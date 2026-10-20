"use client";
/**
 * Login as a small state machine. Every user can sign in with an SMS code;
 * users who set a password can also sign in with it:
 *
 *   phone ─┬─(has password)→ password ─→ done
 *          │                    └─(use SMS / forgot)→ otp
 *          └─(no password)───────────────────────→ otp ─┬─(known)→ done
 *                                                        └─(new)→ register → done
 *
 * After login the user goes to `afterLogin` (e.g. checkout) or the panel.
 * The UI renders the step; inputs bind to the react-hook-form objects.
 */
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginWithPassword, lookupPhone, register, sendOtp, verifyOtp } from "@/engine/api";
import { safeInternalPath } from "@/engine/security";
import { fa, toLatinDigits } from "@/engine/format";
import { useSession } from "@/engine/store";
import type { User } from "@/engine/types";

export const CODE_LENGTH = 5;
/** Seconds before the code can be sent again. */
export const RESEND_SECONDS = 60;
export const DEFAULT_AFTER_LOGIN = "/panel";

const phoneSchema = z.object({
  phone: z.string().transform(toLatinDigits).pipe(z.string().regex(/^09\d{9}$/, "شماره موبایل را به شکل ۰۹۱۲۱۲۳۴۵۶۷ وارد کنید")),
});
const passwordSchema = z.object({ password: z.string().min(1, "رمز عبور را وارد کنید").max(128, "رمز عبور طولانی است") });
const nameSchema = z.object({
  first: z.string().trim().min(2, "نام را وارد کنید").max(40, "نام طولانی است"),
  last: z.string().trim().min(2, "نام خانوادگی را وارد کنید").max(60, "نام خانوادگی طولانی است"),
});

export type LoginStep = "phone" | "password" | "otp" | "register";

export function useLogin() {
  const router = useRouter();
  const setUser = useSession((s) => s.setUser);
  const afterLogin = useSession((s) => s.afterLogin);
  const setAfterLogin = useSession((s) => s.setAfterLogin);

  const [step, setStep] = useState<LoginStep>("phone");
  const [phone, setPhone] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [code, setCodeRaw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Count the resend timer down once a second.
  useEffect(() => {
    if (!resendIn) return;
    const t = setTimeout(() => setResendIn(resendIn - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const phoneForm = useForm<{ phone: string }>({ resolver: zodResolver(phoneSchema) });
  const passwordForm = useForm<{ password: string }>({ resolver: zodResolver(passwordSchema) });
  const nameForm = useForm<{ first: string; last: string }>({ resolver: zodResolver(nameSchema) });

  const finish = (user: User, method: "otp" | "password") => {
    setUser(user, undefined, method);
    // Only ever continue to an in-app path (afterLogin lives in localStorage and could be tampered with).
    const to = safeInternalPath(afterLogin, DEFAULT_AFTER_LOGIN);
    setAfterLogin(null);
    router.push(to);
  };

  /** Run an async step with the busy flag and a user-facing error on failure. */
  const run = async (task: () => Promise<void>) => {
    setError("");
    setBusy(true);
    try {
      await task();
    } catch (ex) {
      setError((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const goToOtp = (target: string) =>
    run(async () => {
      await sendOtp(target);
      setCodeRaw("");
      setResendIn(RESEND_SECONDS);
      setStep("otp");
    });

  return {
    step,
    phone,
    /** The account has a password, so the password step and "use password" are available. */
    hasPassword,
    code,
    /** Keeps digits only (Persian or Latin). */
    setCode: (value: string) => setCodeRaw(value.replace(/[^0-9۰-۹]/g, "").slice(0, CODE_LENGTH)),
    error,
    busy,
    /** Seconds left before "resend" is allowed; 0 when allowed. */
    resendIn,
    phoneForm,
    passwordForm,
    nameForm,

    /** Step 1: validate the phone; accounts with a password go to the password step, others get a code. */
    submitPhone: phoneForm.handleSubmit((values) =>
      run(async () => {
        const valid = values.phone;
        setPhone(valid);
        const account = await lookupPhone(valid);
        setHasPassword(account.hasPassword);
        if (account.hasPassword) {
          passwordForm.reset();
          setStep("password");
        } else {
          await sendOtp(valid);
          setCodeRaw("");
          setResendIn(RESEND_SECONDS);
          setStep("otp");
        }
      }),
    ),

    /** Step 2a: sign in with the password. */
    submitPassword: passwordForm.handleSubmit(({ password }) =>
      run(async () => {
        finish(await loginWithPassword(phone, password), "password");
      }),
    ),

    /** Switch from the password step to an SMS code (also the "forgot password" path). */
    switchToSms: () => goToOtp(phone),

    /** Switch from the code step back to the password step. */
    switchToPassword: () => {
      setError("");
      passwordForm.reset();
      setStep("password");
    },

    /** Step 2b: check the code; known users are logged in, new numbers go to register. */
    submitCode: async (e?: { preventDefault(): void }) => {
      e?.preventDefault();
      const latin = toLatinDigits(code);
      if (latin.length !== CODE_LENGTH) return setError(`کد باید ${fa(CODE_LENGTH)} رقم باشد`);
      await run(async () => {
        const result = await verifyOtp(phone, latin);
        if (result.user) finish(result.user, "otp");
        else setStep("register");
      });
    },

    resend: () => goToOtp(phone),

    changePhone: () => {
      setError("");
      setStep("phone");
    },

    /** Step 3 (new numbers): create the account with first and last name. */
    submitName: nameForm.handleSubmit(({ first, last }) =>
      run(async () => {
        finish(await register(first.trim(), last.trim(), phone), "otp");
      }),
    ),
  };
}
