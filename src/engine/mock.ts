/**
 * Sample data used until the real backend is connected.
 * Everything here is replaceable by API calls in `api.ts`.
 */
import type { Audit, Booking, Coach, Notif, SupportTicket, Ticket, Tx, User } from "@/engine/types";
import { COURTS, HOURS, priceOf } from "@/engine/venue";
import { addDays, dayKey } from "@/engine/format";

export const USERS: Record<string, User> = {
  "09121234567": { phone: "09121234567", first: "علی", last: "رضایی", roles: ["player"], wallet: 1_200_000 },
  "09125556677": { phone: "09125556677", first: "سارا", last: "محمدی", roles: ["player"], wallet: 3_500_000, vip: true },
  "09120000001": { phone: "09120000001", first: "مریم", last: "احمدی", roles: ["secretary"], wallet: 0 },
  "09120000002": { phone: "09120000002", first: "مدیر", last: "مجموعه", roles: ["admin", "secretary"], wallet: 0 },
};

const NAMES = [
  "علی رضایی", "محمد حسینی", "نیما کاظمی", "سارا محمدی", "امیر جعفری", "الهام نوری", "کیان شریفی", "مهسا رحیمی",
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
  { id: "c1", name: "کیان شریفی", title: "سرمربی پدل · بازیکن تیم ملی", level: "head", games: ["padel"], years: 8, students: 210, satisfaction: 96, rating: 4.9, reviews: 74, tags: ["پیشرفته", "تاکتیک دونفره", "مدرک FIP"], price: 950_000, groupPrice: 400_000, gender: "male", published: true, order: 1,
    bio: "بازیکن سابق تیم ملی پدل. روی تاکتیک بازی دونفره، جای‌گیری کنار دیواره و آمادگی مسابقه کار می‌کند.", certificates: ["مربیگری سطح ۳ FIP", "داوری فدراسیون تنیس"],
    schedule: [{ day: 0, from: 16, to: 21 }, { day: 2, from: 16, to: 21 }, { day: 4, from: 9, to: 13 }] },
  { id: "c2", name: "نیلوفر احمدی", title: "مربی پدل · سطح ۲ فدراسیون", level: "coach", games: ["padel"], years: 6, students: 158, satisfaction: 94, rating: 4.8, reviews: 51, tags: ["مبتدی تا متوسط", "بانوان", "کار با دیواره"], price: 750_000, groupPrice: 300_000, gender: "female", published: true, order: 2,
    bio: "کلاس‌های مبتدی و متوسط، با تمرکز روی ضربه‌های پایه و بازی با دیواره. کلاس ویژه‌ی بانوان دارد.", certificates: ["مربیگری سطح ۲ فدراسیون"],
    schedule: [{ day: 1, from: 9, to: 12 }, { day: 3, from: 17, to: 21 }] },
  { id: "c3", name: "آرش طاهری", title: "مربی پدل · آمادگی مسابقه", level: "coach", games: ["padel", "tennis"], years: 5, students: 120, satisfaction: 93, rating: 4.7, reviews: 38, tags: ["متوسط", "سرویس و اسمش", "آمادگی جسمانی"], price: 700_000, gender: "male", published: true, order: 3,
    bio: "آماده‌سازی برای مسابقه: سرویس، اسمش و آمادگی جسمانی. تنیس ساحلی هم تدریس می‌کند.",
    schedule: [{ day: 0, from: 8, to: 12 }, { day: 5, from: 8, to: 12 }] },
  { id: "c4", name: "مهسا رحیمی", title: "مربی پدل · کودکان و نوجوانان", level: "junior", games: ["padel", "volley"], years: 4, students: 95, satisfaction: 97, rating: 4.9, reviews: 29, tags: ["کودکان ۸ تا ۱۶", "مبتدی", "کلاس گروهی"], price: 600_000, groupPrice: 250_000, gender: "female", published: true, order: 4,
    bio: "کلاس گروهی کودکان و نوجوانان با بازی و تمرین‌های هماهنگی. والیبال ساحلی نوجوانان هم دارد.",
    schedule: [{ day: 1, from: 16, to: 19 }, { day: 3, from: 16, to: 19 }, { day: 5, from: 10, to: 13 }] },
];


