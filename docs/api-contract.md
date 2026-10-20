# قرارداد API فرانت‌اند K Club (پیش‌نویس)

این فایل فهرست endpointهایی است که فرانت‌اند همین الان صدا می‌زند. همه در [`src/engine/api.ts`](../src/engine/api.ts) هستند و از کلاینت [`src/engine/http.ts`](../src/engine/http.ts) می‌گذرند. اگر Swagger بک‌اند مسیر یا شکل داده‌ی دیگری داشت، فقط همین دو فایل عوض می‌شوند.

آدرس پایه: `NEXT_PUBLIC_API_URL` (مثلاً `https://api.kclub.ir/v1`). همه‌ی بدنه‌ها JSON هستند و تاریخ‌ها به شکل `yyyy-MM-dd` به وقت تهران، ساعت‌ها عدد ۰ تا ۲۳ و مبلغ‌ها به تومان.

## قواعد مشترک

| موضوع | قرارداد |
|---|---|
| نشست | کوکی `httpOnly; Secure; SameSite=Lax` که بک‌اند هنگام ورود می‌سازد. فرانت هیچ توکنی نگه نمی‌دارد و همه‌ی درخواست‌ها با `credentials: include` ارسال می‌شوند. |
| CSRF | بک‌اند یک کوکی قابل‌خواندن `csrf_token` هم می‌گذارد. فرانت مقدارش را در هدر `X-CSRF-Token` روی همه‌ی درخواست‌های غیر GET برمی‌گرداند و بک‌اند باید آن را بررسی کند. |
| CORS | فقط origin سایت، با `Access-Control-Allow-Credentials: true`. |
| هویت | کاربر از روی نشست شناخته می‌شود. مسیرهای `/me/...` هیچ شماره یا شناسه‌ی کاربری از مرورگر نمی‌گیرند. |
| خطا | بدنه‌ی `{ "message": "متن فارسی برای نمایش", "code": "SLOT_TAKEN" }` با status مناسب. `401` یعنی نشست تمام شده و فرانت کاربر را خارج می‌کند. |
| قیمت | فرانت هیچ قیمتی نمی‌فرستد. بک‌اند خودش رزرو، اجاره و شارژ را قیمت‌گذاری می‌کند. |

## عمومی (بدون ورود)

| متد و مسیر | ورودی | خروجی |
|---|---|---|
| `GET /courts` | `?sport=` | `Court[]` |
| `GET /slots` | `?sport=&date=` | `Slot[]`: `{ hour, past, price, freeCourts: courtId[] }` |
| `GET /availability` | `?sport=&from=&days=` | `{ date, free }[]` |
| `GET /coaches` | — | `Coach[]` |
| `GET /pricing/rentals` | — | `{ [rentalId]: price }` |

## ورود

| متد و مسیر | ورودی | خروجی |
|---|---|---|
| `POST /auth/lookup` | `{ phone }` | `{ hasPassword }`؛ برای شماره‌ی ناشناس هم `false` برگرداند تا نشود حساب‌ها را شناسایی کرد. |
| `POST /auth/otp/send` | `{ phone }` | `204` |
| `POST /auth/otp/verify` | `{ phone, code }` | `{ user: User \| null }`. کاربر موجود وارد می‌شود و کوکی می‌گیرد. شماره‌ی جدید یک نشست کوتاه‌مدت ثبت‌نام می‌گیرد. |
| `POST /auth/register` | `{ first, last }` | `User`. شماره را از نشست ثبت‌نام می‌خواند. |
| `POST /auth/login/password` | `{ phone, password }` | `User`؛ در صورت اشتباه `401` با پیام یکسان. |
| `GET /auth/me` | — | `User` یا `401` |
| `POST /auth/logout` | — | `204` و پاک شدن کوکی |

## کاربر واردشده (`/me`)

| متد و مسیر | ورودی | خروجی |
|---|---|---|
| `GET /me/password` | — | `{ hasPassword }` |
| `PUT /me/password` | `{ password, currentPassword? }` | `204`. اگر رمز قبلی وجود دارد و نشست با کد پیامکی باز نشده، `currentPassword` لازم است. |
| `PUT /me/profile` | `{ first, last, email?, nationalId? }` | `User` |
| `GET /me/bookings` | `?scope=upcoming\|past` | `Booking[]` |
| `POST /me/bookings/{id}/cancel` | — | `{ refundPercent, refundAmount }` |
| `GET /me/transactions` | — | `Tx[]` |
| `POST /me/wallet/topup` | `{ amount }` | `{ gatewayUrl }` |
| `GET /me/notifications` | — | `Notif[]` |
| `POST /me/notifications/read` | `{ ids? }` | `204`؛ بدون `ids` یعنی همه. |

