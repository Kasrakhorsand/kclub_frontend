# کی کلاب · K Club Web

فرانت‌اند سایت و پنل‌های رزرو کی کلاب (پدل، تنیس ساحلی، والیبال ساحلی)، پیاده‌سازی‌شده از روی پروتوتایپ تأییدشده با تم **مشکی و طلایی**.

## تکنولوژی‌ها

| بخش | ابزار |
|---|---|
| فریم‌ورک | Next.js 15 (App Router) + TypeScript |
| استایل | Tailwind CSS + توکن‌های طراحی پروتوتایپ (`src/app/kclub.css`) |
| سه‌بعدی | Three.js (لوگو، راکت‌ها، توپ‌ها) |
| داده و کش | TanStack Query |
| وضعیت (سبد، ورود، تم) | Zustand |
| فرم‌ها | React Hook Form + Zod |
| تاریخ شمسی | date-fns-jalali |
| نمودار | Recharts |
| فونت | وزیرمتن و Jost، روی سرور خود پروژه (بدون Google Fonts) |

هیچ فایل، فونت یا کتابخانه‌ای از CDN خارجی لود نمی‌شود تا سایت روی اینترنت ایران پایدار باشد.

## ساختار

```
src/
  app/
    (site)/            صفحه‌های عمومی: خانه، انتخاب رشته، رزرو، مربیان، ورود، پرداخت
    panel/             پنل بازیکن، منشی و ادمین (منوی کناری)
    kclub.css          استایل‌ها و توکن‌های رنگ از پروتوتایپ
  components/
    site/              ناوبار، هیرو، کارت‌ها، رزرو، نقشه‌ی سه‌بعدی زمین‌ها
    panel/             منوی کناری، جدول زنده، صفحه‌های پنل
    three/             لوگوی سه‌بعدی و مدل‌های راکت و توپ
    ui/                دکمه‌های سه‌بعدی، دکمه بازگشت، توست، تم
  lib/
    api.ts             لایه‌ی داده؛ با NEXT_PUBLIC_API_URL به بک‌اند وصل می‌شود
    mock.ts            داده‌ی نمونه، زمین‌ها، قیمت‌ها، قوانین لغو
    store.ts           سبد، کاربر، تم
    format.ts          اعداد فارسی و تاریخ شمسی
public/
  media/               ویدیوهای هیرو و تصاویر کارت‌ها
  models/              تصویر راکت‌ها و توپ والیبال برای مدل‌های سه‌بعدی
  brand/               لوگو
deploy/                کانفیگ Nginx و اسکریپت دیپلوی
```

## اجرا روی سیستم

```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
```

برای تست پنل‌ها در صفحه‌ی ورود از این شماره‌ها استفاده کنید (هر کد ۵ رقمی قبول است):

- `09121234567` بازیکن
- `09120000001` منشی
- `09120000002` ادمین (و منشی)

## اتصال به بک‌اند

همه‌ی دسترسی به داده در `src/lib/api.ts` است. با تنظیم `NEXT_PUBLIC_API_URL` هر تابع به‌جای داده‌ی نمونه به API واقعی درخواست می‌دهد. مسیرهای مورد انتظار:

| تابع | درخواست |
|---|---|
| `getCourts` | `GET /courts?sport=` |
| `getSlots` | `GET /slots?sport=&date=` |
| `getDayBoard` | `GET /bookings?date=` |
| `sendOtp` | `POST /auth/otp` |
| `verifyOtp` | `POST /auth/verify` |
| `createBookings` | `POST /bookings` |
| `getCoaches` | `GET /coaches` |

درگاه پرداخت و سامانه‌ی پیامک باید سمت بک‌اند وصل شوند؛ فرانت فقط کاربر را به درگاه می‌فرستد و نتیجه را می‌گیرد.

## استقرار روی سرور تست (فردوسی کلاد)

### روش ۱: Docker

```bash
git clone <repo> kclub-web && cd kclub-web
cp .env.example .env
docker compose up -d --build
```

### روش ۲: PM2

```bash
npm ci && npm run build
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
npm i -g pm2 && pm2 start ecosystem.config.js && pm2 save && pm2 startup
```

### Nginx و SSL

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/kclub
sudo ln -s /etc/nginx/sites-available/kclub /etc/nginx/sites-enabled/
sudo htpasswd -c /etc/nginx/.htpasswd kclub     # رمز نسخه‌ی تست
sudo certbot --nginx -d test.kclub.ir
sudo nginx -t && sudo systemctl reload nginx
```

برای به‌روزرسانی: `./deploy/deploy.sh docker` یا `./deploy/deploy.sh pm2`

نسخه‌ی تست با `NEXT_PUBLIC_NOINDEX=1` و رمز Nginx از گوگل پنهان می‌ماند. برای نسخه‌ی نهایی این دو را بردارید.

## وضعیت فاز یک

- آماده: خانه با لوگوی سه‌بعدی و ویدیو، انتخاب رشته‌ی سه‌بعدی، رزرو (روز، سانس، نقشه‌ی سه‌بعدی زمین، رزرو تکراری)، ورود با کد پیامکی، پرداخت، مربیان، پنل بازیکن، منشی (جدول زنده، رزرو جدید، صندوق) و ادمین (درآمد، قیمت‌گذاری، قوانین، بستن زمین، تراکنش‌ها، تاریخچه).
- فاز بعد: هم‌بازی، مسابقات، پکیج مربی، کافه، فروشگاه.
- داده‌ها نمونه‌اند: اطلاعات مربیان، آدرس و تلفن واقعی باید جایگزین شوند.
