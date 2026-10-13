import { expect, test, type Page } from "@playwright/test";
import { signIn, uniqueId } from "./helpers";

/** Monday 5 October 2026, 10:20 in Dhaka: CSE 2101 (Arman Hossain's class) is in progress. */
const IN_CLASS = "2026-10-05T10:20";
const LAB_REPORTS = `/teach/courses/cse-2102/marks/${encodeURIComponent("Lab reports 5–8")}`;

async function exploreAsTeacher(page: Page) {
  await page.goto(`/login?now=${IN_CLASS}`);
  await page.getByRole("button", { name: "Explore as a teacher" }).click();
  await expect(page).toHaveURL(/\/teach$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Good morning, Arman");
}

async function switchView(page: Page, to: "student" | "teacher") {
  await page.getByRole("button", { name: /^Account: / }).click();
  await page.getByRole("menuitem", { name: `Switch to ${to} view` }).click();
  await expect(page).toHaveURL(to === "student" ? /\/dashboard$/ : /\/teach$/);
}

/** Marks the student the visitor plays absent: Mahir Faisal in the sandbox, or an activated account's own name. */
async function takeRollWithStudentAbsent(page: Page, name = "Mahir Faisal") {
  await page.getByRole("link", { name: "Take roll" }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Take roll");
  const mahir = page.getByRole("button", { name: new RegExp(`^Roll \\d{3}, ${name}`) });
  await mahir.click();
  await expect(mahir).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("status").filter({ hasText: "present" })).toContainText("44 present · 1 absent");
  await page.getByRole("button", { name: "Save roll" }).click();
  await expect(page).toHaveURL(/\/teach\/courses\/cse-2101\/roll$/);
}

async function publishLabReports(page: Page, name = "Mahir Faisal") {
  await page.goto(LAB_REPORTS);
  await page.getByLabel(name).fill("7");
  await page.getByLabel("Fahim Ahmed").fill("9");
  await page.getByRole("button", { name: "Publish marks" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Publish to 45 students" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Published", { exact: true }).first()).toBeVisible();
}

// Both sides of one sandbox: what the teacher does lands on the student, and back again.
test("the teacher's roll, marks, post and reminder reach the student, and the student's registration reaches the advisor", async ({ page }) => {
  await exploreAsTeacher(page);

  // The section watch: Mahir is under the line in CSE 2105, and hasn't registered his backlog course.
  await expect(page.getByRole("link", { name: /^Roll 042, Mahir Faisal \(sample student\)\. CSE 2105 attendance/ })).toBeVisible();
  const notRegistered = page.getByRole("region", { name: "Waiting on you" }).getByRole("listitem").filter({ hasText: "Mahir Faisal" });
  await notRegistered.getByRole("button", { name: "Remind" }).click();
  await expect(notRegistered.getByText("Reminded")).toBeVisible();

  await takeRollWithStudentAbsent(page);
  await expect(page.getByRole("row").filter({ hasText: "Mon 5 Oct" }).getByText("Taken by you")).toBeVisible();

  await publishLabReports(page);

  await page.goto("/teach/courses/cse-2101/discussion");
  await page.getByRole("button", { name: "Write a post for CSE 2101" }).click();
  await page.getByLabel("Title", { exact: true }).fill("Class Test 03: syllabus");
  await page.getByLabel("Post", { exact: true }).fill("Chapter 8, sections 8.1 to 8.6.\n\n- Bring a pencil\n- No calculators");
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Class Test 03: syllabus" })).toBeVisible();

  // The student side of the same sandbox.
  await switchView(page, "student");
  await page.getByRole("button", { name: /^Notifications, \d+ new/ }).click();
  for (const title of ["Your advisor sent a reminder", "Lab reports 5–8 marks published for CSE 2102", "Marked absent in CSE 2101"]) {
    await expect(page.getByText(title)).toBeVisible();
  }
  await expect(page.getByText(/^Class Test 03: syllabus: Chapter 8/)).toBeVisible();
  await page.keyboard.press("Escape");

  await page.goto("/courses/cse-2102/assessments");
  await expect(page.getByRole("row").filter({ hasText: "Lab reports 5–8" })).toContainText("7/10");
  await page.goto("/courses/cse-2101/attendance");
  await expect(page.getByRole("row").filter({ hasText: "5 Oct 2026" })).toContainText("Absent");
  await page.goto("/courses/cse-2101/discussion");
  await expect(page.getByText("Class Test 03: syllabus")).toBeVisible();

  // The student registers; the advisor approves; the student sees it.
  await page.goto("/registration/rib");
  await page.getByRole("button", { name: "Register 1 course" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /^Confirm/ }).click();
  await expect(page.getByRole("dialog").getByText("Registration received")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).first().click();
  await expect(page.getByText(/Waiting for Arman Hossain, your advisor, to approve it/)).toBeVisible();

  await switchView(page, "teacher");
  await page.goto("/teach/approvals");
  const row = page.getByRole("listitem").filter({ hasText: "Mahir Faisal" }).filter({ has: page.getByRole("button", { name: "Approve" }) });
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByRole("region", { name: "Decided" }).getByText("Mahir Faisal")).toBeVisible();

  await switchView(page, "student");
  await page.goto("/registration/rib");
  await expect(page.getByText("Approved", { exact: true })).toBeVisible();
  await expect(page.getByText(/approved by Arman Hossain, your advisor/)).toBeVisible();
});

// An activated account keeps its sandbox campus: the teacher's work comes back after a reload and a fresh sign-in.
test("an activated account's roll and published marks are kept", async ({ page }) => {
  const account = { id: uniqueId(), name: "Nadia Rahman", password: "teacher-pass-2026" };
  await page.goto(`/activate?now=${IN_CLASS}`);
  await page.getByLabel("Student ID").fill(account.id);
  await page.getByLabel("Full name").fill(account.name);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Activate account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await switchView(page, "teacher");

  await takeRollWithStudentAbsent(page, account.name);
  await publishLabReports(page, account.name);

  await page.reload();
  await expect(page.getByText("Published", { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel(account.name)).toHaveValue("7");

  await page.getByRole("button", { name: /^Account: / }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await signIn(page, account.id, account.password);
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto("/teach/courses/cse-2101/roll");
  await expect(page.getByRole("row").filter({ hasText: "Mon 5 Oct" }).getByText("Taken by you")).toBeVisible();
  // The account's own name is the student; the absence shows on their side.
  await page.goto("/courses/cse-2101/attendance");
  await expect(page.getByRole("row").filter({ hasText: "5 Oct 2026" })).toContainText("Absent");
});
