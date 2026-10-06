import { Link } from "react-router";
import { ClipboardList, NotebookPen, Pin, TriangleAlert } from "lucide-react";
import { useAttendance, useBills, usePosts, useResults } from "../api/hooks";
import { nextSessions, roomShort, sessionsOn } from "../api/derive";
import * as seed from "../data/seed";
import { addDays, atTime, calendar as C, now, sameDay, startOfDay } from "../lib/clock";
import { cn } from "../lib/cn";
import { ago, credits, fmt, gpa, pct, taka, until } from "../lib/format";
import { useTitle } from "../lib/useTitle";
import { Button } from "../components/Button";
import { Avatar, Meter, PageHeader, Panel, PanelLink, Signal } from "../components/Data";
import { Bars, Reveal } from "../components/Feedback";
import { TermLine } from "../components/TermLine";

function greeting(d: Date) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function Dashboard() {
  useTitle("Dashboard");
  const at = now();
  const first = seed.student.name.split(" ")[0];
  return (
    <>
      <PageHeader title={`${greeting(at)}, ${first}`} description={`${fmt.full(at)} · ${seed.student.levelTerm} · Section ${seed.student.section}`} />
      <TermLine />
      {/* A true 2x2: the four areas at equal weight, rows aligned, bad news (backlog, dues) in the first screen */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <TodayPanel />
        <StandingPanel />
        <DuesPanel />
        <PostsPanel />
      </div>
    </>
  );
}

/* ─── Today ──────────────────────────────────────────────────────────────── */

function TodayPanel() {
  const at = now();
  const today = sessionsOn(at);
  const remainingToday = today.filter((s) => s.end > at);
  const upcoming = nextSessions(at, 8);
  const nextDay = remainingToday.length ? null : upcoming[0]?.start;
  const list = remainingToday.length ? today : nextDay ? sessionsOn(nextDay) : [];
  const nextId = upcoming.find((s) => s.start > at)?.id;
  const heading = remainingToday.length ? "Today" : nextDay ? (sameDay(nextDay, addDays(at, 1)) ? "Tomorrow" : fmt.weekdayLong(nextDay)) : "Today";
  const { data: att, isLoading } = useAttendance();
  const watch = att?.summary.filter((r) => r.standing !== "ok") ?? [];

  const soon = [
    ...seed.examSchedules
      .flatMap((e) => e.sittings)
      .filter((s) => s.date >= startOfDay(at) && s.date <= addDays(at, 12))
      .map((s) => ({ key: s.id, icon: ClipboardList, text: `${s.exam.startsWith("Mid") ? "Mid term" : "Exam"}: ${s.code}`, meta: `${fmt.dayShort(s.date)}, ${s.start} · Room ${roomShort(s.room)}, seat ${s.seat.row}-${s.seat.col}`, when: atTime(s.date, s.start), to: "/exams" })),
    ...seed.assignments
      .filter((a) => a.state === "open" && a.due > at && a.due <= addDays(at, 12))
      .map((a) => ({ key: a.id, icon: NotebookPen, text: `${a.code}: ${a.title.replace(/^Assignment \d+: /, "")}`, meta: `Due ${fmt.dayShort(a.due)}, ${fmt.time(a.due)}`, when: a.due, to: `/courses/${seed.offeringByCode[a.code].slug}/assignments` })),
  ].sort((a, b) => a.when.getTime() - b.when.getTime());

  const nextUp = soon[0];

  return (
    <Panel id="today" title={heading} action={<PanelLink to="/routine">Class Routine</PanelLink>} className="flex flex-col lg:col-span-2 xl:col-span-1" bodyClassName="flex flex-1 flex-col">
      {!remainingToday.length ? (
        <p className="border-b border-line px-4 py-2.5 text-sm text-ink-2 lg:px-5">{today.length ? "Classes are over for today." : "No classes today."} {nextDay ? `Next classes on ${fmt.dayShort(nextDay)}.` : ""}</p>
      ) : null}
      <ol>
        {list.map((s) => {
          const o = seed.offeringByCode[s.code];
          const isNow = s.start <= at && at < s.end;
          const done = s.end <= at;
          const isNext = s.id === nextId;
          const teacher = seed.teachers[o.teacherIds[0]];
          return (
            <li
              key={s.id}
              className={cn(
                "grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 border-b border-line px-4 py-3 last:border-b-0 sm:grid-cols-[4rem_minmax(0,1fr)_auto] lg:px-5",
                isNow && "bg-caution-wash/55",
              )}
            >
              <span className="num row-span-2 self-start leading-tight [font-stretch:84%] sm:row-span-1 sm:self-center">
                <span className={cn("block text-[1rem] font-[680]", done ? "text-ink-3" : "text-ink")}>{fmt.time(s.start)}</span>
                <span className="block text-xs text-ink-3">{fmt.time(s.end)}</span>
              </span>
              <Link to={`/courses/${o.slug}`} className="min-w-0 rounded-sm no-underline">
                <span className={cn("block text-[0.9375rem] sm:truncate", done ? "text-ink-3" : "text-ink")}>
                  <span className="font-[700] [font-stretch:86%]">{s.code}</span> <span className={done ? "" : "text-ink-2"}>{o.title}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-3">
                  <span className="band text-[0.6875rem] text-ink-2">Room {roomShort(s.room)}</span>· {teacher.name}
                </span>
              </Link>
              <span className="col-start-2 justify-self-start sm:col-start-3 sm:row-start-1 sm:justify-self-end">
                {isNow ? (
                  <Signal tone="now">Now</Signal>
                ) : done ? (
                  <Signal tone="neutral" dot={false}>
                    Done
                  </Signal>
                ) : isNext ? (
                  <Signal tone="ok">Next · {until(s.start)}</Signal>
                ) : (
                  <span className="text-xs text-ink-3">{until(s.start)}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      <Reveal loading={isLoading} skeleton={<div className="h-14" />}>
        {watch.length ? (
          <div className="border-t border-line bg-danger-wash/45 px-4 py-3 lg:px-5">
            {watch.map((r) => (
              <p key={r.code} className="flex items-start gap-2.5 text-sm text-ink">
                <TriangleAlert size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-danger" aria-hidden />
                <span>
                  <span className="font-[640]">
                    {r.code} attendance is {pct(r.pct, 1)}
                  </span>
                  , {r.standing === "below" ? `under the ${seed.ATTENDANCE_LINE}% line` : `close to the ${seed.ATTENDANCE_LINE}% line`}.{" "}
                  {r.advice.kind === "need" ? `Attend the next ${r.advice.n} classes in a row to get back above it.` : r.advice.kind === "can-miss" ? `You can miss ${r.advice.n} more.` : "It can no longer reach the line this term; talk to your advisor."}{" "}
                  <Link to="/attendance" className="link">
                    Attendance Summary
                  </Link>
                </span>
              </p>
            ))}
          </div>
        ) : null}
      </Reveal>

      {nextUp ? (
        <Link to={nextUp.to} className="mt-auto flex items-center gap-3 border-t border-line px-4 py-3 no-underline transition-colors duration-150 hover:bg-surface-2/60 lg:px-5">
          <nextUp.icon size={16} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-ink sm:truncate">
              <span className="font-[640]">Next deadline:</span> {nextUp.text}
            </span>
            <span className="block text-xs text-ink-3 sm:truncate">{nextUp.meta}</span>
          </span>
          <span className="shrink-0 text-xs font-[600] text-ink-2">{until(nextUp.when)}</span>
        </Link>
      ) : null}
    </Panel>
  );
}

/* ─── Standing ───────────────────────────────────────────────────────────── */

function StandingPanel() {
  const { data, isLoading } = useResults();
  return (
    <Panel id="standing" title="Standing" action={<PanelLink to="/results">Results</PanelLink>} className="@container">
      <Reveal loading={isLoading} skeleton={<Bars rows={3} />}>
        {data ? (
          <>
            {data.backlog.map((b) => (
              <div key={b.code} className="flex flex-col gap-3 border-b border-danger-line bg-danger-wash/55 px-4 py-3.5 sm:flex-row sm:items-center lg:px-5">
                <p className="flex-1 text-sm text-ink">
                  <span className="font-[660] text-danger">
                    {b.code} is a {b.status.toLowerCase()} course
                  </span>{" "}
                  after {b.attempts.length} attempts. Register it for {b.nextChance} by {fmt.dayShort(C.ribRegistrationDeadline)}.
                </p>
                <Button asChild size="sm" variant="danger" className="self-start sm:self-auto">
                  <Link to="/registration/rib">Register</Link>
                </Button>
              </div>
            ))}
            <table className="table [&_tbody_td]:py-2.5 [&_tbody_th]:py-2.5">
              <caption className="sr-only">GPA by examination, on a fixed 0 to 4 scale</caption>
              <thead>
                <tr>
                  <th scope="col">Examination</th>
                  <th scope="col" className="n">
                    Credits
                  </th>
                  <th scope="col" className="@md:w-[42%]">
                    GPA
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.standing.terms.map((t) => {
                  const fails = data.results.find((r) => r.id === t.id)!.rows.filter((r) => r.grade === "F").length;
                  return (
                    <tr key={t.id}>
                      <th scope="row" className="py-2.5 pl-4 pr-2 text-left font-normal lg:pl-5">
                        <span className={cn("block text-sm font-[600] text-ink", t.kind === "rib" ? "text-pretty" : "whitespace-nowrap")}>{t.kind === "rib" ? t.exam : t.levelTerm}</span>
                        <span className="block whitespace-nowrap text-xs text-ink-3">{t.kind === "rib" ? `${t.levelTerm} course` : t.exam.replace("Final Examination ", "")}</span>
                      </th>
                      <td className="n text-ink-2">{credits(t.credits)}</td>
                      <td>
                        <div className="flex items-center justify-end gap-3">
                          {/* bars need room; a narrow panel keeps the exact figures and drops the bars */}
                          <Meter value={t.gpa} max={4} tone={t.gpa === 0 ? "danger" : "ok"} label={`GPA ${gpa(t.gpa)} of 4`} className="flex-1 @max-md:hidden" />
                          <span className="num w-9 text-right text-sm font-[640] text-ink">{gpa(t.gpa)}</span>
                        </div>
                        {fails ? <span className="mt-1 block whitespace-nowrap text-right text-xs font-[560] text-danger @md:text-left">{fails === 1 ? "1 course failed" : `${fails} courses failed`}</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="pl-4 lg:pl-5">CGPA</td>
                  <td className="n">{credits(data.standing.earned)}</td>
                  <td>
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="whitespace-nowrap text-xs font-normal text-ink-2 @max-md:hidden">of {data.standing.totalCredits} credits</span>
                      <span className="num ml-auto text-md font-[720] text-ink">{gpa(data.standing.cgpa)}</span>
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </>
        ) : null}
      </Reveal>
    </Panel>
  );
}

/* ─── Dues ───────────────────────────────────────────────────────────────── */

function DuesPanel() {
  const { data, isLoading } = useBills();
  const open = data?.bills.filter((b) => data.balances[b.id].due > 0) ?? [];
  const lastPayment = data ? [...data.payments].sort((a, b) => b.date.getTime() - a.date.getTime())[0] : undefined;
  const due = data?.totals.due ?? 0;
  const primary = open.find((b) => b.dueDate) ?? open[0];
  const bal = primary && data ? data.balances[primary.id] : null;
  const overdue = primary?.dueDate ? primary.dueDate < now() : false;

  return (
    <Panel id="dues" title="Dues" action={<PanelLink to="/bills">Bills</PanelLink>}>
      <Reveal loading={isLoading} skeleton={<Bars rows={2} />}>
        {data ? (
          due > 0 && primary && bal ? (
            <div className="px-4 py-4 lg:px-5">
              <p className="text-sm text-ink-2">Balance due{open.length > 1 ? ` across ${open.length} bills` : ` on the ${primary.title.toLowerCase()}`}</p>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="display-num text-3xl text-danger">{taka(due)}</span>
                {primary.dueDate ? <Signal tone={overdue ? "danger" : "caution"}>{overdue ? "Overdue" : `Pay by ${fmt.dayShort(primary.dueDate)} · ${until(primary.dueDate)}`}</Signal> : null}
              </p>
              <div className="mt-4">
                <Meter value={bal.paid + bal.adjusted} max={primary.amount} tone="ok" label={`${taka(bal.paid + bal.adjusted)} settled of ${taka(primary.amount)}`} />
                <p className="mt-2 text-xs text-ink-2">
                  <span className="num font-[600] text-ink">{taka(bal.paid + bal.adjusted)}</span> of <span className="num">{taka(primary.amount)}</span> settled: paid <span className="num">{taka(bal.paid)}</span>
                  {bal.adjusted ? (
                    <>
                      , waiver <span className="num">{taka(bal.adjusted)}</span>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild>
                  <Link to={`/bills?pay=${primary.id}`}>Pay {taka(bal.due)}</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link to="/bills">View statement</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-4 lg:px-5">
              <Signal tone="ok">No dues</Signal>
              <p className="text-sm text-ink-2">Every bill is settled.</p>
            </div>
          )
        ) : null}
        {lastPayment ? (
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm lg:px-5">
            <span className="min-w-0 text-ink-2">
              Last payment <span className="num font-[600] text-ink">{taka(lastPayment.amount)}</span> · {lastPayment.provider ?? lastPayment.method} · {fmt.short(lastPayment.date)}
            </span>
            <Link to={`/bills/receipts/${lastPayment.id}`} className="link shrink-0">
              Receipt
            </Link>
          </div>
        ) : null}
      </Reveal>
    </Panel>
  );
}

/* ─── Posts ──────────────────────────────────────────────────────────────── */

function PostsPanel() {
  const { data, isLoading } = usePosts();
  const latest = data ? [...data].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.at.getTime() - a.at.getTime()).slice(0, 3) : [];
  return (
    <Panel id="posts" title="Course posts" action={<PanelLink to="/courses">Running Courses</PanelLink>} className="lg:col-span-2 xl:col-span-1">
      <Reveal loading={isLoading} skeleton={<Bars rows={4} />}>
        <ul>
          {latest.map((p) => {
            const o = seed.offeringByCode[p.code];
            const t = seed.teachers[p.authorId];
            const firstText = p.blocks.find((b) => b.kind === "p") as { text: string } | undefined;
            return (
              <li key={p.id} className="border-b border-line last:border-b-0">
                <Link to={`/courses/${o.slug}/discussion#${p.id}`} className="flex gap-3 px-4 py-3 no-underline transition-colors duration-150 hover:bg-surface-2/70 lg:px-5">
                  <Avatar name={t.name} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-1.5">
                      <span className="line-clamp-2 text-[0.9375rem] font-[630] text-ink">{p.title}</span>
                      {p.pinned ? <Pin size={14} strokeWidth={1.75} className="mt-1 shrink-0 text-ink-3" aria-label="Pinned" /> : null}
                    </span>
                    <span className="block truncate text-xs text-ink-3">
                      <span className="font-[620] text-ink-2">{p.code}</span> · {t.name} · {ago(p.at)}
                    </span>
                    {firstText ? <span className="mt-0.5 line-clamp-1 block text-sm text-ink-2">{firstText.text}</span> : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </Panel>
  );
}
