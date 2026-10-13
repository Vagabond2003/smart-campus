/**
 * The weekly routine: days Saturday to Friday down the side, nine periods across with the break
 * between periods 3 and 4, a block per class and an amber "now" marker on today. Phones get one
 * day at a time. The student's routine and the teacher's share it.
 */
import { Link } from "react-router";
import { roomShort } from "../api/derive";
import * as seed from "../data/seed";
import type { RoutineSlot } from "../data/types";
import { atTime, BREAK, now, PERIODS, WEEK_DAYS } from "../lib/clock";
import { cn } from "../lib/cn";
import { Signal } from "./Data";
import { EmptyState } from "./Feedback";
import { Segmented } from "./Tabs";

export interface RoutineGridProps {
  slots: RoutineSlot[];
  label: string;
  today: number;
  /** Where a class block leads. */
  linkFor: (slot: RoutineSlot) => string;
  /** The second line under a class on the phone list (teacher's name, or the section). */
  metaFor: (slot: RoutineSlot) => string;
}

/** Grid columns: day label, periods 1–3, break, periods 4–9. */
const colOf = (period: number) => (period <= 3 ? period + 1 : period + 2);

function nowMarker() {
  const t = now();
  const mins = t.getHours() * 60 + t.getMinutes();
  const toMin = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  };
  for (const p of PERIODS) {
    const a = toMin(p.start);
    const b = toMin(p.end);
    if (mins >= a && mins < b) return { col: colOf(p.n), frac: (mins - a) / (b - a) };
    if (mins >= b && mins < b + 10 && p.n !== 3) return { col: colOf(p.n), frac: 1 };
  }
  const a = toMin(BREAK.start);
  const b = toMin(BREAK.end);
  if (mins >= a && mins < b) return { col: 5, frac: (mins - a) / (b - a) };
  return null;
}

