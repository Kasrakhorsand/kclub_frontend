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
| `GET /me/wallet` | — | `{ balance }`؛ موجودی کیف پول همیشه از سرور خوانده می‌شود (بعد از پرداخت، لغو، شارژ و برگشتن به تب). |
| `GET /me/transactions` | — | `Tx[]` |
| `POST /me/wallet/topup` | `{ amount }` | `{ gatewayUrl }` |
| `GET /me/notifications` | — | `Notif[]` |
| `POST /me/notifications/read` | `{ ids? }` | `204`؛ بدون `ids` یعنی همه. |

## رزرو و پرداخت

| متد و مسیر | ورودی | خروجی |
|---|---|---|
| `POST /bookings` | `{ items: [{ courtId, date, hour, game?, rentals? }], method: "wallet"\|"gateway" }` | `{ tracking, gatewayUrl? }`. اگر سانس پر شده باشد `409` با `code: "SLOT_TAKEN"`. در پرداخت با درگاه، `gatewayUrl` برمی‌گردد. |

- اگر موجودی کیف پول کافی نباشد: `422` با `code: "LOW_BALANCE"`.
- `GET /slots` برای هر هفته‌ی تکرار هفتگی هم صدا زده می‌شود تا فقط هفته‌های خالی به سبد بروند.

### برگشت از درگاه

1. بانک به callback بک‌اند برمی‌گردد. بک‌اند پرداخت را با سرویس verify بانک تأیید می‌کند و رزرو یا شارژ را نهایی می‌کند.
2. بک‌اند کاربر را به `{SITE}/payment/return?ref=<paymentRef>` می‌فرستد. به وضعیت یا مبلغ در آدرس اعتماد نمی‌شود.
3. فرانت `GET /payments/{ref}` را صدا می‌زند: `{ ref, status: "paid"|"failed"|"pending", kind: "booking"|"topup", amount, tracking?, bankRef?, wallet?, message? }`. فقط صاحب پرداخت باید بتواند آن را بخواند. تا وقتی `pending` است، فرانت تا یک دقیقه هر ۳ ثانیه دوباره می‌پرسد.

### شلوغی رزرو

- **`429` با `Retry-After`:** وقتی سرور شلوغ است (مثلاً لحظه‌ی باز شدن روز جدید)، `429` با هدر `Retry-After` (ثانیه) برگردانید. فرانت درخواست‌های خواندن را بعد از همان مدت تا ۳ بار تکرار می‌کند، و برای پرداخت شمارش معکوس نشان می‌دهد و خودکار دوباره می‌فرستد.
- **`Idempotency-Key`:** فرانت روی `POST /bookings` این هدر را می‌فرستد و در همه‌ی تلاش‌های دوباره‌ی یک سبد همان مقدار را تکرار می‌کند. بک‌اند باید برای هر کلید فقط یک بار رزرو بسازد و برای تکرارها همان پاسخ اول را برگرداند (حداقل ۲۴ ساعت نگه دارد).
- **سقف رزرو فعال:** اگر بازیکن بیش از `maxActivePerUser` رزرو فعال داشته باشد، `422` با `code: "BOOKING_LIMIT"` و پیام فارسی برگردانید.
- **`GET /site/rules`** (عمومی): `{ maxDaysAhead, holdMinutes, releaseHour, maxActivePerUser, cancelRules }`؛ همان مقادیر تنظیمات ادمین. فرانت با آن صفحه‌ی قوانین، شمارش معکوس باز شدن روز جدید و هشدار سقف رزرو را می‌سازد. در ساعت `releaseHour` هر روز، یک روز تازه به انتهای بازه‌ی رزرو اضافه شود.

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
همه‌ی مسیرهای `/staff/...` فقط برای نقش پذیرش (`secretary`) و مدیریت (`admin`) هستند و بک‌اند نقش را از نشست بررسی می‌کند. هر عملیات مالی با نام کاربر پذیرش ثبت می‌شود (`actor`) و در تاریخچه‌ی تغییرات مدیریت می‌آید.

### جدول و رزرو

