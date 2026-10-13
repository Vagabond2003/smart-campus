/** Pure selectors for the teacher's side of the sandbox campus. */
import * as seed from "../data/seed";
import * as campus from "../data/campus";
import type { Assessment, Assignment, ClassSession, Person } from "../data/types";
import { addDays, atTime, now, sameDay, startOfDay } from "../lib/clock";
import { store } from "./store";
import { rollOf, sheetOf, type ResolvedRoll } from "./records";
import { dayMonth, hhmm, roomShort, sessionsOn, weekdayShort, type AttendanceStanding, type BoardItem } from "./derive";

const LINE = seed.ATTENDANCE_LINE;
export const standingOf = (pct: number): AttendanceStanding => (pct < LINE ? "below" : pct < LINE + 7 ? "watch" : "ok");

/* ─── Class meetings and rolls ───────────────────────────────────────────── */

export type RollStatus = "taken" | "recorded" | "due" | "upcoming";

export interface MeetingRow {
  session: ClassSession;
  key: string;
  roll: ResolvedRoll | null;
  status: RollStatus;
  /** In progress right now. */
  live: boolean;
}

export function meeting(session: ClassSession, at: Date = now()): MeetingRow {
  const key = campus.sessionKey(session);
  const roll = rollOf(key);
  const status: RollStatus = roll ? (roll.source === "taken" ? "taken" : "recorded") : session.start <= at ? "due" : "upcoming";
  return { session, key, roll, status, live: session.start <= at && at < session.end };
}

/** The teacher's own classes on a day. */
export function teachingOn(day: Date, at: Date = now()): MeetingRow[] {
  return sessionsOn(day)
    .filter((s) => campus.teaches(s.code))
    .map((s) => meeting(s, at));
}

/** Every meeting of a course so far, newest first, plus today's still to come. */
export function courseMeetings(code: string, at: Date = now()): MeetingRow[] {
  const end = addDays(startOfDay(at), 1);
  return campus.termSessions
    .filter((s) => s.code === code && s.start < end)
    .map((s) => meeting(s, at))
    .reverse();
}

export function meetingByKey(key: string) {
  const s = campus.sessionByKey(key);
  return s ? meeting(s) : undefined;
}

/* ─── Attendance by person ───────────────────────────────────────────────── */

export interface PersonAttendance {
  code: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  pct: number;
  standing: AttendanceStanding;
}

/** Each roster member's attendance in one course, from every roll so far. */
export function courseAttendance(code: string): Record<string, PersonAttendance> {
  const out: Record<string, PersonAttendance> = Object.fromEntries(campus.roster.map((p) => [p.id, { code, present: 0, absent: 0, late: 0, total: 0, pct: 100, standing: "ok" as AttendanceStanding }]));
  for (const s of campus.termSessions) {
    if (s.code !== code) continue;
    const roll = rollOf(campus.sessionKey(s));
    if (!roll) continue;
    const absent = new Set(roll.absent);
    const late = new Set(roll.late);
    for (const p of campus.roster) {
      const row = out[p.id];
      row.total++;
      if (absent.has(p.id)) row.absent++;
      else {
        row.present++;
        if (late.has(p.id)) row.late++;
      }
    }
  }
  for (const row of Object.values(out)) {
    row.pct = row.total ? (row.present / row.total) * 100 : 100;
    row.standing = standingOf(row.pct);
  }
  return out;
}

/** Every course's attendance for every advisee, computed once per call. */
export function sectionAttendance() {
  const byCourse = Object.fromEntries(seed.offerings.map((o) => [o.code, courseAttendance(o.code)]));
  const byPerson: Record<string, PersonAttendance[]> = {};
  for (const p of campus.roster) byPerson[p.id] = seed.offerings.map((o) => byCourse[o.code][p.id]);
  return { byCourse, byPerson };
}

/* ─── Assessments and mark sheets ────────────────────────────────────────── */

export type SheetStatus = "published" | "draft" | "awaiting" | "upcoming";

