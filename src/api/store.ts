/**
 * In-memory store over the synthetic seed: the visitor's own sandbox campus. Both sides of the
 * portal read it. As the student they register for RIB, pay, comment and submit work; as the
 * teacher (src/data/campus.ts) they take rolls, publish marks, post, grade and advise. Every
 * mutation changes the store at once; with Firebase it's also written to the visitor's own record
 * (src/api/cloud.ts) and merged back in at the next sign-in. Offline, a reload restores the seed.
 */
import * as seed from "../data/seed";
import * as campus from "../data/campus";
import type { AdmitCard, AdvisingDecision, Assignment, Bill, Bundle, Comment, GradeSheet, MarkSheet, Notice, Payment, Post, PostBlock, Resource, RibOffer, Roll } from "../data/types";
import { atTime, calendar as C, now } from "../lib/clock";

type Listener = () => void;
const listeners = new Set<Listener>();

/** A file the student handed in. Names only: nothing is uploaded in this concept build. */
export interface MySubmission {
  assignmentId: string;
  file: string;
  size: string;
  at: Date;
}

function fresh() {
  return {
    bills: [...seed.bills] as Bill[],
    payments: [...seed.payments] as Payment[],
    adjustments: [...seed.adjustments],
    posts: seed.posts.map((p) => ({ ...p, comments: [...p.comments] })) as Post[],
    ribOffer: { ...seed.ribOffer, registered: [...seed.ribOffer.registered] } as RibOffer,
    admitCards: seed.admitCards.map((a) => ({ ...a, courses: [...a.courses] })) as AdmitCard[],
    notices: [...seed.notices.map((n) => ({ ...n })), ...campus.teacherNotices()] as Notice[],
    assignments: seed.assignments.map((a) => ({ ...a })) as Assignment[],
    submissions: {} as Record<string, MySubmission>,
    // The teacher's side
    rolls: {} as Record<string, Roll>,
    marks: {} as Record<string, MarkSheet>,
    grades: {} as Record<string, GradeSheet>,
    bundles: [] as Bundle[],
    advising: {} as Record<string, AdvisingDecision>,
    reminded: [] as string[],
  };
}

export const store = fresh();

/** Back to the untouched sample data (on sign-out, and before loading another visitor's records). */
export function resetStore() {
  Object.assign(store, fresh());
  emit();
}

/** What a signed-in visitor has saved in Firestore, merged over the sample data. */
export interface CloudState {
  payments: Payment[];
  bills: Bill[];
  notices: Notice[];
  readNoticeIds: string[];
  rib: { registered: string[]; submittedAt?: Date } | null;
  comments: Record<string, Comment[]>;
  submissions?: MySubmission[];
  rolls?: Roll[];
  marks?: MarkSheet[];
  grades?: GradeSheet[];
  posts?: Post[];
  pins?: Record<string, boolean>;
  bundles?: Bundle[];
  assignments?: Assignment[];
  advising?: AdvisingDecision[];
  reminded?: string[];
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
  store.posts = byId(store.posts, s.posts ?? []);
  store.posts = store.posts.map((p) => {
    const extra = s.comments[p.id] ?? [];
    const pinned = s.pins?.[p.id];
    return extra.length || pinned != null ? { ...p, pinned: pinned ?? p.pinned, comments: [...p.comments, ...extra].sort((a, b) => a.at.getTime() - b.at.getTime()) } : p;
  });
  store.assignments = byId(store.assignments, s.assignments ?? []);
  for (const x of s.submissions ?? []) store.submissions[x.assignmentId] = x;
  for (const r of s.rolls ?? []) store.rolls[r.key] = r;
  for (const m of s.marks ?? []) store.marks[m.key] = m;
  for (const g of s.grades ?? []) applyGrades(g);
  store.bundles = byId(store.bundles, s.bundles ?? []);
  for (const d of s.advising ?? []) store.advising[d.personId] = d;
  store.reminded = [...new Set([...store.reminded, ...(s.reminded ?? [])])];
  emit();
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
let version = 0;
/** Bumped on every change, for components that derive straight from the store. */
export const storeVersion = () => version;
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};

let seq = 1;
const id = (p: string) => `${p}-${Date.now().toString(36)}-${seq++}`;

function notify(n: Omit<Notice, "id" | "at" | "read">): Notice {
  const notice: Notice = { id: id("n"), at: now(), read: false, ...n };
  store.notices = [notice, ...store.notices];
  return notice;
}

const slugOf = (code: string) => seed.offeringByCode[code]?.slug ?? code.toLowerCase().replace(/\s+/g, "-");

/* ─── The student's actions ──────────────────────────────────────────────── */

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

  const forAdvisor = notify({ title: `${seed.student.name} registered for RIB`, body: `${chosen.map((c) => c.code).join(", ")} for ${offer.exam}. Waiting for your approval.`, to: "/teach/approvals", tone: "caution", audience: "teacher" });
  const forStudent = notify({ title: `Registered for ${offer.exam}`, body: `${chosen.map((c) => c.code).join(", ")}. A fee bill of ৳${fee.toLocaleString("en-US")} was added to Bills. Your advisor approves it next.`, to: "/bills", tone: "info" });
  emit();
  return { bill, notices: [forStudent, forAdvisor] };
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
  notify({ title: "Payment received", body: `৳${amount.toLocaleString("en-US")} by ${provider}. Your receipt is ready.`, to: `/bills/receipts/${payment.id}`, tone: "info" });
  emit();
  return payment;
}

