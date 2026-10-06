import { beforeEach, describe, expect, it, vi } from "vitest";
import { addComment, applyCloudState, markNoticesRead, pay, registerRib, resetStore, store, subscribe, type CloudState } from "./store";
import * as seed from "../data/seed";
import type { Notice } from "../data/types";

const empty = (): CloudState => ({ payments: [], bills: [], notices: [], readNoticeIds: [], rib: null, comments: {} });
const ribCard = () => store.admitCards.find((a) => a.exam === store.ribOffer.exam);

beforeEach(() => resetStore());

describe("RIB registration", () => {
  it("records the courses, raises the fee bill and updates the admit card", () => {
    const { bill } = registerRib(["MATH 1243"]);
    expect(store.ribOffer.registered).toEqual(["MATH 1243"]);
    expect(store.ribOffer.submittedAt).toBeInstanceOf(Date);
    expect(bill).toMatchObject({ type: "RIB Fee", semester: seed.SEMESTER, amount: 1000, title: `RIB fee, ${store.ribOffer.exam}` });
    expect(store.bills).toContainEqual(bill);
    expect(ribCard()).toMatchObject({ status: "Not issued", courses: [expect.objectContaining({ code: "MATH 1243" })] });
    expect(store.notices[0]).toMatchObject({ title: `Registered for ${store.ribOffer.exam}`, to: "/bills", read: false });
  });

  it("keeps one fee bill per exam when the registration changes", () => {
    const first = registerRib(["MATH 1243"]).bill;
    const second = registerRib(["MATH 1243", "PHY 1131"]).bill;
    expect(second.id).toBe(first.id);
    expect(store.bills.filter((b) => b.id === first.id)).toEqual([second]);
    expect(second.amount).toBe(2000);
  });
});

describe("payments, comments and notifications", () => {
  it("adds a payment against the bill with a sample reference and a receipt notice", () => {
    const before = store.payments.length;
    const p = pay("b1", 1000, "bKash");
    expect(store.payments).toHaveLength(before + 1);
    expect(p).toMatchObject({ billId: "b1", amount: 1000, provider: "bKash", method: "Mobile banking" });
    expect(p.reference).toMatch(/^SAMPLE[A-Z0-9]+$/);
    expect(store.notices[0]).toMatchObject({ title: "Payment received", to: `/bills/receipts/${p.id}` });
  });

  it("adds a comment to its own post only", () => {
    const [target, other] = store.posts;
    const before = other.comments.length;
    const c = addComment(target.id, "Is the lab report due Friday?", "Mahir Faisal");
    expect(store.posts.find((p) => p.id === target.id)?.comments.at(-1)).toEqual(c);
    expect(store.posts.find((p) => p.id === other.id)?.comments).toHaveLength(before);
  });

  it("marks every notification read", () => {
    markNoticesRead();
    expect(store.notices.every((n) => n.read)).toBe(true);
  });

  it("tells subscribers about each change until they unsubscribe", () => {
    const listener = vi.fn<() => void>();
    const stop = subscribe(listener);
    markNoticesRead();
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
    markNoticesRead();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("goes back to the untouched sample data on reset", () => {
    registerRib(["MATH 1243"]);
    pay("b1", 1000, "bKash");
    resetStore();
    expect(store.ribOffer.registered).toEqual([]);
    expect(store.payments).toHaveLength(seed.payments.length);
    expect(store.bills).toHaveLength(seed.bills.length);
  });
});

describe("merging a student's saved records over the sample data", () => {
  const notice = (id: string, at: string, read = false): Notice => ({ id, at: new Date(at), title: id, body: "", to: "/bills", tone: "info", read });

  it("adds saved payments and bills once, however often it runs", () => {
    const saved = { ...empty(), payments: [{ id: "pay-x", date: new Date(), billId: "b1", amount: 500, method: "Mobile banking" as const, receivedBy: "Accounts Office (online)" }] };
    applyCloudState(saved);
    applyCloudState(saved);
    expect(store.payments.filter((p) => p.id === "pay-x")).toHaveLength(1);
  });

  it("keeps notifications newest first and remembers which were read", () => {
    applyCloudState({ ...empty(), notices: [notice("n-new", "2026-10-07T09:00:00+06:00"), notice("n-old", "2026-01-01T09:00:00+06:00")], readNoticeIds: ["n-new"] });
    const times = store.notices.map((n) => n.at.getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
    expect(store.notices.find((n) => n.id === "n-new")?.read).toBe(true);
    expect(store.notices.find((n) => n.id === "n-old")?.read).toBe(false);
  });

  it("restores a saved RIB registration on the offer and the admit card", () => {
    applyCloudState({ ...empty(), rib: { registered: ["PHY 1131"], submittedAt: new Date() } });
    expect(store.ribOffer.registered).toEqual(["PHY 1131"]);
    expect(ribCard()?.courses.map((c) => c.code)).toEqual(["PHY 1131"]);
  });

  it("appends saved comments to the posts they belong to", () => {
    const post = store.posts[0];
    const before = post.comments.length;
    applyCloudState({ ...empty(), comments: { [post.id]: [{ id: "c-saved", author: "Mahir Faisal", authorRole: "student", at: new Date(), text: "Saved" }], "no-such-post": [] } });
    const after = store.posts.find((p) => p.id === post.id)!;
    expect(after.comments).toHaveLength(before + 1);
    expect(after.comments.at(-1)?.id).toBe("c-saved");
  });
});
