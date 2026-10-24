import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PUBLIC = ["/", "/sport", "/book/padel", "/book/beach", "/coaches", "/terms", "/privacy", "/login"];

for (const path of PUBLIC) {
  test(`${path}: باز می‌شود، بدون خطا و بدون مشکل جدی دسترس‌پذیری`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.waitForLoadState("networkidle").catch(() => undefined);
    expect(errors, errors.join("\n")).toEqual([]);

    // WebGL canvases and decorative 3D are left out; everything else must have no serious or critical issue.
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).exclude("canvas").analyze();
    const bad = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
  });
}

test("در موبایل صفحه از عرض بیرون نمی‌زند", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of PUBLIC) {
    await page.goto(path);
    await page.waitForLoadState("networkidle").catch(() => undefined);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${path} is ${overflow}px wider than the screen`).toBeLessThanOrEqual(1);
  }
});

test("robots، sitemap و llms.txt", async ({ request }) => {
  expect((await request.get("/robots.txt")).status()).toBe(200);
  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain("<urlset");
  expect(await (await request.get("/llms.txt")).text()).toContain("## Prices");
});
