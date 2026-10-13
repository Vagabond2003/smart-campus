/**
 * Motion for the React tree (the `motion` library): how a page arrives, how a course tab slides,
 * how rows leave a list. CSS springs (src/styles/springs.css) handle presses and overlays; this
 * handles what CSS can't: staggering whatever a page happens to contain, and animating things out.
 * Reduced motion keeps the fades and drops every movement (MotionConfig reducedMotion="user").
 */
import { useState, type ReactNode } from "react";
import { LazyMotion, m, MotionConfig, type Transition, type Variants } from "motion/react";

/** Lands with a hair of give, then holds still. */
export const spring: Transition = { type: "spring", stiffness: 420, damping: 32, mass: 1 };
/** For things that should feel picked up and set down: a little more bounce. */
export const springPop: Transition = { type: "spring", stiffness: 520, damping: 26, mass: 0.9 };

/**
 * A page fades in, then its header and panels rise one after another, 45ms apart. A dashboard of
 * eight panels is whole in under half a second; nothing waits on it, it's all clickable at once.
 */
export const pageVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.045, delayChildren: 0.02 } },
};

export const riseVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.988 },
  show: { opacity: 1, y: 0, scale: 1, transition: spring },
};

/** Starts loading at once (from main.tsx): by the time a visitor has signed in it's long there. */
export const loadFeatures = () => import("./motion-features").then((r) => r.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadFeatures} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}

/** Wraps a page; give it a `key` that changes when the page does. */
export function PageMotion({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <m.div className={className} variants={pageVariants} initial="hidden" animate="show">
      {children}
    </m.div>
  );
}

/**
 * The content under a row of tabs: it slides in from the side the new tab sits on, so moving
 * right through a course's tabs reads as moving along the line.
 */
export function TabMotion({ tab, order, children }: { tab: string; order: string[]; children: ReactNode }) {
  // which way the last change went, worked out while rendering (no effect, no flash of the wrong side)
  const [seen, setSeen] = useState({ tab, dir: 0 });
  if (seen.tab !== tab) setSeen({ tab, dir: Math.sign(order.indexOf(tab) - order.indexOf(seen.tab)) });
  const dir = seen.tab === tab ? seen.dir : Math.sign(order.indexOf(tab) - order.indexOf(seen.tab));
  return (
    <m.div key={tab} initial={{ opacity: 0, x: dir * 18 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, opacity: { duration: 0.18 } }}>
      {children}
    </m.div>
  );
}
