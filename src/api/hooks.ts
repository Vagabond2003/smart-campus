/**
 * Query hooks over the in-memory store. Every read goes through TanStack Query with a small,
 * realistic latency so loading states are real. Mutations change the store, then write through
 * to Firestore when a Firebase account is signed in.
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import * as seed from "../data/seed";
import { addComment, markNoticesRead, pay, registerRib, store, subscribe } from "./store";
import { persistComment, persistPayment, persistReadNotices, persistRib } from "./cloud";
import { trackEvent } from "../lib/firebase";
import { attendanceSummary, billBalance, ledger, ledgerTotals, standing } from "./derive";

function delay<T>(value: () => T, ms = 220 + Math.random() * 260): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value()), ms));
}

export const queries = {
  student: { queryKey: ["student"], queryFn: () => delay(() => ({ student: seed.student, advisor: seed.teachers[seed.student.advisorId] })) },
  offerings: { queryKey: ["offerings"], queryFn: () => delay(() => seed.offerings) },
  routine: { queryKey: ["routine"], queryFn: () => delay(() => seed.routine) },
  attendance: { queryKey: ["attendance"], queryFn: () => delay(() => ({ summary: attendanceSummary(), records: seed.attendance })) },
  assessments: { queryKey: ["assessments"], queryFn: () => delay(() => seed.assessments) },
  posts: { queryKey: ["posts"], queryFn: () => delay(() => store.posts) },
  lectures: { queryKey: ["lectures"], queryFn: () => delay(() => seed.lectures) },
  materials: { queryKey: ["materials"], queryFn: () => delay(() => seed.materials) },
  assignments: { queryKey: ["assignments"], queryFn: () => delay(() => seed.assignments) },
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

/** Re-read store-backed queries whenever a mutation changes the store. */
export function useStoreSync() {
  const qc = useQueryClient();
  useEffect(
    () =>
      subscribe(() => {
        for (const k of ["posts", "rib", "bills", "admit-cards", "notices"]) qc.invalidateQueries({ queryKey: [k] });
      }),
    [qc],
  );
}

export function useRegisterRib() {
  return useMutation({
    mutationFn: (codes: string[]) =>
      delay(() => {
        const r = registerRib(codes);
        persistRib(store.ribOffer, r.bill, store.notices[0]);
        trackEvent("rib_register", { courses: codes.length });
        return r;
      }, 700),
  });
}

export function usePay() {
  return useMutation({
    mutationFn: (v: { billId: string; amount: number; provider: string }) =>
      delay(() => {
        const p = pay(v.billId, v.amount, v.provider);
        persistPayment(p, store.notices[0]);
        trackEvent("demo_payment", { method: v.provider });
        return p;
      }, 900),
  });
}

export function useAddComment() {
  return useMutation({
    mutationFn: (v: { postId: string; text: string }) =>
      delay(() => {
        const c = addComment(v.postId, v.text, seed.student.name);
        persistComment(v.postId, c);
        return c;
      }, 260),
  });
}

export function useMarkNoticesRead() {
  return useMutation({
    mutationFn: () =>
      delay(() => {
        markNoticesRead();
        persistReadNotices(store.notices.filter((n) => n.read).map((n) => n.id));
      }, 80),
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
  const keys = routeQueries[path] ?? (path.startsWith("/courses/") ? (["offerings", "posts", "assessments", "attendance", "lectures", "materials", "assignments", "people"] as const) : []);
  for (const k of keys) qc.prefetchQuery({ ...(queries[k] as Parameters<QueryClient["prefetchQuery"]>[0]), staleTime: 60_000 });
}
