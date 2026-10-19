"use client";
/** Edit the signed-in user's name, email and national ID; the phone is the login and can't change here. */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProfile } from "@/engine/api";
import { isValidNationalId, toLatinDigits } from "@/engine/format";
import { useSession } from "@/engine/store";

const schema = z.object({
  first: z.string().trim().min(2, "نام را وارد کنید"),
  last: z.string().trim().min(2, "نام خانوادگی را وارد کنید"),
  email: z.union([z.literal(""), z.string().trim().email("ایمیل معتبر نیست")]),
  nationalId: z
    .string()
    .transform((v) => toLatinDigits(v).replace(/\D/g, ""))
    .refine((v) => v === "" || isValidNationalId(v), "کد ملی معتبر نیست"),
});

type Values = z.infer<typeof schema>;

export function useProfile() {
  const user = useSession((s) => s.user);
  const updateUser = useSession((s) => s.updateUser);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: { first: user?.first ?? "", last: user?.last ?? "", email: user?.email ?? "", nationalId: user?.nationalId ?? "" },
  });

  return {
    user,
    form,
    saved,
    error,
    busy: form.formState.isSubmitting,
    /** True when something was edited and not saved yet. */
    dirty: form.formState.isDirty,
    submit: form.handleSubmit(async (values) => {
      if (!user) return;
      setError("");
      setSaved(false);
      const patch = {
        first: values.first.trim(),
        last: values.last.trim(),
        email: values.email.trim() || undefined,
        nationalId: values.nationalId || undefined,
      };
      try {
        await updateProfile(user.phone, patch);
        updateUser(patch);
        form.reset(values);
        setSaved(true);
      } catch (ex) {
        setError((ex as Error).message);
      }
    }),
  };
}
