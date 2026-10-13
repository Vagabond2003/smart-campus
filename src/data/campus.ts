/**
 * The sandbox campus: the section-level records behind both sides of the portal. The student
 * side reads one person's slice (the sample student, "me"); the teacher side reads the whole
 * section. Everything here is synthetic and deterministic, and agrees with the sample student's
 * own records in seed.ts, so a roll or a mark sheet reads the same from either side.
 *
 * What a visitor changes as the teacher lives in the store (src/api/store.ts) and overrides
 * these base records; nothing here is ever mutated.
 */
import * as seed from "./seed";
import type { Assessment, ClassSession, Notice, Person, RegType } from "./types";
import { addDays, atTime, calendar as C, HOUR, now, routineDayIndex, startOfDay, weekOf } from "../lib/clock";
import { rngFor } from "../lib/rng";

/** The teacher every visitor plays: teaches CSE 2101 and CSE 2102, and advises the section. */
export const TEACHER_ID = "t-arman";
export const teacher = seed.teachers[TEACHER_ID];

/** The sample student's roster ID. */
export const ME = "me";

/** 19th batch, Section A: the class list for every course this term, and the advisees. */
export const roster: Person[] = seed.classmates;
export const personById: Record<string, Person> = Object.fromEntries(roster.map((p) => [p.id, p]));
export const SECTION_LABEL = `${parseInt(seed.student.batch, 10)}-${seed.student.section}`; // "19-A"

export const teachingOfferings = seed.offerings.filter((o) => o.teacherIds.includes(TEACHER_ID));
export const teachingCodes = teachingOfferings.map((o) => o.code);
export const teaches = (code: string) => teachingCodes.includes(code);

/** Last three digits of a roll: what a teacher calls out in class. */
export const rollSuffix = (p: Person) => p.roll.slice(-3);

/* ─── Sessions ───────────────────────────────────────────────────────────── */

/**
 * A class meeting's identity relative to the term (course, week, day, period), so a roll saved
 * today still lands on the same meeting tomorrow: the calendar is anchored to "today".
 */
export function sessionKey(s: Pick<ClassSession, "code" | "start" | "period">) {
  return `${s.code.replace(/\s+/g, "")}-w${weekOf(s.start)}-d${routineDayIndex(s.start)}-p${s.period}`;
}

/** Every meeting of the term, first class to last. */
export const termSessions: ClassSession[] = seed.sessionsBetween(C.classesBegin, addDays(C.lastClass, 1));
const sessionIndex = new Map(termSessions.map((s) => [sessionKey(s), s]));
export const sessionByKey = (key: string) => sessionIndex.get(key);

/* ─── Base rolls ─────────────────────────────────────────────────────────── */

export interface BaseRoll {
  absent: string[];
  late: string[];
}

/** How often each classmate misses class: most rarely, a few often enough to fall under the line. */
function absenceRate(id: string) {
  const r = rngFor(`propensity:${id}`);
  const u = r();
  if (u < 0.72) return 0.015 + r() * 0.04;
  if (u < 0.91) return 0.06 + r() * 0.06;
  return 0.2 + r() * 0.1;
}
const rates = new Map(roster.map((p) => [p.id, absenceRate(p.id)]));
/** Early classes lose a few more students. */
const courseFactor: Record<string, number> = { "CSE 2105": 1.3, "MATH 2145": 1.1 };

/** The sample student's own record, exactly as the student side has always shown it. */
const mine = new Map(seed.attendance.map((a) => [`${a.code}|${a.date.getTime()}`, a]));

/**
 * Recorded rolls for meetings already held. The teacher's own classes from today on are left
 * for the visitor to take; every other meeting was recorded by its teacher.
 */
function buildBaseRolls() {
  const out = new Map<string, BaseRoll>();
  const at = now();
  const today = startOfDay(at);
  for (const s of termSessions) {
    if (s.end > at) break;
    if (teaches(s.code) && s.start >= today) continue;
    const absent: string[] = [];
    const late: string[] = [];
    const key = sessionKey(s);
    for (const p of roster) {
      if (p.id === ME) {
        const rec = mine.get(`${s.code}|${s.start.getTime()}`);
        if (rec?.status === "A") absent.push(ME);
        else if (rec?.remarks) late.push(ME);
        continue;
      }
      const r = rngFor(`roll:${p.id}:${key}`);
      if (r() < (rates.get(p.id) ?? 0.05) * (courseFactor[s.code] ?? 1)) absent.push(p.id);
      else if (r() < 0.035) late.push(p.id);
    }
    out.set(key, { absent, late });
  }
  return out;
}
export const baseRolls = buildBaseRolls();

