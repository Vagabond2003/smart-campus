import { useEffect, useRef, useState } from "react";

type Phase = "closed" | "opening" | "open" | "closing";

/**
 * Keeps an overlay mounted through its close transition and returns the
 * transitions.dev state class (`is-open` / `is-closing`). The element mounts in its
 * resting pre-open state, then flips to `is-open` on the next frame so the open tween runs.
 */
export function usePresence(open: boolean, closeMs: number) {
  const [phase, setPhase] = useState<Phase>(open ? "open" : "closed");
  const raf = useRef<number>(0);

  useEffect(() => {
    if (open) {
      setPhase((p) => (p === "open" ? p : "opening"));
      raf.current = requestAnimationFrame(() => {
        raf.current = requestAnimationFrame(() => setPhase("open"));
      });
      return () => cancelAnimationFrame(raf.current);
    }
    setPhase((p) => (p === "closed" ? p : "closing"));
    const t = window.setTimeout(() => setPhase("closed"), closeMs);
    return () => window.clearTimeout(t);
  }, [open, closeMs]);

  return {
    mounted: phase !== "closed",
    state: phase,
    className: phase === "open" ? "is-open" : phase === "closing" ? "is-closing" : "",
    dataOpen: phase === "open" ? "true" : "false",
  } as const;
}

/** Reads a transitions.dev duration token in ms so JS timing stays in sync with CSS. */
export function tokenMs(name: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(v) ? v : fallback;
}
