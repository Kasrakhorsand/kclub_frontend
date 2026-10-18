/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Button3D } from "../ui/Buttons";
import { CANCEL_RULES, MAX_DAYS_AHEAD } from "@/lib/mock";
import { fa } from "@/lib/format";

const SPORTS = [
  { href: "/book/padel", img: "/media/card-padel.jpg", pos: "50% 60%", lat: "Padel", name: "پدل", alt: "راکت و توپ پدل روی زمین آبی", text: "۳ زمین سرپوشیده؛ ۲ چمن آبی، ۱ چمن مشکی." },
  { href: "/book/beach?game=tennis", img: "/media/card-beach-tennis.jpg", pos: "55% 40%", lat: "Beach Tennis", name: "تنیس ساحلی", alt: "بازیکن تنیس ساحلی در حال ضربه", text: "راکت و توپ نرم روی ماسه؛ سریع، پرهیجان، دونفره." },
  { href: "/book/beach?game=volley", img: "/media/card-beach-volley.jpg", pos: "82% 50%", lat: "Beach Volley", name: "والیبال ساحلی", alt: "بازیکنان والیبال ساحلی کنار تور", text: "بازی تیمی روی ماسه‌ی نرم، دو نفر در برابر دو نفر." },
];

export function SportCards() {
  return (
    <section className="sports3">
      <div className="wrap">
        <div className="s3hd">
          <span className="lat eyebrow">Choose your game</span>
          <h2>کدام زمین، کدام بازی؟</h2>
        </div>
        <div className="s3g">
          {SPORTS.map((s) => (
            <Link key={s.name} href={s.href} className="spc">
              <div className="med">
                <img src={s.img} alt={s.alt} loading="lazy" style={{ objectPosition: s.pos }} />
              </div>
              <div className="band">
                <span className="lat">{s.lat}</span>
                <h3>{s.name}</h3>
                <p>{s.text}</p>
                <span className="b3d sm">
                  <span>مشاهده سانس‌ها</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
        <p className="s3note">تنیس ساحلی و والیبال ساحلی روی همان ۳ زمین ماسه‌ای برگزار می‌شوند؛ سانس را رزرو کنید و هر کدام را بازی کنید.</p>
      </div>
    </section>
  );
}

export function About() {
  const items = [
    ["زمین‌های سرپوشیده", "سه زمین پدل در سوله؛ دو زمین با چمن آبی و یکی با چمن مشکی."],
    ["ماسه‌ی نرم و تمیز", "سه زمین ساحلی برای تنیس و والیبال."],
    ["هر روز ۸ تا ۲۴", "سانس‌های یک‌ساعته، بدون تماس تلفنی."],
    ["مربیان پدل", "کلاس خصوصی و گروهی برای همه‌ی سطح‌ها."],
  ];
  return (
    <section className="about">
      <div className="wrap">
        <div className="abt">
          <span className="lat eyebrow">The Club</span>
          <h2>یک مجموعه، دو حال‌وهوای بازی</h2>
          <p>کی کلاب برای کسانی ساخته شده که می‌خواهند بی‌دردسر بازی کنند: زمین را آنلاین ببینند، رزرو کنند و فقط برای بازی بیایند.</p>
        </div>
        <ul className="abl">
          {items.map(([t, d]) => (
            <li key={t}>
              <b>{t}</b>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const STEPS = [
  ["رزرو زمین", <>در صفحه‌ی اصلی یا منوی بالا روی «رزرو زمین» بزنید.</>],
  ["انتخاب نوع زمین", <><b>پدل</b> (۳ زمین سرپوشیده) یا <b>ساحلی</b> (۳ زمین ماسه‌ای برای تنیس ساحلی و والیبال ساحلی).</>],
  ["انتخاب روز و سانس خالی", <>روز و ساعت را انتخاب کنید، بعد زمین دلخواه را روی نقشه‌ی مجموعه بزنید. برای بازی ثابت هفتگی، «رزرو تکراری» را انتخاب کنید.</>],
  ["ورود با کد پیامکی", <>شماره‌ی موبایل را وارد کنید تا کد یک‌بارمصرف پیامک شود. بار اول فقط نام و نام خانوادگی لازم است.</>],
  ["پرداخت و تأیید", <>با درگاه بانکی یا کیف پول پرداخت کنید. زمین تا پایان پرداخت برای شما نگه داشته می‌شود و پیامک تأیید و کد رهگیری می‌رسد.</>],
] as const;

const FAQ = [
  ["آیا برای رزرو زمین باید عضو باشم؟", "نه. کافی است با شماره‌ی موبایل و کد پیامکی وارد شوید. بار اول فقط نام و نام خانوادگی می‌خواهیم و حساب شما همان لحظه ساخته می‌شود."],
  ["چقدر زودتر باید رزرو کنم؟", `سانس‌ها تا ${fa(MAX_DAYS_AHEAD)} روز آینده باز هستند. سانس‌های عصر و شب زودتر پر می‌شوند؛ اگر هر هفته ساعت ثابتی بازی می‌کنید از «رزرو تکراری هفتگی» استفاده کنید.`],
  ["آیا رزرو قابل لغو است؟", `بله، از پنل «رزروهای من». ${CANCEL_RULES.filter((r) => r.percent > 0).map((r) => `تا ${fa(r.hours)} ساعت قبل از شروع ${fa(r.percent)}٪`).join(" و ")} مبلغ به کیف پول برمی‌گردد؛ بعد از آن بازگشتی ندارد.`],
  ["آیا امکان اجاره راکت پدل وجود دارد؟", "بله. راکت پدل و توپ را می‌توانید هنگام ورود از پذیرش مجموعه اجاره کنید؛ برای زمین‌های ساحلی هم توپ تنیس ساحلی و والیبال در اختیارتان قرار می‌گیرد."],
  ["اگر پرداخت ناموفق باشد چه می‌شود؟", "اگر مبلغ از حساب کم شده باشد ولی رزرو ثبت نشده باشد، همان مبلغ خودکار به کیف پول کی کلاب برمی‌گردد و می‌توانید با آن رزرو کنید."],
];

export function HowTo() {
  return (
    <section className="how" id="how">
      <div className="wrap">
        <div className="howhd">
          <span className="lat eyebrow">How to book</span>
          <h2>رزرو زمین در کی کلاب، کمتر از ۲ دقیقه</h2>
          <p className="muted">بدون تماس با باشگاه. سانس‌های خالی همین حالا روی سایت هستند و تأیید رزرو با پیامک می‌رسد.</p>
        </div>
        <ol className="steps">
          {STEPS.map(([t, d], i) => (
            <li key={t}>
              <span className="sn">{fa(i + 1)}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
        <div className="faq">
          <div className="faqhd">
            <span className="lat eyebrow">FAQ · سؤالات متداول</span>
            <h2>قبل از شروع</h2>
          </div>
          <div className="faqg">
            {FAQ.map(([q, a]) => (
              <details className="fq" key={q}>
                <summary>
                  <span>{q}</span>
                  <i aria-hidden="true" />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="howcta">
          <Button3D size="lg" href="/sport">
            شروع رزرو
          </Button3D>
        </div>
      </div>
    </section>
  );
}
