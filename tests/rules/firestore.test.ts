import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, getDocs, collection, serverTimestamp, setDoc, Timestamp, updateDoc, type Firestore } from "firebase/firestore";

// Mirrors the app: activated accounts sign in as <16-digit ID>@students.smart-campus.example,
// and the sample sandbox is an anonymous account that always plays the sample student.
const DOMAIN = "students.smart-campus.example";
const SAMPLE_ID = "9999202600001042";
const ALICE = { uid: "alice", id: "2026000000000017" };
const BOB = { uid: "bob", id: "2026000000000018" };

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-smart-campus",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});
beforeEach(() => env.clearFirestore());
afterAll(() => env.cleanup());

const student = (who: { uid: string; id: string }): Firestore =>
  env.authenticatedContext(who.uid, { email: `${who.id}@${DOMAIN}`, firebase: { sign_in_provider: "password" } }).firestore() as unknown as Firestore;
const sandbox = (uid = "anon"): Firestore => env.authenticatedContext(uid, { firebase: { sign_in_provider: "anonymous" } }).firestore() as unknown as Firestore;
const signedOut = (): Firestore => env.unauthenticatedContext().firestore() as unknown as Firestore;

const profile = (studentId: string, kind: "activated" | "demo" = "activated", name = "Alice Rahman") => ({ studentId, name, kind, createdAt: serverTimestamp() });
const ts = Timestamp.fromDate(new Date("2026-10-07T09:20:00+06:00"));
const payment = { date: ts, billId: "rib-fee-rib-exam-of-summer-2026", amount: 1000, method: "Mobile banking", provider: "bKash", reference: "SAMPLE7LPXJCI1", receivedBy: "Accounts Office (online)" };
const bill = { number: "2026005301", date: ts, title: "RIB fee, RIB Exam of Summer 2026", type: "RIB Fee", semester: "Summer 2026", amount: 1000, lines: [{ name: "RIB examination, 1 course", amount: 1000 }], dueDate: ts };
const notice = { at: ts, title: "Payment received", body: "৳1,000 by bKash. Your receipt is ready.", to: "/bills/receipts/pay-1", tone: "info", read: false };
const comment = (text = "Is the lab report due Friday?") => ({ postId: "p-2101-mid", author: "Alice Rahman", text, at: serverTimestamp() });

/** Writes a document as if the student had already saved it, bypassing the rules. */
const seedAs = (path: string, data: Record<string, unknown>) => env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore() as unknown as Firestore, path), data));

describe("profiles", () => {
  it("lets a student create the profile for their own ID", async () => {
    await assertSucceeds(setDoc(doc(student(ALICE), "students", ALICE.uid), profile(ALICE.id)));
  });

  it("refuses a profile whose ID doesn't match the account", async () => {
    await assertFails(setDoc(doc(student(ALICE), "students", ALICE.uid), profile(BOB.id)));
  });

  it("refuses to activate an ID from the sample range", async () => {
    const sampleRange = { uid: "mallory", id: "9999202600001099" };
    await assertFails(setDoc(doc(student(sampleRange), "students", sampleRange.uid), profile(sampleRange.id)));
  });

  it("lets the sandbox be the sample student, and nobody else", async () => {
    await assertSucceeds(setDoc(doc(sandbox(), "students", "anon"), profile(SAMPLE_ID, "demo", "Mahir Faisal")));
    await assertFails(setDoc(doc(sandbox("anon-2"), "students", "anon-2"), profile(ALICE.id, "demo")));
    await assertFails(setDoc(doc(student(ALICE), "students", ALICE.uid), profile(SAMPLE_ID, "demo")));
  });

  it("refuses extra fields, overlong names and client-chosen creation times", async () => {
    const db = student(ALICE);
    const ref = doc(db, "students", ALICE.uid);
    await assertFails(setDoc(ref, { ...profile(ALICE.id), admin: true }));
    await assertFails(setDoc(ref, profile(ALICE.id, "activated", "x".repeat(81))));
    await assertFails(setDoc(ref, { ...profile(ALICE.id), createdAt: ts }));
  });

  it("keeps a profile readable by its owner only, and fixed once written", async () => {
    await seedAs(`students/${ALICE.uid}`, { studentId: ALICE.id, name: "Alice Rahman", kind: "activated", createdAt: ts });
    await assertSucceeds(getDoc(doc(student(ALICE), "students", ALICE.uid)));
    await assertFails(getDoc(doc(student(BOB), "students", ALICE.uid)));
    await assertFails(getDoc(doc(signedOut(), "students", ALICE.uid)));
    await assertFails(updateDoc(doc(student(ALICE), "students", ALICE.uid), { name: "Someone Else" }));
    await assertFails(deleteDoc(doc(student(ALICE), "students", ALICE.uid)));
  });
});

