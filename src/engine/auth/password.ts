/** Password rules shared by sign-in, set-password and change-password forms. */
import { z } from "zod";

export const PASSWORD_MIN = 8;

/** At least 8 characters with at least one letter and one digit. */
export const passwordRule = z
  .string()
  .min(PASSWORD_MIN, `رمز عبور حداقل ${PASSWORD_MIN.toLocaleString("fa-IR")} کاراکتر باشد`)
  .max(128, "رمز عبور طولانی است")
  .regex(/[A-Za-z؀-ۿ]/, "رمز عبور باید حرف داشته باشد")
  .regex(/[0-9۰-۹]/, "رمز عبور باید عدد داشته باشد");

/** 0–4 strength score with a Persian label, for a meter under the password field. */
export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= PASSWORD_MIN) score++;
  if (pw.length >= 12) score++;
  if (/[A-Za-z؀-ۿ]/.test(pw) && /[0-9۰-۹]/.test(pw)) score++;
  if (/[^A-Za-z0-9؀-ۿ۰-۹]/.test(pw) || (/[a-z]/.test(pw) && /[A-Z]/.test(pw))) score++;
  const s = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  return { score: s, label: ["خیلی ضعیف", "ضعیف", "متوسط", "خوب", "قوی"][s] };
}
