import { expect, test } from "@playwright/test";
import { open, openSandbox } from "./helpers";

/** Pages in a PDF the browser printed: every printable document is one sheet. */
const pageCount = (pdf: Buffer) => (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;

// A visitor in the dark theme still prints the daylight rendition, and each document fits one sheet.
test("prints every document on one light page", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("sc.display", JSON.stringify({ theme: "dark", text: "m" })));
  await openSandbox(page);
  for (const path of ["/admit-card", "/exams", "/routine", "/bills/receipts/pay4"]) {
    await open(page, path);
    await expect(page.locator("[data-print-fit]")).toHaveCount(1);
    // the theme switches to light only for the print, and back afterwards
    expect(await page.evaluate(() => (dispatchEvent(new Event("beforeprint")), document.documentElement.dataset.theme))).toBe("light");
    expect(await page.evaluate(() => (dispatchEvent(new Event("afterprint")), document.documentElement.dataset.theme))).toBe("dark");
    expect(pageCount(await page.pdf({ format: "A4", preferCSSPageSize: true })), path).toBe(1);
  }
});