/* ─── Base mark sheets ───────────────────────────────────────────────────── */

export function assessmentKey(code: string, name: string) {
  return `${code.replace(/\s+/g, "")}-${name.replace(/[^A-Za-z0-9]+/g, "-").replace(/-+$/, "")}`;
}

const ability = new Map(roster.map((p) => [p.id, 0.5 + rngFor(`ability:${p.id}`)() * 0.45]));

/** Everyone's marks for an assessment its teacher has already published. */
function buildSheet(a: Assessment): Record<string, number> {
  const scores: Record<string, number> = {};
  const cap = a.highest ?? a.max;
  const r = rngFor(`marks:${a.code}:${a.name}`);
  for (const p of roster) {
    if (p.id === ME) {
      if (a.obtained != null) scores[ME] = a.obtained;
      continue;
    }
    if (r() < 0.03) continue; // missed the test
    const v = Math.round(a.max * Math.min(1, Math.max(0.15, (ability.get(p.id) ?? 0.7) + (r() - 0.5) * 0.28)));
    scores[p.id] = Math.min(cap, v);
  }
  // The published highest is a real score: give it to the strongest student if nobody has it.
  const values = Object.values(scores);
  if (a.highest != null && !values.includes(a.highest)) {
    const best = Object.entries(scores)
      .filter(([id]) => id !== ME)
      .sort((x, y) => y[1] - x[1])[0];
    if (best) scores[best[0]] = a.highest;
  }
  return scores;
}

export const baseSheets: Record<string, Record<string, number>> = Object.fromEntries(
  seed.assessments.filter((a) => a.state === "published").map((a) => [assessmentKey(a.code, a.name), buildSheet(a)]),
);

/* ─── Assignment submissions ─────────────────────────────────────────────── */

export interface Submission {
  personId: string;
  at: Date;
  file: string;
  size: string;
  late: boolean;
}

/** Who submitted the teacher's seeded assignments, when, and what (file names only). */
function buildSubmissions() {
  const out: Record<string, Submission[]> = {};
  for (const a of seed.assignments.filter((x) => x.authorId === TEACHER_ID)) {
    const list: Submission[] = [];
    const posted = a.postedAt ?? addDays(a.due, -14);
    for (const p of roster) {
      const r = rngFor(`submit:${a.id}:${p.id}`);
      const u = r();
      if (p.id === ME) {
        if (a.submittedAt) list.push({ personId: ME, at: a.submittedAt, file: `${p.roll}_Assignment1.pdf`, size: "1.4 MB", late: a.submittedAt > a.due });
        continue;
      }
      if (u < 0.06) continue; // nothing submitted
      const late = u > 0.92;
      // a day in the window, at a plausible hour (09:00 to 23:40)
      const day = late ? addDays(startOfDay(a.due), 1 + Math.floor(r() * 2)) : addDays(startOfDay(posted), Math.floor((0.5 + r() * 0.5) * ((a.due.getTime() - posted.getTime()) / 86_400_000)));
      const at = new Date(Math.min(late ? Infinity : a.due.getTime() - 5 * 60_000, atTime(day, "09:00").getTime() + Math.floor(r() * 880) * 60_000));
      if (at > now()) continue; // a late hand-in that hasn't happened yet: still missing
      list.push({ personId: p.id, at, file: `${p.roll}_Assignment1.pdf`, size: `${(0.6 + r() * 2.2).toFixed(1)} MB`, late });
    }
    out[a.id] = list;
  }
  return out;
}
export const baseSubmissions = buildSubmissions();

/* ─── Advisees: referred and backlog courses, RIB registrations ─────────── */

export interface AdviseeCourse {
  code: string;
  title: string;
  credit: number;
  regType: Extract<RegType, "Referred" | "Backlog" | "Improvement">;
}

export interface AdviseeRecord {
  person: Person;
  /** Courses the advisee must clear in the next RIB exam. */
  carries: AdviseeCourse[];
  /** Where their RIB registration stood before the visitor arrived. The sample student's is live. */
  rib: { state: "none" | "submitted" | "approved"; at?: Date; courses: string[] };
}

const prevTerm = seed.results[1].rows;
const course = (code: string, regType: AdviseeCourse["regType"]): AdviseeCourse => {
  const r = prevTerm.find((x) => x.code === code) ?? seed.results[0].rows.find((x) => x.code === code)!;
  return { code, title: r.title, credit: r.credit, regType };
};

