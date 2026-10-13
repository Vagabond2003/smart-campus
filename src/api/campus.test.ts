import { beforeEach, describe, expect, it } from "vitest";
import * as seed from "../data/seed";
import * as campus from "../data/campus";
import { decideRegistration, registerRib, remind, resetStore, saveGrades, saveMarks, saveRoll, store } from "./store";
import { myAssessments, myAssignments, myAttendance, sheetOf } from "./records";
import { attendanceSummary } from "./derive";
import { advisees, approvals, courseAttendance, duties, meetingByKey, teacherBoardItems, teachingOn } from "./teach";
import { now } from "../lib/clock";
import { shortName } from "../pages/teach/parts";

beforeEach(() => resetStore());

const lastHeld = (code: string) => campus.termSessions.filter((s) => s.code === code && s.end <= now()).at(-1)!;

describe("the campus agrees with the sample student's own records", () => {
  it("reads the student's attendance from the section's rolls, class for class", () => {
    expect(myAttendance()).toEqual(seed.attendance);
  });

  it("keeps every published score and highest the student has always seen", () => {
    for (const a of seed.assessments.filter((x) => x.state === "published")) {
      const sheet = sheetOf(a.code, a.name);
      expect(sheet.state).toBe("published");
      expect(sheet.scores[campus.ME]).toBe(a.obtained);
      expect(Math.max(...Object.values(sheet.scores))).toBe(a.highest);
    }
    expect(myAssessments()).toEqual(seed.assessments);
  });

  it("has a section with real variety: some students under the line, some carrying RIB courses", () => {
    const list = advisees();
    expect(list).toHaveLength(campus.roster.length);
    expect(list.filter((a) => a.under.length).length).toBeGreaterThan(1);
    expect(list.filter((a) => a.record.carries.length).length).toBeGreaterThan(3);
    expect(approvals(list).waiting.length).toBeGreaterThan(0);
  });
  it("gives every student in the section a roster name of their own", () => {
    const names = campus.roster.map((p) => shortName(p.name));
    expect(new Set(names).size).toBe(campus.roster.length);
  });
});

describe("what the teacher does reaches the student", () => {
  it("a roll marking the student absent lowers their attendance and tells them", () => {
    const s = lastHeld("CSE 2101");
    const key = campus.sessionKey(s);
    const before = attendanceSummary().find((r) => r.code === "CSE 2101")!;
    const { notice } = saveRoll(key, [campus.ME, "s-3"], []);
    const after = attendanceSummary().find((r) => r.code === "CSE 2101")!;
    expect(after.absent).toBe(before.absent + (seed.attendance.some((a) => a.code === "CSE 2101" && a.date.getTime() === s.start.getTime() && a.status === "A") ? 0 : 1));
    expect(notice).toMatchObject({ title: "Marked absent in CSE 2101", to: "/attendance" });
    expect(meetingByKey(key)?.status).toBe("taken");
    expect(courseAttendance("CSE 2101")["s-3"].absent).toBeGreaterThan(0);
  });

  it("leaves today's classes of the teacher's own courses for the teacher to take", () => {
    for (const m of teachingOn(now())) expect(m.status === "recorded").toBe(false);
  });

  it("a draft mark sheet stays private; publishing shows the score and the class highest", () => {
    const name = "Lab reports 5–8";
    const scores = { [campus.ME]: 7, "s-1": 9, "s-2": 6 };
    saveMarks("CSE 2102", name, scores, false);
    expect(myAssessments().find((a) => a.code === "CSE 2102" && a.name === name)).toMatchObject({ obtained: null, state: "pending" });
    const { notice } = saveMarks("CSE 2102", name, scores, true);
    expect(myAssessments().find((a) => a.code === "CSE 2102" && a.name === name)).toMatchObject({ obtained: 7, highest: 9, state: "published", submittedBy: campus.teacher.name });
    expect(notice).toMatchObject({ title: `${name} marks published for CSE 2102`, body: "You scored 7 out of 10." });
  });

  it("published marks stay published when corrected", () => {
    saveMarks("CSE 2102", "Lab reports 5–8", { [campus.ME]: 7 }, true);
    saveMarks("CSE 2102", "Lab reports 5–8", { [campus.ME]: 8 }, false);
    expect(store.marks[campus.assessmentKey("CSE 2102", "Lab reports 5–8")].state).toBe("published");
  });

  it("publishing an assignment's grades grades the student and fills its assessment", () => {
    saveGrades("asg-2101-1", { [campus.ME]: 13, "s-4": 15 }, true);
    expect(myAssignments().find((a) => a.id === "asg-2101-1")).toMatchObject({ state: "graded", marks: 13 });
    expect(myAssessments().find((a) => a.code === "CSE 2101" && a.name === "Assignment")).toMatchObject({ obtained: 13, highest: 15, state: "published" });
  });
});

describe("advising", () => {
  it("puts the student's RIB registration in the advisor's queue, and the decision back on the student", () => {
    expect(approvals().unregistered.map((a) => a.record.person.id)).toContain(campus.ME);
    registerRib(["MATH 1243"]);
    expect(approvals().waiting.map((a) => a.record.person.id)).toContain(campus.ME);
    expect(store.notices.find((n) => n.audience === "teacher" && n.title.startsWith(seed.student.name))).toBeTruthy();

    const { notice } = decideRegistration(campus.ME, "returned", "Add PHY 1131 too.");
    expect(notice).toMatchObject({ title: "RIB registration returned", tone: "danger" });
    expect(advisees().find((a) => a.record.person.id === campus.ME)?.rib).toMatchObject({ state: "returned", note: "Add PHY 1131 too." });
  });

  it("puts a changed registration back in the queue, even after a decision", () => {
    registerRib(["MATH 1243"]);
    decideRegistration(campus.ME, "approved");
    expect(approvals().waiting.map((a) => a.record.person.id)).not.toContain(campus.ME);
    // a registration changed later is a new one
    store.ribOffer.submittedAt = new Date(now().getTime() + 60_000);
    expect(approvals().waiting.map((a) => a.record.person.id)).toContain(campus.ME);
  });

  it("reminds an advisee who hasn't registered", () => {
    const { notice } = remind(campus.ME);
    expect(store.reminded).toContain(campus.ME);
    expect(notice).toMatchObject({ title: "Your advisor sent a reminder", to: "/registration/rib" });
  });
});

describe("the teacher's day", () => {
  it("lists what's owed, oldest first, and puts it on the board", () => {
    const owed = duties();
    expect(owed.some((d) => d.kind === "marks" && d.code === "CSE 2102")).toBe(true);
    expect(owed.some((d) => d.kind === "grading" && d.code === "CSE 2101")).toBe(true);
    expect(owed.map((d) => d.since.getTime())).toEqual(owed.map((d) => d.since.getTime()).sort((a, b) => a - b));
    expect(teacherBoardItems().some((i) => i.kind === "approval")).toBe(true);
  });
});
