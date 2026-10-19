/** Password rules shared by sign-in, set-password and change-password forms. */
import { z } from "zod";

export const PASSWORD_MIN = 8;

/** At least 8 characters with at least one letter and one digit. */
export const passwordRule = z
  .string()
  .min(PASSWORD_MIN, `رمز عبور حداقل ${PASSWORD_MIN.toLocaleString("fa-IR")} کاراکتر باشد`)
  .regex(/[A-Za-z؀-ۿ]/, "رمز عبور باید حرف داشته باشد")
  .regex(/[0-9۰-۹]/, "رمز عبور باید عدد داشته باشد");