| متد و مسیر | ورودی | خروجی |
|---|---|---|
| `GET /staff/board` | `?date=` | `Booking[]`: رزروهای فعال آن روز، با `userPhone`، `source` و `checkedIn`. |
| `POST /staff/bookings` | `{ phone, first?, last?, items: [{ courtId, date, hour, game?, rentals? }], payment, note? }` | `{ tracking, total, count }`. `payment` یکی از `pos`، `cash`، `wallet`، `link` (پیامک لینک درگاه) و `later` (پرداخت هنگام ورود) است. اگر شماره حساب نداشته باشد، با `first` و `last` ساخته می‌شود. قیمت را بک‌اند حساب می‌کند. سانس پر: `409` با `SLOT_TAKEN`. کیف پول کم: `422` با `LOW_BALANCE`. پیامک تأیید را بک‌اند می‌فرستد. |
| `POST /staff/bookings/{id}/checkin` | — | `204`؛ ورود بازیکن ثبت می‌شود. |
| `POST /staff/bookings/{id}/cancel` | `{ reason, fullRefund }` | `{ refundAmount }`. برگشت وجه طبق قوانین لغو به کیف پول؛ `fullRefund: true` برگشت کامل است و بهتر است فقط برای مدیریت یا با ثبت دلیل مجاز باشد. |

### مشتری‌ها و کیف پول

| متد و مسیر | ورودی | خروجی |
|---|---|---|
| `GET /staff/customers` | `?phone=` | `{ phone, first, last, wallet, vip?, upcoming }` یا `404` اگر حساب نیست (فرانت آن را «مشتری جدید» نشان می‌دهد). |
| `GET /staff/customers/list` | `?q=&filter=all\|vip\|upcoming\|inactive` | `CustomerRow[]`: همان فیلدها به‌علاوه‌ی `roles`، `totalBookings` و `lastVisit?`. `q` روی نام و شماره جستجو می‌کند. **پذیرش فقط بازیکن‌ها را می‌بیند؛ مدیریت حساب کارکنان را هم می‌بیند.** |
| `GET /staff/customers/{phone}` | — | `{ customer, upcoming: Booking[], recent: Booking[], transactions: Tx[] }` |
| `POST /staff/customers/{phone}/wallet` | `{ kind: "charge"\|"refund", amount, method: "pos"\|"cash", note? }` | `{ balance }`. مبلغ بین ۱۰ هزار تا ۵۰ میلیون تومان؛ برگشت بیشتر از موجودی: `422` با `LOW_BALANCE`. |

### تراکنش‌ها و صندوق

| متد و مسیر | ورودی | خروجی |
|---|---|---|
| `GET /staff/transactions` | `?from=&to=` | `Tx[]` همه‌ی کاربران، جدیدترین اول، با `userName`. |
| `GET /staff/cash` | `?date=` | `{ date, rows: Tx[], byMethod: [{ method, received, refunded, count }], received, refunded, expectedCash, closed? }`؛ فقط تراکنش‌هایی که همین کاربر پذیرش ثبت کرده. `expectedCash` = نقد دریافتی − نقد برگشتی. |
| `POST /staff/cash/close` | `{ date, counted, note? }` | `204`. اختلاف (`counted − expectedCash`) ذخیره و به مدیریت گزارش می‌شود. برای اختلاف ۱۰۰ هزار تومان یا بیشتر توضیح لازم است. صندوق بسته‌شده دوباره بسته نمی‌شود (`409`). |

## مدیریت (`/admin/...`، فقط نقش `admin`)

هر تغییر در این بخش با نام مدیر، زمان و جزئیات در تاریخچه‌ی تغییرات ثبت می‌شود.

