import { expect, test } from "@playwright/test";
import { activate, open, signIn, uniqueId } from "./helpers";

// One student's whole term, end to end, against the emulators: everything they do must survive a
// reload and a fresh sign-in, because it lives in their own Firestore record.
test("an activated student's registration, payment and comment are kept", async ({ page }) => {
  const account = { id: uniqueId(), name: "Tanvir Ahmed", password: "journey-pass-2026" };
  await activate(page, account);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Good morning, Tanvir");

  // Register for the RIB exam: the required backlog course is pre-selected.
  await open(page, "/registration/rib");
  await page.getByRole("button", { name: "Register 1 course" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /^Confirm/ }).click();
  await expect(page.getByRole("dialog").getByText("Registration received")).toBeVisible();
  await page.getByRole("link", { name: "Go to Bills" }).click();

  // Pay the new fee from its own row in the statement.
  const ribRow = page.getByRole("listitem").filter({ has: page.getByRole("button", { name: /RIB fee, RIB Exam of Summer 2026/ }) });
  const billNumber = (await ribRow.getByText(/^Bill \d{10}$/).innerText()).replace("Bill ", "");
  await ribRow.getByRole("button", { name: /RIB fee, RIB Exam of Summer 2026/ }).click();
  await ribRow.getByRole("button", { name: /^Pay/ }).click();
  const payDialog = page.getByRole("dialog", { name: "Pay dues" });
  await payDialog.getByRole("button", { name: /^Pay/ }).click();
  await expect(page.getByRole("dialog").getByText("Payment received")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).first().click();

  // Comment on a course post.
  const comment = `Is the lab report due Friday? (${account.id.slice(-4)})`;
  await open(page, "/courses/cse-2101/discussion");
  const box = page.getByRole("textbox", { name: "Write a comment" }).first();
  await box.fill(comment);
  await box.press("Enter");
  await expect(page.getByText(comment)).toBeVisible();

  // A reload starts the app from nothing: what's on screen now came back from Firestore.
  await page.reload();
  await expect(page.getByText(comment)).toBeVisible();
  await open(page, "/bills");
  await expect(page.getByText(`For bill ${billNumber}`, { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: /RIB fee, RIB Exam of Summer 2026/ })).not.toContainText("Due");

  // Sign out, then back in.
  await page.getByRole("button", { name: /^Account: Tanvir Ahmed/ }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await signIn(page, account.id, account.password);
  await expect(page).toHaveURL(/\/dashboard/);
  await open(page, "/registration/rib");
  await expect(page.getByRole("button", { name: "Update registration" })).toBeVisible();
});
