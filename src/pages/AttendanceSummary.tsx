import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useAttendance } from "../api/hooks";
import type { AttendanceSummaryRow } from "../api/derive";
import * as seed from "../data/seed";
import { cn } from "../lib/cn";
import { credits, pct, plural } from "../lib/format";
import { Flip, gsap, prefersReducedMotion } from "../lib/motion";
import { useTitle } from "../lib/useTitle";
import { Meter, PageHeader, Signal } from "../components/Data";
import { Bars, ErrorState, Reveal } from "../components/Feedback";
import { Segmented } from "../components/Tabs";

type Sort = "course" | "lowest";

function outlook(r: AttendanceSummaryRow) {
  if (r.advice.kind === "can-miss") return r.advice.n === 0 ? "No more absences to spare" : `Can miss ${plural(r.advice.n, "more class", "more classes")}`;
  if (r.advice.kind === "need") return `Attend the next ${r.advice.n} in a row`;
  return "Can't reach the line this term";
}

export default function AttendanceSummary() {
  useTitle("Attendance Summary");
  const { data, isLoading, isError, refetch } = useAttendance();
  const [sort, setSort] = useState<Sort>("course");
  const list = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);

  const changeSort = (s: Sort) => {
    if (list.current && !prefersReducedMotion()) flipState.current = Flip.getState(list.current.querySelectorAll("[data-flip-id]"));
    setSort(s);
  };

  useLayoutEffect(() => {
    if (!flipState.current) return;
    const el = list.current;
    const tween = Flip.from(flipState.current, { duration: 0.42, ease: "expo.out", absolute: false });
    flipState.current = null;
    return () => {
      tween.kill();
      gsap.set(el?.querySelectorAll("[data-flip-id]") ?? [], { clearProps: "transform" });
    };
  }, [sort]);

  if (isError) return <ErrorState what="attendance" onRetry={() => refetch()} />;
  const rows = [...(data?.summary ?? [])].sort((a, b) => (sort === "lowest" ? a.pct - b.pct : 0));
  const below = rows.filter((r) => r.standing === "below").length;

  return (
    <>
      <PageHeader
        title="Attendance Summary"
        description={`${seed.SEMESTER} · classes held up to today. The ${seed.ATTENDANCE_LINE}% line is illustrative in this concept.`}
        actions={
          <Segmented
            label="Sort courses"
            value={sort}
            onChange={changeSort}
            options={[
              { value: "course", label: "Course order" },
              { value: "lowest", label: "Lowest first" },
            ]}
          />
        }
      />
      {below ? (
        <p className="mb-4 flex items-center gap-2 text-sm text-ink">
          <Signal tone="danger">{plural(below, "course")} under the line</Signal>
          <span className="text-ink-2">Each row says exactly what it takes to recover.</span>
        </p>
      ) : null}
      <Reveal loading={isLoading} skeleton={<Bars rows={6} />}>
        <div className="panel overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,2.2fr)_4.5rem_4.5rem_4.5rem_minmax(11rem,1.5fr)_minmax(10rem,1.2fr)] gap-4 border-b border-line bg-surface-2 px-5 py-2.5 md:grid" aria-hidden>
            <span className="caps text-ink-2">Course</span>
            <span className="caps text-right text-ink-2">Held</span>
            <span className="caps text-right text-ink-2">Present</span>
            <span className="caps text-right text-ink-2">Absent</span>
            <span className="caps text-ink-2">Percentage</span>
            <span className="caps text-ink-2">Outlook</span>
          </div>
          <div ref={list} role="list" aria-label="Attendance by course">
            {rows.map((r) => {
              const tone = r.standing === "below" ? "danger" : r.standing === "watch" ? "caution" : "ok";
              return (
                <div
                  key={r.code}
                  role="listitem"
                  data-flip-id={r.code}
                  className={cn(
                    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-line bg-surface px-4 py-3.5 last:border-b-0 md:grid-cols-[minmax(0,2.2fr)_4.5rem_4.5rem_4.5rem_minmax(11rem,1.5fr)_minmax(10rem,1.2fr)] md:px-5",
                    r.standing === "below" && "bg-danger-wash/40",
                  )}
                >
                  <div className="min-w-0">
                    <Link to={`/courses/${r.slug}/attendance`} className="block truncate text-[0.9375rem] no-underline hover:underline">
                      <span className="font-[700] text-ink [font-stretch:88%]">{r.code}</span> <span className="text-ink-2">{r.title}</span>
                    </Link>
                    <span className="text-xs text-ink-3">
                      {r.type} · {credits(r.credit)} credits
                    </span>
                  </div>
                  <span className="num text-right text-sm text-ink-2 max-md:hidden">{r.total}</span>
                  <span className="num text-right text-sm text-ink-2 max-md:hidden">{r.present}</span>
                  <span className={cn("num text-right text-sm max-md:hidden", r.absent ? "font-[620] text-ink" : "text-ink-2")}>{r.absent}</span>
                  <div className="col-span-2 flex items-center gap-3 md:col-span-1">
                    <Meter value={r.pct} max={100} line={seed.ATTENDANCE_LINE} tone={tone} label={`${r.code} attendance ${pct(r.pct, 1)}`} className="flex-1" />
                    <span className={cn("num w-12 text-right text-sm font-[680]", tone === "danger" ? "text-danger" : "text-ink")}>{pct(r.pct, 1)}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2 md:col-span-1">
                    <span className={cn("text-sm", tone === "danger" ? "font-[620] text-danger" : "text-ink-2")}>{outlook(r)}</span>
                    <span className="num text-xs text-ink-3 md:hidden">
                      · {r.present}/{r.total} present
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>
    </>
  );
}
