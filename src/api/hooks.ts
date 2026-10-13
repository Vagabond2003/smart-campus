/**
 * Query hooks over the in-memory store. Every read goes through TanStack Query with a small,
 * realistic latency so loading states are real. Mutations change the store, then write through
 * to Firestore when a Firebase account is signed in.
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from "react";
import * as seed from "../data/seed";
import * as campus from "../data/campus";
import type { AdvisingDecision, Notice, Resource } from "../data/types";
import {
  addBundle,
  addComment,
  createAssignment,
  createPost,
  decideRegistration,
  markNoticesRead,
  pay,
  registerRib,
  remind,
  saveGrades,
  saveMarks,
  saveRoll,
  setPinned,
  store,
  storeVersion,
  submitAssignment,
  subscribe,
  type NewPost,
} from "./store";
import {
  persistAssignment,
  persistBundle,
  persistComment,
  persistDecision,
  persistGrades,
  persistMarks,
  persistNotice,
  persistPayment,
  persistPins,
  persistPost,
  persistReadNotices,
  persistReminders,
  persistRib,
  persistRoll,
  persistSubmission,
} from "./cloud";
import { trackEvent } from "../lib/firebase";
import { now } from "../lib/clock";
import { attendanceSummary, billBalance, ledger, ledgerTotals, standing } from "./derive";
import { allLectures, allMaterials, myAssessments, myAssignments, myAttendance } from "./records";
import { advisees, approvals, courseAttendance, courseMeetings, courseSheets, duties, sectionAttendance, teacherAssignments, teachingOn } from "./teach";

/** A read: a short, realistic wait, so loading states are real (and prefetching on intent can hide it). */
function delay<T>(value: () => T, ms = 140 + Math.random() * 160): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value()), ms));
}

/**
 * A write is optimistic: the sandbox changes at once and the screen follows on the next tick. The
 * copy in the visitor's account is written in the background (src/api/cloud.ts); if that fails, a
 * toast says so and offers to try again. Nothing waits on the network.
 */
function instantly<T>(value: () => T): Promise<T> {
  return Promise.resolve().then(value);
}

export const queries = {
  student: { queryKey: ["student"], queryFn: () => delay(() => ({ student: seed.student, advisor: seed.teachers[seed.student.advisorId] })) },
  offerings: { queryKey: ["offerings"], queryFn: () => delay(() => seed.offerings) },
  routine: { queryKey: ["routine"], queryFn: () => delay(() => seed.routine) },
  attendance: {
    queryKey: ["attendance"],
    queryFn: () =>
      delay(() => {
        const records = myAttendance();
        return { summary: attendanceSummary(records), records };
      }),
  },
  assessments: { queryKey: ["assessments"], queryFn: () => delay(() => myAssessments()) },
  posts: { queryKey: ["posts"], queryFn: () => delay(() => store.posts) },
  lectures: { queryKey: ["lectures"], queryFn: () => delay(() => allLectures()) },
  materials: { queryKey: ["materials"], queryFn: () => delay(() => allMaterials()) },
  assignments: { queryKey: ["assignments"], queryFn: () => delay(() => myAssignments()) },
  people: { queryKey: ["people"], queryFn: () => delay(() => seed.classmates) },
  results: { queryKey: ["results"], queryFn: () => delay(() => ({ results: seed.results, standing: standing(), backlog: seed.backlog })) },
  rib: { queryKey: ["rib"], queryFn: () => delay(() => ({ ...store.ribOffer })) },
  bills: {
    queryKey: ["bills"],
    queryFn: () =>
      delay(() => ({
        bills: store.bills,
        payments: store.payments,
        adjustments: store.adjustments,
        ledger: ledger(store.bills, store.payments, store.adjustments),
        totals: ledgerTotals(store.bills, store.payments, store.adjustments),
        balances: Object.fromEntries(store.bills.map((b) => [b.id, billBalance(b, store.payments, store.adjustments)])),
      })),
  },
  exams: { queryKey: ["exams"], queryFn: () => delay(() => seed.examSchedules) },
  admitCards: { queryKey: ["admit-cards"], queryFn: () => delay(() => store.admitCards) },
  notices: { queryKey: ["notices"], queryFn: () => delay(() => store.notices, 120) },
} as const;

/* ─── The teacher's reads ────────────────────────────────────────────────── */

