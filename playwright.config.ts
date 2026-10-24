/**
 * End-to-end tests (tests/e2e) for the main flows: login, booking, payment.
 * They run against the production build with sample data, in the Edge
 * already on the machine (no browser download needed):
 *   npm run build && npm run test:e2e
 * Set E2E_BASE_URL to test a running server (e.g. staging) instead.
 */
import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3100";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "test-results/report" }]],
  outputDir: "test-results/artifacts",
  use: {
    baseURL,
    channel: process.env.E2E_CHANNEL ?? "msedge",
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npx next start -p 3100", url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
