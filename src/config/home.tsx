/**
 * Home page text, cards and lists for this club. The home components in src/ui/home only lay
 * these out; change the words, images and items here.
 */
import { CANCEL_RULES, CLOSE_HOUR, MAX_DAYS_AHEAD, OPEN_HOUR, PRICING } from "@/config/venue";
import { fa } from "@/engine/format";
import type { Icon3DName } from "@/ui/kit/icons3d";

export const HERO = {
  eyebrow: "Padel · Beach Tennis · Beach Volley",
  /** Headline: `before` <gold>highlight</gold> `after`. */
  title: { before: "زمینت را", highlight: "آنلاین", after: "رزرو کن" },
  text: "سانس خالی را ببین، زمین را روی نقشه انتخاب کن و پرداخت کن. بدون تماس و انتظار.",
  /** Background clips, played in order with a crossfade. `pos` is the CSS object-position. */
  videos: [
    { src: "/media/hero-beach-tennis.mp4", pos: "50% 55%" },
    { src: "/media/hero-padel.mp4", pos: "50% 68%" },
    { src: "/media/hero-beach-volley.mp4", pos: "50% 50%" },
  ],
  poster: "/media/hero-poster.jpg",
};

/** Stats bar at the bottom of the hero; numbers count up on first view. */
export const HERO_FACTS: { icon: Icon3DName; value: number; valueTo?: number; label: string }[] = [
  { icon: "court", value: 3, label: "زمین پدل سرپوشیده" },
  { icon: "racket", value: 3, label: "زمین تنیس ساحلی و والیبال ساحلی" },
  { icon: "clock", value: 8, valueTo: 24, label: "هر روز هفته" },
];

/** Photo cards under the hero, one per game. */
export const SPORT_CARDS = {
  eyebrow: "Choose your game",
  title: "کدام زمین، کدام بازی؟",
  note: "تنیس ساحلی و والیبال ساحلی روی همان ۳ زمین ماسه‌ای برگزار می‌شوند؛ سانس را رزرو کنید و هر کدام را بازی کنید.",
  cards: [
    { href: "/book/padel", img: "/media/card-padel.jpg", pos: "50% 60%", latin: "Padel", name: "پدل", alt: "راکت و توپ پدل روی زمین آبی", text: "۳ زمین سرپوشیده؛ ۲ چمن آبی، ۱ چمن مشکی." },
    { href: "/book/beach?game=tennis", img: "/media/card-beach-tennis.jpg", pos: "55% 40%", latin: "Beach Tennis", name: "تنیس ساحلی", alt: "بازیکن تنیس ساحلی در حال ضربه", text: "راکت و توپ نرم روی ماسه؛ سریع، پرهیجان، دونفره." },
    { href: "/book/beach?game=volley", img: "/media/card-beach-volley.jpg", pos: "82% 50%", latin: "Beach Volley", name: "والیبال ساحلی", alt: "بازیکنان والیبال ساحلی کنار تور", text: "بازی تیمی روی ماسه‌ی نرم، دو نفر در برابر دو نفر." },
  ],
};

export const ABOUT = {
  eyebrow: "The Club",
  title: "یک مجموعه، دو حال‌وهوای بازی",
  text: "کی کلاب برای کسانی ساخته شده که می‌خواهند بی‌دردسر بازی کنند: زمین را آنلاین ببینند، رزرو کنند و فقط برای بازی بیایند.",
  hours: "هر روز، ۸ صبح تا ۱۲ شب",
};

export const AMENITIES: { icon: Icon3DName; title: string; text: string }[] = [
  { icon: "roof", title: "زمین‌های سرپوشیده", text: "۳ زمین پدل در سوله؛ ۲ چمن آبی، ۱ چمن مشکی" },
  { icon: "court", title: "ماسه‌ی نرم و تمیز", text: "۳ زمین برای تنیس و والیبال ساحلی" },
  { icon: "user", title: "مربیان پدل", text: "کلاس خصوصی و گروهی" },
  { icon: "racket", title: "اجاره‌ی راکت و توپ", text: "در پذیرش مجموعه" },
  { icon: "shower", title: "رختکن و دوش", text: "تمیز و مجهز" },
  { icon: "cup", title: "کافه‌ی مجموعه", text: "قبل و بعد از بازی" },
  { icon: "park", title: "پارکینگ", text: "برای اعضا" },
  { icon: "cal", title: "رزرو آنلاین", text: "بدون تماس تلفنی" },
];

export const PRICING_SECTION = {
  eyebrow: "Pricing",
  title: "قیمت هر سانس",
  text: "صبح‌ها ارزان‌تر است. مبلغ برای کل زمین است، نه هر نفر.",
};

export const GALLERY_SECTION = { eyebrow: "Inside K Club", title: "نگاهی به مجموعه" };

export const COACHES_SECTION = { eyebrow: "Coaches", title: "با مربی‌های کی کلاب بازی را یاد بگیرید", count: 3 };

export const REVIEWS_SECTION = { eyebrow: "Players say", title: "از زبان بازیکن‌ها" };