| متد و مسیر | ورودی | خروجی |
|---|---|---|
| `GET /admin/revenue` | `?days=7\|30\|90` | `{ days: [{ date, bySport: { [sport]: toman }, bookings }], total, bySport, byCourt, hoursByCourt, onlineShare, bookings }`؛ رزروهای فعال بر اساس تاریخ سانس. |
| `GET /admin/courts` | — | `Court[]` با `active` |
| `PATCH /admin/courts/{id}` | `{ active }` | `204`. زمین غیرفعال در رزرو آنلاین نمی‌آید؛ رزروهای قبلی‌اش می‌مانند. |
| `GET /admin/closures` | — | `Closure[]` از امروز به بعد: `{ id, courtIds, date, from, to, reason, affected, createdBy }` |
| `POST /admin/closures/preview` | `{ courtIds, date, from, to }` | `Booking[]` که با این بستن لغو می‌شوند (بدون تغییر چیزی). |
| `POST /admin/closures` | `{ courtIds, date, from, to, reason, fullRefund }` | `Closure`. رزروهای بازه لغو، وجه (کامل یا طبق قوانین) به کیف پول برگشت و به رزروکنندگان پیامک می‌شود. آن ساعت‌ها دیگر قابل رزرو نیستند. |
| `DELETE /admin/closures/{id}` | — | `204`؛ زمین دوباره باز می‌شود (رزروهای لغوشده برنمی‌گردند). |
| `GET /admin/pricing` | — | `{ bands: { [sport]: [{ from, to, price }] }, rentals: { [rentalId]: price } }` |
| `PUT /admin/pricing` | همان شکل | `204`. هر قیمت بین ۱۰ هزار و ۱۰۰ میلیون تومان. رزروهای ثبت‌شده با قیمت قبلی می‌مانند؛ رزروهای تازه با قیمت جدید حساب می‌شوند. |
| `GET /admin/settings` | — | `{ maxDaysAhead, holdMinutes, releaseHour, maxActivePerUser, cancelRules: [{ hours, percent }] }` |
| `PUT /admin/settings` | همان شکل | `204`. بازه‌ها: `maxDaysAhead` ۱ تا ۹۰، `holdMinutes` ۳ تا ۳۰، `releaseHour` ۰ تا ۲۳، `maxActivePerUser` ۰ تا ۵۰ (۰ یعنی بی‌محدودیت). `cancelRules` نزولی بر اساس `hours`، آخری با `hours: 0`، و درصد برای لغو دیرتر بیشتر نشود. بک‌اند همین قوانین را برای رزرو، نگه‌داشت درگاه و برگشت وجه به کار ببرد. |
| `GET /admin/audit` | `?from=` | `[{ date, time, actor, action, target, detail }]`، جدیدترین اول. |

## کارکنان و دسترسی‌ها (فقط `admin`)

`User` در `/auth/me` فیلد `permissions?: ("gallery"|"albums"|"coaches"|"home")[]` هم دارد. مدیر همه‌ی دسترسی‌ها را دارد؛ منشی فقط آنچه مدیر داده. **بک‌اند هر درخواست محتوا را با همین دسترسی‌ها بررسی کند**؛ پنهان شدن دکمه در پنل امنیت نیست.

| متد و مسیر | ورودی | خروجی |
|---|---|---|
| `GET /admin/staff` | — | `[{ phone, first, last, roles, permissions }]`: هر حسابی که نقش منشی یا مدیر دارد. |
| `POST /admin/staff` | `{ phone, role: "secretary", first?, last? }` | `StaffMember`. اگر شماره حساب ندارد با نام داده‌شده ساخته می‌شود (بدون نام: `422` با `NAME_REQUIRED`). |
| `DELETE /admin/staff/{phone}/roles/{role}` | — | `204`. مدیر نقش مدیر خودش را برنمی‌دارد (`409 SELF_ADMIN`) و آخرین مدیر حذف نمی‌شود (`409 LAST_ADMIN`). نشست‌های باز آن نقش باید باطل شوند. |
| `PUT /admin/staff/{phone}/permissions` | `{ permissions }` | `204` |

## پروفایل مربیان (دسترسی `coaches` یا مدیر)

همه‌ی اطلاعات مربی را پذیرش در پنل وارد می‌کند. `rating`، `reviews`، `satisfaction` و `students` را بک‌اند از نظرها و رزروهای بازیکن‌ها حساب می‌کند و از فرم دریافت نمی‌کند.

`Coach`: `{ id, name, title, level: "head"|"coach"|"junior"|"guest", games: gameId[], years, price, groupPrice?, tags: string[], bio?, certificates?: string[], gender?: "male"|"female", schedule?: [{ day: 0..6 (۰ = شنبه), from, to }], photo?, published, order, students?, satisfaction?, rating?, reviews? }`

