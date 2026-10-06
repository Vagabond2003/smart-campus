import { expect, test } from "@playwright/test";
import { OFFLINE } from "../../playwright.config";
import { open } from "./helpers";

// With no Firebase config the portal still works, on sample data only, as a fresh clone does.
test.use({ baseURL: OFFLINE });

test("runs on sample data with the original sample login", async ({ page }) => {
  await open(page, "/login");
  await expect(page.getByText("This copy runs on sample data.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Activate your account" })).toHaveCount(0);
  await expect(page.getByRole("note")).toContainText("Unofficial concept");

  await page.getByRole("button", { name: "Use sample account" }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Good morning, Mahir");
});