export interface SheetRow {
  assessment: Assessment;
  scores: Record<string, number>;
  status: SheetStatus;
  entered: number;
  average: number | null;
  highest: number | null;
  publishedAt?: Date;
  updatedAt?: Date;
}

export function sheetRow(a: Assessment, at: Date = now()): SheetRow {
  const sheet = sheetOf(a.code, a.name);
  const values = Object.values(sheet.scores);
  const status: SheetStatus = sheet.state === "published" ? "published" : sheet.state === "draft" ? "draft" : a.date && a.date > at ? "upcoming" : "awaiting";
  return {
    assessment: a,
    scores: sheet.scores,
    status,
    entered: values.length,
    average: values.length ? values.reduce((s, v) => s + v, 0) / values.length : null,
    highest: values.length ? Math.max(...values) : null,
    publishedAt: sheet.publishedAt,
    updatedAt: sheet.updatedAt,
  };
}

export function courseSheets(code: string): SheetRow[] {
  return seed.assessments
    .filter((a) => a.code === code)
    .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0))
    .map((a) => sheetRow(a));
}

export const findAssessment = (code: string, name: string) => seed.assessments.find((a) => a.code === code && a.name === name);

/* ─── Assignments and their submissions ──────────────────────────────────── */

export interface SubmissionRow {
  person: Person;
  at?: Date;
  file?: string;
  size?: string;
  late: boolean;
  score?: number;
}

export function teacherAssignments(code?: string): Assignment[] {
  return store.assignments.filter((a) => a.authorId === campus.TEACHER_ID && (!code || a.code === code));
}

export function submissionsFor(a: Assignment): SubmissionRow[] {
  const base = campus.baseSubmissions[a.id] ?? [];
  const grades = store.grades[a.id]?.scores ?? {};
  return campus.roster.map((p) => {
    // The sample student's own hand-in this visit wins over the seeded one.
    const own = p.id === campus.ME ? store.submissions[a.id] : undefined;
    const sub = own ? { at: own.at, file: own.file, size: own.size, late: own.at > a.due } : base.find((s) => s.personId === p.id);
    return { person: p, at: sub?.at, file: sub?.file, size: sub?.size, late: !!sub?.late, score: grades[p.id] };
  });
}

export function gradeState(a: Assignment) {
  const g = store.grades[a.id];
  const subs = submissionsFor(a);
  const submitted = subs.filter((s) => s.at).length;
  return { state: g?.state ?? ("none" as const), submitted, graded: Object.keys(g?.scores ?? {}).length, late: subs.filter((s) => s.late).length, total: campus.roster.length, publishedAt: g?.publishedAt };
}

/* ─── Advising ───────────────────────────────────────────────────────────── */

export type RibState = "none" | "submitted" | "approved" | "returned";

export interface AdviseeStatus {
  record: campus.AdviseeRecord;
  rib: { state: RibState; at?: Date; courses: string[]; note?: string; decidedAt?: Date };
  reminded: boolean;
  /** Courses under the attendance line, and close to it. */
  under: PersonAttendance[];
  watch: PersonAttendance[];
  /** Lowest course attendance. */
  worst: PersonAttendance;
  /** The one word the section grid shows for this advisee. */
  mark: "danger" | "caution" | "ok";
  waiting: boolean;
}

/** Where an advisee's RIB registration stands, the sample student's straight from their own record. */
function ribOf(rec: campus.AdviseeRecord): AdviseeStatus["rib"] {
  const d = store.advising[rec.person.id];
  if (rec.person.id === campus.ME) {
    const offer = store.ribOffer;
    if (!offer.registered.length || !offer.submittedAt) return { state: "none", courses: [] };
    // A decision made before the student last changed their registration no longer applies.
    if (d && d.at >= offer.submittedAt) return { state: d.decision, at: offer.submittedAt, courses: offer.registered, note: d.note, decidedAt: d.at };
    return { state: "submitted", at: offer.submittedAt, courses: offer.registered };
  }
  if (rec.rib.state === "none") return { state: "none", courses: [] };
  if (d) return { state: d.decision, at: rec.rib.at, courses: rec.rib.courses, note: d.note, decidedAt: d.at };
  return { state: rec.rib.state, at: rec.rib.at, courses: rec.rib.courses };
}

