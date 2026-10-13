import { expect, test, type Page } from "@playwright/test";
import { open, openSandbox } from "./helpers";

/** Pages in a PDF the browser printed: every printable document is one sheet. */
const pageCount = (pdf: Buffer) => (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;

/**
 * Papers a print dialog might end up with, including Safari's own header and footer margins.
 * iOS ignores the page size a page asks for and lets you flip orientation in the dialog.
 */
const PAPERS = [
  { name: "as the page asks", opts: { preferCSSPageSize: true } },
  { name: "A4 portrait, Safari margins", opts: { format: "A4", displayHeaderFooter: true, margin: { top: "18mm", bottom: "18mm", left: "12mm", right: "12mm" } } },
  { name: "Letter landscape, Safari margins", opts: { format: "Letter", landscape: true, displayHeaderFooter: true, margin: { top: "18mm", bottom: "18mm", left: "12mm", right: "12mm" } } },
] as const;

async function printsOnOneLightPage(page: Page, path: string) {
  await open(page, path);
  await expect(page.locator("[data-print-fit]")).toHaveCount(1);
  // the theme switches to light only for the print, and back afterwards
  expect(await page.evaluate(() => (dispatchEvent(new Event("beforeprint")), document.documentElement.dataset.theme))).toBe("light");
  expect(await page.evaluate(() => (dispatchEvent(new Event("afterprint")), document.documentElement.dataset.theme))).toBe("dark");
  for (const paper of PAPERS) {
    expect(pageCount(await page.pdf(paper.opts)), `${path}, ${paper.name}`).toBe(1);
  }
  // Safari doesn't use the named landscape page: the routines must fit a portrait sheet too
  await page.addStyleTag({ content: "@media print { .print-landscape { page: auto !important; } }" });
  expect(pageCount(await page.pdf(PAPERS[1].opts)), `${path}, portrait without the landscape page`).toBe(1);
}

// A visitor in the dark theme still prints the daylight rendition, and each document fits one sheet.
test("prints every document on one light page", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("sc.display", JSON.stringify({ theme: "dark", text: "m" })));
  await openSandbox(page);
  for (const path of ["/admit-card", "/exams", "/routine", "/bills/receipts/pay4"]) await printsOnOneLightPage(page, path);
});

test("prints the teacher's routine on one light page", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("sc.display", JSON.stringify({ theme: "dark", text: "m" })));
  await open(page, "/login");
  await page.getByRole("button", { name: "Explore as a teacher" }).click();
  await expect(page).toHaveURL(/\/teach$/);
  await printsOnOneLightPage(page, "/teach/routine");
  await expect(page.getByRole("button", { name: "Print or save PDF" })).toBeVisible();
});
