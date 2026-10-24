import { expect, test } from "@playwright/test";
import { PHONES, addFirstFreeSession, login } from "./helpers";

test.describe("رزرو و پرداخت", () => {
  test("مهمان سانس انتخاب می‌کند، برای پرداخت وارد می‌شود و برمی‌گردد", async ({ page }) => {
    await addFirstFreeSession(page);
    await page.getByRole("button", { name: "ادامه و پرداخت" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.locator("#ph").fill(PHONES.player);
    await page.getByRole("button", { name: "ادامه" }).click();
    await page.getByLabel("کد تأیید").fill("12345");
    await page.getByRole("button", { name: "تأیید و ورود" }).click();
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByRole("button", { name: /^پرداخت/ })).toBeEnabled();
  });

  test("بازیکن رزرو را با درگاه پرداخت می‌کند و کد رهگیری می‌گیرد", async ({ page }) => {
    await login(page, PHONES.player);
    await expect(page).toHaveURL(/\/panel/);
    await addFirstFreeSession(page);
    await page.getByRole("button", { name: "ادامه و پرداخت" }).click();
    await expect(page).toHaveURL(/\/checkout/);

    // The amount comes from the server's quote; the button waits for it.
    const pay = page.getByRole("button", { name: /^پرداخت/ });
    await expect(pay).toBeEnabled();
    await expect(pay).toContainText("تومان");
    await pay.click();

    await expect(page.getByText("کد رهگیری")).toBeVisible();
    await expect(page.getByRole("link", { name: "رفتن به رزروهای من" })).toBeVisible();
  });

  test("زمین انتخاب‌شده با کلیک دوباره از سبد خارج می‌شود", async ({ page }) => {
    await addFirstFreeSession(page);
    const court = page.locator("#courtpick button.cp", { has: page.locator(":scope") }).filter({ hasNot: page.locator("[disabled]") });
    const picked = page.locator('#courtpick button.cp[aria-label*="در سبد شما"]');
    await expect(picked).toHaveCount(1);
    await picked.click();
    await expect(picked).toHaveCount(0);
    await expect(court.first()).toBeVisible();
    await expect(page.getByRole("button", { name: "ادامه و پرداخت" })).toHaveCount(0);
  });
});

test.describe("برگشت از درگاه", () => {
  test("پرداخت موفق کد رهگیری نشان می‌دهد", async ({ page }) => {
    await login(page, PHONES.player);
    await page.goto("/payment/return?ref=OK123");
    await expect(page.getByText("پرداخت موفق بود؛ رزرو ثبت شد")).toBeVisible();
    await expect(page.getByText("کد رهگیری رزرو")).toBeVisible();
  });

  test("پرداخت ناموفق پیام خطا می‌دهد", async ({ page }) => {
    await login(page, PHONES.player);
    await page.goto("/payment/return?ref=F123");
    await expect(page.getByText("پرداخت موفق بود؛ رزرو ثبت شد")).toHaveCount(0);
    await expect(page.locator("h2").first()).toBeVisible();
  });
});
