/**
 * Student-ID accounts, independent of React and Firebase so they can be tested on their own.
 * A 16-digit ID becomes an internal address that no one ever sees or receives mail at.
 */

export type SignInError = "id" | "password" | "credentials" | "rate" | "network" | "disabled" | "unknown";
export type ActivateError = "taken" | "sample" | "weak" | "rate" | "network" | "disabled" | "unknown";

/** Keep in sync with the profile check in firestore.rules. */
export const STUDENT_EMAIL_DOMAIN = "students.smart-campus.example";

export const cleanId = (id: string) => id.replace(/\s+/g, "");
export const isStudentId = (id: string) => /^\d{16}$/.test(id);
export const aliasEmail = (id: string) => `${id}@${STUDENT_EMAIL_DOMAIN}`;

const ALIAS = new RegExp(`^(\\d{16})@${STUDENT_EMAIL_DOMAIN.replace(/\./g, "\\.")}$`);
export const idFromEmail = (email: string | null | undefined) => ALIAS.exec(email ?? "")?.[1];

const code = (err: unknown) => (typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : "");

/** Firebase sign-in error → what the sign-in page tells the student. */
export function signInReason(err: unknown): SignInError {
  switch (code(err)) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "credentials";
    case "auth/too-many-requests":
      return "rate";
    case "auth/network-request-failed":
      return "network";
    case "auth/user-disabled":
    case "auth/operation-not-allowed":
    case "auth/admin-restricted-operation":
      return "disabled";
    default:
      return "unknown";
  }
}

/** Firebase account-creation error → what the activation page tells the student. */
export function activateReason(err: unknown): ActivateError {
  switch (code(err)) {
    case "auth/email-already-in-use":
      return "taken";
    case "auth/weak-password":
    case "auth/password-does-not-meet-requirements":
      return "weak";
    case "auth/too-many-requests":
      return "rate";
    case "auth/network-request-failed":
      return "network";
    case "auth/operation-not-allowed":
    case "auth/admin-restricted-operation":
      return "disabled";
    default:
      return "unknown";
  }
}
