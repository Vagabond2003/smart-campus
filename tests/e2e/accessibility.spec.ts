import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { open, openSandbox } from "./helpers";

// Automated WCAG 2.2 A/AA checks. Serious and critical problems fail the test; anything milder is
// attached to the report so it stays visible without blocking.
async function scan(page: Page, name: string) {
  await expect(page.locator("[aria-busy='true']")).toHaveCount(0);
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

test("every module, signed in", async ({ page }) => {
  await openSandbox(page);
  for (const path of ["/dashboard", "/profile", "/registration/regular", "/registration/rib", "/courses", "/courses/cse-2101/discussion", "/attendance", "/results", "/routine", "/bills", "/admit-card", "/exams"]) {
    await open(page, path);
    await scan(page, path);
  }
});
