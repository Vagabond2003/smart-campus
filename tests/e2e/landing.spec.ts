import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openSandbox, PINNED } from "./helpers";

// The front door: a short arrival once per visit, then the sign-in page it was playing over.

test("with reduced motion the front door opens straight onto sign-in", async ({ page }) => {
  await page.goto(`/?now=${PINNED}`);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip intro" })).toHaveCount(0);
});

test("signed-in students go straight to their dashboard", async ({ page }) => {
  await openSandbox(page);
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test.describe("with motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("plays once, then hands over to sign-in with the notice in place", async ({ page }) => {
    await page.goto(`/?now=${PINNED}`);
    await expect(page.getByRole("button", { name: "Skip intro" })).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);

    await expect(page).toHaveURL(/\/login$/, { timeout: 12_000 });
    await expect(page.getByRole("note")).toContainText("Unofficial concept");
    await expect(page.getByLabel("Student ID")).toBeEditable();

    // Once per visit: coming back to the front door in the same tab goes straight in.
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: "Skip intro" })).toHaveCount(0);
  });

  test("Skip intro goes straight to sign-in", async ({ page }) => {
    await page.goto(`/?now=${PINNED}`);
    await page.getByRole("button", { name: "Skip intro" }).click();
    await expect(page).toHaveURL(/\/login$/, { timeout: 3_000 });
    await expect(page.getByLabel("Student ID")).toBeEditable();
  });

  test("any key skips, and the cursor is waiting in Student ID", async ({ page }) => {
    await page.goto(`/?now=${PINNED}`);
    await expect(page.getByRole("button", { name: "Skip intro" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/login$/, { timeout: 3_000 });
    await expect(page.getByLabel("Student ID")).toBeFocused();
  });
});
