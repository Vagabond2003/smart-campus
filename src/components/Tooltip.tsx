import { useCallback, useId, useRef, type ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * One tooltip shared by a group of triggers (transitions.dev tooltip): it appears after a short
 * delay, hides instantly, and travels between neighbouring triggers instead of popping twice.
 * Triggers inside the group opt in with `data-tooltip="…"`.
 */
export function TipGroup({ children, className, placement = "bottom" }: { children: ReactNode; className?: string; placement?: "top" | "bottom" }) {
  const group = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const id = useId();

  const hide = useCallback(() => {
    tip.current?.setAttribute("data-show", "false");
    tip.current?.setAttribute("aria-hidden", "true");
  }, []);

  const place = useCallback((trigger: HTMLElement) => {
    const t = tip.current;
    const g = group.current;
    const tx = text.current;
    if (!t || !g || !tx) return;
    const showing = t.getAttribute("data-show") === "true";
    tx.textContent = trigger.getAttribute("data-tooltip") || "";
    trigger.setAttribute("aria-describedby", id);
    const cs = getComputedStyle(t);
    const width = Math.ceil(tx.scrollWidth + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight));
    const gr = g.getBoundingClientRect();
    const r = trigger.getBoundingClientRect();
    let x = r.left - gr.left + r.width / 2 - width / 2;
    // keep the bubble inside the viewport
    const minX = 8 - gr.left;
    const maxX = window.innerWidth - 8 - gr.left - width;
    x = Math.max(minX, Math.min(maxX, x));
    if (!showing) {
      t.style.transition = "none";
      t.style.width = `${width}px`;
      t.style.setProperty("--tt-x", `${x}px`);
      void t.offsetWidth;
      t.style.transition = "";
    } else {
      t.style.width = `${width}px`;
      t.style.setProperty("--tt-x", `${x}px`);
    }
    t.setAttribute("data-show", "true");
    t.setAttribute("aria-hidden", "false");
  }, [id]);

  const fromEvent = (e: React.SyntheticEvent) => (e.target as HTMLElement).closest<HTMLElement>("[data-tooltip]");

  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- delegation only: the triggers inside are the real buttons and links; this wrapper just hears their pointer and focus events
    <span
      ref={group}
      className={cn("t-tt-group", className)}
      onPointerOver={(e) => {
        if (e.pointerType === "touch") return;
        const t = fromEvent(e);
        if (t) place(t);
      }}
      onPointerLeave={hide}
      onFocus={(e) => {
        const t = fromEvent(e);
        if (t && t.matches(":focus-visible")) place(t);
      }}
      onBlur={hide}
      onKeyDown={(e) => e.key === "Escape" && hide()}
      onClick={hide}
    >
      {children}
      <span
        ref={tip}
        id={id}
        role="tooltip"
        aria-hidden="true"
        data-show="false"
        className={cn("t-tt z-[70] text-xs font-[560]", placement === "bottom" && "is-below")}
      >
        <span ref={text} className="t-tt-text" />
      </span>
    </span>
  );
}
