import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemePref = "system" | "light" | "dark";
export type TextSize = "s" | "m" | "l";

type Display = {
  theme: ThemePref;
  text: TextSize;
  resolvedTheme: "light" | "dark";
  setTheme: (t: ThemePref) => void;
  setText: (t: TextSize) => void;
};

const KEY = "sc.display";
const Ctx = createContext<Display | null>(null);

function read(): { theme: ThemePref; text: TextSize } {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      theme: p.theme === "light" || p.theme === "dark" ? p.theme : "system",
      text: p.text === "s" || p.text === "l" ? p.text : "m",
    };
  } catch {
    return { theme: "system", text: "m" };
  }
}

export function DisplayProvider({ children }: { children: ReactNode }) {
  const [{ theme, text }, setPrefs] = useState(read);
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
    try {
      localStorage.setItem(KEY, JSON.stringify({ theme, text }));
    } catch {
      /* preference simply won't persist */
    }
  }, [theme, text, resolvedTheme]);

  const setTheme = useCallback((t: ThemePref) => setPrefs((p) => ({ ...p, theme: t })), []);
  const setText = useCallback((t: TextSize) => setPrefs((p) => ({ ...p, text: t })), []);

  const value = useMemo(
    () => ({ theme, text, resolvedTheme, setTheme, setText }) as Display,
    [theme, text, resolvedTheme, setTheme, setText],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDisplay() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDisplay must be used inside DisplayProvider");
  return v;
}
