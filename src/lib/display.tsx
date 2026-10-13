import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { originPoint, play, setSoundEnabled } from "./feel";
import { prefersReducedMotion } from "./motion";

export type ThemePref = "system" | "light" | "dark";
export type TextSize = "s" | "m" | "l";

type Display = {
  theme: ThemePref;
  text: TextSize;
  resolvedTheme: "light" | "dark";
  /** Small interface sounds; off until the visitor turns them on. */
  sound: boolean;
  setTheme: (t: ThemePref) => void;
  setText: (t: TextSize) => void;
  setSound: (on: boolean) => void;
};

const KEY = "sc.display";
const Ctx = createContext<Display | null>(null);

function read(): { theme: ThemePref; text: TextSize; sound: boolean } {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      theme: p.theme === "light" || p.theme === "dark" ? p.theme : "system",
      text: p.text === "s" || p.text === "l" ? p.text : "m",
      sound: p.sound === true,
    };
  } catch {
    return { theme: "system", text: "m", sound: false };
  }
}

export function DisplayProvider({ children }: { children: ReactNode }) {
  const [{ theme, text, sound }, setPrefs] = useState(read);
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.dataset.text = text;
    setSoundEnabled(sound);
    try {
      localStorage.setItem(KEY, JSON.stringify({ theme, text, sound }));
    } catch {
      /* preference simply won't persist */
    }
  }, [theme, text, sound, resolvedTheme]);

  /** A theme the visitor picks spreads out from where they picked it (a view transition). */
  const setTheme = useCallback(
    (t: ThemePref) => {
      const root = document.documentElement;
      const next = t === "system" ? (systemDark ? "dark" : "light") : t;
      const commit = () => setPrefs((p) => ({ ...p, theme: t }));
      if (next === root.dataset.theme || !document.startViewTransition || prefersReducedMotion()) {
        commit();
        return;
      }
      const { x, y } = originPoint();
      const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      play("whoosh");
      root.classList.add("theme-sweep");
      const vt = document.startViewTransition(() => {
        flushSync(commit);
        root.dataset.theme = next;
      });
      void vt.ready
        .then(() =>
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
            { duration: 560, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
          ),
        )
        .catch(() => {});
      void vt.finished.finally(() => root.classList.remove("theme-sweep"));
    },
    [systemDark],
  );
  const setText = useCallback((t: TextSize) => setPrefs((p) => ({ ...p, text: t })), []);
  const setSound = useCallback((on: boolean) => {
    setSoundEnabled(on);
    if (on) play("tick");
    setPrefs((p) => ({ ...p, sound: on }));
  }, []);

  const value = useMemo(
    () => ({ theme, text, sound, resolvedTheme, setTheme, setText, setSound }) as Display,
    [theme, text, sound, resolvedTheme, setTheme, setText, setSound],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDisplay() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDisplay must be used inside DisplayProvider");
  return v;
}
