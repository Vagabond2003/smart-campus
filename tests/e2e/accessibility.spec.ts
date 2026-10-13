import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { open, openSandbox } from "./helpers";

// Automated WCAG 2.2 A/AA checks. Serious and critical problems fail the test; anything milder is
// attached to the report so it stays visible without blocking.
async function scan(page: Page, name: string) {
  await expect(page.locator("[aria-busy='true']")).toHaveCount(0);
  // Pages fade in and their panels rise; contrast is measured once everything has arrived.
  await page.waitForFunction(
    () =>
      document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity) &&
      [...document.querySelectorAll<HTMLElement>("main *")].every((el) => el.style.opacity === "" || el.style.opacity === "1"),
  );
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const blocking = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const summary = violations.map((v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.length}) ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  if (summary.length) await test.info().attach(`axe: ${name}`, { body: summary.join("\n"), contentType: "text/plain" });
  // Soft, so one run reports every page's problems rather than stopping at the first.
  expect.soft(blocking.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`), name).toEqual([]);
}

test("sign-in pages", async ({ page }) => {
  for (const path of ["/login", "/activate", "/forgot-password"]) {
    await open(page, path);
    await scan(page, path);
  }
});

test("every teacher screen", async ({ page }) => {
  test.setTimeout(120_000); // fifteen screens, each scanned in full
  await open(page, "/login");
  await page.getByRole("button", { name: "Explore as a teacher" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^Good (morning|afternoon|evening), Arman$/);
  for (const path of [
    "/teach",
    "/teach/courses",
    "/teach/courses/cse-2101/roll",
    "/teach/courses/cse-2101/marks",
    "/teach/courses/cse-2101/discussion",
    "/teach/courses/cse-2101/lectures",
    "/teach/courses/cse-2101/assignments",
    "/teach/courses/cse-2101/people",
    `/teach/courses/cse-2102/marks/${encodeURIComponent("Lab reports 5–8")}`,
    "/teach/courses/cse-2101/assignments/asg-2101-1",
    "/teach/routine",
    "/teach/advising",
    "/teach/approvals",
    "/teach/students/me",
  ]) {
    await open(page, path);
    await scan(page, path);
  }
  // A past meeting's roll
  await open(page, "/teach/courses/cse-2101/roll");
  await page.getByRole("link", { name: /^Edit the roll for/ }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Edit roll");
  await scan(page, "/teach/roll");
});

test("every module, signed in", async ({ page }) => {
  test.setTimeout(120_000);
  await openSandbox(page);
  for (const path of ["/dashboard", "/profile", "/registration/regular", "/registration/rib", "/courses", "/courses/cse-2101/discussion", "/attendance", "/results", "/routine", "/bills", "/admit-card", "/exams"]) {
    await open(page, path);
    await scan(page, path);
  }
});
