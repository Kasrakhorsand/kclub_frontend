# پنل کاربری K Club

هر نقش پوشه‌ی خودش را دارد. هر صفحه یک فایل است و CSS هر نقش کنار صفحه‌هایش قرار دارد. منطق (داده، دسترسی، منو) در `src/engine/panel` است.

```
src/ui/panel/
  PanelRouter.tsx       کدام صفحه برای کدام نقش و آدرس
  shell/                قاب پنل برای همه: منوی کناری، نوار بالا، عنوان صفحه
  common/               صفحه‌های مشترک همه‌ی نقش‌ها
  parts/                تکه‌های مشترک: کارت‌های آمار، جدول تراکنش، جدول زنده
  player/               بازیکن
  secretary/            منشی (پذیرش)
  admin/                ادمین
  support/              پشتیبانی فنی سایت (تیم فنی خود سایت، نه پذیرش مجموعه)
```

## کدام فایل را باز کنم؟

### بازیکن — `player/`

| صفحه در منو | آدرس | فایل |
|---|---|---|
| داشبورد | `/panel` | `player/DashboardPage.tsx` |
| رزروهای من | `/panel/res` | `player/MyBookingsPage.tsx` |
| کیف پول | `/panel/wallet` | `player/WalletPage.tsx` |
| استایل‌ها | | `player/player.css` |

### منشی — `secretary/`

| صفحه در منو | آدرس | فایل |
|---|---|---|
| داشبورد | `/panel` | `secretary/DashboardPage.tsx` |
| جدول رزروها | `/panel/sched` | `secretary/SchedulePage.tsx` (ادمین هم) |
| رزرو جدید | `/panel/newb` | `secretary/NewBookingPage.tsx` (ادمین هم) |
| کاربران | `/panel/users` | `secretary/UsersPage.tsx` (ادمین هم) |
| کیف پول و تراکنش‌ها | `/panel/wops` | `secretary/TransactionsPage.tsx` |
| گزارش صندوق روزانه | `/panel/cash` | `secretary/DailyCashPage.tsx` |
| استایل‌ها | | `secretary/secretary.css` |

### ادمین — `admin/`

| صفحه در منو | آدرس | فایل |
|---|---|---|
| داشبورد | `/panel` | `admin/DashboardPage.tsx` (نمودار: `admin/RevenueChart.tsx`) |
| زمین‌ها | `/panel/courts` | `admin/CourtsPage.tsx` |
| بستن زمین | `/panel/close` | `admin/CloseCourtPage.tsx` |
| قیمت‌گذاری و اجاره‌ی تجهیزات | `/panel/pricing` | `admin/PricingPage.tsx` |
| تنظیمات و قوانین | `/panel/settings` | `admin/SettingsPage.tsx` |
| گزارش‌های مالی | `/panel/rfin` | `admin/FinanceReportsPage.tsx` |
| تراکنش‌ها | `/panel/alltx` | `secretary/TransactionsPage.tsx` |
| تاریخچه تغییرات | `/panel/audit` | `admin/AuditLogPage.tsx` |
| جدول رزروها، رزرو جدید، کاربران | | همان صفحه‌های منشی |
| استایل‌ها | | `admin/admin.css` |

### پشتیبانی فنی سایت — `support/` (نقش `support`)

| صفحه در منو | آدرس | فایل |
|---|---|---|
| داشبورد | `/panel` | `support/DashboardPage.tsx` |
| صف گزارش‌ها | `/panel/queue` (`?id=` یک گزارش را باز می‌کند) | `support/QueuePage.tsx` |
| خطاهای سایت | `/panel/errors` | `support/ErrorsPage.tsx` |
| وضعیت سامانه | `/panel/health` | `support/HealthPage.tsx` |
| اطلاعیه‌ی سایت | `/panel/notice` | `support/NoticePage.tsx` (نوار روی سایت: `src/ui/layout/SiteNotice.tsx`) |
| پاسخ‌های آماده | `/panel/replies` | `support/RepliesPage.tsx` |
| جستجوی کاربر | `/panel/lookup` | `support/LookupPage.tsx` |
| تکه‌های مشترک و استایل‌ها | | `support/parts.tsx` + `support/support.css` |

منطق: `src/engine/support/useSupportDesk.ts` (صف، پاسخ، یادداشت، آمار، گروه‌بندی خطاها، پاسخ‌های آماده) و `src/engine/support/useSiteOps.ts` (اطلاعیه، وضعیت سامانه، جستجوی کاربر).

### همه‌ی نقش‌ها — `common/`

| صفحه | آدرس | فایل |
|---|---|---|
| تیکت‌ها (امور مجموعه) | `/panel/tickets` | `common/TicketsPage.tsx` |
| پشتیبانی فنی سایت | `/panel/support` | `common/SupportPage.tsx` (منطق: `src/engine/support/`) |
| اعلان‌ها | `/panel/notif` | `common/NotificationsPage.tsx` |
| پروفایل و رمز عبور | `/panel/profile` | `common/ProfilePage.tsx` |
| بخش‌های «به‌زودی» (کافه، فروشگاه، …) | | `common/ComingSoonPage.tsx` و فهرستشان در `PanelRouter.tsx` |

### قاب و تکه‌های مشترک

| چه چیزی | فایل |
|---|---|
| منوی کناری، تغییر نقش، خروج، نوار بالا | `shell/PanelShell.tsx` + `shell/shell.css` |
| عنوان بالای هر صفحه | `shell/PageHead.tsx` |
| آیکون هر آیتم منو | `shell/menuIcons.ts` |
| آیتم‌های منوی هر نقش و برچسب‌ها | `src/engine/panel/menus.ts` |
| کارت‌های آمار (KPI) | `parts/KpiGrid.tsx` + `parts/parts.css` |
| جدول تراکنش‌ها | `parts/TransactionTable.tsx` |
| جدول زنده‌ی زمین × ساعت | `parts/LiveBoard.tsx` + `parts/parts.css` |

## اضافه کردن یک صفحه‌ی جدید

1. آیتم منو را در `src/engine/panel/menus.ts` به نقش موردنظر اضافه کنید (کلید = آدرس `/panel/<key>`).
2. فایل صفحه را در پوشه‌ی همان نقش بسازید، مثلاً `admin/CoachesPage.tsx`.
3. در `PanelRouter.tsx` کلید را به صفحه وصل کنید.
4. آیکونش را در `shell/menuIcons.ts` بگذارید.
5. استایل مخصوصش را در CSS همان پوشه بنویسید.
