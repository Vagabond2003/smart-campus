/** Pure selectors: everything the screens show is computed here from the store. */
import * as seed from "../data/seed";
import type { Adjustment, Bill, ClassSession, ExamResult, Payment } from "../data/types";
import { addDays, atTime, calendar as C, now, sameDay, startOfDay } from "../lib/clock";
import { pointFor } from "../lib/grades";

/* ─── Attendance ─────────────────────────────────────────────────────────── */

export type AttendanceStanding = "ok" | "watch" | "below";

export interface AttendanceSummaryRow {
  code: string;
  slug: string;
  title: string;
  type: string;
  credit: number;
  contactHours: number;
  present: number;
  absent: number;
  total: number;
  pct: number;
  remaining: number;
  standing: AttendanceStanding;
  /** How many more absences keep the student at or above the line, or how many consecutive presences are needed. */
  advice: { kind: "can-miss"; n: number } | { kind: "need"; n: number } | { kind: "unreachable" };
}

export function attendanceSummary(): AttendanceSummaryRow[] {
  const line = seed.ATTENDANCE_LINE / 100;
  const future = seed.sessionsBetween(now(), addDays(C.lastClass, 1)).filter((s) => s.start > now());
  return seed.offerings.map((o) => {
    const recs = seed.attendance.filter((a) => a.code === o.code);
    const present = recs.filter((a) => a.status === "P").length;
    const total = recs.length;
    const absent = total - present;
    const pct = total ? (present / total) * 100 : 100;
    const remaining = future.filter((s) => s.code === o.code).length;
    const finalTotal = total + remaining;
    const maxAbsent = Math.floor(finalTotal * (1 - line));
    let advice: AttendanceSummaryRow["advice"];
    if (pct / 100 >= line) {
      advice = { kind: "can-miss", n: Math.max(0, maxAbsent - absent) };
    } else {
      // consecutive presences needed: (present + k) / (total + k) >= line
      const k = Math.ceil((line * total - present) / (1 - line));
      advice = k <= remaining ? { kind: "need", n: k } : { kind: "unreachable" };
    }
    const standing: AttendanceStanding = pct < seed.ATTENDANCE_LINE ? "below" : pct < seed.ATTENDANCE_LINE + 7 ? "watch" : "ok";
    return { code: o.code, slug: o.slug, title: o.title, type: o.type, credit: o.credit, contactHours: o.contactHours, present, absent, total, pct, remaining, standing, advice };
  });
}

/* ─── Sessions, today, board ─────────────────────────────────────────────── */

export function sessionsOn(day: Date): ClassSession[] {
  return seed.sessionsBetween(startOfDay(day), addDays(startOfDay(day), 1));
}

export function nextSessions(from: Date = now(), count = 3): ClassSession[] {
  return seed.sessionsBetween(startOfDay(from), addDays(from, 14)).filter((s) => s.end > from).slice(0, count);
}

export function currentSession(at: Date = now()): ClassSession | undefined {
  return sessionsOn(at).find((s) => s.start <= at && at < s.end);
}

export type BoardKind = "class" | "exam" | "assignment" | "dues";

export interface BoardItem {
  id: string;
  kind: BoardKind;
  label: string;
  live: boolean;
  when: string;
  code: string;
  title: string;
  place: string;
  placeLabel: string;
  target: Date;
  countdownPrefix: "in" | "ends" | "due";
  to: string;
}

