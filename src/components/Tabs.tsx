import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { NavLink } from "react-router";
import { cn } from "../lib/cn";
import { play } from "../lib/feel";

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
          onClick={() => {
            if (o.value !== value) play("tick");
            onChange(o.value);
          }}
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

/**
 * Navigation tabs backed by routes, with the sliding underline. When the strip is wider than its
 * column (phones), the active tab is scrolled into view and the clipped edge fades, so it reads
 * as a strip that continues rather than one that ends.
 */
export function RouteTabs({ label, tabs, activeKey, className }: RouteTabsProps) {
  const { bar, pill } = usePill(activeKey);
  const strip = useRef<HTMLElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = strip.current;
    if (!el) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setEdges((e) => (e.left === left && e.right === right ? e : { left, right }));
  }, []);

  useLayoutEffect(() => {
    const el = strip.current;
    const tab = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (el && tab && el.scrollWidth > el.clientWidth) {
      el.scrollLeft = Math.max(0, tab.offsetLeft - (el.clientWidth - tab.offsetWidth) / 2);
    }
    measure();
  }, [activeKey, measure]);

  useLayoutEffect(() => {
    const el = strip.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const fade = edges.left || edges.right ? `linear-gradient(to right, ${edges.left ? "transparent, #000 2rem" : "#000"}, ${edges.right ? "#000 calc(100% - 2rem), transparent" : "#000"})` : undefined;
  return (
    <nav ref={strip} aria-label={label} className={cn("scroll-x", className)} onScroll={measure} style={fade ? { maskImage: fade, WebkitMaskImage: fade } : undefined}>
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
