import { expect, test, type Page } from "@playwright/test";
import { PHONES, login } from "./helpers";

/** Every working (not "soon") menu page per role. Keep in step with src/engine/panel/menus.ts. */
const PAGES: Record<string, string[]> = {
  player: ["", "res", "wallet", "notif", "tickets", "support", "profile"],
  secretary: ["", "sched", "newb", "users", "wops", "tickets", "support", "notif", "cash", "profile"],
  admin: ["", "sched", "newb", "users", "staff", "courts", "close", "pricing", "settings", "rfin", "alltx", "tickets", "support", "coaches", "media", "audit", "notif", "profile"],
  support: ["", "queue", "errors", "health", "notice", "replies", "lookup", "profile"],
};
const PHONE_OF: Record<string, string> = { player: PHONES.player, secretary: PHONES.desk, admin: PHONES.admin, support: PHONES.support };

/** Collect uncaught errors and console errors while a page is used. */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|favicon|net::ERR/.test(m.text())) errors.push(`console: ${m.text()}`);
  });
  return errors;
}

for (const [role, keys] of Object.entries(PAGES)) {
  test(`همه‌ی صفحه‌های پنل ${role} بدون خطا باز می‌شوند`, async ({ page }) => {
    test.setTimeout(keys.length * 15_000 + 30_000);
    const errors = watchErrors(page);
    await login(page, PHONE_OF[role]);
    await expect(page).toHaveURL(/\/panel/);
    for (const key of keys) {
      // Client navigation keeps the sample data in memory, like a real visit.
      await page.evaluate((href) => (window as unknown as { next: { router: { push: (h: string) => void } } }).next.router.push(href), key ? `/panel/${key}` : "/panel");
      await expect(page).toHaveURL(new RegExp(`/panel${key ? `/${key}` : ""}$`));
      await expect(page.locator("main, .pn-main, [role=main]").first()).toBeVisible();
      await expect(page.getByText(/Application error|خطای غیرمنتظره/)).toHaveCount(0);
      await page.waitForLoadState("networkidle").catch(() => undefined);
    }
    expect(errors, errors.join("\n")).toEqual([]);
  });
}

test("صفحه‌ی ناموجود ۴۰۴ می‌دهد", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
});

test("سرآیندهای امنیتی فرستاده می‌شوند", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("default-src 'self'");
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBeTruthy();
});

test("صفحه‌های خصوصی noindex هستند", async ({ page }) => {
  for (const path of ["/login", "/checkout"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
  }
});
