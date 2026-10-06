/**
 * Firebase wiring. Everything here is optional: with no VITE_FIREBASE_* config the portal runs
 * fully offline on its built-in sample data, exactly as before.
 */
import { initializeApp, type FirebaseApp } from "firebase/app";
import { browserLocalPersistence, connectAuthEmulator, indexedDBLocalPersistence, initializeAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, initializeFirestore, type Firestore } from "firebase/firestore/lite";
import type { Analytics } from "firebase/analytics";

const env = import.meta.env;

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId);
const useEmulators = env.VITE_FIREBASE_EMULATORS === "true";

export const app: FirebaseApp | null = firebaseEnabled ? initializeApp(config) : null;

// No popup/redirect resolver: accounts sign in with a student ID and password, never a pop-up.
export const auth: Auth | null = app ? initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] }) : null;

// Firestore Lite: plain reads and writes, no on-disk cache, so nothing a student saved stays
// behind in the browser for the next person on a shared computer.
export const db: Firestore | null = app ? initializeFirestore(app, { ignoreUndefinedProperties: true }) : null;

if (auth && db && useEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

/* ─── Analytics: production builds only, and only once the project has a measurement ID ─── */

type Log = (typeof import("firebase/analytics"))["logEvent"];
let analytics: { instance: Analytics; log: Log } | null = null;

/**
 * Page views need no code here: GA4's enhanced measurement records every route change from the
 * browser history, which is Google's recommended setup for a pushState app. Sending them by hand
 * as well would count each page twice.
 */
export async function initAnalytics() {
  if (!app || !config.measurementId || env.DEV || useEmulators) return;
  try {
    const { getAnalytics, isSupported, logEvent } = await import("firebase/analytics");
    if (!(await isSupported())) return;
    analytics = { instance: getAnalytics(app), log: logEvent };
  } catch {
    analytics = null; // blocked by the browser or an extension; the portal works without it
  }
}

export function trackEvent(name: string, params?: Record<string, string | number>) {
  analytics?.log(analytics.instance, name, params);
}
