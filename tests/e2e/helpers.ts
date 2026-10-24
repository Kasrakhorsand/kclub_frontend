import { expect, type Page } from "@playwright/test";

/** Test numbers from the sample data (see CLAUDE.md). */
export const PHONES = { player: "09121234567", desk: "09120000001", admin: "09120000002" };

/** Sign in with an SMS code (sample data accepts any 5 digits). */
export async function login(page: Page, phone: string, next = "/panel") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.locator("#ph").fill(phone);
  await page.getByRole("button", { name: "ادامه" }).click();
  await page.getByLabel("کد تأیید").fill("12345");
  await page.getByRole("button", { name: "تأیید و ورود" }).click();
}

/** Open a sport's booking page and put the first free session on the first free court in the cart. */
export async function addFirstFreeSession(page: Page, sport = "padel") {
  await page.goto(`/book/${sport}`);
  // Today's sessions may be over: walk the date strip until a day has a free hour.
  const days = page.locator("button.dc:not([disabled])");
  await expect(days.first()).toBeVisible();
  const count = await days.count();
  for (let i = 0; i < count; i++) {
    await days.nth(i).click();
    const hour = page.locator("button.ts.free").first();
    if (await hour.isVisible().catch(() => false)) {
      await hour.click();
      break;
    }
  }
  const court = page.locator("#courtpick button.cp:not([disabled])").first();
  await expect(court).toBeVisible();
  await court.click();
  await expect(court).toHaveAttribute("aria-label", /در سبد شما/);
}
