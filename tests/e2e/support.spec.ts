import { expect, test, type Page } from "@playwright/test";
import { PHONES, login } from "./helpers";

/** Client navigation, so the sample data the test changed stays in memory. */
const go = (page: Page, href: string) => page.evaluate((h) => (window as unknown as { next: { router: { push: (x: string) => void } } }).next.router.push(h), href);

test.describe("پنل پشتیبانی", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, PHONES.support);
    await expect(page).toHaveURL(/\/panel/);
  });

  test("داشبورد گزارش‌های فوری را نشان می‌دهد", async ({ page }) => {
    await expect(page.getByText("گزارش باز").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "دکمه‌ی انتخاب زمین در آیفون کار نمی‌کند" })).toBeVisible();
  });

  test("گزارش را برمی‌دارد، یادداشت می‌گذارد، با پاسخ آماده جواب می‌دهد و حل می‌کند", async ({ page }) => {
    await page.getByRole("link", { name: "دکمه‌ی انتخاب زمین در آیفون کار نمی‌کند" }).click();
    await expect(page).toHaveURL(/\/panel\/queue\?id=s2/);
    await expect(page.locator(".tc-pane h3")).toHaveText("دکمه‌ی انتخاب زمین در آیفون کار نمی‌کند");
    // Device details with browser errors open by default.
    await expect(page.getByText("WebGL context lost")).toBeVisible();

    await page.getByRole("button", { name: "برداشتن برای خودم" }).click();
    await expect(page.getByText("به شما سپرده شد.")).toBeVisible();

    await page.getByLabel("متن یادداشت").fill("در Safari 17 تکرار شد");
    await page.getByRole("button", { name: "ثبت یادداشت" }).click();
    await expect(page.locator(".sd-notes")).toContainText("در Safari 17 تکرار شد");

    await page.getByRole("button", { name: "مشکل برطرف شد" }).click();
    await expect(page.getByLabel("متن پاسخ")).toHaveValue(/مشکل برطرف شد/);
    await page.getByRole("button", { name: "ارسال و حل شد" }).click();
    await expect(page.getByText("پاسخ رفت و گزارش حل‌شده علامت خورد.")).toBeVisible();
    await expect(page.locator(".tc-pane-head .tc-status")).toHaveText("حل شد");
    await expect(page.locator(".tc-thread")).toContainText("مشکل برطرف شد");
  });

  test("فیلترها و جستجو", async ({ page }) => {
    await go(page, "/panel/queue");
    await page.getByLabel("جستجو").fill("SUP-1016");
    await expect(page.locator(".tc-inbox .tc-row")).toHaveCount(1);
    await page.getByLabel("جستجو").fill("");
    await page.getByRole("tab", { name: /حل و بسته/ }).click();
    await expect(page.locator(".tc-inbox .tc-row")).toHaveCount(1);
    await expect(page.locator(".tc-inbox")).toContainText("کد تأیید دیر می‌رسد");
  });

  test("خطاهای سایت گروه‌بندی می‌شوند", async ({ page }) => {
    await go(page, "/panel/errors");
    const fetchGroup = page.locator(".sd-errors li", { hasText: "Failed to fetch" });
    await expect(fetchGroup).toContainText("۲ گزارش");
  });

  test("وضعیت سامانه بررسی می‌شود", async ({ page }) => {
    await go(page, "/panel/health");
    await expect(page.getByText("همه‌ی بخش‌ها سالم پاسخ می‌دهند.")).toBeVisible();
    await expect(page.getByText("قیمت‌ها (/site/pricing)")).toBeVisible();
  });

  test("اطلاعیه روی سایت منتشر و برداشته می‌شود", async ({ page }) => {
    await go(page, "/panel/notice");
    await page.getByRole("radio", { name: "قطعی" }).click();
    await page.getByLabel(/^متن/).fill("درگاه بانک موقتاً در دسترس نیست؛ با کیف پول پرداخت کنید.");
    await page.getByRole("button", { name: "انتشار روی سایت" }).click();
    await expect(page.getByText("اطلاعیه روی سایت منتشر شد.")).toBeVisible();
    await go(page, "/sport");
    await expect(page.locator(".site-notice")).toContainText("درگاه بانک موقتاً در دسترس نیست");
    await go(page, "/panel/notice");
    await page.getByRole("button", { name: "برداشتن اطلاعیه" }).click();
    await expect(page.getByText("اطلاعیه برداشته شد.")).toBeVisible();
    await go(page, "/sport");
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator(".site-notice")).toHaveCount(0);
  });

  test("پاسخ آماده اضافه و حذف می‌شود", async ({ page }) => {
    await go(page, "/panel/replies");
    await page.getByRole("button", { name: "پاسخ آماده‌ی جدید" }).click();
    await page.getByLabel("عنوان").fill("تست خودکار");
    await page.getByLabel(/^متن/).fill("این یک پاسخ آماده برای تست است.");
    await page.getByRole("button", { name: "ذخیره" }).click();
    await expect(page.locator(".sd-replies")).toContainText("تست خودکار");
    await page.getByRole("button", { name: "حذف تست خودکار" }).click();
    await expect(page.locator(".sd-replies")).not.toContainText("تست خودکار");
  });

  test("جستجوی کاربر گزارش‌هایش را نشان می‌دهد", async ({ page }) => {
    await go(page, "/panel/lookup");
    await page.getByLabel("شماره‌ی موبایل").fill("123");
    await page.getByRole("button", { name: "جستجو" }).click();
    await expect(page.locator(".su-err")).toContainText("۱۱ رقمی");
    await page.getByLabel("شماره‌ی موبایل").fill(PHONES.player);
    await page.getByRole("button", { name: "جستجو" }).click();
    await expect(page.getByRole("link", { name: "بعد از پرداخت به صفحه‌ی سایت برنگشتم" })).toBeVisible();
    await expect(page.getByRole("link", { name: "کد تأیید دیر می‌رسد" })).toBeVisible();
  });

  test("پنل‌های مجموعه برای پشتیبانی باز نمی‌شوند", async ({ page }) => {
    await go(page, "/panel/pricing");
    await expect(page).toHaveURL(/\/panel\/pricing/);
    // Unknown sections for this role fall back to the support dashboard.
    await expect(page.getByText("گزارش باز").first()).toBeVisible();
    await expect(page.getByText("قیمت‌گذاری")).toHaveCount(0);
  });
});