export function boardItems(at: Date = now(), dues = ledgerTotals().due): BoardItem[] {
  const items: BoardItem[] = [];
  const cur = currentSession(at);
  const next = nextSessions(at, 2).find((s) => s.start > at);
  const fmtWhen = (d: Date) => (sameDay(d, at) ? hhmm(d) : `${weekdayShort(d)} ${hhmm(d)}`);

  if (cur) {
    const o = seed.offeringByCode[cur.code];
    items.push({ id: `now-${cur.id}`, kind: "class", label: "Now", live: true, when: `${hhmm(cur.start)}–${hhmm(cur.end)}`, code: cur.code, title: o.title, place: roomShort(cur.room), placeLabel: "Room", target: cur.end, countdownPrefix: "ends", to: "/routine" });
  }
  if (next) {
    const o = seed.offeringByCode[next.code];
    items.push({ id: `next-${next.id}`, kind: "class", label: "Next class", live: false, when: fmtWhen(next.start), code: next.code, title: o.title, place: roomShort(next.room), placeLabel: "Room", target: next.start, countdownPrefix: "in", to: "/routine" });
  }

  const exam = seed.examSchedules.flatMap((e) => e.sittings).filter((s) => atTime(s.date, s.start) > at).sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  if (exam && exam.date.getTime() - at.getTime() < 21 * 86_400_000) {
    items.push({ id: `exam-${exam.id}`, kind: "exam", label: exam.exam.startsWith("Mid") ? "Mid term" : "Exam", live: false, when: `${weekdayShort(exam.date)} ${dayMonth(exam.date)}`, code: exam.code, title: exam.title, place: `${roomShort(exam.room)} · ${exam.seat.row}-${exam.seat.col}`, placeLabel: "Room · seat", target: atTime(exam.date, exam.start), countdownPrefix: "in", to: "/exams" });
  }

  const asg = seed.assignments.filter((a) => a.state === "open" && a.due > at).sort((a, b) => a.due.getTime() - b.due.getTime())[0];
  if (asg) {
    items.push({ id: `asg-${asg.id}`, kind: "assignment", label: "Assignment", live: false, when: `${weekdayShort(asg.due)} ${hhmm(asg.due)}`, code: asg.code, title: asg.title.replace(/^Assignment \d+: /, ""), place: "Online", placeLabel: "Submit", target: asg.due, countdownPrefix: "due", to: `/courses/${seed.offeringByCode[asg.code].slug}/assignments` });
  }

  if (dues > 0) {
    const bill = seed.bills.find((b) => b.dueDate);
    if (bill?.dueDate) {
      items.push({ id: "dues", kind: "dues", label: "Dues", live: false, when: `By ${dayMonth(bill.dueDate)}`, code: `৳${dues.toLocaleString("en-US")}`, title: bill.title, place: "Bills", placeLabel: "Pay in", target: bill.dueDate, countdownPrefix: "due", to: "/bills" });
    }
  }
  return items;
}

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const weekdayShort = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short" });
const dayMonth = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
export const roomShort = (room: string) => room.replace(" (Academic)", "");

/* ─── Term line ──────────────────────────────────────────────────────────── */

export interface Station {
  key: string;
  label: string;
  date: Date;
  state: "past" | "next" | "future";
}

export function termStations(at: Date = now()): Station[] {
  const list = [
    { key: "begin", label: "Classes began", date: C.classesBegin },
    { key: "ct1", label: "CT-1", date: C.ct1 },
    { key: "ct2", label: "CT-2", date: C.ct2 },
    { key: "mid", label: "Mid term", date: C.midTermStart },
    { key: "ct3", label: "CT-3", date: C.ct3 },
    { key: "last", label: "Last class", date: C.lastClass },
    { key: "finals", label: "Finals", date: C.finalsStart },
    { key: "results", label: "Results", date: C.results },
  ];
  let nextMarked = false;
  return list.map((s) => {
    if (s.date < startOfDay(at)) return { ...s, state: "past" as const };
    if (!nextMarked) {
      nextMarked = true;
      return { ...s, state: "next" as const };
    }
    return { ...s, state: "future" as const };
  });
}

/* ─── Results ────────────────────────────────────────────────────────────── */

