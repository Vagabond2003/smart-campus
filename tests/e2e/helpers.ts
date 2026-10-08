import { expect, type Page } from "@playwright/test";

/** Wednesday 7 October 2026, 09:20 in Dhaka: CSE 2103 is in progress. */
export const PINNED = "2026-10-07T09:20";

/** Opens a page with the portal's clock pinned (the pin then lasts for the whole tab). */
export async function open(page: Page, path: string) {
  await page.goto(`${path}${path.includes("?") ? "&" : "?"}now=${PINNED}`);
}

let counter = 0;
/** A fresh 16-digit ID per test, outside the sample range (9999 2026 0000 xxxx). */
export function uniqueId() {
  counter += 1;
  const tail = `${Date.now()}${counter}${Math.floor(Math.random() * 1000)}`.slice(-12).padStart(12, "0");
  return `2026${tail}`;
}

export async function activate(page: Page, account: { id: string; name: string; password: string }) {
  await open(page, "/activate");
  await page.getByLabel("Student ID").fill(account.id);
  await page.getByLabel("Full name").fill(account.name);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Activate account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function signIn(page: Page, id: string, password: string) {
  await page.getByLabel("Student ID").fill(id);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

export async function openSandbox(page: Page) {
  await open(page, "/login");
  await page.getByRole("button", { name: "Use sample account" }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Good morning, Mahir");
}