export const HOW_TO = {
  eyebrow: "How to book",
  title: "رزرو زمین در کی کلاب، کمتر از ۲ دقیقه",
  text: "بدون تماس با باشگاه. سانس‌های خالی همین حالا روی سایت هستند و تأیید رزرو با پیامک می‌رسد.",
  steps: [
    ["رزرو زمین", <>در صفحه‌ی اصلی یا منوی بالا روی «رزرو زمین» بزنید.</>],
    ["انتخاب نوع زمین", <><b>پدل</b> (۳ زمین سرپوشیده) یا <b>ساحلی</b> (۳ زمین ماسه‌ای برای تنیس ساحلی و والیبال ساحلی).</>],
    ["انتخاب روز و سانس خالی", <>روز و ساعت را انتخاب کنید، بعد زمین دلخواه را روی نقشه‌ی مجموعه بزنید. برای بازی ثابت هفتگی، «رزرو تکراری» را انتخاب کنید.</>],
    ["ورود با کد پیامکی", <>شماره‌ی موبایل را وارد کنید تا کد یک‌بارمصرف پیامک شود. بار اول فقط نام و نام خانوادگی لازم است.</>],
    ["پرداخت و تأیید", <>با درگاه بانکی یا کیف پول پرداخت کنید. زمین تا پایان پرداخت برای شما نگه داشته می‌شود و پیامک تأیید و کد رهگیری می‌رسد.</>],
  ] as const,
};

export const FAQ: [question: string, answer: string][] = [
  [
    "قیمت هر سانس چقدر است؟",
    `هر سانس یک ساعت است. پدل ${PRICING.padel.map((b) => `از ساعت ${fa(b.from)} تا ${fa(b.to)} ${fa(b.price / 1000)} هزار تومان`).join(" و ")}؛ زمین‌های ساحلی (تنیس ساحلی و والیبال ساحلی) ${PRICING.beach.map((b) => `از ساعت ${fa(b.from)} تا ${fa(b.to)} ${fa(b.price / 1000)} هزار تومان`).join(" و ")}.`,
  ],
  ["ساعت کاری کی کلاب چیست؟", `همه‌ی روزهای هفته، از ساعت ${fa(OPEN_HOUR)} صبح تا ${fa(CLOSE_HOUR)}. رزرو آنلاین شبانه‌روزی باز است.`],
  ["آیا برای رزرو زمین باید عضو باشم؟", "نه. کافی است با شماره‌ی موبایل و کد پیامکی وارد شوید. بار اول فقط نام و نام خانوادگی می‌خواهیم و حساب شما همان لحظه ساخته می‌شود."],
  ["چقدر زودتر باید رزرو کنم؟", `سانس‌ها تا ${fa(MAX_DAYS_AHEAD)} روز آینده باز هستند. سانس‌های عصر و شب زودتر پر می‌شوند؛ اگر هر هفته ساعت ثابتی بازی می‌کنید از «رزرو تکراری هفتگی» استفاده کنید.`],
  ["آیا رزرو قابل لغو است؟", `بله، از پنل «رزروهای من». ${CANCEL_RULES.filter((r) => r.percent > 0).map((r) => `تا ${fa(r.hours)} ساعت قبل از شروع ${fa(r.percent)}٪`).join(" و ")} مبلغ به کیف پول برمی‌گردد؛ بعد از آن بازگشتی ندارد.`],
  ["آیا امکان اجاره راکت پدل وجود دارد؟", "بله. هنگام رزرو آنلاین تعداد راکت را انتخاب کنید تا هزینه‌اش روی فاکتور بیاید، یا هنگام ورود از پذیرش اجاره کنید. برای زمین‌های ساحلی هم توپ تنیس ساحلی و والیبال در اختیارتان قرار می‌گیرد."],
  ["اگر پرداخت ناموفق باشد چه می‌شود؟", "اگر مبلغ از حساب کم شده باشد ولی رزرو ثبت نشده باشد، همان مبلغ خودکار به کیف پول کی کلاب برمی‌گردد و می‌توانید با آن رزرو کنید."],
];

export const FINAL_CTA = {
  eyebrow: "Ready to play?",
  title: { before: "امروز زمینت را", highlight: "رزرو کن" },
  text: "سانس خالی را ببین، زمین را انتخاب کن و در کمتر از دو دقیقه پرداخت کن.",
  secondary: { href: "/coaches", label: "کلاس با مربی" },
};

/**
 * Home page photos and videos the front desk can replace from the panel
 * (Gallery & media › Home page). `fallback` is the file shipped with the site.
 */
export const MEDIA_SLOTS: { id: string; group: string; label: string; kind: "image" | "video"; fallback: string; hint: string }[] = [
  ...HERO.videos.map((v, i) => ({
    id: `hero-video-${i + 1}`,
    group: "ویدیوهای بالای صفحه",
    label: `ویدیوی ${(i + 1).toLocaleString("fa-IR")}`,
    kind: "video" as const,
    fallback: v.src,
    hint: "افقی ۱۶:۹، ۸ تا ۱۵ ثانیه، بی‌صدا؛ MP4 یا WEBM تا ۸۰ مگابایت",
  })),
  { id: "hero-poster", group: "ویدیوهای بالای صفحه", label: "عکس جایگزین ویدیو", kind: "image", fallback: HERO.poster, hint: "تا ویدیو بارگذاری شود نمایش داده می‌شود؛ افقی ۱۶:۹" },
  ...SPORT_CARDS.cards.map((c) => ({
    id: c.img.split("/").pop()!.replace(/\.\w+$/, ""),
    group: "کارت‌های بازی",
    label: `کارت ${c.name}`,
    kind: "image" as const,
    fallback: c.img,
    hint: "عمودی ۳:۴، حداقل ۹۰۰ پیکسل عرض",
  })),
];
