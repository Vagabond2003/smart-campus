import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { cn } from "../lib/cn";

/**
 * Whether an element is wider inside than out. Measured before paint, and again whenever the box,
 * its content (a table widening as the web font arrives) or the fonts themselves change.
 */
export function useOverflowX(ref: RefObject<HTMLElement | null>) {
  const [overflows, setOverflows] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    let live = true;
    document.fonts?.ready.then(() => live && check());
    return () => {
      live = false;
      ro.disconnect();
    };
  }, [ref]);
  return overflows;
}

/**
 * A region that scrolls sideways on narrow screens (wide tables). While it actually scrolls it joins
 * the tab order, so keyboard users can reach it and scroll with the arrow keys (WCAG 2.1.1).
 */
export function ScrollX({ label, labelledBy, className, children }: { label?: string; labelledBy?: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const overflows = useOverflowX(ref);
  return (
    <div ref={ref} role="region" aria-label={label} aria-labelledby={labelledBy} tabIndex={overflows ? 0 : undefined} className={cn("scroll-x", className)}>
      {children}
    </div>
  );
}
