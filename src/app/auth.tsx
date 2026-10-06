/**
 * Sign-in, in one of two modes:
 *
 * - firebase: real accounts. A student activates an account with a 16-digit ID, a name and a
 *   password; the ID becomes an internal address (<id>@students.smart-campus.example) that no
 *   one ever sees or receives mail at. "Explore with the sample student" opens a private
 *   anonymous sandbox. Whatever the student does is saved to their own Firestore record.
 * - local: no Firebase config, so the original offline sample login, kept in sessionStorage.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut as fbSignOut, updateProfile, type User } from "firebase/auth";
import { auth, trackEvent } from "../lib/firebase";
import { createProfile, loadCloudState, loadProfile, onCloudError, setCloudUser, type Profile } from "../api/cloud";
import { applyCloudState, resetStore } from "../api/store";
import { SAMPLE_ID_PREFIX, SAMPLE_PASSWORD, SAMPLE_STUDENT, setStudentIdentity } from "../data/seed";
import { useToast } from "../components/Toast";

export type SignInError = "id" | "password" | "credentials" | "rate" | "network" | "disabled" | "unknown";
export type ActivateError = "taken" | "sample" | "weak" | "rate" | "network" | "disabled" | "unknown";
type Result<E> = { ok: true } | { ok: false; reason: E };

type AuthValue = {
  mode: "firebase" | "local";
  /** The first sign-in state is known. Always true in local mode. */
  ready: boolean;
  signedIn: boolean;
  /** Which kind of Firebase account is signed in; null when signed out or in local mode. */
  kind: Profile["kind"] | null;
  /** The student chose to sign out (rather than arriving signed out), so there's no page to return to. */
  leftOnPurpose: boolean;
  signIn: (id: string, password: string) => Promise<Result<SignInError>>;
  activate: (id: string, name: string, password: string) => Promise<Result<ActivateError>>;
  explore: () => Promise<Result<SignInError>>;
  signOut: () => void;
};

const Ctx = createContext<AuthValue | null>(null);

const DOMAIN = "students.smart-campus.example";
const aliasEmail = (id: string) => `${id}@${DOMAIN}`;
const idFromEmail = (email: string | null) => new RegExp(`^(\\d{16})@${DOMAIN.replace(/\./g, "\\.")}$`).exec(email ?? "")?.[1];
export const cleanId = (id: string) => id.replace(/\s+/g, "");
const demoProfile = (): Profile => ({ studentId: SAMPLE_STUDENT.id, name: SAMPLE_STUDENT.name, kind: "demo" });

const code = (err: unknown) => (typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : "");

