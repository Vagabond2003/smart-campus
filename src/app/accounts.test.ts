import { describe, expect, it } from "vitest";
import { activateReason, aliasEmail, cleanId, idFromEmail, isStudentId, signInReason, STUDENT_EMAIL_DOMAIN } from "./accounts";

const err = (code: string) => Object.assign(new Error(code), { code });

describe("student IDs", () => {
  it("ignores the spaces people type between digit groups", () => {
    expect(cleanId(" 9999 2026 0000 1042 ")).toBe("9999202600001042");
  });

  it("accepts exactly sixteen digits", () => {
    expect(isStudentId("2026000000000017")).toBe(true);
    expect(isStudentId("202600000000001")).toBe(false);
    expect(isStudentId("20260000000000170")).toBe(false);
    expect(isStudentId("2026-00000000017")).toBe(false);
  });

  it("round-trips an ID through its internal address", () => {
    const id = "2026000000000017";
    expect(aliasEmail(id)).toBe(`${id}@${STUDENT_EMAIL_DOMAIN}`);
    expect(idFromEmail(aliasEmail(id))).toBe(id);
  });

  it("reads an ID only from a genuine internal address", () => {
    expect(idFromEmail(null)).toBeUndefined();
    expect(idFromEmail("student@gmail.com")).toBeUndefined();
    expect(idFromEmail(`123@${STUDENT_EMAIL_DOMAIN}`)).toBeUndefined();
    expect(idFromEmail(`2026000000000017@${STUDENT_EMAIL_DOMAIN}.evil.example`)).toBeUndefined();
    expect(idFromEmail(`2026000000000017@studentsXsmart-campus.example`)).toBeUndefined();
  });
});

describe("Firebase errors become messages a student can act on", () => {
  it.each([
    ["auth/invalid-credential", "credentials"],
    ["auth/invalid-login-credentials", "credentials"],
    ["auth/wrong-password", "credentials"],
    ["auth/user-not-found", "credentials"],
    ["auth/too-many-requests", "rate"],
    ["auth/network-request-failed", "network"],
    ["auth/user-disabled", "disabled"],
    ["auth/admin-restricted-operation", "disabled"],
    ["auth/something-new", "unknown"],
  ])("sign-in: %s → %s", (code, reason) => {
    expect(signInReason(err(code))).toBe(reason);
  });

  it.each([
    ["auth/email-already-in-use", "taken"],
    ["auth/weak-password", "weak"],
    ["auth/password-does-not-meet-requirements", "weak"],
    ["auth/too-many-requests", "rate"],
    ["auth/network-request-failed", "network"],
    ["auth/operation-not-allowed", "disabled"],
    ["auth/something-new", "unknown"],
  ])("activation: %s → %s", (code, reason) => {
    expect(activateReason(err(code))).toBe(reason);
  });

  it("treats anything without a code as unknown", () => {
    expect(signInReason(new Error("boom"))).toBe("unknown");
    expect(signInReason("boom")).toBe("unknown");
    expect(activateReason(null)).toBe("unknown");
  });
});