/** Day key `n` days from today (negative = past). */
const k = (n: number) => dayKey(addDays(new Date(), n));
export const TXS: Tx[] = [
  { id: "TX-1", date: k(-1), phone: "09121234567", type: "charge", amount: 1_000_000, desc: "شارژ کیف پول", method: "درگاه", actor: "کاربر" },
  { id: "TX-2", date: k(-2), phone: "09121234567", type: "pay", amount: -800_000, desc: "رزرو پدل ۲ · ۱۸:۰۰", method: "کیف پول", actor: "کاربر" },
  { id: "TX-3", date: k(-3), phone: "09125556677", type: "refund", amount: 400_000, desc: "بازگشت وجه لغو ساحلی ۱", method: "کیف پول", actor: "سیستم" },
  { id: "TX-4", date: k(0), phone: "09125556677", type: "pay", amount: -600_000, desc: "رزرو ساحلی ۳ · ۱۹:۰۰", method: "کارتخوان", actor: "منشی: مریم احمدی" },
  { id: "TX-5", date: k(0), phone: "09121234567", type: "charge", amount: 500_000, desc: "شارژ حضوری", method: "کارتخوان", actor: "منشی: مریم احمدی" },
  { id: "TX-6", date: k(-5), phone: "09121234567", type: "pay", amount: -500_000, desc: "رزرو پدل ۱ · ۱۰:۰۰", method: "کیف پول", actor: "کاربر" },
  { id: "TX-7", date: k(-8), phone: "09121234567", type: "refund", amount: 600_000, desc: "بازگشت وجه لغو ساحلی ۲", method: "کیف پول", actor: "سیستم" },
  { id: "TX-8", date: k(-9), phone: "09121234567", type: "pay", amount: -600_000, desc: "رزرو ساحلی ۲ · ۲۰:۰۰", method: "کیف پول", actor: "کاربر" },
  { id: "TX-9", date: k(-12), phone: "09121234567", type: "charge", amount: 2_000_000, desc: "شارژ کیف پول", method: "درگاه", actor: "کاربر" },
  { id: "TX-10", date: k(-15), phone: "09121234567", type: "pay", amount: -1_000_000, desc: "رزرو پدل ۳ · ۲۱:۰۰ + ۲ راکت", method: "کیف پول", actor: "کاربر" },
  { id: "TX-11", date: k(-21), phone: "09121234567", type: "pay", amount: -800_000, desc: "رزرو پدل ۲ · ۱۹:۰۰", method: "درگاه", actor: "کاربر" },
];
export const TICKETS: Ticket[] = [
  { id: "T-1042", phone: "09121234567", title: "روشنایی زمین پدل ۳ کم است", status: "answered", category: "facility", date: k(-4), messages: [{ by: "user", text: "دیشب نور زمین ۳ کم بود.", time: "22:10" }, { by: "staff", text: "ممنون از گزارش؛ لامپ‌ها تعویض شد.", time: "10:35", date: k(-3) }] },
  { id: "T-1051", phone: "09125556677", title: "اضافه شدن نوشیدنی ورزشی به منوی کافه", status: "open", category: "other", date: k(0), messages: [{ by: "user", text: "امکانش هست نوشیدنی ورزشی هم داشته باشید؟", time: "09:20" }] },
  { id: "T-1053", phone: "09121234567", title: "درخواست بازگشت کامل وجه", status: "escalated", category: "payment", date: k(-1), messages: [{ by: "user", text: "۵ ساعت قبل لغو کردم. امکان بازگشت کامل هست؟", time: "18:05" }, { by: "staff", text: "درخواست شما برای تصمیم به مدیریت ارجاع شد.", time: "18:40" }] },
];
export const NOTIFS: Notif[] = [
  { id: "n1", kind: "booking", title: "یادآوری رزرو", text: "فردا ساعت ۱۸ زمین پدل ۲ برای شما رزرو شده است.", read: false, date: k(0), time: "09:00", href: "/panel/res" },
  { id: "n2", kind: "booking", title: "رزرو تکراری ثبت شد", text: "۴ جلسه پدل، شنبه‌ها ساعت ۱۹ تا ۲۰.", read: false, date: k(-1), time: "20:14", href: "/panel/res" },
  { id: "n4", kind: "ticket", title: "پاسخ تیکت", text: "پذیرش به تیکت «روشنایی زمین پدل ۳ کم است» پاسخ داد.", read: false, date: k(-3), time: "10:35", href: "/panel/tickets" },
  { id: "n3", kind: "wallet", title: "شارژ کیف پول", text: "کیف پول شما توسط منشی ۱٬۰۰۰٬۰۰۰ تومان شارژ شد.", read: true, date: k(-2), time: "17:42", href: "/panel/wallet" },
  { id: "n5", kind: "wallet", title: "بازگشت وجه", text: "۶۰۰٬۰۰۰ تومان بابت لغو رزرو ساحلی ۲ به کیف پول برگشت.", read: true, date: k(-8), time: "12:03", href: "/panel/wallet" },
  { id: "n6", kind: "system", title: "ساعت کاری جدید", text: "از هفته‌ی آینده زمین‌ها از ساعت ۷ صبح باز هستند.", read: true, date: k(-10), time: "08:00" },
];
export const AUDIT: Audit[] = [
  { date: k(0), actor: "مریم احمدی (منشی)", action: "ثبت رزرو", target: "ساحلی ۱ · ۱۰:۰۰", detail: "برای علی رضایی · کارتخوان" },
  { date: k(-1), actor: "مدیر مجموعه", action: "تغییر قیمت", target: "پدل · ۱۲ تا ۲۴", detail: "۷۵۰٬۰۰۰ ← ۸۰۰٬۰۰۰" },
  { date: k(-2), actor: "مدیر مجموعه", action: "بستن زمین", target: "پدل ۳", detail: "تعمیر چمن · ۸ تا ۱۲" },
];

/** Technical support reports (per phone), with one waiting on the player for more detail. */
export const SUPPORT: (SupportTicket & { phone: string })[] = [
  {
    id: "s1", ref: "SUP-1018", phone: "09121234567", area: "payment", severity: "major",
    subject: "بعد از پرداخت به صفحه‌ی سایت برنگشتم",
    steps: "یک سانس پدل انتخاب کردم، روی پرداخت با درگاه زدم و پرداخت را تمام کردم.",
    actual: "بانک پیام موفق داد ولی صفحه‌ی سایت باز نشد و رزرو در «رزروهای من» نیامد.",
    expected: "برگشت به سایت و نمایش کد رهگیری",
    when: "yesterday", whenTime: "21:40", refCode: "KC-48213", allowCall: true,
    status: "need_info", date: k(-1), time: "21:52", attachments: [],
    messages: [
      { by: "support", text: "سلام، گزارش شما بررسی شد. لطفاً چهار رقم آخر کارت و ساعت دقیق پرداخت را بنویسید تا تراکنش را با بانک پیگیری کنیم. اگر از صفحه‌ی بانک عکس دارید، پیوست کنید.", date: k(0), time: "09:15" },
    ],
  },
];
