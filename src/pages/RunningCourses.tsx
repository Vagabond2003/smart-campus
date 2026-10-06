import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAssessments, useAttendance, useOfferings, usePosts, prefetchRoute } from "../api/hooks";
import { nextSessions, roomShort } from "../api/derive";
import * as seed from "../data/seed";
import { addDays, now } from "../lib/clock";
import { cn } from "../lib/cn";
import { credits, fmt, pct } from "../lib/format";
import { useTitle } from "../lib/useTitle";
import { Avatar, PageHeader } from "../components/Data";
import { Bars, ErrorState, Reveal } from "../components/Feedback";

export default function RunningCourses() {
  useTitle("Running Courses");
  const qc = useQueryClient();
  const { data: offerings, isLoading, isError, refetch } = useOfferings();
  const { data: att } = useAttendance();
  const { data: marks } = useAssessments();
  const { data: posts } = usePosts();
  if (isError) return <ErrorState what="your courses" onRetry={() => refetch()} />;
  const upcoming = nextSessions(now(), 40);
  const weekAgo = addDays(now(), -7);
  const total = offerings?.reduce((s, o) => s + o.credit, 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Running Courses"
        description={offerings ? `${seed.SEMESTER} · ${offerings.length} courses · ${credits(total)} credits · Section ${seed.student.section}` : `${seed.SEMESTER}`}
      />
      <Reveal loading={isLoading} skeleton={<Bars rows={6} />}>
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {offerings?.map((o) => {
            const a = att?.summary.find((r) => r.code === o.code);
            const latest = marks
              ?.filter((m) => m.code === o.code && m.obtained != null)
              .sort((x, y) => (y.date?.getTime() ?? 0) - (x.date?.getTime() ?? 0))[0];
            const next = upcoming.find((s) => s.code === o.code);
            const fresh = posts?.filter((p) => p.code === o.code && p.at > weekAgo).length ?? 0;
            const teachers = o.teacherIds.map((id) => seed.teachers[id]);
            return (
              <li key={o.code} className="min-w-0">
                <Link
                  to={`/courses/${o.slug}`}
                  onPointerEnter={() => prefetchRoute(qc, `/courses/${o.slug}`)}
                  className="panel group flex h-full flex-col no-underline transition-[border-color,background-color] duration-150 ease-out hover:border-line-strong hover:bg-surface"
                >
                  <div className="flex items-start justify-between gap-3 px-4 pt-4 lg:px-5">
                    <div className="min-w-0">
                      <p className="text-[0.9375rem] font-[720] tracking-[0.01em] text-ink [font-stretch:86%]">{o.code}</p>
                      <h2 className="mt-0.5 text-md font-[640] leading-snug text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">{o.title}</h2>
                    </div>
                    <span className="shrink-0 rounded-sm bg-surface-2 px-2 py-1 text-xs font-[600] text-ink-2">
                      {o.type} · {credits(o.credit)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 px-4 lg:px-5">
                    <span className="flex -space-x-1.5">
                      {teachers.map((t) => (
                        <Avatar key={t.id} name={t.name} size="sm" className="ring-2 ring-surface" />
                      ))}
                    </span>
                    <span className="truncate text-sm text-ink-2">{teachers.map((t) => t.name).join(", ")}</span>
                  </div>
                  <dl className="mt-4 grid grid-cols-3 border-t border-line">
                    <div className="border-r border-line px-4 py-3 lg:px-5">
                      <dt className="caps text-ink-3">Attendance</dt>
                      <dd className={cn("num mt-0.5 text-[0.9375rem] font-[660]", a?.standing === "below" ? "text-danger" : a?.standing === "watch" ? "text-caution" : "text-ink")}>{a ? pct(a.pct) : "—"}</dd>
                    </div>
                    <div className="border-r border-line px-3 py-3">
                      <dt className="caps text-ink-3">Latest mark</dt>
                      <dd className="num mt-0.5 truncate text-[0.9375rem] font-[660] text-ink">
                        {latest ? (
                          <>
                            {latest.obtained}/{latest.max} <span className="text-xs font-[500] text-ink-3">{latest.name}</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                    <div className="px-3 py-3">
                      <dt className="caps text-ink-3">Next class</dt>
                      <dd className="num mt-0.5 truncate text-[0.9375rem] font-[660] text-ink">{next ? `${fmt.weekday(next.start)} ${fmt.time(next.start)}` : "—"}</dd>
                      {next ? <dd className="truncate text-xs text-ink-3">Room {roomShort(next.room)}</dd> : null}
                    </div>
                  </dl>
                  {fresh ? (
                    <p className="border-t border-line px-4 py-2.5 text-sm text-ink-2 lg:px-5">
                      <span className="font-[620] text-ink">{fresh === 1 ? "1 new post" : `${fresh} new posts`}</span> this week
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </>
  );
}
