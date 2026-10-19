"use client";
/**
 * Phone + SMS code login as a small state machine:
 * phone → otp → (existing user: done) | (new number: register → done).
 * After login the user goes to `afterLogin` (e.g. checkout) or the panel.
 * The UI renders the step; inputs bind to `phoneForm` / `nameForm` (react-hook-form).
 */
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sendOtp, verifyOtp } from "@/engine/api";
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
const nameSchema = z.object({
  first: z.string().min(2, "نام را وارد کنید"),
  last: z.string().min(2, "نام خانوادگی را وارد کنید"),
});

export type LoginStep = "phone" | "otp" | "register";

export function useOtpLogin() {
  const router = useRouter();
  const setUser = useSession((s) => s.setUser);
  const afterLogin = useSession((s) => s.afterLogin);
  const setAfterLogin = useSession((s) => s.setAfterLogin);

  const [step, setStep] = useState<LoginStep>("phone");
  const [phone, setPhone] = useState("");
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
  const nameForm = useForm<{ first: string; last: string }>({ resolver: zodResolver(nameSchema) });

  const finish = (user: User) => {
    setUser(user);
    const to = afterLogin ?? DEFAULT_AFTER_LOGIN;
    setAfterLogin(null);
    router.push(to);
  };

  return {
    step,
    phone,
    code,
    /** Keeps digits only (Persian or Latin). */
    setCode: (value: string) => setCodeRaw(value.replace(/[^0-9۰-۹]/g, "").slice(0, CODE_LENGTH)),
    error,
    busy,
    /** Seconds left before "resend" is allowed; 0 when allowed. */
    resendIn,
    phoneForm,
    nameForm,

    /** Step 1: validate the phone and send the code. */
    submitPhone: phoneForm.handleSubmit(async ({ phone: valid }) => {
      setBusy(true);
      await sendOtp(valid);
      setBusy(false);
      setPhone(valid);
      setResendIn(RESEND_SECONDS);
      setStep("otp");
    }),

    /** Step 2: check the code; known users are logged in, new numbers go to register. */
    submitCode: async (e?: { preventDefault(): void }) => {
      e?.preventDefault();
      setError("");
      const latin = toLatinDigits(code);
      if (latin.length !== CODE_LENGTH) return setError(`کد باید ${fa(CODE_LENGTH)} رقم باشد`);
      setBusy(true);
      try {
        const result = await verifyOtp(phone, latin);
        if (result.user) finish(result.user);
        else setStep("register");
      } catch (ex) {
        setError((ex as Error).message);
      } finally {
        setBusy(false);
      }
    },

    resend: async () => {
      setError("");
      setCodeRaw("");
      await sendOtp(phone);
      setResendIn(RESEND_SECONDS);
    },

    changePhone: () => setStep("phone"),

    /** Step 3 (new numbers): create the account with first and last name. */
    submitName: nameForm.handleSubmit(({ first, last }) => finish({ phone, first, last, roles: ["player"], wallet: 0 })),
  };
}