describe("a student's own records", () => {
  it("accepts a payment once, exactly as the portal writes it", async () => {
    const ref = doc(student(ALICE), "students", ALICE.uid, "payments", "pay-1");
    await assertSucceeds(setDoc(ref, payment));
    await assertFails(setDoc(ref, payment)); // no rewriting history
    await assertFails(deleteDoc(ref));
  });

  it("refuses payments with extra fields, odd amounts or unknown methods", async () => {
    const pay = (id: string, data: Record<string, unknown>) => setDoc(doc(student(ALICE), "students", ALICE.uid, "payments", id), data);
    await assertFails(pay("p-extra", { ...payment, verified: true }));
    await assertFails(pay("p-negative", { ...payment, amount: -5 }));
    await assertFails(pay("p-huge", { ...payment, amount: 1_000_001 }));
    await assertFails(pay("p-method", { ...payment, method: "Cash in hand" }));
  });

  it("lets a RIB fee bill be replaced when the registration changes, within limits", async () => {
    const ref = doc(student(ALICE), "students", ALICE.uid, "bills", "rib-fee-rib-exam-of-summer-2026");
    await assertSucceeds(setDoc(ref, bill));
    await assertSucceeds(setDoc(ref, { ...bill, amount: 2000 }));
    await assertFails(setDoc(ref, { ...bill, type: "Hostel Fee" }));
    await assertFails(setDoc(ref, { ...bill, lines: Array.from({ length: 21 }, (_, i) => ({ name: `line ${i}`, amount: 1 })) }));
  });

  it("keeps notification links inside the portal", async () => {
    const write = (id: string, data: Record<string, unknown>) => setDoc(doc(student(ALICE), "students", ALICE.uid, "notices", id), data);
    await assertSucceeds(write("n-1", notice));
    await assertFails(write("n-2", { ...notice, to: "javascript:alert(1)" }));
    await assertFails(write("n-3", { ...notice, to: "https://example.com" }));
    await assertFails(write("n-4", { ...notice, tone: "celebration" }));
  });

  it("stamps comments with the server's time and caps their length", async () => {
    const write = (id: string, data: Record<string, unknown>) => setDoc(doc(student(ALICE), "students", ALICE.uid, "comments", id), data);
    await assertSucceeds(write("c-1", comment()));
    await assertFails(write("c-2", { ...comment(), at: ts }));
    await assertFails(write("c-3", comment("")));
    await assertFails(write("c-4", comment("x".repeat(1001))));
  });

  it("stores only the two known state documents", async () => {
    const write = (id: string, data: Record<string, unknown>) => setDoc(doc(student(ALICE), "students", ALICE.uid, "state", id), data);
    await assertSucceeds(write("rib", { exam: "RIB Exam of Summer 2026", registered: ["MATH 1243"], submittedAt: ts }));
    await assertSucceeds(write("notices", { ids: ["n-1", "n-2"] }));
    await assertFails(write("rib", { exam: "RIB Exam of Summer 2026", registered: Array.from({ length: 21 }, (_, i) => `C ${i}`) }));
    await assertFails(write("preferences", { theme: "dark" }));
  });
});

describe("isolation", () => {
  it("never lets one student read or write another's records", async () => {
    await seedAs(`students/${ALICE.uid}/payments/pay-1`, payment);
    await assertFails(getDocs(collection(student(BOB), "students", ALICE.uid, "payments")));
    await assertFails(getDoc(doc(student(BOB), "students", ALICE.uid, "payments", "pay-1")));
    await assertFails(setDoc(doc(student(BOB), "students", ALICE.uid, "payments", "pay-2"), payment));
    await assertFails(getDocs(collection(signedOut(), "students", ALICE.uid, "payments")));
  });

  it("refuses collections the portal doesn't use", async () => {
    await assertFails(setDoc(doc(student(ALICE), "students", ALICE.uid, "junk", "x"), { a: "b" }));
    await assertFails(setDoc(doc(student(ALICE), "posts", "p-1"), { a: "b" }));
    await assertFails(getDocs(collection(student(ALICE), "students")));
  });
});
