import { expect, test } from "@playwright/test";
import { PHONES, login } from "./helpers";

test.describe("ورود", () => {
  test("بازیکن با کد پیامکی وارد پنل می‌شود", async ({ page }) => {
    await login(page, PHONES.player);
    await expect(page).toHaveURL(/\/panel/);
    await expect(page.getByRole("link", { name: "رزرو زمین" }).first()).toBeVisible();
  });

  test("شماره‌ی نامعتبر پذیرفته نمی‌شود", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#ph").fill("123");
    await page.getByRole("button", { name: "ادامه" }).click();
    await expect(page.getByLabel("کد تأیید")).toHaveCount(0);
    await expect(page).toHaveURL(/\/login/);
  });

  test("شماره‌ی تازه حساب می‌سازد", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#ph").fill("09125550000");
    await page.getByRole("button", { name: "ادامه" }).click();
    await page.getByLabel("کد تأیید").fill("12345");
    await page.getByRole("button", { name: "تأیید و ورود" }).click();
    await page.getByLabel("نام", { exact: true }).fill("آزمون");
    await page.getByLabel("نام خانوادگی").fill("خودکار");
    await page.getByRole("button", { name: "ساخت حساب" }).click();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("پنل بدون ورود به صفحه‌ی ورود می‌رود", async ({ page }) => {
    await page.goto("/panel");
    await expect(page).toHaveURL(/\/login/);
  });

  test("next خارجی به سایت دیگر نمی‌برد", async ({ page }) => {
    await login(page, PHONES.player, "https://evil.example/");
    await expect(page).toHaveURL(/localhost|127\.0\.0\.1/);
  });
});