/** The sample student's own RIB registration, as their advisor sees it. */
export const myRib = () => ribOf(campus.adviseeById[campus.ME]);

export function advisees(att = sectionAttendance()): AdviseeStatus[] {
  return campus.advisees.map((rec) => {
    const rows = att.byPerson[rec.person.id];
    const under = rows.filter((r) => r.standing === "below");
    const watch = rows.filter((r) => r.standing === "watch");
    const worst = [...rows].sort((a, b) => a.pct - b.pct)[0];
    const rib = ribOf(rec);
    const unregistered = rec.carries.some((c) => c.regType !== "Improvement") && (rib.state === "none" || rib.state === "returned");
    const mark = under.length || unregistered ? "danger" : watch.length || rec.carries.length ? "caution" : "ok";
    return { record: rec, rib, reminded: store.reminded.includes(rec.person.id), under, watch, worst, mark, waiting: rib.state === "submitted" };
  });
}

export function approvals(list = advisees()) {
  const byWait = (a: AdviseeStatus, b: AdviseeStatus) => (a.rib.at?.getTime() ?? 0) - (b.rib.at?.getTime() ?? 0);
  return {
    waiting: list.filter((a) => a.rib.state === "submitted").sort(byWait),
    decided: list.filter((a) => a.rib.state === "approved" || a.rib.state === "returned").sort((a, b) => (b.rib.decidedAt?.getTime() ?? b.rib.at?.getTime() ?? 0) - (a.rib.decidedAt?.getTime() ?? a.rib.at?.getTime() ?? 0)),
    unregistered: list.filter((a) => a.record.carries.some((c) => c.regType !== "Improvement") && (a.rib.state === "none" || a.rib.state === "returned")),
    deadline: store.ribOffer.deadline,
    exam: store.ribOffer.exam,
  };
}

/* ─── What the teacher owes ──────────────────────────────────────────────── */

export interface Duty {
  id: string;
  kind: "marks" | "grading" | "roll";
  code: string;
  title: string;
  detail: string;
  since: Date;
  to: string;
}

const slug = (code: string) => seed.offeringByCode[code].slug;

/** Marks waiting to be entered or published, assignments to grade, rolls not yet taken today. */
export function duties(at: Date = now()): Duty[] {
  const out: Duty[] = [];
  for (const code of campus.teachingCodes) {
    for (const row of courseSheets(code)) {
      if (row.status === "awaiting" || row.status === "draft") {
        const a = row.assessment;
        // An assignment's assessment is graded from its submissions, not typed into a sheet.
        const linked = teacherAssignments(code).find((x) => x.assessment === a.name);
        if (linked) continue;
        out.push({ id: `m-${a.code}-${a.name}`, kind: "marks", code, title: `${a.name} marks`, detail: row.status === "draft" ? `Draft · ${row.entered} of ${campus.roster.length} entered` : `Out of ${a.max} · held ${dayMonth(a.date ?? at)}, none entered yet`, since: a.date ?? at, to: `/teach/courses/${slug(code)}/marks/${encodeURIComponent(a.name)}` });
      }
    }
    for (const a of teacherAssignments(code)) {
      const g = gradeState(a);
      if (a.due <= at && g.state !== "published") {
        out.push({ id: `g-${a.id}`, kind: "grading", code, title: a.title.replace(/^Assignment (\d+): .*/, "Assignment $1"), detail: g.state === "draft" ? `Draft · ${g.graded} of ${g.submitted} graded` : `${g.submitted} handed in, ${g.late} late · due ${dayMonth(a.due)}`, since: a.due, to: `/teach/courses/${slug(code)}/assignments/${a.id}` });
      }
    }
  }
  for (const m of teachingOn(at, at)) {
    if (m.status === "due") out.push({ id: `r-${m.key}`, kind: "roll", code: m.session.code, title: "Roll", detail: `${hhmm(m.session.start)}–${hhmm(m.session.end)} · Room ${roomShort(m.session.room)}`, since: m.session.start, to: `/teach/roll/${m.key}` });
  }
  return out.sort((a, b) => a.since.getTime() - b.since.getTime());
}

