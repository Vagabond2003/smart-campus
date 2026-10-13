import { Link } from "react-router";
import { AnimatePresence, m } from "motion/react";
import { useSection } from "../../api/hooks";
import * as seed from "../../data/seed";
import { rollSuffix, roster, SECTION_LABEL } from "../../data/campus";
import { addDays, calendar as C, now } from "../../lib/clock";
import { fmt, plural, until } from "../../lib/format";
import { useTitle } from "../../lib/useTitle";
import { PageHeader, Panel, Signal } from "../../components/Data";
import { Bars, EmptyState, Reveal } from "../../components/Feedback";
import { ApprovalRow, queueRow, RemindRow, RibSignal } from "./advising-parts";

export default function Approvals() {
  useTitle("Registration Approvals");
  const { data, isLoading } = useSection();
  const q = data?.approvals;
  const closesSoon = q ? q.deadline.getTime() - now().getTime() < 7 * 86_400_000 : false;
  return (
    <>
      <PageHeader title="Registration Approvals" description={`RIB registrations from Section ${SECTION_LABEL} wait here for you, the advisor. Approve them, or return them with a note the student sees.`} />
      <Reveal loading={isLoading} skeleton={<Bars rows={6} />}>
        {q ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="flex min-w-0 flex-col gap-5">
              <div className="panel flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 lg:px-5">
                <Signal tone={closesSoon ? "danger" : "caution"}>Closes {until(q.deadline)}</Signal>
                <span className="text-sm text-ink-2">
                  {q.exam} · students register until {fmt.dayShort(q.deadline)}, {fmt.time(q.deadline)}.
                </span>
              </div>

              <Panel id="waiting" title={`Waiting on you${q.waiting.length ? ` · ${q.waiting.length}` : ""}`}>
                {q.waiting.length ? (
                  <ul>
                    <AnimatePresence mode="popLayout" initial={false}>
                      {q.waiting.map((a) => (
                        <ApprovalRow key={a.record.person.id} a={a} />
                      ))}
                    </AnimatePresence>
                  </ul>
                ) : (
                  <EmptyState scene="clear" title="All clear: nothing waiting for you">
                    New RIB registrations from your advisees land here. The student sees your decision on their RIB Course Registration page.
                  </EmptyState>
                )}
              </Panel>

              <Panel id="decided" title="Decided">
                {q.decided.length ? (
                  <ul>
                    <AnimatePresence initial={false}>
                      {q.decided.map((a) => (
                        <m.li key={a.record.person.id} {...queueRow} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-3 last:border-b-0 lg:px-5">
                          <Link to={`/teach/students/${a.record.person.id}`} className="min-w-0 flex-1 text-sm no-underline">
                            <span className="font-[620] text-ink hover:underline">{a.record.person.name}</span> <span className="num text-xs text-ink-3">{rollSuffix(a.record.person)}</span>
                            <span className="block text-xs text-ink-2">
                              {a.rib.courses.join(", ")}
                              {a.rib.note ? ` · “${a.rib.note}”` : ""}
                            </span>
                          </Link>
                          <RibSignal a={a} />
                          <span className="w-24 text-right text-xs text-ink-3">{a.rib.decidedAt ? fmt.short(a.rib.decidedAt) : a.rib.at ? fmt.short(a.rib.at) : ""}</span>
                        </m.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                ) : (
                  <p className="px-4 py-4 text-sm text-ink-2 lg:px-5">No decisions yet this term.</p>
                )}
              </Panel>
            </div>

            <aside className="flex flex-col gap-5 xl:sticky xl:top-[calc(var(--topbar-h)+1.5rem)] xl:self-start">
              <Panel id="unregistered" title="Not registered yet" tone={q.unregistered.length ? "danger" : undefined}>
                {q.unregistered.length ? (
                  <>
                    <p className="border-b border-line px-4 py-2.5 text-sm text-ink-2 lg:px-5">These advisees carry a referred or backlog course and haven't registered it. A reminder lands in their notifications.</p>
                    <ul className="py-1">
                      {q.unregistered.map((a) => (
                        <RemindRow key={a.record.person.id} a={a} />
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="px-4 py-4 text-sm text-ink-2 lg:px-5">Everyone who needs to has registered.</p>
                )}
              </Panel>
              <Panel id="regular" title="Regular registration">
                <div className="flex flex-col gap-2 px-4 py-4 text-sm text-ink-2 lg:px-5">
                  <Signal tone="ok" className="self-start">
                    Complete
                  </Signal>
                  <p>
                    {seed.SEMESTER} registration for all {plural(roster.length, "student")} was approved on {fmt.long(addDays(C.termStart, 3))}. It opens again after results, around {fmt.long(C.results)}.
                  </p>
                </div>
              </Panel>
            </aside>
          </div>
        ) : null}
      </Reveal>
    </>
  );
}