export interface TermStanding {
  id: string;
  exam: string;
  levelTerm: string;
  kind: ExamResult["kind"];
  credits: number;
  earned: number;
  gpa: number;
  cgpaAfter: number;
  earnedAfter: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Sample CGPA rule: each course counts once at its best grade; a failed course is
 * left out of the CGPA until it is cleared.
 */
export function standing(results: ExamResult[] = seed.results) {
  const best = new Map<string, { credit: number; point: number }>();
  const terms: TermStanding[] = [];
  for (const r of results) {
    const credits = r.rows.reduce((s, x) => s + x.credit, 0);
    const earned = r.rows.filter((x) => x.grade !== "F").reduce((s, x) => s + x.credit, 0);
    const gpa = credits ? round2(r.rows.reduce((s, x) => s + x.credit * pointFor(x.grade), 0) / credits) : 0;
    for (const x of r.rows) {
      const p = pointFor(x.grade);
      const prev = best.get(x.code);
      if (!prev || p > prev.point) best.set(x.code, { credit: x.credit, point: p });
    }
    const passed = [...best.values()].filter((b) => b.point > 0);
    const earnedAfter = passed.reduce((s, b) => s + b.credit, 0);
    const cgpaAfter = earnedAfter ? round2(passed.reduce((s, b) => s + b.credit * b.point, 0) / earnedAfter) : 0;
    terms.push({ id: r.id, exam: r.exam, levelTerm: r.levelTerm, kind: r.kind, credits, earned, gpa, cgpaAfter, earnedAfter });
  }
  const last = terms[terms.length - 1];
  return { terms, cgpa: last?.cgpaAfter ?? 0, earned: last?.earnedAfter ?? 0, totalCredits: 160 };
}

/* ─── Money ──────────────────────────────────────────────────────────────── */

export interface LedgerEntry {
  id: string;
  date: Date;
  kind: "bill" | "payment" | "adjustment";
  description: string;
  detail: string;
  billId: string;
  fee: number;
  paid: number;
  adjusted: number;
  balance: number;
  reference?: string;
}

export function ledger(bills: Bill[], payments: Payment[], adjustments: Adjustment[]): LedgerEntry[] {
  const num = (id: string) => bills.find((x) => x.id === id)?.number ?? "";
  const rows: Omit<LedgerEntry, "balance">[] = [
    ...bills.map((b) => ({ id: b.id, date: b.date, kind: "bill" as const, description: b.title, detail: `Bill ${b.number}`, billId: b.id, fee: b.amount, paid: 0, adjusted: 0 })),
    ...payments.map((p) => ({
      id: p.id,
      date: p.date,
      kind: "payment" as const,
      description: `${p.provider ?? p.method} payment`,
      detail: `For bill ${num(p.billId)}${p.reference ? ` · Ref ${p.reference}` : ""}`,
      billId: p.billId,
      fee: 0,
      paid: p.amount,
      adjusted: 0,
      reference: p.reference,
    })),
    ...adjustments.map((a) => ({ id: a.id, date: a.date, kind: "adjustment" as const, description: a.description, detail: `On bill ${num(a.billId)}`, billId: a.billId, fee: 0, paid: 0, adjusted: a.amount })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());
  let balance = 0;
  return rows.map((r) => {
    balance += r.fee - r.paid - r.adjusted;
    return { ...r, balance };
  });
}

export function ledgerTotals(bills: Bill[] = seed.bills, payments: Payment[] = seed.payments, adjustments: Adjustment[] = seed.adjustments) {
  const billed = bills.reduce((s, b) => s + b.amount, 0);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const adjusted = adjustments.reduce((s, a) => s + a.amount, 0);
  return { billed, paid, adjusted, due: billed - paid - adjusted };
}

export function billBalance(bill: Bill, payments: Payment[], adjustments: Adjustment[]) {
  const paid = payments.filter((p) => p.billId === bill.id).reduce((s, p) => s + p.amount, 0);
  const adjusted = adjustments.filter((a) => a.billId === bill.id).reduce((s, a) => s + a.amount, 0);
  return { paid, adjusted, payable: bill.amount - adjusted, due: bill.amount - paid - adjusted };
}

/* ─── Courses ────────────────────────────────────────────────────────────── */

export function courseProgress(code: string) {
  const o = seed.offeringByCode[code];
  const held = seed.attendance.filter((a) => a.code === code).length;
  const all = seed.sessionsBetween(C.classesBegin, addDays(C.lastClass, 1)).filter((s) => s.code === code).length;
  const marks = seed.assessments.filter((a) => a.code === code && a.obtained != null);
  return { offering: o, held, all, marks };
}