/* ─── The teacher's departure board ──────────────────────────────────────── */

export function teacherBoardItems(at: Date = now()): BoardItem[] {
  const items: BoardItem[] = [];
  const today = teachingOn(at, at);
  const cur = today.find((m) => m.live);
  const upcoming = campus.termSessions.filter((s) => campus.teaches(s.code) && s.start > at)[0];
  const fmtWhen = (d: Date) => (sameDay(d, at) ? hhmm(d) : `${weekdayShort(d)} ${hhmm(d)}`);

  if (cur) {
    const o = seed.offeringByCode[cur.session.code];
    items.push({ id: `now-${cur.key}`, kind: "class", label: "Now", live: true, when: `${hhmm(cur.session.start)}–${hhmm(cur.session.end)}`, code: cur.session.code, title: o.title, place: roomShort(cur.session.room), placeLabel: "Room", target: cur.session.end, countdownPrefix: "ends", to: cur.status === "due" ? `/teach/roll/${cur.key}` : `/teach/courses/${seed.offeringByCode[cur.session.code].slug}/roll`, cta: cur.status === "due" ? "Take roll" : undefined });
  }
  if (upcoming) {
    const o = seed.offeringByCode[upcoming.code];
    items.push({ id: `next-${campus.sessionKey(upcoming)}`, kind: "class", label: "Next class", live: false, when: fmtWhen(upcoming.start), code: upcoming.code, title: o.title, place: roomShort(upcoming.room), placeLabel: "Room", target: upcoming.start, countdownPrefix: "in", to: "/teach/routine" });
  }
  const queue = approvals();
  if (queue.waiting.length) {
    items.push({ id: "approvals", kind: "approval", label: "Approvals", live: false, when: `By ${dayMonth(queue.deadline)}`, code: `${queue.waiting.length} RIB`, title: queue.waiting.length === 1 ? "registration waiting" : "registrations waiting", place: campus.SECTION_LABEL, placeLabel: "Section", target: queue.deadline, countdownPrefix: "due", to: "/teach/approvals" });
  }
  const owed = duties(at).find((d) => d.kind !== "roll");
  if (owed) {
    items.push({ id: `owed-${owed.id}`, kind: "marks", label: owed.kind === "grading" ? "Grading" : "Marks", live: false, when: `Since ${dayMonth(owed.since)}`, code: owed.code, title: owed.title, place: owed.kind === "grading" ? "Online" : "Sheet", placeLabel: "Enter in", target: atTime(addDays(startOfDay(owed.since), 7), "23:59"), countdownPrefix: "due", to: owed.to });
  }
  const duty = campus.examDuties.filter((d) => atTime(d.date, d.start) > at).sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  if (duty && duty.date.getTime() - at.getTime() < 21 * 86_400_000) {
    items.push({ id: duty.id, kind: "duty", label: duty.role, live: false, when: `${weekdayShort(duty.date)} ${dayMonth(duty.date)}`, code: duty.code, title: duty.title, place: roomShort(duty.room), placeLabel: "Room", target: atTime(duty.date, duty.start), countdownPrefix: "in", to: "/teach/routine" });
  }
  return items;
}


/** Posts of the teacher's whose latest comment is a student's: a question waiting on a reply. */
export function unanswered(code: string) {
  return store.posts.filter((p) => p.code === code && p.authorId === campus.TEACHER_ID && p.comments.length && p.comments[p.comments.length - 1].authorRole === "student").length;
}
