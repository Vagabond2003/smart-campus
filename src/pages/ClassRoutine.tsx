import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { CalendarRange, Printer } from "lucide-react";
import { useRoutine } from "../api/hooks";
import { roomShort } from "../api/derive";
import * as seed from "../data/seed";
import type { RoutineSlot } from "../data/types";
import { atTime, BREAK, now, PERIODS, routineDayIndex, WEEK_DAYS } from "../lib/clock";
import { cn } from "../lib/cn";
import { useTitle } from "../lib/useTitle";
import { useIsPhone } from "../lib/useMediaQuery";
import { Button } from "../components/Button";
import { PageHeader, Signal } from "../components/Data";
import { Bars, EmptyState, ErrorState, Reveal } from "../components/Feedback";
import { Segmented } from "../components/Tabs";

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

export default function ClassRoutine() {
  useTitle("Class Routine");
  const { data, isLoading, isError, refetch } = useRoutine();
  const [params, setParams] = useSearchParams();
  const phone = useIsPhone();
  const today = routineDayIndex(now());
  const [day, setDay] = useState(String(today));

  useEffect(() => {
    if (params.get("print") === "1" && data) {
      const t = window.setTimeout(() => {
        window.print();
        params.delete("print");
        setParams(params, { replace: true });
      }, 300);
      return () => window.clearTimeout(t);
    }
  }, [params, data, setParams]);

  if (isError) return <ErrorState what="the class routine" onRetry={() => refetch()} />;
  const marker = nowMarker();

  return (
    <>
      <PageHeader
        title="Class Routine"
        description={`${seed.SEMESTER} · ${seed.student.levelTerm} · Section ${seed.student.section}. Break ${BREAK.start}–${BREAK.end}.`}
        actions={
          <Button variant="secondary" className="no-print" icon={<Printer size={16} strokeWidth={1.75} />} onClick={() => window.print()}>
            Print or save PDF
          </Button>
        }
      />
      <Reveal loading={isLoading} skeleton={<Bars rows={7} />}>
        {data ? (
          phone ? (
            <DayView slots={data} day={Number(day)} setDay={setDay} today={today} />
          ) : (
            <div className="panel scroll-x">
              <div
                role="region"
                aria-label={`Weekly class routine, ${seed.SEMESTER}`}
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
                        <SlotCell key={`${s.day}-${s.period}`} slot={s} row={di + 2} today={isToday} />
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
          )
        ) : null}
      </Reveal>
      <p className="mt-4 text-xs text-ink-3 no-print">
        Lab sessions span three periods. Rooms are in the Academic Building unless marked as a lab. Need the dates? <Link to="/exams" className="link">Exam Routine</Link>
      </p>
    </>
  );
}

function SlotCell({ slot, row, today }: { slot: RoutineSlot; row: number; today: boolean }) {
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
        to={`/courses/${o.slug}`}
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

function DayView({ slots, day, setDay, today }: { slots: RoutineSlot[]; day: number; setDay: (d: string) => void; today: number }) {
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
            const t = seed.teachers[o.teacherIds[0]];
            return (
              <li key={`${s.day}-${s.period}`}>
                <Link to={`/courses/${o.slug}`} className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-3 px-4 py-3 no-underline">
                  <span className="num leading-tight">
                    <span className="block font-[650] text-ink">{p1.start}</span>
                    <span className="block text-xs text-ink-3">{p2.end}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[0.9375rem] text-ink">
                      <span className="font-[700] [font-stretch:88%]">{s.code}</span> <span className="text-ink-2">{o.title}</span>
                    </span>
                    <span className="block truncate text-xs text-ink-3">
                      {s.span > 1 ? s.room : `Room ${roomShort(s.room)}`} · {t.name}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="panel">
          <EmptyState icon={<CalendarRange size={20} strokeWidth={1.75} />} title={`No classes on ${WEEK_DAYS[day]}`}>
            Your section has classes from Sunday to Thursday.
          </EmptyState>
        </div>
      )}
    </div>
  );
}
