/**
 * In-memory store over the synthetic seed. Mutations (RIB registration, payments, comments,
 * notices) change it at once; with Firebase they're also written to the student's own record
 * (src/api/cloud.ts) and merged back in at the next sign-in. Offline, a reload restores the seed.
 */
import * as seed from "../data/seed";
import type { AdmitCard, Bill, Comment, Notice, Payment, Post, RibOffer } from "../data/types";
import { atTime, calendar as C, now } from "../lib/clock";

type Listener = () => void;
const listeners = new Set<Listener>();

function fresh() {
  return {
    bills: [...seed.bills] as Bill[],
    payments: [...seed.payments] as Payment[],
    adjustments: [...seed.adjustments],
    posts: seed.posts.map((p) => ({ ...p, comments: [...p.comments] })) as Post[],
    ribOffer: { ...seed.ribOffer, registered: [...seed.ribOffer.registered] } as RibOffer,
    admitCards: seed.admitCards.map((a) => ({ ...a, courses: [...a.courses] })) as AdmitCard[],
    notices: seed.notices.map((n) => ({ ...n })) as Notice[],
  };
}

export const store = fresh();

/** Back to the untouched sample data (on sign-out, and before loading another student's records). */
export function resetStore() {
  Object.assign(store, fresh());
  emit();
}

/** What a signed-in student has saved in Firestore, merged over the sample data. */
export interface CloudState {
  payments: Payment[];
  bills: Bill[];
  notices: Notice[];
  readNoticeIds: string[];
  rib: { registered: string[]; submittedAt?: Date } | null;
  comments: Record<string, Comment[]>;
}

export function applyCloudState(s: CloudState) {
  const byId = <T extends { id: string }>(base: T[], extra: T[]) => [...base, ...extra.filter((x) => !base.some((b) => b.id === x.id))];
  store.payments = byId(store.payments, s.payments);
  store.bills = byId(store.bills, s.bills);
  store.notices = [...s.notices, ...store.notices]
    .filter((n, i, all) => all.findIndex((m) => m.id === n.id) === i)
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .map((n) => (s.readNoticeIds.includes(n.id) ? { ...n, read: true } : n));
  if (s.rib?.registered.length) {
    const offer = store.ribOffer;
    offer.registered = s.rib.registered;
    offer.submittedAt = s.rib.submittedAt;
    const chosen = offer.courses.filter((c) => offer.registered.includes(c.code));
    store.admitCards = store.admitCards.map((a) =>
      a.exam === offer.exam
        ? { ...a, status: "Not issued", note: "Registration received. The admit card is issued closer to the exam.", courses: chosen.map((c) => ({ code: c.code, title: c.title, credit: c.credit, regType: c.regType, type: c.type })) }
        : a,
    );
  }
  store.posts = store.posts.map((p) => (s.comments[p.id]?.length ? { ...p, comments: [...p.comments, ...s.comments[p.id]] } : p));
  emit();
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
const emit = () => listeners.forEach((l) => l());

let seq = 1;
const id = (p: string) => `${p}-${Date.now().toString(36)}-${seq++}`;

export function registerRib(codes: string[]) {
  const offer = store.ribOffer;
  const chosen = offer.courses.filter((c) => codes.includes(c.code));
  offer.registered = chosen.map((c) => c.code);
  offer.submittedAt = now();

  const fee = chosen.reduce((s, c) => s + c.fee, 0);
  const existing = store.bills.find((b) => b.type === "RIB Fee" && b.semester === seed.SEMESTER);
  if (existing) store.bills = store.bills.filter((b) => b !== existing);
  const bill: Bill = {
    // stable per exam, so changing the registration replaces the bill instead of adding another
    id: `rib-fee-${offer.exam.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    number: `${now().getFullYear()}00${String(5300 + seq).padStart(4, "0")}`,
    date: now(),
    title: `RIB fee, ${offer.exam}`,
    type: "RIB Fee",
    semester: seed.SEMESTER,
    amount: fee,
    lines: [{ name: `RIB examination, ${chosen.length} course${chosen.length === 1 ? "" : "s"}`, amount: fee }],
    dueDate: atTime(C.ribRegistrationDeadline, "23:59"),
  };
  store.bills = [...store.bills, bill];

  store.admitCards = store.admitCards.map((a) =>
    a.exam === offer.exam
      ? {
          ...a,
          status: "Not issued",
          note: "Registration received. The admit card is issued closer to the exam.",
          courses: chosen.map((c) => ({ code: c.code, title: c.title, credit: c.credit, regType: c.regType, type: c.type })),
        }
      : a,
  );

  store.notices = [
    { id: id("n"), at: now(), title: `Registered for ${offer.exam}`, body: `${chosen.map((c) => c.code).join(", ")}. A fee bill of ৳${fee.toLocaleString("en-US")} was added to Bills.`, to: "/bills", tone: "info", read: false },
    ...store.notices,
  ];
  emit();
  return { bill };
}

export function pay(billId: string, amount: number, provider: string) {
  const payment: Payment = {
    id: id("pay"),
    date: now(),
    billId,
    amount,
    method: "Mobile banking",
    provider,
    reference: `SAMPLE${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    receivedBy: "Accounts Office (online)",
  };
  store.payments = [...store.payments, payment];
  store.notices = [
    { id: id("n"), at: now(), title: "Payment received", body: `৳${amount.toLocaleString("en-US")} by ${provider}. Your receipt is ready.`, to: `/bills/receipts/${payment.id}`, tone: "info", read: false },
    ...store.notices,
  ];
  emit();
  return payment;
}

export function addComment(postId: string, text: string, author: string) {
  const c: Comment = { id: id("c"), author, authorRole: "student", at: now(), text };
  store.posts = store.posts.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, c] } : p));
  emit();
  return c;
}

export function markNoticesRead() {
  store.notices = store.notices.map((n) => ({ ...n, read: true }));
  emit();
}