function signInReason(err: unknown): SignInError {
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

function activateReason(err: unknown): ActivateError {
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

/* ─── Local mode: the offline sample login ───────────────────────────────── */

const KEY = "sc.session";

function readSession() {
  try {
    return sessionStorage.getItem(KEY) === SAMPLE_STUDENT.id;
  } catch {
    return false;
  }
}

function writeSession(on: boolean) {
  try {
    if (on) sessionStorage.setItem(KEY, SAMPLE_STUDENT.id);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* the session just won't survive a reload */
  }
}

/* ─── Provider ───────────────────────────────────────────────────────────── */

type State = { ready: boolean; signedIn: boolean; kind: Profile["kind"] | null; leftOnPurpose: boolean };

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [state, setState] = useState<State>(() => ({ ready: !auth, signedIn: auth ? false : readSession(), kind: null, leftOnPurpose: false }));

  // The profile to create for an account that is being activated right now. onAuthStateChanged
  // fires before createUserWithEmailAndPassword resolves, so the name has to be waiting for it.
  const pending = useRef<Profile | null>(null);
  // Bumped on every auth change, so a slow load for a previous account can't land late.
  const generation = useRef(0);

  /** Back to the untouched sample student with nothing cached from the previous account. */
  const clearSession = useCallback(() => {
    setCloudUser(null);
    setStudentIdentity(SAMPLE_STUDENT);
    resetStore();
    qc.removeQueries();
  }, [qc]);

  useEffect(() => {
    let lastToast = 0;
    onCloudError((what) => {
      if (Date.now() - lastToast < 6000) return; // one RIB registration is three writes; say it once
      lastToast = Date.now();
      toast({ title: `Couldn't save ${what} to your account`, description: "It shows here for now but won't be there after a reload. Check your connection.", tone: "caution" });
    });
  }, [toast]);

  useEffect(() => {
    if (!auth) return;

    async function resolveProfile(user: User): Promise<Profile> {
      const fallback: Profile = user.isAnonymous ? demoProfile() : { studentId: idFromEmail(user.email) ?? SAMPLE_STUDENT.id, name: user.displayName || "Student", kind: "activated" };
      const wanted = pending.current ?? fallback;
      pending.current = null;
      try {
        const existing = await loadProfile(user.uid);
        if (existing) return existing;
        await createProfile(user.uid, wanted);
      } catch (err) {
        console.warn("[auth] profile unavailable, using the account's own details", err);
      }
      return wanted;
    }

    return onAuthStateChanged(auth, async (user) => {
      const run = ++generation.current;
      clearSession();
      if (!user) {
        setState((s) => ({ ...s, ready: true, signedIn: false, kind: null }));
        return;
      }
      const profile = await resolveProfile(user);
      if (run !== generation.current) return;
      setStudentIdentity({ name: profile.name, id: profile.studentId });
      setCloudUser(user.uid);
      try {
        const saved = await loadCloudState(user.uid);
        if (run !== generation.current) return;
        applyCloudState(saved);
      } catch (err) {
        if (run !== generation.current) return;
        console.warn("[auth] saved records unavailable", err);
        toast({ title: "Couldn't load your saved records", description: "You're seeing the sample records. New changes still save to your account.", tone: "caution" });
      }
      qc.removeQueries();
      setState({ ready: true, signedIn: true, kind: profile.kind, leftOnPurpose: false });
    });
  }, [clearSession, qc, toast]);

  const explore = useCallback(async (): Promise<Result<SignInError>> => {
    if (!auth) {
      writeSession(true);
      setState({ ready: true, signedIn: true, kind: null, leftOnPurpose: false });
      return { ok: true };
    }
    pending.current = demoProfile();
    try {
      await signInAnonymously(auth);
      trackEvent("login", { method: "sample" });
      return { ok: true };
    } catch (err) {
      pending.current = null;
      return { ok: false, reason: signInReason(err) };
    }
  }, []);

  const signIn = useCallback(
    async (id: string, password: string): Promise<Result<SignInError>> => {
      const sid = cleanId(id);
      // The sample student needs no account: its ID and password open the sandbox in both modes.
      if (sid === SAMPLE_STUDENT.id) {
        if (password !== SAMPLE_PASSWORD) {
          await new Promise((r) => setTimeout(r, 450));
          return { ok: false, reason: "password" };
        }
        if (!auth) await new Promise((r) => setTimeout(r, 650));
        return explore();
      }
      if (!auth) {
        await new Promise((r) => setTimeout(r, 650));
        return { ok: false, reason: "id" };
      }
      if (!/^\d{16}$/.test(sid)) return { ok: false, reason: "id" };
      try {
        await signInWithEmailAndPassword(auth, aliasEmail(sid), password);
        trackEvent("login", { method: "student_id" });
        return { ok: true };
      } catch (err) {
        return { ok: false, reason: signInReason(err) };
      }
    },
    [explore],
  );

  const activate = useCallback(async (id: string, name: string, password: string): Promise<Result<ActivateError>> => {
    if (!auth) return { ok: false, reason: "disabled" };
    const sid = cleanId(id);
    if (sid.startsWith(SAMPLE_ID_PREFIX)) return { ok: false, reason: "sample" };
    const profile: Profile = { studentId: sid, name: name.trim().replace(/\s+/g, " "), kind: "activated" };
    pending.current = profile;
    try {
      const { user } = await createUserWithEmailAndPassword(auth, aliasEmail(sid), password);
      // The name also lives on the account itself, so the portal can greet the student even if
      // the profile document is ever unavailable.
      await updateProfile(user, { displayName: profile.name }).catch(() => undefined);
      trackEvent("sign_up", { method: "student_id" });
      return { ok: true };
    } catch (err) {
      pending.current = null;
      return { ok: false, reason: activateReason(err) };
    }
  }, []);

  const signOut = useCallback(() => {
    if (!auth) {
      writeSession(false);
      setState({ ready: true, signedIn: false, kind: null, leftOnPurpose: true });
      return;
    }
    // Leave at once rather than waiting for Firebase, so the sign-in page never bounces back.
    generation.current++;
    clearSession();
    setState({ ready: true, signedIn: false, kind: null, leftOnPurpose: true });
    void fbSignOut(auth);
  }, [clearSession]);

  const value = useMemo<AuthValue>(() => ({ mode: auth ? "firebase" : "local", ...state, signIn, activate, explore, signOut }), [state, signIn, activate, explore, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}

/** Holding screen while Firebase restores the session and the student's records load. */
export function AuthPending() {
  return (
    <div className="grid min-h-dvh place-items-center bg-ground px-6" aria-busy="true">
      <p role="status" className="t-shimmer text-sm font-[560]" data-text="Loading your records…">
        Loading your records…
      </p>
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, signedIn, leftOnPurpose } = useAuth();
  const loc = useLocation();
  if (!ready) return <AuthPending />;
  if (!signedIn) return <Navigate to={leftOnPurpose ? "/login" : `/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  return <>{children}</>;
}
