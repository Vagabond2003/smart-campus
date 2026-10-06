import { useEffect, useRef, useState, type ReactNode } from "react";
import { CircleAlert, RotateCcw } from "lucide-react";
import { cn } from "../lib/cn";
import { tokenMs } from "../lib/presence";
import { Button } from "./Button";

/* ─── Empty state that teaches what will appear and where it comes from ──── */

export function EmptyState({ icon, title, children, action, className }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      <div className="mb-4 grid size-12 place-items-center rounded-full bg-surface-2 text-ink-2">{icon}</div>
      <h3 className="text-md font-[640] text-ink">{title}</h3>
      {children ? <div className="mt-1.5 max-w-[46ch] text-sm text-ink-2">{children}</div> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ onRetry, what = "this page" }: { onRetry?: () => void; what?: string }) {
  return (
    <EmptyState
      icon={<CircleAlert size={22} strokeWidth={1.75} />}
      title={`Couldn't load ${what}`}
      action={
        onRetry ? (
          <Button variant="secondary" icon={<RotateCcw size={16} strokeWidth={1.75} />} onClick={onRetry}>
            Try again
          </Button>
        ) : null
      }
    >
      Check your connection and try again. Nothing you entered was lost.
    </EmptyState>
  );
}

/* ─── Skeleton → content reveal (transitions.dev skeleton recipe, grid-stacked) ─── */

export function Reveal({ loading, skeleton, children, className }: { loading: boolean; skeleton: ReactNode; children: ReactNode; className?: string }) {
  const [phase, setPhase] = useState<"loading" | "revealing" | "done">(loading ? "loading" : "done");
  const wasLoading = useRef(loading);

  useEffect(() => {
    if (loading) {
      wasLoading.current = true;
      setPhase("loading");
      return;
    }
    if (!wasLoading.current) return;
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setPhase("revealing"));
    });
    const t = window.setTimeout(() => setPhase("done"), tokenMs("--reveal-dur", 400) + 60);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [loading]);

  if (phase === "done" && !loading) return <div className={className}>{children}</div>;

  return (
    <div className={cn("t-skel is-stack", phase === "revealing" && "is-revealed", className)} aria-busy={loading}>
      <div className="t-skel-skeleton is-pulsing" aria-hidden>
        {skeleton}
      </div>
      <div className="t-skel-content">{loading ? null : children}</div>
    </div>
  );
}

export function Bars({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 p-4", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="skeleton-bar h-9 w-9 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <span className="skeleton-bar h-3" style={{ width: `${68 - ((i * 13) % 30)}%` }} />
            <span className="skeleton-bar h-2.5" style={{ width: `${44 - ((i * 7) % 18)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="t-skel-skeleton is-pulsing relative! inset-auto! flex flex-col gap-4">
      <span className="skeleton-bar h-8 w-64" />
      <span className="skeleton-bar h-4 w-96 max-w-full" />
      <span className="skeleton-bar mt-4 h-64 w-full rounded-lg" />
    </div>
  );
}

/* ─── Success check (transitions.dev) ────────────────────────────────────── */

export function SuccessCheck({ show, className }: { show: boolean; className?: string }) {
  return (
    <span className={cn("t-success-check text-ok", className)} data-state={show ? "in" : "out"} aria-hidden>
      <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
        <circle cx="24" cy="24" r="22" fill="currentColor" opacity="0.14" />
        <path d="M14 24.5l7 7L34 17" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function SampleNote({ className }: { className?: string }) {
  return <p className={cn("sample-mark text-2xs text-ink-3", className)}>Concept build · synthetic sample data</p>;
}