export function RoutineGrid({ slots: data, label, today, linkFor }: Omit<RoutineGridProps, "metaFor">) {
  const marker = nowMarker();
  return (
            <div className="panel scroll-x">
              <div
                role="region"
                aria-label={label}
                className="grid min-w-[64rem]"
                style={{ gridTemplateColumns: "7.5rem repeat(3, minmax(0,1fr)) 3.25rem repeat(6, minmax(0,1fr))" }}
              >
                <div aria-hidden className="contents">
                  <div className="caps sticky left-0 z-[2] flex items-end border-b border-line bg-surface-2 px-4 pb-2 pt-3 text-ink-2">Day</div>
                  {PERIODS.map((p) => (
                    <div key={p.n} className="border-b border-l border-line bg-surface-2 px-3 pb-2 pt-3" style={{ gridColumn: colOf(p.n) }}>
                      <span className="caps block text-ink-3">Period {p.n}</span>
                      <span className="num block text-xs font-[620] text-ink">
                        {p.start}–{p.end}
                      </span>
                    </div>
                  ))}
                  <div className="border-b border-l border-line bg-surface-2" style={{ gridColumn: 5 }} />
                </div>

                {WEEK_DAYS.map((name, di) => {
                  const slots = data.filter((s) => s.day === di);
                  const isToday = di === today;
                  return (
                    <div key={name} role="group" aria-label={`${name}${isToday ? ", today" : ""}${slots.length ? "" : ", no classes"}`} className="contents">
                      <div
                        aria-hidden
                        className={cn("sticky left-0 z-[2] flex flex-col justify-center gap-1 border-b border-line px-4 py-3", isToday ? "bg-caution-wash" : "bg-surface")}
                        style={{ gridRow: di + 2, gridColumn: 1 }}
                      >
                        <span className={cn("text-sm", isToday ? "font-[700] text-ink" : "font-[560] text-ink-2")}>{name}</span>
                        {isToday ? (
                          <Signal tone="now" className="self-start">
                            Today
                          </Signal>
                        ) : null}
                      </div>
                      {/* row background and empty cells */}
                      {Array.from({ length: 10 }, (_, i) => (
                        <div key={i} aria-hidden className={cn("border-b border-l border-line", isToday ? "bg-caution-wash/45" : "bg-surface", i === 3 && "bg-[repeating-linear-gradient(135deg,var(--surface-2)_0_6px,transparent_6px_12px)]")} style={{ gridRow: di + 2, gridColumn: i + 2 }} />
                      ))}
                      {slots.map((s) => (
                        <SlotCell key={`${s.day}-${s.period}`} slot={s} row={di + 2} today={isToday} to={linkFor(s)} />
                      ))}
                      {isToday && marker ? (
                        <div aria-hidden className="pointer-events-none relative z-0" style={{ gridRow: di + 2, gridColumn: marker.col }}>
                          {/* sits behind class blocks: a full line in free periods, ticks above and below a class in progress */}
                          <span className="absolute inset-y-0 w-[2px] -translate-x-1/2 rounded-full bg-amber" style={{ left: `${marker.frac * 100}%` }} />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                <div aria-hidden className="pointer-events-none flex items-center justify-center" style={{ gridRow: `2 / span 7`, gridColumn: 5 }}>
                  <span className="caps text-ink-3 [writing-mode:vertical-rl] rotate-180">Break {BREAK.start}–{BREAK.end}</span>
                </div>
              </div>
            </div>
  );
}

function SlotCell({ slot, row, today, to }: { slot: RoutineSlot; row: number; today: boolean; to: string }) {
  const o = seed.offeringByCode[slot.code];
  const start = colOf(slot.period);
  const lab = slot.span > 1;
  const at = now();
  const p1 = PERIODS[slot.period - 1];
  const p2 = PERIODS[slot.period - 1 + slot.span - 1];
  const live = today && at >= atTime(at, p1.start) && at < atTime(at, p2.end);
  return (
    <div className="relative z-[1] p-1.5" style={{ gridRow: row, gridColumn: `${start} / span ${slot.span}` }}>
      <span className="sr-only">
        {p1.start} to {p2.end}:
      </span>
      <Link
        to={to}
        className={cn(
          "flex h-full flex-col justify-center rounded-md px-2.5 py-2 no-underline transition-colors duration-150",
          live ? "bg-amber text-[#121314]" : lab ? "bg-surface-3 hover:bg-line" : "bg-ok-wash hover:brightness-[0.97] dark:hover:brightness-110",
        )}
        title={`${slot.code} ${o.title}, ${p1.start}–${p2.end}, ${slot.room}`}
      >
        <span className={cn("text-sm font-[720] [font-stretch:86%]", live ? "text-[#121314]" : "text-ink")}>{slot.code}</span>
        <span className={cn("truncate text-xs", live ? "text-[#121314]/80" : "text-ink-2")}>{lab ? `Lab · ${slot.room}` : `Room ${roomShort(slot.room)}`}</span>
        {lab ? <span className={cn("truncate text-xs", live ? "text-[#121314]/80" : "text-ink-2")}>{o.title}</span> : null}
      </Link>
    </div>
  );
}

export function RoutineDayView({ slots, day, setDay, today, linkFor, metaFor, empty }: Pick<RoutineGridProps, "slots" | "today" | "linkFor" | "metaFor"> & { day: number; setDay: (d: string) => void; empty: string }) {
  const list = slots.filter((s) => s.day === day).sort((a, b) => a.period - b.period);
  return (
    <div className="flex flex-col gap-4">
      <Segmented
        label="Day"
        full
        value={String(day)}
        onChange={setDay}
        options={WEEK_DAYS.map((d, i) => ({ value: String(i), label: <span className={cn(i === today && "font-[750]")}>{d.slice(0, 3)}</span> }))}
      />
      <h2 className="text-md font-[650] text-ink">
        {WEEK_DAYS[day]}
        {day === today ? <span className="ml-2 align-middle"><Signal tone="now">Today</Signal></span> : null}
      </h2>
      {list.length ? (
        <ol className="panel divide-y divide-line overflow-hidden">
          {list.map((s) => {
            const o = seed.offeringByCode[s.code];
            const p1 = PERIODS[s.period - 1];
            const p2 = PERIODS[s.period - 1 + s.span - 1];
            return (
              <li key={`${s.day}-${s.period}`}>
                <Link to={linkFor(s)} className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-3 px-4 py-3 no-underline">
                  <span className="num leading-tight">
                    <span className="block font-[650] text-ink">{p1.start}</span>
                    <span className="block text-xs text-ink-3">{p2.end}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[0.9375rem] text-ink">
                      <span className="font-[700] [font-stretch:88%]">{s.code}</span> <span className="text-ink-2">{o.title}</span>
                    </span>
                    <span className="block truncate text-xs text-ink-3">
                      {s.span > 1 ? s.room : `Room ${roomShort(s.room)}`} · {metaFor(s)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="panel">
          <EmptyState scene="platform" title={`No classes on ${WEEK_DAYS[day]}`}>
            {empty}
          </EmptyState>
        </div>
      )}
    </div>
  );
}
