/**
 * Firestore persistence for what a signed-in student does in the portal. Every path is private
 * to that student; nothing one student writes is ever shown to another.
 *
 *   students/{uid}                      profile: studentId, name, kind
 *   students/{uid}/payments/{id}        demo payments
 *   students/{uid}/bills/{id}           bills the student's actions created (RIB fees)
 *   students/{uid}/notices/{id}         notices those actions produced
 *   students/{uid}/comments/{id}        course discussion comments (postId says where)
 *   students/{uid}/state/rib            RIB registration for the open exam
 *   students/{uid}/state/notices        ids of notices the student has read
 *
 * Writes are fire-and-forget: the in-memory store has already changed, so the portal never waits
 * on the network. A failed write is reported through onCloudError.
 */
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, Timestamp } from "firebase/firestore/lite";
import { db } from "../lib/firebase";
import type { Bill, Comment, Notice, Payment, RibOffer } from "../data/types";
import type { CloudState } from "./store";

export interface Profile {
  studentId: string;
  name: string;
  kind: "activated" | "demo";
}

/** `what` names the record in plain words ("the payment"), ready for a sentence. */
type Report = (what: string, err: unknown) => void;
let report: Report = (what, err) => console.warn(`[cloud] couldn't save ${what}`, err);
export function onCloudError(fn: Report) {
  report = fn;
}

const toDate = (v: unknown): Date => (v instanceof Timestamp ? v.toDate() : v instanceof Date ? v : new Date(String(v)));
const ts = (d?: Date) => (d ? Timestamp.fromDate(d) : undefined);

function need() {
  if (!db) throw new Error("Firestore is not configured");
  return db;
}

/* ─── Profile ────────────────────────────────────────────────────────────── */

export async function loadProfile(uid: string): Promise<Profile | null> {
  const snap = await getDoc(doc(need(), "students", uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { studentId: String(d.studentId), name: String(d.name), kind: d.kind === "activated" ? "activated" : "demo" };
}

/** Written once, when the account is activated or the sample sandbox is opened. */
export async function createProfile(uid: string, p: Profile) {
  await setDoc(doc(need(), "students", uid), { ...p, createdAt: serverTimestamp() });
}

/* ─── Load everything a student has saved ────────────────────────────────── */

export async function loadCloudState(uid: string): Promise<CloudState> {
  const base = doc(need(), "students", uid);
  const [paymentsSnap, billsSnap, noticesSnap, commentsSnap, ribSnap, readSnap] = await Promise.all([
    getDocs(collection(base, "payments")),
    getDocs(collection(base, "bills")),
    getDocs(collection(base, "notices")),
    getDocs(collection(base, "comments")),
    getDoc(doc(base, "state", "rib")),
    getDoc(doc(base, "state", "notices")),
  ]);

  const payments: Payment[] = paymentsSnap.docs.map((s) => {
    const x = s.data();
    return { id: s.id, date: toDate(x.date), billId: x.billId, amount: x.amount, method: x.method, provider: x.provider, reference: x.reference, receivedBy: x.receivedBy };
  });
  const bills: Bill[] = billsSnap.docs.map((s) => {
    const x = s.data();
    return { id: s.id, number: x.number, date: toDate(x.date), title: x.title, type: x.type, semester: x.semester, amount: x.amount, lines: x.lines ?? [], dueDate: x.dueDate ? toDate(x.dueDate) : undefined };
  });
  const notices: Notice[] = noticesSnap.docs.map((s) => {
    const x = s.data();
    return { id: s.id, at: toDate(x.at), title: x.title, body: x.body, to: x.to, tone: x.tone, read: Boolean(x.read) };
  });

  const comments: Record<string, Comment[]> = {};
  for (const s of commentsSnap.docs) {
    const x = s.data();
    (comments[x.postId] ??= []).push({ id: s.id, author: x.author, authorRole: "student", at: toDate(x.at), text: x.text });
  }
  for (const list of Object.values(comments)) list.sort((a, b) => a.at.getTime() - b.at.getTime());

  const rib = ribSnap.exists() ? { registered: (ribSnap.data().registered as string[]) ?? [], submittedAt: ribSnap.data().submittedAt ? toDate(ribSnap.data().submittedAt) : undefined } : null;
  const readNoticeIds = readSnap.exists() ? ((readSnap.data().ids as string[]) ?? []) : [];

  return { payments, bills, notices, readNoticeIds, rib, comments };
}

/* ─── Write-through for each action (no-ops in offline sample mode) ──────── */

let activeUid: string | null = null;

/** Set by the auth provider: whose records the write-through goes to. */
export function setCloudUser(uid: string | null) {
  activeUid = uid;
}

function fire(what: string, write: (uid: string) => Promise<unknown>) {
  if (!db || !activeUid) return;
  write(activeUid).catch((err) => report(what, err));
}

export function persistRib(offer: RibOffer, bill: Bill, notice: Notice | undefined) {
  fire("your RIB registration", (uid) => setDoc(doc(need(), "students", uid, "state", "rib"), { exam: offer.exam, registered: offer.registered, submittedAt: ts(offer.submittedAt) }));
  fire("the RIB fee bill", (uid) => setDoc(doc(need(), "students", uid, "bills", bill.id), { ...bill, id: undefined, date: ts(bill.date), dueDate: ts(bill.dueDate) }));
  if (notice) persistNotice(notice);
}

export function persistPayment(payment: Payment, notice: Notice | undefined) {
  fire("the payment", (uid) => setDoc(doc(need(), "students", uid, "payments", payment.id), { ...payment, id: undefined, date: ts(payment.date) }));
  if (notice) persistNotice(notice);
}

export function persistNotice(n: Notice) {
  fire("a notification", (uid) => setDoc(doc(need(), "students", uid, "notices", n.id), { ...n, id: undefined, at: ts(n.at) }));
}

export function persistReadNotices(ids: string[]) {
  fire("which notifications you've read", (uid) => setDoc(doc(need(), "students", uid, "state", "notices"), { ids }));
}

export function persistComment(postId: string, c: Comment) {
  fire("your comment", (uid) => setDoc(doc(need(), "students", uid, "comments", c.id), { postId, author: c.author, text: c.text, at: serverTimestamp() }));
}