/** A comment on a course post, by the student or (replying) by the teacher. */
export function addComment(postId: string, text: string, author: string, role: Comment["authorRole"] = "student") {
  const c: Comment = { id: id("c"), author, authorRole: role, at: now(), text };
  const post = store.posts.find((p) => p.id === postId);
  store.posts = store.posts.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, c] } : p));
  let notice: Notice | undefined;
  if (post && role === "student" && post.authorId === campus.TEACHER_ID) {
    notice = notify({ title: `${author} commented`, body: `On ${post.title}: “${text.length > 90 ? `${text.slice(0, 88)}…` : text}”`, to: `/teach/courses/${slugOf(post.code)}/discussion#${post.id}`, tone: "info", audience: "teacher" });
  } else if (post && role === "teacher") {
    notice = notify({ title: `${author} replied in ${post.code}`, body: `On ${post.title}: “${text.length > 90 ? `${text.slice(0, 88)}…` : text}”`, to: `/courses/${slugOf(post.code)}/discussion#${post.id}`, tone: "info" });
  }
  emit();
  return { comment: c, notice };
}

/** Hand in work for an assignment. The file is recorded by name and size; nothing is uploaded. */
export function submitAssignment(assignmentId: string, file: { name: string; size: string }) {
  const sub: MySubmission = { assignmentId, file: file.name, size: file.size, at: now() };
  store.submissions[assignmentId] = sub;
  const a = store.assignments.find((x) => x.id === assignmentId);
  const notice = a ? notify({ title: `${seed.student.name} submitted work`, body: `${a.code}: ${a.title.replace(/^Assignment \d+: /, "")}.`, to: `/teach/courses/${slugOf(a.code)}/assignments/${a.id}`, tone: "info", audience: "teacher" }) : undefined;
  emit();
  return { submission: sub, notice };
}

/** Mark every notification read, for whichever side is looking. */
export function markNoticesRead(audience: Notice["audience"] = undefined) {
  store.notices = store.notices.map((n) => (n.audience === audience ? { ...n, read: true } : n));
  emit();
}

/* ─── The teacher's actions ──────────────────────────────────────────────── */

/** Save (or correct) one class meeting's roll. */
export function saveRoll(key: string, absent: string[], late: string[], reason?: string) {
  const s = campus.sessionByKey(key);
  if (!s) throw new Error(`No class meeting ${key}`);
  const prev = store.rolls[key];
  const roll: Roll = { key, code: s.code, absent: [...absent], late: [...late], takenAt: prev?.takenAt ?? now(), ...(prev ? { editedAt: now(), reason } : {}) };
  store.rolls[key] = roll;
  const wasAbsent = prev ? prev.absent.includes(campus.ME) : campus.baseRolls.get(key)?.absent.includes(campus.ME);
  let notice: Notice | undefined;
  if (absent.includes(campus.ME) && !wasAbsent) {
    notice = notify({ title: `Marked absent in ${s.code}`, body: `${s.start.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}, period ${s.period}. Your Attendance Summary is up to date.`, to: "/attendance", tone: "caution" });
  }
  emit();
  return { roll, notice };
}

/** Save a mark sheet as a draft, or publish it to the class. */
export function saveMarks(code: string, name: string, scores: Record<string, number>, publish: boolean) {
  const key = campus.assessmentKey(code, name);
  const prev = store.marks[key];
  const published = publish || prev?.state === "published";
  const sheet: MarkSheet = { key, code, name, scores: { ...scores }, state: published ? "published" : "draft", updatedAt: now(), publishedAt: prev?.publishedAt ?? (published ? now() : undefined) };
  store.marks[key] = sheet;
  let notice: Notice | undefined;
  if (published && publish) {
    const a = seed.assessments.find((x) => x.code === code && x.name === name);
    const mine = scores[campus.ME];
    const first = prev?.state !== "published";
    notice = notify({
      title: `${name} marks ${first ? "published" : "updated"} for ${code}`,
      body: mine != null ? `You scored ${mine} out of ${a?.max ?? ""}.`.replace(" out of .", ".") : "You're recorded as absent for this assessment.",
      to: `/courses/${slugOf(code)}/assessments`,
      tone: mine != null && a && mine / a.max < 0.5 ? "caution" : "info",
    });
  }
  emit();
  return { sheet, notice };
}

export interface NewPost {
  code: string;
  title: string;
  blocks: PostBlock[];
  pinned: boolean;
}

