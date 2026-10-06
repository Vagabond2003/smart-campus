import { useEffect, useRef } from "react";
import { termStations } from "../api/derive";
import { calendar as C, now } from "../lib/clock";
import { cn } from "../lib/cn";
import { fmt, until } from "../lib/format";

/**
 * The term drawn as a line with its milestones. Stations sit at equal spacing for legibility;
 * the amber "you are here" marker sits between the last passed and the next station by date.
 */
export function TermLine({ className }: { className?: string }) {
  const at = now();
  const stations = termStations(at);
  const n = stations.length;
  const nextIdx = Math.max(0, stations.findIndex((s) => s.state === "next"));
  const prevIdx = Math.max(0, nextIdx - 1);
  const prev = stations[prevIdx];
  const next = stations[nextIdx];
  const span = next.date.getTime() - prev.date.getTime();
  const frac = span > 0 ? Math.min(1, Math.max(0, (at.getTime() - prev.date.getTime()) / span)) : 0;
  const progress = (prevIdx + (nextIdx > prevIdx ? frac : 0)) / (n - 1);
  const inset = 50 / n; // % from the edge to the first station centre
  const usable = 100 - 2 * inset;
  const scroller = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const s = scroller.current;
    const m = marker.current;
    if (s && m && s.scrollWidth > s.clientWidth) s.scrollLeft = Math.max(0, m.offsetLeft - s.clientWidth / 2);
  }, []);

  return (
    <section aria-labelledby="term-line-title" className={cn("panel overflow-hidden", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 pt-4 lg:px-5">
        <h2 id="term-line-title" className="band text-[0.9375rem] text-ink">
          {C.current.label} · Week {C.week} of {C.weeks}
        </h2>
        <p className="text-sm text-ink-2">
          {next.label} <span className="font-[620] text-ink">{until(next.date)}</span> · {fmt.dayShort(next.date)}
        </p>
      </div>
      {/* On narrow screens the line scrolls; faded edges say so */}
      <div ref={scroller} className="scroll-x px-1 pb-3.5 pt-4 max-lg:[mask-image:linear-gradient(to_right,transparent,#000_28px,#000_calc(100%-28px),transparent)]">
        <div className="relative min-w-[40rem]">
          {/* the line */}
          <div className="absolute top-[7px] h-[2px] bg-line-strong" style={{ left: `${inset}%`, width: `${usable}%` }} aria-hidden />
          <div className="absolute top-[7px] h-[2px] bg-primary" style={{ left: `${inset}%`, width: `${usable * progress}%` }} aria-hidden />
          <span
            ref={marker}
            className="absolute top-[1px] z-10 size-[14px] -translate-x-1/2 rounded-full bg-amber shadow-[0_0_0_3px_var(--surface),0_0_0_5px_rgb(255_176_0/0.35)]"
            style={{ left: `${inset + usable * progress}%` }}
            aria-hidden
          />
          <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {stations.map((s) => (
              <li key={s.key} className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    "relative z-[1] size-4 rounded-full border-2",
                    s.state === "past" && "border-primary bg-primary",
                    s.state === "next" && "border-primary bg-surface",
                    s.state === "future" && "border-line-strong bg-surface",
                  )}
                  aria-hidden
                />
                <span className={cn("caps mt-2.5", s.state === "next" ? "text-ink" : s.state === "past" ? "text-ink-2" : "text-ink-3")}>{s.label}</span>
                <span className={cn("num mt-0.5 text-xs", s.state === "next" ? "font-[620] text-ink" : "text-ink-3")}>{fmt.short(s.date)}</span>
                <span className="sr-only">{s.state === "past" ? ", passed" : s.state === "next" ? ", next" : ", upcoming"}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
