import { useId, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

/** Disclosure built on the transitions.dev accordion: grid-rows height, flipped chevron. */
export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  open: controlled,
  onOpenChange,
  className,
  headClassName,
  panelClassName,
  layout = "row",
}: {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  className?: string;
  headClassName?: string;
  panelClassName?: string;
  /** "custom": the summary's children lay themselves out in the head (e.g. as grid cells); the chevron is the last cell. */
  layout?: "row" | "custom";
}) {
  const [inner, setInner] = useState(defaultOpen);
  const open = controlled ?? inner;
  const id = useId();
  const toggle = () => {
    const n = !open;
    if (controlled == null) setInner(n);
    onOpenChange?.(n);
  };
  return (
    <div className={cn("t-acc", className)} data-open={open ? "true" : "false"}>
      <button
        type="button"
        className={cn("t-acc-head w-full text-left", layout === "row" && "flex items-center gap-3", headClassName)}
        aria-expanded={open}
        aria-controls={id}
        onClick={toggle}
      >
        {layout === "row" ? <span className="min-w-0 flex-1">{summary}</span> : summary}
        <Chevron className={layout === "custom" ? "max-lg:absolute max-lg:right-4 max-lg:top-4 lg:justify-self-end" : undefined} />
      </button>
      <div className="t-acc-panel" id={id} role="region">
        <div className={cn("t-acc-panel-inner", panelClassName)} inert={!open}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Chevron({ className }: { className?: string }) {
  return (
    <span className={cn("t-acc-chevron shrink-0 text-ink-3", className)} aria-hidden>
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6.5L8 10.5L12 6.5" />
      </svg>
    </span>
  );
}