## رزرو و پرداخت

| متد و مسیر | ورودی | خروجی |
|---|---|---|
| `POST /bookings` | `{ items: [{ courtId, date, hour, game?, rentals? }], method: "wallet"\|"gateway" }` | `{ tracking, gatewayUrl? }`. اگر سانس پر شده باشد `409` با `code: "SLOT_TAKEN"`. در پرداخت با درگاه، `gatewayUrl` برمی‌گردد. |

فرانت فقط به میزبان‌های درگاه که در `NEXT_PUBLIC_PAYMENT_HOSTS` آمده‌اند (و فقط با https) redirect می‌کند.

## تیکت‌ها (دامنه بر اساس نقش نشست)

| متد و مسیر | ورودی | خروجی |
|---|---|---|
| `GET /tickets` | — | `Ticket[]`؛ بازیکن فقط تیکت‌های خودش را می‌بیند. |
| `POST /tickets` | `{ title, category, text }` | `Ticket` |
| `POST /tickets/{id}/messages` | `{ text }` | `204`. فرستنده (کاربر، پذیرش یا مدیریت) را بک‌اند از نشست تعیین می‌کند. |
| `PATCH /tickets/{id}` | `{ status }` | `204`؛ فقط برای پذیرش و مدیریت. |

## پشتیبانی فنی سایت (همه‌ی نقش‌ها؛ برای تیم فنی سایت، نه پذیرش)

هر کاربر فقط گزارش‌های خودش را می‌بیند. ارسال‌ها `multipart/form-data` هستند: بخش `data` شامل JSON فیلدها و تا ۴ بخش `files` (فقط PNG، JPEG یا WEBP، هر کدام تا ۵ مگابایت).

| متد و مسیر | ورودی | خروجی |
|---|---|---|
| `GET /support/tickets` | — | `SupportTicket[]` |
| `POST /support/tickets` | `data`: `{ area, severity, subject, steps, actual, expected?, when, whenTime?, refCode?, allowCall, diagnostics? }` + `files` | `SupportTicket` با `ref` (مثل `SUP-1024`) و `status: "new"` |
| `POST /support/tickets/{id}/messages` | `data`: `{ text }` + `files` | `204`؛ وضعیت به `in_progress` برمی‌گردد. |
| `POST /support/tickets/{id}/close` | — | `204` |

- `area`: `login`، `booking`، `payment`، `wallet`، `panel`، `display`، `speed`، `other`
- `severity`: `blocker`، `major`، `minor`
- `when`: `now`، `today`، `yesterday`، `earlier`
- `status`: `new`، `in_progress`، `need_info` (منتظر کاربر)، `resolved`، `closed`
- `diagnostics` فقط اطلاعات فنی است: صفحه و صفحه‌های اخیر، مرورگر، سیستم‌عامل، دستگاه، اندازه‌ی صفحه، زبان، منطقه‌ی زمانی، وضعیت اینترنت، تم، نقش، نسخه‌ی سایت و حداکثر ۱۰ خطای اخیر مرورگر (فقط متن خطا). کاربر می‌تواند ارسالش را خاموش کند.
- پاسخ‌های تیم فنی با `by: "support"` در `messages` می‌آیند و می‌توانند `attachments` داشته باشند.

**بک‌اند حتماً:** نوع واقعی فایل را از محتوای آن تشخیص دهد (نه از نام یا Content-Type)، حجم و تعداد را دوباره چک کند، متادیتای EXIF (مثل موقعیت مکانی) را پاک کند، فایل‌ها را خارج از مسیر قابل‌اجرا ذخیره کند و فقط به صاحب گزارش و تیم فنی نشان دهد (با `Content-Disposition` و `X-Content-Type-Options: nosniff`)، و روی ثبت گزارش محدودیت تعداد بگذارد.

## کارکنان

| متد و مسیر | ورودی | خروجی |
|---|---|---|
| `GET /staff/board` | `?date=` | `Booking[]`؛ فقط برای پذیرش و مدیریت. |

شکل نوع‌ها (`User`، `Booking`، `Court` و بقیه) در [`src/engine/types.ts`](../src/engine/types.ts) است.