/** Synthetic advisees who carry referred or backlog courses, in roll order of discovery. */
const PLANS: { carries: AdviseeCourse[]; rib: AdviseeRecord["rib"]["state"]; daysAgo?: number }[] = [
  { carries: [course("MATH 1243", "Referred")], rib: "submitted", daysAgo: 3 },
  { carries: [course("EEE 1269", "Referred"), course("CSE 1201", "Referred")], rib: "submitted", daysAgo: 1 },
  { carries: [course("CHEM 1201", "Referred")], rib: "approved", daysAgo: 6 },
  { carries: [course("MATH 1243", "Backlog")], rib: "none" },
  { carries: [course("EEE 1269", "Referred")], rib: "none" },
];

function buildAdvisees(): AdviseeRecord[] {
  const r = rngFor("advisees");
  const others = roster.filter((p) => p.id !== ME);
  const chosen = new Set<string>();
  const plans = new Map<string, (typeof PLANS)[number]>();
  for (const plan of PLANS) {
    let p: Person;
    do p = others[Math.floor(r() * others.length)];
    while (chosen.has(p.id));
    chosen.add(p.id);
    plans.set(p.id, plan);
  }
  const today = startOfDay(now());
  return roster.map((p) => {
    if (p.id === ME) {
      return { person: p, carries: seed.backlog.map((b) => ({ code: b.code, title: b.title, credit: b.credit, regType: b.status })), rib: { state: "none", courses: [] } };
    }
    const plan = plans.get(p.id);
    if (!plan) return { person: p, carries: [], rib: { state: "none", courses: [] } };
    const at = plan.daysAgo != null ? atTime(addDays(today, -plan.daysAgo), "20:15") : undefined;
    return { person: p, carries: plan.carries, rib: { state: plan.rib, at, courses: plan.rib === "none" ? [] : plan.carries.map((c) => c.code) } };
  });
}
export const advisees = buildAdvisees();
export const adviseeById: Record<string, AdviseeRecord> = Object.fromEntries(advisees.map((a) => [a.person.id, a]));

/* ─── Exam duties ────────────────────────────────────────────────────────── */

export interface ExamDuty {
  id: string;
  exam: string;
  role: "Examiner" | "Invigilator";
  code: string;
  title: string;
  date: Date;
  start: string;
  end: string;
  room: string;
}

const mid = seed.examSchedules.find((e) => e.kind === "mid")!;
export const examDuties: ExamDuty[] = mid.sittings
  .filter((s) => teaches(s.code) || s.code === "CSE 2103" || s.code === "MATH 2145")
  .map((s) => ({
    id: `duty-${s.id}`,
    exam: s.exam,
    role: teaches(s.code) ? "Examiner" : "Invigilator",
    code: s.code,
    title: s.title,
    date: s.date,
    start: s.start,
    end: s.end,
    room: s.room,
  }));

/* ─── The teacher's notifications on arrival ─────────────────────────────── */

export function teacherNotices(): Notice[] {
  const t = now();
  const hoursAgo = (h: number) => new Date(t.getTime() - h * HOUR);
  const pending = advisees.filter((a) => a.rib.state === "submitted").sort((a, b) => (b.rib.at?.getTime() ?? 0) - (a.rib.at?.getTime() ?? 0));
  const labs = seed.assessments.find((a) => a.code === "CSE 2102" && a.state === "pending");
  return [
    ...pending.map((a, i) => ({
      id: `tn-rib-${a.person.id}`,
      at: a.rib.at ?? hoursAgo(20 + i),
      title: `${a.person.name} registered for RIB`,
      body: `${a.rib.courses.join(", ")} for ${seed.ribOffer.exam}. Waiting for your approval.`,
      to: "/teach/approvals",
      tone: "caution" as const,
      read: false,
      audience: "teacher" as const,
    })),
    ...(labs
      ? [{ id: "tn-labs", at: hoursAgo(30), title: `${labs.name} marks for CSE 2102`, body: "The reports are in. Enter and publish the marks when they're checked.", to: `/teach/courses/cse-2102/marks/${encodeURIComponent(labs.name)}`, tone: "info" as const, read: false, audience: "teacher" as const }]
      : []),
    { id: "tn-c1", at: hoursAgo(20), title: "Tasnim Chowdhury commented", body: "On Mid term syllabus: “Will K-maps with don't-care conditions be included?”", to: "/teach/courses/cse-2101/discussion#p-2101-mid", tone: "info", read: true, audience: "teacher" },
  ];
}
