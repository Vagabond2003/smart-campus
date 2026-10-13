/**
 * Resolved records: the campus's base records (src/data/campus.ts) with the visitor's own changes
 * from the store laid over them. Both sides of the portal read these, so a roll or a mark sheet
 * means the same thing to the teacher who wrote it and the student who reads it.
 */
import * as seed from "../data/seed";
import * as campus from "../data/campus";
import type { Assessment, Assignment, AttendanceRecord, Bundle } from "../data/types";
import { store } from "./store";

/* ─── Rolls ──────────────────────────────────────────────────────────────── */

export interface ResolvedRoll {
  absent: string[];
  late: string[];
  /** taken: by the visitor as the teacher; recorded: by the course teacher before today. */
  source: "taken" | "recorded";
  takenAt?: Date;
  editedAt?: Date;
}

export function rollOf(key: string): ResolvedRoll | null {
  const mine = store.rolls[key];
  if (mine) return { absent: mine.absent, late: mine.late, source: "taken", takenAt: mine.takenAt, editedAt: mine.editedAt };
  const base = campus.baseRolls.get(key);
  return base ? { ...base, source: "recorded" } : null;
}

/** The sample student's class-by-class attendance, oldest first: every meeting with a roll. */
export function myAttendance(): AttendanceRecord[] {
  const out: AttendanceRecord[] = [];
  for (const s of campus.termSessions) {
    const roll = rollOf(campus.sessionKey(s));
    if (!roll) continue;
    const absent = roll.absent.includes(campus.ME);
    const late = !absent && roll.late.includes(campus.ME);
    out.push({ code: s.code, date: s.start, period: s.period, status: absent ? "A" : "P", remarks: late ? (roll.source === "recorded" ? "Late, 10 min" : "Late") : undefined });
  }
  return out;
}

/* ─── Mark sheets ────────────────────────────────────────────────────────── */

export interface ResolvedSheet {
  scores: Record<string, number>;
  state: "published" | "draft" | "none";
  publishedAt?: Date;
  updatedAt?: Date;
}

export function sheetOf(code: string, name: string): ResolvedSheet {
  const key = campus.assessmentKey(code, name);
  const mine = store.marks[key];
  if (mine) return { scores: mine.scores, state: mine.state, publishedAt: mine.publishedAt, updatedAt: mine.updatedAt };
  const base = campus.baseSheets[key];
  return base ? { scores: base, state: "published" } : { scores: {}, state: "none" };
}

export const highestOf = (scores: Record<string, number>) => {
  const v = Object.values(scores);
  return v.length ? Math.max(...v) : null;
};

/** The sample student's marks. A published sheet without their score means they were absent. */
export function myAssessments(): Assessment[] {
  return seed.assessments.map((a) => {
    const mine = store.marks[campus.assessmentKey(a.code, a.name)];
    if (!mine || mine.state !== "published") return a;
    const teacherName = seed.teachers[seed.offeringByCode[a.code]?.teacherIds[0] ?? campus.TEACHER_ID]?.name;
    return { ...a, obtained: mine.scores[campus.ME] ?? null, highest: highestOf(mine.scores), submittedBy: teacherName, state: "published" as const };
  });
}

/* ─── Assignments, lectures, materials ───────────────────────────────────── */

/** The student's assignments, with whatever they've handed in this visit. */
export function myAssignments(): Assignment[] {
  return store.assignments.map((a) => {
    const sub = store.submissions[a.id];
    return sub && a.state === "open" ? { ...a, state: "submitted" as const, submittedAt: sub.at } : a;
  });
}

export const allLectures = (): Bundle[] => [...store.bundles.filter((b) => b.section === "lectures"), ...seed.lectures];
export const allMaterials = (): Bundle[] => [...store.bundles.filter((b) => b.section === "materials"), ...seed.materials];
