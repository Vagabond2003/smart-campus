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
 *   students/{uid}/submissions/{id}     work handed in for an assignment (file name only)
 *
 * The same visitor's teacher side of their sandbox campus:
 *
 *   students/{uid}/rolls/{key}          rolls taken (absent and late roster IDs)
 *   students/{uid}/marks/{key}          mark sheets, draft or published
 *   students/{uid}/grades/{id}          assignment grade sheets
 *   students/{uid}/posts/{id}           course posts
 *   students/{uid}/bundles/{id}         lectures and materials (file names only)
 *   students/{uid}/assignments/{id}     assignments set
 *   students/{uid}/advising/{personId}  RIB registration decisions
 *   students/{uid}/state/pins           posts pinned or unpinned
 *   students/{uid}/state/reminders      advisees reminded to register
 *
 * Writes are fire-and-forget: the in-memory store has already changed, so the portal never waits
 * on the network. A failed write is reported through onCloudError.
 */
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, Timestamp } from "firebase/firestore/lite";
import { db } from "../lib/firebase";
import type { AdvisingDecision, Assignment, Bill, Bundle, Comment, GradeSheet, MarkSheet, Notice, Payment, Post, RibOffer, Roll } from "../data/types";
import type { CloudState, MySubmission } from "./store";

export interface Profile {
  studentId: string;
  name: string;
  kind: "activated" | "demo";
}

/** `what` names the record in plain words ("the payment"), ready for a sentence; `retry` writes it again. */
type Report = (what: string, err: unknown, retry: () => void) => void;
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
  const all = (name: string) => getDocs(collection(base, name));
  const [paymentsSnap, billsSnap, noticesSnap, commentsSnap, ribSnap, readSnap] = await Promise.all([
    all("payments"),
    all("bills"),
    all("notices"),
    all("comments"),
    getDoc(doc(base, "state", "rib")),
    getDoc(doc(base, "state", "notices")),
  ]);
  const [subsSnap, rollsSnap, marksSnap, gradesSnap, postsSnap, bundlesSnap, asgSnap, advSnap, pinsSnap, remindSnap] = await Promise.all([
    all("submissions"),
    all("rolls"),
    all("marks"),
    all("grades"),
    all("posts"),
    all("bundles"),
    all("assignments"),
    all("advising"),
    getDoc(doc(base, "state", "pins")),
    getDoc(doc(base, "state", "reminders")),
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
    return { id: s.id, at: toDate(x.at), title: x.title, body: x.body, to: x.to, tone: x.tone, read: Boolean(x.read), ...(x.audience === "teacher" ? { audience: "teacher" as const } : {}) };
  });

  const comments: Record<string, Comment[]> = {};
  for (const s of commentsSnap.docs) {
    const x = s.data();
    (comments[x.postId] ??= []).push({ id: s.id, author: x.author, authorRole: x.role === "teacher" ? "teacher" : "student", at: toDate(x.at), text: x.text });
  }
  for (const list of Object.values(comments)) list.sort((a, b) => a.at.getTime() - b.at.getTime());

  const rib = ribSnap.exists() ? { registered: (ribSnap.data().registered as string[]) ?? [], submittedAt: ribSnap.data().submittedAt ? toDate(ribSnap.data().submittedAt) : undefined } : null;
  const readNoticeIds = readSnap.exists() ? ((readSnap.data().ids as string[]) ?? []) : [];

  const submissions: MySubmission[] = subsSnap.docs.map((s) => ({ assignmentId: s.id, file: s.data().file, size: s.data().size, at: toDate(s.data().at) }));
  const rolls: Roll[] = rollsSnap.docs.map((s) => {
    const x = s.data();
    return { key: s.id, code: x.code, absent: x.absent ?? [], late: x.late ?? [], takenAt: toDate(x.takenAt), editedAt: x.editedAt ? toDate(x.editedAt) : undefined, reason: x.reason };
  });
  const marks: MarkSheet[] = marksSnap.docs.map((s) => {
    const x = s.data();
    return { key: s.id, code: x.code, name: x.name, scores: x.scores ?? {}, state: x.state, updatedAt: toDate(x.updatedAt), publishedAt: x.publishedAt ? toDate(x.publishedAt) : undefined };
  });
  const grades: GradeSheet[] = gradesSnap.docs.map((s) => {
    const x = s.data();
    return { assignmentId: s.id, scores: x.scores ?? {}, state: x.state, updatedAt: toDate(x.updatedAt), publishedAt: x.publishedAt ? toDate(x.publishedAt) : undefined };
  });
  const posts: Post[] = postsSnap.docs.map((s) => {
    const x = s.data();
    return { id: s.id, code: x.code, authorId: TEACHER, at: toDate(x.at), title: x.title, blocks: x.blocks ?? [], pinned: Boolean(x.pinned), comments: [] };
  });
  const bundles: Bundle[] = bundlesSnap.docs.map((s) => {
    const x = s.data();
    return { id: s.id, code: x.code, section: x.section, title: x.title, at: toDate(x.at), authorId: TEACHER, resources: x.resources ?? [] };
  });
  const assignments: Assignment[] = asgSnap.docs.map((s) => {
    const x = s.data();
    return { id: s.id, code: x.code, title: x.title, brief: x.brief, due: toDate(x.due), max: x.max, state: "open", authorId: TEACHER, postedAt: toDate(x.postedAt) };
  });
  const advising: AdvisingDecision[] = advSnap.docs.map((s) => ({ personId: s.id, decision: s.data().decision, note: s.data().note, at: toDate(s.data().at) }));
  const pins = pinsSnap.exists() ? ((pinsSnap.data().pins as Record<string, boolean>) ?? {}) : {};
  const reminded = remindSnap.exists() ? ((remindSnap.data().ids as string[]) ?? []) : [];

  return { payments, bills, notices, readNoticeIds, rib, comments, submissions, rolls, marks, grades, posts, pins, bundles, assignments, advising, reminded };
}

