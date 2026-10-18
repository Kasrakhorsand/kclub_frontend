import { format as jFormat } from "date-fns-jalali";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Convert Latin digits to Persian digits. */
export const fa = (v: string | number) =>
  String(v).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

/** Group thousands and convert to Persian digits. */
export const faNum = (n: number) => fa(n.toLocaleString("en-US").replace(/,/g, "٬"));

export const toman = (n: number) => `${faNum(n)} تومان`;

export const pad2 = (n: number) => String(n).padStart(2, "0");

/** Hour label like ۱۸:۰۰ */
export const hm = (h: number) => fa(`${pad2(h % 24)}:00`);

/** yyyy-MM-dd key in local time */
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const fromKey = (k: string) => new Date(`${k}T00:00:00`);

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
export const weekday = (k: string) => WEEKDAYS[fromKey(k).getDay()];
export const jDay = (k: string) => fa(jFormat(fromKey(k), "d"));
export const jMonth = (k: string) => jFormat(fromKey(k), "MMMM");
export const jFull = (k: string) => `${weekday(k)} ${jDay(k)} ${jMonth(k)}`;
export const jDate = (k: string) => fa(jFormat(fromKey(k), "yyyy/MM/dd"));
