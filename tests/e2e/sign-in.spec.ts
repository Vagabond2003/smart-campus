import { expect, test } from "@playwright/test";
import { open, openSandbox, signIn, uniqueId } from "./helpers";

test.describe("signing in", () => {
  test("every sign-in page says it isn't the BAUST portal", async ({ page }) => {
    for (const path of ["/login", "/activate", "/forgot-password"]) {
      await open(page, path);
      const notice = page.getByRole("note");
      await expect(notice).toBeVisible();
      await expect(notice).toContainText("Unofficial concept");
      await expect(notice).toContainText("Never enter your BAUST password here.");
    }
  });

  test("asks for this site's password, not the BAUST one", async ({ page }) => {
    await open(page, "/login");
    await expect(page.getByText("not your BAUST portal password")).toBeVisible();
    await expect(page.getByRole("link", { name: "Activate your account" })).toBeVisible();
  });

  test("says what to check when the ID and password don't match", async ({ page }) => {
    await open(page, "/login");
    await signIn(page, uniqueId(), "not-a-real-password");
    await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveText("That ID and password don't match an activated account. Check both, or activate the ID first.");
    await expect(page).toHaveURL(/\/login/);
  });

  test("won't activate the sample student's ID", async ({ page }) => {
    await open(page, "/activate");
    await page.getByLabel("Student ID").fill("9999 2026 0000 1042");
    await page.getByLabel("Full name").fill("Someone");
    await page.getByLabel("Password", { exact: true }).fill("a-long-enough-password");
    await page.getByRole("button", { name: "Activate account" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveText("That ID belongs to the sample student. Use it from the sign-in page.");
  });

  test("the sample account opens a private sandbox", async ({ page }) => {
    await openSandbox(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