/** Every teacher-side record belongs to the one teacher a visitor plays (src/data/campus.ts). */
const TEACHER = "t-arman";

/* ─── Write-through for each action (no-ops in offline sample mode) ──────── */

let activeUid: string | null = null;

/** Set by the auth provider: whose records the write-through goes to. */
export function setCloudUser(uid: string | null) {
  activeUid = uid;
}

function fire(what: string, write: (uid: string) => Promise<unknown>) {
  if (!db || !activeUid) return;
  write(activeUid).catch((err) => report(what, err, () => fire(what, write)));
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
  fire("a notification", (uid) => setDoc(doc(need(), "students", uid, "notices", n.id), defined({ at: ts(n.at), title: n.title, body: n.body, to: n.to, tone: n.tone, read: n.read, audience: n.audience })));
}

export function persistReadNotices(ids: string[]) {
  fire("which notifications you've read", (uid) => setDoc(doc(need(), "students", uid, "state", "notices"), { ids }));
}

export function persistComment(postId: string, c: Comment) {
  fire(c.authorRole === "teacher" ? "your reply" : "your comment", (uid) =>
    setDoc(doc(need(), "students", uid, "comments", c.id), { postId, author: c.author, text: c.text, at: serverTimestamp(), ...(c.authorRole === "teacher" ? { role: "teacher" } : {}) }),
  );
}

export function persistSubmission(s: MySubmission) {
  fire("your submission", (uid) => setDoc(doc(need(), "students", uid, "submissions", s.assignmentId), { file: s.file, size: s.size, at: ts(s.at) }));
}

/* ─── The teacher's side ─────────────────────────────────────────────────── */

/** Firestore refuses undefined values: drop optional fields that aren't set. */
const defined = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

export function persistRoll(r: Roll) {
  fire("the roll", (uid) => setDoc(doc(need(), "students", uid, "rolls", r.key), defined({ code: r.code, absent: r.absent, late: r.late, takenAt: ts(r.takenAt), editedAt: ts(r.editedAt), reason: r.reason || undefined })));
}

export function persistMarks(m: MarkSheet) {
  fire("the mark sheet", (uid) => setDoc(doc(need(), "students", uid, "marks", m.key), defined({ code: m.code, name: m.name, scores: m.scores, state: m.state, updatedAt: ts(m.updatedAt), publishedAt: ts(m.publishedAt) })));
}

export function persistGrades(g: GradeSheet) {
  fire("the grades", (uid) => setDoc(doc(need(), "students", uid, "grades", g.assignmentId), defined({ scores: g.scores, state: g.state, updatedAt: ts(g.updatedAt), publishedAt: ts(g.publishedAt) })));
}

export function persistPost(p: Post) {
  fire("the post", (uid) => setDoc(doc(need(), "students", uid, "posts", p.id), { code: p.code, title: p.title, blocks: p.blocks, pinned: p.pinned, at: ts(p.at) }));
}

/** Pins live in one document: seeded posts can't be edited, so their pin state is kept beside them. */
export function persistPins(pins: Record<string, boolean>) {
  fire("the pin", (uid) => setDoc(doc(need(), "students", uid, "state", "pins"), { pins }));
}

export function persistBundle(b: Bundle) {
  fire("the files", (uid) =>
    setDoc(doc(need(), "students", uid, "bundles", b.id), { code: b.code, section: b.section, title: b.title, at: ts(b.at), resources: b.resources.map((r) => defined({ name: r.name, kind: r.kind, size: r.size, url: r.url })) }),
  );
}

export function persistAssignment(a: Assignment) {
  fire("the assignment", (uid) => setDoc(doc(need(), "students", uid, "assignments", a.id), { code: a.code, title: a.title, brief: a.brief, due: ts(a.due), max: a.max, postedAt: ts(a.postedAt ?? a.due) }));
}

export function persistDecision(d: AdvisingDecision) {
  fire("the decision", (uid) => setDoc(doc(need(), "students", uid, "advising", d.personId), defined({ decision: d.decision, note: d.note, at: ts(d.at) })));
}

export function persistReminders(ids: string[]) {
  fire("the reminder", (uid) => setDoc(doc(need(), "students", uid, "state", "reminders"), { ids }));
}