export const teachQueries = {
  section: {
    queryKey: ["t-section"],
    queryFn: () =>
      delay(() => {
        const att = sectionAttendance();
        const list = advisees(att);
        return { advisees: list, approvals: approvals(list), attendance: att };
      }),
  },
  today: { queryKey: ["t-today"], queryFn: () => delay(() => ({ meetings: teachingOn(now()), duties: duties() })) },
  course: (code: string) => ({
    queryKey: ["t-course", code],
    queryFn: () =>
      delay(() => ({
        meetings: courseMeetings(code),
        sheets: courseSheets(code),
        attendance: courseAttendance(code),
        assignments: teacherAssignments(code),
      })),
  }),
} as const;

export const useSection = () => useQuery(teachQueries.section);
export const useTeachToday = () => useQuery(teachQueries.today);
export const useTeachCourse = (code: string) => useQuery(teachQueries.course(code));

export const useStudent = () => useQuery(queries.student);
export const useOfferings = () => useQuery(queries.offerings);
export const useRoutine = () => useQuery(queries.routine);
export const useAttendance = () => useQuery(queries.attendance);
export const useAssessments = () => useQuery(queries.assessments);
export const usePosts = () => useQuery(queries.posts);
export const useLectures = () => useQuery(queries.lectures);
export const useMaterials = () => useQuery(queries.materials);
export const useAssignments = () => useQuery(queries.assignments);
export const usePeople = () => useQuery(queries.people);
export const useResults = () => useQuery(queries.results);
export const useRib = () => useQuery(queries.rib);
export const useBills = () => useQuery(queries.bills);
export const useExams = () => useQuery(queries.exams);
export const useAdmitCards = () => useQuery(queries.admitCards);
export const useNotices = () => useQuery(queries.notices);

/**
 * Re-read store-backed queries whenever a mutation changes the store. Both sides of the sandbox
 * read the same records, so any change can move any screen: a roll moves the student's attendance,
 * a registration moves the advisor's queue.
 */
export function useStoreSync() {
  const qc = useQueryClient();
  useEffect(() => subscribe(() => void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "student" && q.queryKey[0] !== "routine" && q.queryKey[0] !== "exams" })), [qc]);
}

/** Re-render whenever the sandbox changes (for derivations that don't go through a query). */
export const useStoreVersion = () => useSyncExternalStore(subscribe, storeVersion);

const persistNotices = (list: (Notice | undefined)[]) => list.forEach((n) => n && persistNotice(n));

export function useRegisterRib() {
  return useMutation({
    mutationFn: (codes: string[]) =>
      instantly(() => {
        const r = registerRib(codes);
        persistRib(store.ribOffer, r.bill, undefined);
        persistNotices(r.notices);
        trackEvent("rib_register", { courses: codes.length });
        return r;
      }),
  });
}

export function usePay() {
  return useMutation({
    mutationFn: (v: { billId: string; amount: number; provider: string }) =>
      instantly(() => {
        const p = pay(v.billId, v.amount, v.provider);
        // the receipt notice is the newest one
        persistPayment(p, store.notices[0]);
        trackEvent("demo_payment", { method: v.provider });
        return p;
      }),
  });
}

/** A comment by the student, or a reply by the teacher (`asTeacher`). */
export function useAddComment(asTeacher = false) {
  return useMutation({
    mutationFn: (v: { postId: string; text: string }) =>
      instantly(() => {
        const r = addComment(v.postId, v.text, asTeacher ? campus.teacher.name : seed.student.name, asTeacher ? "teacher" : "student");
        persistComment(v.postId, r.comment);
        persistNotices([r.notice]);
        return r.comment;
      }),
  });
}

export function useMarkNoticesRead(audience: Notice["audience"] = undefined) {
  return useMutation({
    mutationFn: () =>
      instantly(() => {
        markNoticesRead(audience);
        persistReadNotices(store.notices.filter((n) => n.read).map((n) => n.id));
      }),
  });
}

export function useSubmitAssignment() {
  return useMutation({
    mutationFn: (v: { assignmentId: string; file: { name: string; size: string } }) =>
      instantly(() => {
        const r = submitAssignment(v.assignmentId, v.file);
        persistSubmission(r.submission);
        persistNotices([r.notice]);
        return r.submission;
      }),
  });
}

/* ─── The teacher's actions ──────────────────────────────────────────────── */

export function useSaveRoll() {
  return useMutation({
    mutationFn: (v: { key: string; absent: string[]; late: string[]; reason?: string }) =>
      instantly(() => {
        const r = saveRoll(v.key, v.absent, v.late, v.reason);
        persistRoll(r.roll);
        persistNotices([r.notice]);
        trackEvent("roll_taken", { absent: v.absent.length });
        return r.roll;
      }),
  });
}