| متد و مسیر | ورودی | خروجی |
|---|---|---|
| `GET /coaches` | — | فقط مربیان منتشرشده، به ترتیب `order` (عمومی). |
| `GET /staff/coaches` | — | همه‌ی مربیان، منتشرشده و پیش‌نویس. |
| `POST /staff/coaches` | `CoachInput` (همه‌ی فیلدهای بالا جز `id`، `photo`، `order` و آمارها) | `Coach` |
| `PUT /staff/coaches/{id}` | `CoachInput` | `Coach` |
| `DELETE /staff/coaches/{id}` | — | `204` |
| `PUT /staff/coaches/order` | `{ ids }` | `204` |

اعتبارسنجی (همان فرانت): نام ۲ تا ۶۰ حرف، عنوان ۳ تا ۸۰، حداقل یک بازی، سابقه ۰ تا ۶۰ سال، قیمت جلسه‌ی خصوصی ۵۰ هزار تا ۵۰ میلیون تومان، قیمت گروهی کمتر از خصوصی، حداکثر ۶ برچسب (هر کدام ۲۴ حرف)، ۶ مدرک (هر کدام ۶۰ حرف)، توضیح ۶۰۰ حرف، ۱۴ ردیف برنامه با پایان بعد از شروع.

## محتوای سایت: گالری، عکس مربیان، رسانه‌ی صفحه‌ی اصلی

آپلودها `multipart/form-data` با بخش‌های `files` (و `data` برای JSON در صورت نیاز). عکس: JPG، PNG یا WEBP تا ۸ مگابایت؛ ویدیو: MP4 یا WEBM تا ۸۰ مگابایت؛ هر بار تا ۲۰ عکس. بک‌اند نوع واقعی فایل را از محتوا تشخیص دهد، EXIF را پاک کند، اندازه‌های کوچک‌تر (thumbnail) بسازد و فایل‌ها را از دامنه‌ی خودش یا CDN داخلی سرو کند.

| متد و مسیر | دسترسی | ورودی | خروجی |
|---|---|---|---|
| `GET /site/gallery` | عمومی | — | `Album[]` منتشرشده با عکس: `{ id, title, published, coverId?, items: MediaItem[], updatedAt }` |
| `GET /staff/albums` | gallery یا albums | — | همه‌ی آلبوم‌ها |
| `POST /staff/albums` | albums | `{ title }` | `Album` (پیش‌نویس) |
| `PATCH /staff/albums/{id}` | albums | `{ title?, published?, coverId? }` | `204` |
| `DELETE /staff/albums/{id}` | albums | — | `204` |
| `POST /staff/albums/{id}/items` | gallery | `files` | `Album` |
| `PATCH /staff/albums/{id}/items/{itemId}` | gallery | `{ caption?, alt? }` | `204` |
| `DELETE /staff/albums/{id}/items/{itemId}` | gallery | — | `204` |
| `PUT /staff/albums/{id}/order` | gallery | `{ ids }` | `204` |
| `PUT /staff/coaches/{id}/photo` | coaches | `files` (یک عکس) | `{ url }` |
| `DELETE /staff/coaches/{id}/photo` | coaches | — | `204` |
| `GET /site/media` | عمومی | — | `{ [slotId]: MediaItem }`: فقط جایگاه‌هایی که عوض شده‌اند. |
| `PUT /staff/site-media/{slotId}` | home | `files` (یک فایل) | `MediaItem` |
| `DELETE /staff/site-media/{slotId}` | home | — | `204`؛ فایل پیش‌فرض سایت برمی‌گردد. |

`MediaItem`: `{ id, kind: "image"|"video", url, alt?, caption?, width?, height? }`. شناسه‌ی جایگاه‌ها: `hero-video-1`، `hero-video-2`، `hero-video-3` (ویدیو)، `hero-poster`، `card-padel`، `card-beach-tennis`، `card-beach-volley` (عکس). فهرست کامل در `src/config/home.tsx` (`MEDIA_SLOTS`) است. هر تغییر محتوا در تاریخچه‌ی تغییرات ثبت شود.

شکل نوع‌ها (`User`، `Booking`، `Court` و بقیه) در [`src/engine/types.ts`](../src/engine/types.ts) است.
