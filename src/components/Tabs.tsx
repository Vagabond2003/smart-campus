import { useLayoutEffect, useRef, type ReactNode } from "react";
import { NavLink } from "react-router";
import { cn } from "../lib/cn";

/** Writes the active tab's geometry onto the pill; snaps without a transition on first paint and resize. */
function usePill(activeKey: string) {
  const bar = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useLayoutEffect(() => {
    const b = bar.current;
    const p = pill.current;
    if (!b || !p) return;
    const move = (animate: boolean) => {
      const tab = b.querySelector<HTMLElement>('[aria-selected="true"], [aria-current="page"]');
      if (!tab) {
        p.style.width = "0px";
        return;
      }
      if (!animate) {
        const prev = p.style.transition;
        p.style.transition = "none";
        p.style.transform = `translateX(${tab.offsetLeft}px)`;
        p.style.width = `${tab.offsetWidth}px`;
        void p.offsetWidth;
        p.style.transition = prev;
      } else {
        p.style.transform = `translateX(${tab.offsetLeft}px)`;
        p.style.width = `${tab.offsetWidth}px`;
      }
    };
    move(!first.current);
    first.current = false;
    const ro = new ResizeObserver(() => move(false));
    ro.observe(b);
    return () => ro.disconnect();
  }, [activeKey]);

  return { bar, pill };
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  full?: boolean;
  className?: string;
}

/** Small mutually exclusive set with a sliding pill (transitions.dev tabs sliding). */
export function Segmented<T extends string>({ label, value, onChange, options, full, className }: SegmentedProps<T>) {
  const { bar, pill } = usePill(value);
  return (
    <div ref={bar} role="tablist" aria-label={label} className={cn("t-tabs", full && "is-full", className)}>
      <span ref={pill} className="t-tabs-pill" aria-hidden />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          className="t-tab"
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            e.preventDefault();
            const i = options.findIndex((x) => x.value === value);
            const n = options[(i + (e.key === "ArrowRight" ? 1 : options.length - 1)) % options.length];
            onChange(n.value);
            requestAnimationFrame(() => bar.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus());
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface RouteTabsProps {
  label: string;
  tabs: { to: string; label: ReactNode; end?: boolean }[];
  activeKey: string;
  className?: string;
}

/** Navigation tabs backed by routes, with the sliding underline. */
export function RouteTabs({ label, tabs, activeKey, className }: RouteTabsProps) {
  const { bar, pill } = usePill(activeKey);
  return (
    <nav aria-label={label} className={cn("scroll-x", className)}>
      <div ref={bar} className="t-tabs is-underline min-w-max">
        <span ref={pill} className="t-tabs-pill" aria-hidden />
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className="t-tab" replace>
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
