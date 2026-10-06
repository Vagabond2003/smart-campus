import { type ReactNode } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";
import { initials, taka } from "../lib/format";
import { hashString } from "../lib/rng";

/* ─── Page header ─────────────────────────────────────────────────────────── */

interface Crumb {
  label: string;
  to?: string;
}

export function PageHeader({ title, description, crumbs, actions, children }: { title: ReactNode; description?: ReactNode; crumbs?: Crumb[]; actions?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-5">
      {crumbs?.length ? (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-3">
            {crumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-1">
                {c.to ? (
                  <Link to={c.to} className="rounded-sm text-ink-2 no-underline hover:text-ink hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page">{c.label}</span>
                )}
                {i < crumbs.length - 1 ? <ChevronRight size={14} strokeWidth={1.75} aria-hidden /> : null}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="signboard text-[1.875rem] text-ink sm:text-[2.25rem]">{title}</h1>
          {description ? <p className="mt-1.5 max-w-[68ch] text-[0.9375rem] text-ink-2">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </header>
  );
}

/* ─── Panel: a ruled module, never a floating shadow card ─────────────────── */

export function Panel({ title, action, children, className, id, bodyClassName, tone }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; id?: string; bodyClassName?: string; tone?: "danger" }) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section aria-labelledby={headingId} className={cn("panel min-w-0", tone === "danger" && "border-danger-line", className)}>
      {title ? (
        <div className={cn("panel-head", tone === "danger" && "border-danger-line bg-danger-wash/60")}>
          <h2 id={headingId} className="band text-[0.9375rem] text-ink">
            {title}
          </h2>
          {action}
        </div>
      ) : null}
      <div className={cn(bodyClassName)}>{children}</div>
    </section>
  );
}

export function PanelLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-1 rounded-sm text-sm font-[560] text-link no-underline hover:underline">
      {children}
      <ChevronRight size={15} strokeWidth={1.75} className="transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

/* ─── Signal: state as railway signal aspects ─────────────────────────────── */

export type SignalTone = "ok" | "caution" | "danger" | "neutral" | "now";

const signalTone: Record<SignalTone, string> = {
  ok: "bg-ok-wash text-ok",
  caution: "bg-caution-wash text-caution",
  danger: "bg-danger-wash text-danger",
  neutral: "bg-surface-2 text-ink-2",
  now: "bg-amber text-[#121314]",
};
const signalDot: Record<SignalTone, string> = {
  ok: "bg-ok",
  caution: "bg-caution-fill",
  danger: "bg-danger",
  neutral: "bg-ink-3",
  now: "bg-[#121314]",
};

export function Signal({ tone = "neutral", children, dot = true, className }: { tone?: SignalTone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-[600]", signalTone[tone], className)}>
      {dot ? <span className={cn("size-1.5 rounded-full", signalDot[tone])} aria-hidden /> : null}
      {children}
    </span>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex h-6 items-center rounded-sm border border-line px-2 text-xs font-[560] text-ink-2", className)}>{children}</span>;
}

/* ─── Avatar: initials only (no photographs of anyone) ────────────────────── */

const avatarTints = [
  "bg-[#dbeee6] text-[#0b4b38]",
  "bg-[#f3e6c9] text-[#6b4700]",
  "bg-[#e3e6f0] text-[#2c3a6b]",
  "bg-[#efe0e6] text-[#6a2340]",
  "bg-[#e6ebdc] text-[#3f4f17]",
  "bg-[#e1ecee] text-[#18505a]",
];
const avatarTintsDark = [
  "dark:bg-[#123d30] dark:text-[#bfe8d6]",
  "dark:bg-[#3d300f] dark:text-[#f5d58f]",
  "dark:bg-[#232a45] dark:text-[#c8d0f0]",
  "dark:bg-[#3b1d29] dark:text-[#f0c6d6]",
  "dark:bg-[#2c3416] dark:text-[#d6e2ad]",
  "dark:bg-[#15373d] dark:text-[#b9e2ea]",
];

export function Avatar({ name, size = "md", you, className }: { name: string; size?: "sm" | "md" | "lg" | "xl"; you?: boolean; className?: string }) {
  const i = hashString(name) % avatarTints.length;
  const sizes = { sm: "size-7 text-[0.6875rem]", md: "size-9 text-xs", lg: "size-12 text-sm", xl: "size-20 text-xl" };
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid shrink-0 select-none place-items-center rounded-full font-[680] tracking-[0.02em]",
        you ? "bg-primary text-primary-ink" : cn(avatarTints[i], avatarTintsDark[i]),
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

/* ─── Key/value list ──────────────────────────────────────────────────────── */

export function KeyValues({ items, columns = 1, className }: { items: { k: ReactNode; v: ReactNode }[]; columns?: 1 | 2; className?: string }) {
  return (
    <dl className={cn("grid gap-x-8", columns === 2 && "sm:grid-cols-2", className)}>
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-[minmax(8rem,40%)_1fr] items-baseline gap-3 border-b border-line py-2.5 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
          <dt className="text-sm text-ink-3">{it.k}</dt>
          <dd className="min-w-0 text-[0.9375rem] text-ink">{it.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ─── Money ───────────────────────────────────────────────────────────────── */

export function Money({ value, decimals, className }: { value: number; decimals?: boolean; className?: string }) {
  return <span className={cn("num whitespace-nowrap", className)}>{taka(value, { decimals })}</span>;
}

/* ─── Meter: a labelled bar for real measured values (attendance, GPA) ────── */

/**
 * Meter: a measured value against a fixed scale. Data-end is rounded, the baseline square,
 * and the track is a lighter step of the fill's own hue (dataviz meter spec).
 */
export function Meter({ value, max, line, tone = "ok", label, className }: { value: number; max: number; line?: number; tone?: SignalTone; label: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill = { ok: "bg-ok", caution: "bg-caution-fill", danger: "bg-danger", neutral: "bg-ink-3", now: "bg-amber" }[tone];
  const track = { ok: "bg-ok-wash", caution: "bg-caution-wash", danger: "bg-danger-wash", neutral: "bg-surface-3", now: "bg-caution-wash" }[tone];
  return (
    <div className={cn("relative h-2 w-full", track, className)} role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={Number(value.toFixed(2))} aria-label={label}>
      <div className={cn("h-full rounded-r-[4px]", fill)} style={{ width: `${pct}%` }} />
      {line != null ? <div className="absolute -top-1 bottom-[-4px] w-[2px] bg-ink" style={{ left: `calc(${(line / max) * 100}% - 1px)` }} aria-hidden /> : null}
    </div>
  );
}
