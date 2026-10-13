import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Link } from "react-router";
import { CalendarClock, ClipboardCheck, Inbox, NotebookPen, SquarePen } from "lucide-react";
import { useSection, useTeachToday } from "../../api/hooks";
import { roomShort } from "../../api/derive";
import type { AdviseeStatus } from "../../api/teach";
import * as seed from "../../data/seed";
import { ME, rollSuffix, roster, SECTION_LABEL, teacher, teachingCodes, termSessions } from "../../data/campus";
import { now } from "../../lib/clock";
import { cn } from "../../lib/cn";
import { fmt, plural, until } from "../../lib/format";
import { useTitle } from "../../lib/useTitle";
import { useIsPhone } from "../../lib/useMediaQuery";
import { Button } from "../../components/Button";
import { PageHeader, Panel, PanelLink, Signal } from "../../components/Data";
import { Bars, EmptyState, Reveal } from "../../components/Feedback";
import { Segmented } from "../../components/Tabs";
import { firstName, greeting, RollSignal, RosterLink, slugOf, Swatch } from "./parts";
import { ApprovalRow, brief, reasons, RemindRow } from "./advising-parts";

export default function TeachDashboard() {
  useTitle("Dashboard");
  const at = now();
  return (
    <>
      <PageHeader
        title={`${greeting(at)}, ${firstName(teacher.name)}`}
        description={`${fmt.full(at)} · ${teacher.designation}, ${teacher.department} · Advisor, ${seed.student.batch} batch Section ${seed.student.section}`}
      />
      {/* The section first: who is slipping and who is waiting. Phones read the queue before the grid. */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:items-start">
        <SectionPanel className="order-2 xl:order-1" />
        <WaitingPanel className="order-1 xl:order-2" />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2 lg:items-start">
        <TodayPanel />
        <OwedPanel />
      </div>
    </>
  );
}

/* ─── Section watch ──────────────────────────────────────────────────────── */

type Filter = "all" | "risk" | "waiting";

function SectionPanel({ className }: { className?: string }) {
  const { data, isLoading } = useSection();
  const [filter, setFilter] = useState<Filter>("all");
  const list = data?.advisees ?? [];
  const risk = list.filter((a) => a.mark === "danger");
  const waiting = list.filter((a) => a.waiting);
  const under = list.filter((a) => a.under.length).length;
  const carrying = list.filter((a) => a.record.carries.length).length;
  const shown = (a: AdviseeStatus) => filter === "all" || (filter === "risk" ? a.mark === "danger" : a.waiting);
  // Phones list one student per row and drop the ones the filter leaves out; the grid dims them in place.
  const phone = useIsPhone();
  const rows = phone ? list.filter(shown) : list;

  return (
    <Panel id="section" title={`Section ${SECTION_LABEL}`} action={<PanelLink to="/teach/advising">Advisees</PanelLink>} className={className}>
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-5">
        <Segmented
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: `All ${list.length || ""}`.trim() },
            { value: "risk", label: `At risk ${data ? risk.length : ""}`.trim() },
            { value: "waiting", label: `Waiting on you ${data ? waiting.length : ""}`.trim() },
          ]}
        />
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2" aria-label="Legend">
          <li className="flex items-center gap-1.5">
            <Swatch mark="danger" />
            Under 75%, or RIB not registered
          </li>
          <li className="flex items-center gap-1.5">
            <Swatch mark="caution" />
            Close to the line, or a RIB course
          </li>
          <li className="flex items-center gap-1.5">
            <Inbox size={13} strokeWidth={2} className="text-ink-2" aria-hidden />
            Waiting for you
          </li>
        </ul>
      </div>
      <Reveal loading={isLoading} skeleton={<Bars rows={5} />}>
        {rows.length ? (
          <ul className={cn("roster-arrive", phone ? "roster-list" : "roster-grid px-4 py-4 lg:px-5")} aria-label={`Section ${SECTION_LABEL}, ${rows.length} students in roll order`}>
            {rows.map((a, i) => {
              const why = reasons(a);
              return (
                <li key={a.record.person.id} className={phone ? undefined : "contents"}>
                  <RosterLink
                    to={`/teach/students/${a.record.person.id}`}
                    person={a.record.person}
                    mark={a.mark === "ok" ? undefined : a.mark}
                    waiting={a.waiting}
                    dim={!shown(a)}
                    row={phone}
                    index={i}
                    note={a.mark === "ok" ? undefined : brief(a)}
                    label={`Roll ${rollSuffix(a.record.person)}, ${a.record.person.name}${a.record.person.id === ME ? " (sample student)" : ""}. ${why.length ? `${why.join("; ")}.` : "On track."}`}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-4 py-6 text-sm text-ink-2 lg:px-5">{filter === "risk" ? "Nobody in the section is at risk right now." : "Nothing from the section is waiting for you."}</p>
        )}
        <div className="flex flex-col gap-1 border-t border-line px-4 py-3 text-sm text-ink-2 lg:px-5">
          <p>
            <span className="font-[640] text-danger">{plural(under, "student")}</span> under the attendance line in at least one course ·{" "}
            <span className="font-[640] text-ink">{carrying}</span> carrying referred or backlog courses.
          </p>
          <p className="text-xs text-ink-3">
            Roll {seed.student.id.slice(-3)} is {seed.student.name}, the student you play on the student side. Everything you do here reaches them.
          </p>
        </div>
      </Reveal>
    </Panel>
  );
}

/* ─── Waiting on you ─────────────────────────────────────────────────────── */

function WaitingPanel({ className }: { className?: string }) {
  const { data, isLoading } = useSection();
  const q = data?.approvals;
  const closesSoon = q ? q.deadline.getTime() - now().getTime() < 7 * 86_400_000 : false;
  return (
    <Panel id="waiting" title="Waiting on you" action={<PanelLink to="/teach/approvals">Approvals</PanelLink>} className={cn("flex flex-col", className)} bodyClassName="flex flex-1 flex-col">
      <Reveal loading={isLoading} skeleton={<Bars rows={3} />}>
        {q ? (
          <>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-line px-4 py-2.5 text-sm text-ink-2 lg:px-5">
              <span className="font-[620] text-ink">{q.exam}</span>
              <Signal tone={closesSoon ? "danger" : "caution"}>Registration closes {until(q.deadline)}</Signal>
            </p>
            {q.waiting.length ? (
              <ul>
                <AnimatePresence mode="popLayout" initial={false}>
                  {q.waiting.map((a) => (
                    <ApprovalRow key={a.record.person.id} a={a} />
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <EmptyState scene="clear" title="All clear: nothing waiting for you" className="py-8">
                When an advisee registers for the RIB exam, their registration lands here for you to approve or return.
              </EmptyState>
            )}
            {q.unregistered.length ? (
              <div className="mt-auto border-t border-danger-line bg-danger-wash/45">
                <p className="band px-4 pb-1 pt-3 text-[0.8125rem] text-danger lg:px-5">Not registered yet</p>
                <ul>
                  {q.unregistered.map((a) => (
                    <RemindRow key={a.record.person.id} a={a} />
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}
      </Reveal>
    </Panel>
  );
}

/* ─── Today ──────────────────────────────────────────────────────────────── */

function TodayPanel() {
  const { data, isLoading } = useTeachToday();
  const at = now();
  const next = termSessions.find((s) => teachingCodes.includes(s.code) && s.start > at);
  return (
    <Panel id="today" title="Today" action={<PanelLink to="/teach/routine">Class Routine</PanelLink>}>
      <Reveal loading={isLoading} skeleton={<Bars rows={2} />}>
        {data?.meetings.length ? (
          <ol>
            {data.meetings.map((m) => {
              const o = seed.offeringByCode[m.session.code];
              const done = m.session.end <= at;
              const present = m.roll ? roster.length - m.roll.absent.length : null;
              return (
                <li key={m.key} className={cn("grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-b border-line px-4 py-3 last:border-b-0 sm:grid-cols-[4rem_minmax(0,1fr)_auto] lg:px-5", m.live && "bg-caution-wash/55")}>
                  <span className="num row-span-2 self-start leading-tight [font-stretch:84%] sm:row-span-1 sm:self-center">
                    <span className={cn("block text-[1rem] font-[680]", done && m.status !== "due" ? "text-ink-3" : "text-ink")}>{fmt.time(m.session.start)}</span>
                    <span className="block text-xs text-ink-3">{fmt.time(m.session.end)}</span>
                  </span>
                  <Link to={`/teach/courses/${o.slug}/roll`} className="min-w-0 rounded-sm no-underline">
                    <span className="block text-[0.9375rem] text-ink sm:truncate">
                      <span className="font-[700] [font-stretch:86%]">{m.session.code}</span> <span className="text-ink-2">{o.title}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-3">
                      <span className="band text-[0.6875rem] text-ink-2">{m.session.span > 1 ? m.session.room : `Room ${roomShort(m.session.room)}`}</span> · Section {seed.student.section}
                      {present != null ? ` · ${present} of ${roster.length} present` : ""}
                    </span>
                  </Link>
                  <span className="col-start-2 flex flex-wrap items-center gap-2 justify-self-start sm:col-start-3 sm:row-start-1 sm:justify-self-end">
                    <RollSignal status={m.status} live={m.live} start={m.session.start} />
                    {m.status === "due" ? (
                      <Button asChild size="sm" variant={m.live ? "primary" : "danger"} icon={<ClipboardCheck size={15} strokeWidth={1.75} />}>
                        <Link to={`/teach/roll/${m.key}`}>{m.live ? "Take roll" : "Take late roll"}</Link>
                      </Button>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="px-4 py-4 text-sm text-ink-2 lg:px-5">
            No classes today.
            {next ? ` Next: ${next.code} on ${fmt.dayShort(next.start)} at ${fmt.time(next.start)}, ${until(next.start)}.` : ""}
          </p>
        )}
      </Reveal>
    </Panel>
  );
}

/* ─── Marks to publish ───────────────────────────────────────────────────── */

function OwedPanel() {
  const { data, isLoading } = useTeachToday();
  const at = now();
  const owed = data?.duties.filter((d) => d.kind !== "roll") ?? [];
  const coming = seed.assessments
    .filter((a) => teachingCodes.includes(a.code) && a.date && a.date > at && a.date.getTime() - at.getTime() < 21 * 86_400_000)
    .sort((a, b) => a.date!.getTime() - b.date!.getTime())
    .slice(0, 2);
  return (
    <Panel id="owed" title="Marks to publish" action={<PanelLink to="/teach/courses">My Courses</PanelLink>}>
      <Reveal loading={isLoading} skeleton={<Bars rows={2} />}>
        {owed.length ? (
          <ul>
            {owed.map((d) => (
              <li key={d.id} className="flex items-center gap-3 border-b border-line px-4 py-3 lg:px-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface-2 text-ink-2">
                  {d.kind === "grading" ? <NotebookPen size={17} strokeWidth={1.75} aria-hidden /> : <SquarePen size={17} strokeWidth={1.75} aria-hidden />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-ink sm:truncate">
                    <span className="font-[700] [font-stretch:86%]">{d.code}</span> {d.title}
                  </span>
                  <span className="block text-xs text-ink-3">{d.detail}</span>
                </span>
                <Button asChild size="sm" variant="secondary">
                  <Link to={d.to}>{d.kind === "grading" ? "Grade" : "Enter marks"}</Link>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-3 border-b border-line px-4 py-3.5 text-sm text-ink-2 lg:px-5">
            <Signal tone="ok">All published</Signal> Every held assessment has its marks out.
          </p>
        )}
        {coming.map((a) => (
          <Link key={`${a.code}-${a.name}`} to={`/teach/courses/${slugOf(a.code)}/marks`} className="flex items-center gap-3 border-b border-line px-4 py-3 no-underline transition-colors duration-150 last:border-b-0 hover:bg-surface-2/60 lg:px-5">
            <CalendarClock size={16} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
            <span className="min-w-0 flex-1 text-sm text-ink-2">
              <span className="font-[640] text-ink">Next:</span> {a.code} {a.name} on {fmt.dayShort(a.date!)}
            </span>
            <span className="shrink-0 text-xs font-[600] text-ink-2">{until(a.date!)}</span>
          </Link>
        ))}
      </Reveal>
    </Panel>
  );
}
