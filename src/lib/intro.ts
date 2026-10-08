/**
 * The landing intro plays once per browser session (per tab), for signed-out visitors who haven't
 * asked their device for reduced motion. index.html reads the same key before first paint.
 */
const KEY = "sc.intro";

export function introSeen() {
  try {
    return sessionStorage.getItem(KEY) === "seen";
  } catch {
    return true; // no storage, no way to remember it: never replay the intro on every load
  }
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem(KEY, "seen");
  } catch {
    /* nothing to remember it in */
  }
}

/** index.html paints the platform green before the app loads when the intro is due; this undoes it. */
export function clearLandingGround() {
  document.documentElement.removeAttribute("data-landing");
}
