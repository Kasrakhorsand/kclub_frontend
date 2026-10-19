/** Persian number formatting and Jalali (Solar Hijri) date labels. */
import { format as jFormat } from "date-fns-jalali";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Convert Latin digits to Persian digits. */
export const fa = (v: string | number) =>
  String(v).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

/** Group thousands and convert to Persian digits. */
export const faNum = (n: number) => fa(n.toLocaleString("en-US").replace(/,/g, "٬"));

/** Amount with the currency, e.g. "۴۵۰٬۰۰۰ تومان". */
export const toman = (n: number) => `${faNum(n)} تومان`;

export const pad2 = (n: number) => String(n).padStart(2, "0");

/** Hour label like ۱۸:۰۰ */
export const hm = (h: number) => fa(`${pad2(h % 24)}:00`);

/** yyyy-MM-dd key in local time */
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** Parse a day key back to local midnight. */
export const fromKey = (k: string) => new Date(`${k}T00:00:00`);

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
/** Persian weekday name, e.g. "یکشنبه". */
export const weekday = (k: string) => WEEKDAYS[fromKey(k).getDay()];
/** Jalali day of month, e.g. "۲۶". */
export const jDay = (k: string) => fa(jFormat(fromKey(k), "d"));
/** Jalali month name, e.g. "مهر". */
export const jMonth = (k: string) => jFormat(fromKey(k), "MMMM");
/** e.g. "یکشنبه ۲۶ مهر". */
export const jFull = (k: string) => `${weekday(k)} ${jDay(k)} ${jMonth(k)}`;
/** e.g. "۱۴۰۵/۰۷/۲۶". */
export const jDate = (k: string) => fa(jFormat(fromKey(k), "yyyy/MM/dd"));

/** Convert Persian digits to Latin digits (for phone numbers and codes typed on a Persian keyboard). */
export const toLatinDigits = (s: string) => s.replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));

/**
 * Time left until a session starts, e.g. "۲ روز و ۳ ساعت", "۴ ساعت و ۱۰ دقیقه",
 * "۱۵ دقیقه"; null once it has started.
 */
export function timeUntil(date: string, hour: number, now = Date.now()) {
  const ms = new Date(`${date}T${pad2(hour)}:00:00`).getTime() - now;
  if (ms <= 0) return null;
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days) return hours ? `${fa(days)} روز و ${fa(hours)} ساعت` : `${fa(days)} روز`;
  if (hours) return mins ? `${fa(hours)} ساعت و ${fa(mins)} دقیقه` : `${fa(hours)} ساعت`;
  return `${fa(Math.max(1, mins))} دقیقه`;
}

/** Greeting for the time of day. */
export const greeting = (hour = new Date().getHours()) =>
  hour < 5 ? "شب بخیر" : hour < 12 ? "صبح بخیر" : hour < 17 ? "روز بخیر" : hour < 21 ? "عصر بخیر" : "شب بخیر";