export function useSaveMarks() {
  return useMutation({
    mutationFn: (v: { code: string; name: string; scores: Record<string, number>; publish: boolean }) =>
      instantly(() => {
        const r = saveMarks(v.code, v.name, v.scores, v.publish);
        persistMarks(r.sheet);
        persistNotices([r.notice]);
        if (v.publish) trackEvent("marks_published", { entered: Object.keys(v.scores).length });
        return r.sheet;
      }),
  });
}

export function useCreatePost() {
  return useMutation({
    mutationFn: (v: NewPost) =>
      instantly(() => {
        const r = createPost(v);
        persistPost(r.post);
        persistNotices([r.notice]);
        return r.post;
      }),
  });
}

/** Seeded posts can't be rewritten, so their pins live in one state document. */
export function useSetPinned() {
  return useMutation({
    mutationFn: (v: { postId: string; pinned: boolean }) =>
      instantly(() => {
        setPinned(v.postId, v.pinned);
        const post = store.posts.find((p) => p.id === v.postId);
        if (post && !seed.posts.some((p) => p.id === post.id)) persistPost(post);
        else persistPins(Object.fromEntries(store.posts.filter((p) => seed.posts.some((s) => s.id === p.id && s.pinned !== p.pinned)).map((p) => [p.id, p.pinned])));
      }),
  });
}

export function useAddBundle() {
  return useMutation({
    mutationFn: (v: { code: string; section: "lectures" | "materials"; title: string; resources: Resource[] }) =>
      instantly(() => {
        const r = addBundle(v);
        persistBundle(r.bundle);
        persistNotices([r.notice]);
        return r.bundle;
      }),
  });
}

export function useCreateAssignment() {
  return useMutation({
    mutationFn: (v: { code: string; title: string; brief: string; due: Date; max: number }) =>
      instantly(() => {
        const r = createAssignment(v);
        persistAssignment(r.assignment);
        persistNotices([r.notice]);
        return r.assignment;
      }),
  });
}

export function useSaveGrades() {
  return useMutation({
    mutationFn: (v: { assignmentId: string; scores: Record<string, number>; publish: boolean }) =>
      instantly(() => {
        const r = saveGrades(v.assignmentId, v.scores, v.publish);
        persistGrades(r.grades);
        persistNotices([r.notice]);
        return r.grades;
      }),
  });
}

export function useDecideRegistration() {
  return useMutation({
    mutationFn: (v: { personId: string; decision: AdvisingDecision["decision"]; note?: string }) =>
      instantly(() => {
        const r = decideRegistration(v.personId, v.decision, v.note);
        persistDecision(r.decision);
        persistNotices([r.notice]);
        trackEvent("rib_decision", { decision: v.decision });
        return r.decision;
      }),
  });
}

export function useRemind() {
  return useMutation({
    mutationFn: (personId: string) =>
      instantly(() => {
        const r = remind(personId);
        persistReminders(r.reminded);
        persistNotices([r.notice]);
        return r.reminded;
      }),
  });
}

/** Route → queries it needs, so navigation can prefetch on intent and screens arrive whole. */
export const routeQueries: Record<string, (keyof typeof queries)[]> = {
  "/dashboard": ["student", "attendance", "results", "bills", "posts", "assessments"],
  "/profile": ["student", "results"],
  "/registration/regular": ["offerings"],
  "/registration/rib": ["rib", "results"],
  "/courses": ["offerings", "attendance", "assessments"],
  "/attendance": ["attendance"],
  "/results": ["results"],
  "/routine": ["routine"],
  "/bills": ["bills"],
  "/admit-card": ["admitCards", "student"],
  "/exams": ["exams"],
};

export function prefetchRoute(qc: QueryClient, path: string) {
  if (path.startsWith("/teach")) {
    qc.prefetchQuery({ ...(teachQueries.section as Parameters<QueryClient["prefetchQuery"]>[0]), staleTime: 60_000 });
    qc.prefetchQuery({ ...(teachQueries.today as Parameters<QueryClient["prefetchQuery"]>[0]), staleTime: 60_000 });
    return;
  }
  const keys = routeQueries[path] ?? (path.startsWith("/courses/") ? (["offerings", "posts", "assessments", "attendance", "lectures", "materials", "assignments", "people"] as const) : []);
  for (const k of keys) qc.prefetchQuery({ ...(queries[k] as Parameters<QueryClient["prefetchQuery"]>[0]), staleTime: 60_000 });
}