export function createPost(v: NewPost) {
  const post: Post = { id: id("p"), code: v.code, authorId: campus.TEACHER_ID, at: now(), title: v.title, blocks: v.blocks, pinned: v.pinned, comments: [] };
  store.posts = [post, ...store.posts];
  const first = v.blocks.find((b) => b.kind === "p") as { text: string } | undefined;
  const notice = notify({ title: `New post in ${v.code}`, body: `${v.title}${first ? `: ${first.text.length > 80 ? `${first.text.slice(0, 78)}…` : first.text}` : "."}`, to: `/courses/${slugOf(v.code)}/discussion#${post.id}`, tone: "info" });
  emit();
  return { post, notice };
}

export function setPinned(postId: string, pinned: boolean) {
  store.posts = store.posts.map((p) => (p.id === postId ? { ...p, pinned } : p));
  emit();
}

export function addBundle(v: { code: string; section: "lectures" | "materials"; title: string; resources: Resource[] }) {
  const bundle: Bundle = { id: id("b"), code: v.code, title: v.title, at: now(), authorId: campus.TEACHER_ID, resources: v.resources, section: v.section };
  store.bundles = [bundle, ...store.bundles];
  const notice = notify({ title: `New ${v.section === "lectures" ? "lecture" : "material"} in ${v.code}`, body: `${v.title} · ${v.resources.length} file${v.resources.length === 1 ? "" : "s"}.`, to: `/courses/${slugOf(v.code)}/${v.section}`, tone: "info" });
  emit();
  return { bundle, notice };
}

export function createAssignment(v: { code: string; title: string; brief: string; due: Date; max: number }) {
  const a: Assignment = { id: id("asg"), code: v.code, title: v.title, brief: v.brief, due: v.due, max: v.max, state: "open", authorId: campus.TEACHER_ID, postedAt: now() };
  store.assignments = [...store.assignments, a];
  const notice = notify({ title: `New assignment in ${v.code}`, body: `${v.title}. Due ${v.due.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}.`, to: `/courses/${slugOf(v.code)}/assignments`, tone: "info" });
  emit();
  return { assignment: a, notice };
}

/** Put a grade sheet into the store; a published one also fills the student's assignment and its assessment. */
function applyGrades(g: GradeSheet) {
  store.grades[g.assignmentId] = g;
  if (g.state !== "published") return;
  const a = store.assignments.find((x) => x.id === g.assignmentId);
  if (!a) return;
  const mine = g.scores[campus.ME];
  store.assignments = store.assignments.map((x) => (x.id === a.id ? { ...x, state: mine != null ? "graded" : x.state, marks: mine } : x));
  if (a.assessment) {
    const key = campus.assessmentKey(a.code, a.assessment);
    store.marks[key] = { key, code: a.code, name: a.assessment, scores: { ...g.scores }, state: "published", updatedAt: g.updatedAt, publishedAt: g.publishedAt };
  }
}

export function saveGrades(assignmentId: string, scores: Record<string, number>, publish: boolean) {
  const prev = store.grades[assignmentId];
  const published = publish || prev?.state === "published";
  const g: GradeSheet = { assignmentId, scores: { ...scores }, state: published ? "published" : "draft", updatedAt: now(), publishedAt: prev?.publishedAt ?? (published ? now() : undefined) };
  applyGrades(g);
  let notice: Notice | undefined;
  const a = store.assignments.find((x) => x.id === assignmentId);
  if (publish && a && scores[campus.ME] != null) {
    notice = notify({ title: `${a.code} assignment graded`, body: `${a.title.replace(/^Assignment \d+: /, "")}: ${scores[campus.ME]} out of ${a.max}.`, to: `/courses/${slugOf(a.code)}/assignments`, tone: "info" });
  }
  emit();
  return { grades: g, notice };
}

/** Approve or return an advisee's RIB registration. */
export function decideRegistration(personId: string, decision: AdvisingDecision["decision"], note?: string) {
  const d: AdvisingDecision = { personId, decision, note: note?.trim() || undefined, at: now() };
  store.advising[personId] = d;
  let notice: Notice | undefined;
  if (personId === campus.ME) {
    notice =
      decision === "approved"
        ? notify({ title: "RIB registration approved", body: `${campus.teacher.name}, your advisor, approved your registration for ${store.ribOffer.exam}.`, to: "/registration/rib", tone: "info" })
        : notify({ title: "RIB registration returned", body: `${campus.teacher.name}: “${d.note ?? "Please review your choice."}” Update it before ${store.ribOffer.deadline.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.`, to: "/registration/rib", tone: "danger" });
  }
  emit();
  return { decision: d, notice };
}

/** Remind an advisee who carries a referred or backlog course to register for the RIB exam. */
export function remind(personId: string) {
  if (!store.reminded.includes(personId)) store.reminded = [...store.reminded, personId];
  let notice: Notice | undefined;
  if (personId === campus.ME) {
    const req = store.ribOffer.courses.filter((c) => c.required).map((c) => c.code);
    notice = notify({ title: "Your advisor sent a reminder", body: `Register ${req.join(", ")} for ${store.ribOffer.exam} by ${store.ribOffer.deadline.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.`, to: "/registration/rib", tone: "danger" });
  }
  emit();
  return { reminded: store.reminded, notice };
}
