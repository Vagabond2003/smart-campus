import { expect, test } from "@playwright/test";

// The roll is taken standing in class, usually on a phone: tap the absentees, save.
test("takes the roll in the class that's in progress", async ({ page }) => {
  await page.goto("/login?now=2026-10-05T10:20");
  await page.getByRole("button", { name: "Explore as a teacher" }).click();
  await expect(page).toHaveURL(/\/teach$/);

  await page.getByRole("region", { name: "Today" }).getByRole("link", { name: "Take roll" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Take roll");

  // Find by roll number, then mark one absent and one late.
  await page.getByLabel("Find a roll or name").fill("007");
  await page.getByRole("button", { name: /^Roll 007,/ }).click();
  await page.getByLabel("Find a roll or name").fill("");
  await page.getByRole("tab", { name: "Late" }).click();
  await page.getByRole("button", { name: /^Roll 042,/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "present" })).toContainText("44 present · 1 absent · 1 late");

  await page.getByRole("button", { name: "Save roll" }).click();
  await expect(page).toHaveURL(/\/teach\/courses\/cse-2101\/roll$/);
  await expect(page.getByText("Roll saved for CSE 2101")).toBeVisible();
});
