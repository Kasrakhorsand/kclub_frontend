/**
 * Sample data used until the real backend is connected.
 * Everything here is replaceable by API calls in `api.ts`.
 */
import type { Audit, Booking, Coach, Notif, Ticket, Tx, User } from "@/modules/core/types";
import { COURTS, HOURS, priceOf } from "@/modules/core/venue";
import { addDays, dayKey } from "@/modules/core/format";

export const USERS: Record<string, User> = {
  "09121234567": { phone: "09121234567", first: "علی", last: "رضایی", roles: ["player"], wallet: 1_200_000 },
  "09125556677": { phone: "09125556677", first: "سارا", last: "محمدی", roles: ["player"], wallet: 3_500_000, vip: true },
  "09120000001": { phone: "09120000001", first: "مریم", last: "احمدی", roles: ["secretary"], wallet: 0 },
  "09120000002": { phone: "09120000002", first: "مدیر", last: "مجموعه", roles: ["admin", "secretary"], wallet: 0 },
};

const NAMES = [
  "محمد حسینی", "نیما کاظمی", "سارا محمدی", "امیر جعفری", "الهام نوری", "کیان شریفی", "مهسا رحیمی",
  "پویا اکبری", "هستی کریمی", "بهراد صالحی", "نگار موسوی", "آرش طاهری", "یاسمن فرهادی", "سینا مرادی",
];

/** Deterministic hash so sample bookings are stable between renders. */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}
/** Rough share of courts booked at each hour, so the sample board looks realistic. */
const occupancy = (h: number) => (h < 12 ? 0.32 : h < 17 ? 0.42 : h < 23 ? 0.78 : 0.5);

/** Deterministic sample bookings for the 14 days starting at `today` (same input, same output). */
export function seedBookings(today = new Date()): Booking[] {
  const out: Booking[] = [];
  for (let d = 0; d < 14; d++) {
    const date = dayKey(addDays(today, d));
    for (const c of COURTS) {
      for (const h of HOURS) {
        const r = hash(date + c.id + h);
        if (r < occupancy(h)) {
          const name = NAMES[Math.floor(r * 1000) % NAMES.length];
          out.push({
            id: `S-${date}-${c.id}-${h}`,
            courtId: c.id,
            date,
            hour: h,
            userPhone: "",
            userName: name,
            price: priceOf(c.sport, h),
            source: r < occupancy(h) * 0.25 ? "staff" : "online",
            status: "active",
          });
        }
      }
    }
  }
  return out;
}

export const COACHES: Coach[] = [
  { id: "c1", name: "کیان شریفی", title: "سرمربی پدل · بازیکن تیم ملی", level: "Head Coach", years: 8, students: 210, satisfaction: 96, rating: 4.9, reviews: 74, tags: ["پیشرفته", "تاکتیک دونفره", "مدرک FIP"], price: 950_000 },
  { id: "c2", name: "نیلوفر احمدی", title: "مربی پدل · سطح ۲ فدراسیون", level: "Coach", years: 6, students: 158, satisfaction: 94, rating: 4.8, reviews: 51, tags: ["مبتدی تا متوسط", "بانوان", "کار با دیواره"], price: 750_000 },
  { id: "c3", name: "آرش طاهری", title: "مربی پدل · آمادگی مسابقه", level: "Coach", years: 5, students: 120, satisfaction: 93, rating: 4.7, reviews: 38, tags: ["متوسط", "سرویس و اسمش", "آمادگی جسمانی"], price: 700_000 },
  { id: "c4", name: "مهسا رحیمی", title: "مربی پدل · کودکان و نوجوانان", level: "Junior Coach", years: 4, students: 95, satisfaction: 97, rating: 4.9, reviews: 29, tags: ["کودکان ۸ تا ۱۶", "مبتدی", "کلاس گروهی"], price: 600_000 },
];


/** Day key `n` days from today (negative = past). */
const k = (n: number) => dayKey(addDays(new Date(), n));
export const TXS: Tx[] = [
  { id: "TX-1", date: k(-1), phone: "09121234567", type: "charge", amount: 1_000_000, desc: "شارژ کیف پول", method: "درگاه", actor: "کاربر" },
  { id: "TX-2", date: k(-2), phone: "09121234567", type: "pay", amount: -800_000, desc: "رزرو پدل ۲ · ۱۸:۰۰", method: "کیف پول", actor: "کاربر" },
  { id: "TX-3", date: k(-3), phone: "09125556677", type: "refund", amount: 400_000, desc: "بازگشت وجه لغو ساحلی ۱", method: "کیف پول", actor: "سیستم" },
  { id: "TX-4", date: k(0), phone: "09125556677", type: "pay", amount: -600_000, desc: "رزرو ساحلی ۳ · ۱۹:۰۰", method: "کارتخوان", actor: "منشی: مریم احمدی" },
  { id: "TX-5", date: k(0), phone: "09121234567", type: "charge", amount: 500_000, desc: "شارژ حضوری", method: "کارتخوان", actor: "منشی: مریم احمدی" },
];
export const TICKETS: Ticket[] = [
  { id: "T-1042", phone: "09121234567", title: "روشنایی زمین پدل ۳ کم است", status: "answered", date: k(-4), messages: [{ by: "user", text: "دیشب نور زمین ۳ کم بود." }, { by: "staff", text: "ممنون از گزارش؛ لامپ‌ها تعویض شد." }] },
  { id: "T-1051", phone: "09125556677", title: "اضافه شدن نوشیدنی ورزشی به منوی کافه", status: "open", date: k(0), messages: [{ by: "user", text: "امکانش هست نوشیدنی ورزشی هم داشته باشید؟" }] },
  { id: "T-1053", phone: "09121234567", title: "درخواست بازگشت کامل وجه", status: "escalated", date: k(-1), messages: [{ by: "user", text: "۵ ساعت قبل لغو کردم. امکان بازگشت کامل هست؟" }] },
];
export const NOTIFS: Notif[] = [
  { id: "n1", title: "یادآوری رزرو", text: "فردا ساعت ۱۸ زمین پدل ۲ برای شما رزرو شده است.", read: false, date: k(0) },
  { id: "n2", title: "رزرو تکراری ثبت شد", text: "۴ جلسه پدل، شنبه‌ها ساعت ۱۹ تا ۲۰.", read: false, date: k(-1) },
  { id: "n3", title: "شارژ کیف پول", text: "کیف پول شما توسط منشی ۱٬۰۰۰٬۰۰۰ تومان شارژ شد.", read: true, date: k(-2) },
];
export const AUDIT: Audit[] = [
  { date: k(0), actor: "مریم احمدی (منشی)", action: "ثبت رزرو", target: "ساحلی ۱ · ۱۰:۰۰", detail: "برای علی رضایی · کارتخوان" },
  { date: k(-1), actor: "مدیر مجموعه", action: "تغییر قیمت", target: "پدل · ۱۲ تا ۲۴", detail: "۷۵۰٬۰۰۰ ← ۸۰۰٬۰۰۰" },
  { date: k(-2), actor: "مدیر مجموعه", action: "بستن زمین", target: "پدل ۳", detail: "تعمیر چمن · ۸ تا ۱۲" },
];
