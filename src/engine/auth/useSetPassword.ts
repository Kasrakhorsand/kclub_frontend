"use client";
/**
 * Set or change the signed-in user's password, so they can log in with
 * either the password or an SMS code. Changing needs the current password,
 * unless this session signed in with an SMS code (the "forgot password" path).
 */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { hasPassword as fetchHasPassword, setPassword } from "@/engine/api";
import { useSession } from "@/engine/store";
import { passwordRule } from "./password";

type Values = { current: string; password: string; confirm: string };

export function useSetPassword() {
  const user = useSession((s) => s.user);
  const loginMethod = useSession((s) => s.loginMethod);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) fetchHasPassword(user.phone).then(setHasPassword);
  }, [user]);

  /** An SMS login proves the phone, so the old password isn't needed. */
  const needsCurrent = !!hasPassword && loginMethod !== "otp";

  const schema = z
    .object({
      current: needsCurrent ? z.string().min(1, "رمز فعلی را وارد کنید") : z.string().optional().default(""),
      password: passwordRule,
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "تکرار رمز با رمز جدید یکی نیست" });

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { current: "", password: "", confirm: "" } });

  return {
    /** null while loading. */
    hasPassword,
    /** Show the "current password" field. */
    needsCurrent,
    form,
    error,
    saved,
    busy: form.formState.isSubmitting,
    submit: form.handleSubmit(async ({ current, password }) => {
      if (!user) return;
      setError("");
      setSaved(false);
      try {
        await setPassword(user.phone, password, needsCurrent ? current : undefined, loginMethod === "otp");
        setHasPassword(true);
        setSaved(true);
        form.reset();
      } catch (ex) {
        setError((ex as Error).message);
      }
    }),
  };
}
