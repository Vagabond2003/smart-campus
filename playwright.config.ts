import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests. `npm run test:e2e` starts the Auth and Firestore emulators, then Playwright starts
 * two copies of the portal: one wired to the emulators (real accounts, nothing leaves this machine)
 * and one with no Firebase config at all, as a fresh clone of the repo runs.
 *
 * Locally the tests drive your installed Google Chrome; CI installs Playwright's Chromium. Set
 * PW_CHANNEL=chromium to use Playwright's own browser here too (after `npx playwright install chromium`).
 */
const CI = !!process.env.CI;
const channel = process.env.PW_CHANNEL ?? (CI ? undefined : "chrome");
const browser = channel === "chromium" ? undefined : channel;

export const EMULATED = "http://localhost:5176";
export const OFFLINE = "http://localhost:5177";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: EMULATED,
    channel: browser,
    timezoneId: "Asia/Dhaka",
    locale: "en-GB",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: browser } },
    // The long journey drives the desktop account menu; phones get the notice, sandbox and accessibility checks.
    { name: "phone", use: { ...devices["Pixel 7"], channel: browser }, testIgnore: /student-journey/ },
  ],
  webServer: [
    { command: "npm run dev:emulated -- --port 5176 --strictPort", url: EMULATED, reuseExistingServer: !CI, timeout: 120_000 },
    { command: "npm run dev:offline -- --port 5177 --strictPort", url: OFFLINE, reuseExistingServer: !CI, timeout: 120_000 },
  ],
});
