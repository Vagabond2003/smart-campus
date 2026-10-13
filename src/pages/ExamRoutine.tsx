/* oxlint-disable react/jsx-key -- DocTable cells are passed as data arrays; DocTable keys every row and cell it renders. */
import { useState } from "react";
import { Link } from "react-router";
import { Printer } from "lucide-react";
import { useExams, useStudent } from "../api/hooks";
import { roomShort } from "../api/derive";
import { atTime, now } from "../lib/clock";
import { cn } from "../lib/cn";
import { fmt, until } from "../lib/format";
import { useTitle } from "../lib/useTitle";
import { printDensity } from "../lib/print";
import { Button } from "../components/Button";
import { PageHeader, Signal } from "../components/Data";
import { Bars, EmptyState, ErrorState, Reveal } from "../components/Feedback";
import { Disclosure } from "../components/Accordion";
import { DocFields, DocHead, DocTable, SeatMap } from "../components/Docs";
import type { ExamSchedule } from "../data/types";
import { Select } from "../components/Select";

export default function ExamRoutine() {
  useTitle("Exam Routine");
  const { data, isLoading, isError, refetch } = useExams();
  const { data: st } = useStudent();
  const [exam, setExam] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  if (isError) return <ErrorState what="the exam routine" onRetry={() => refetch()} />;
  const schedule = data?.find((e) => e.exam === exam) ?? data?.[0];
  const at = now();
  const next = schedule?.sittings.find((s) => atTime(s.date, s.end) > at);

  return (
    <>
      {schedule?.published && st ? <ExamRoutineDoc schedule={schedule} student={st.student} /> : null}
      <div className="no-print">
        <PageHeader
          title="Exam Routine"
          description="Dates, times, rooms and your seat for every examination."
          actions={
            schedule?.published ? (
              <Button variant="secondary" icon={<Printer size={16} strokeWidth={1.75} />} onClick={() => window.print()}>
                Print or save PDF
              </Button>
            ) : null
          }
        />
        <Reveal loading={isLoading} skeleton={<Bars rows={5} />}>
          {data && schedule ? (
            <div className="flex flex-col gap-5">
              <Select
                label="Examination"
                className="w-full sm:w-96"
                value={schedule.exam}
                onValueChange={(v) => {
                  setExam(v);
                  setOpenId(null);
                }}
                options={data.map((e) => ({ value: e.exam, label: e.exam, hint: e.published ? `${e.sittings.length} exams` : "Not published yet" }))}
              />
              {schedule.published ? (
                <ul className="panel overflow-hidden" aria-label={schedule.exam}>
                  {schedule.sittings.map((s) => {
                    const past = atTime(s.date, s.end) <= at;
                    const isNext = next?.id === s.id;
                    const open = openId === s.id || (openId == null && isNext);
                    return (
                      <li key={s.id} className={cn("relative border-b border-line last:border-b-0", isNext && "bg-caution-wash/45")}>
                        <Disclosure
                          open={open}
                          onOpenChange={(o) => setOpenId(o ? s.id : "")}
                          headClassName="px-4 py-3.5 hover:bg-surface-2/50 lg:px-5"
                          summary={
                            <span className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-1 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto]">
                              <span className={cn("num leading-tight", past && "text-ink-3")}>
                                <span className="block text-xs uppercase tracking-[0.06em] [font-stretch:80%]">{fmt.weekday(s.date)}</span>
                                <span className={cn("block text-lg font-[700]", past ? "text-ink-3" : "text-ink")}>{fmt.short(s.date)}</span>
                              </span>
                              <span className="min-w-0">
                                <span className={cn("block truncate text-[0.9375rem]", past ? "text-ink-3" : "text-ink")}>
                                  <span className="font-[700] [font-stretch:88%]">{s.code}</span> <span className={past ? "" : "text-ink-2"}>{s.title}</span>
                                </span>
                                <span className="num block text-sm text-ink-2">
                                  {s.start}–{s.end} · Slot {s.slot} · Room {roomShort(s.room)} · Seat {s.seat.row}-{s.seat.col}
                                </span>
                              </span>
                              <span className="col-start-2 sm:col-start-3">
                                {isNext ? <Signal tone="now">Next · {until(atTime(s.date, s.start))}</Signal> : past ? <Signal tone="neutral" dot={false}>Done</Signal> : <span className="text-xs text-ink-3">{until(atTime(s.date, s.start))}</span>}
                              </span>
                            </span>
                          }
                        >
                          <div className="grid gap-5 border-t border-dashed border-line px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,16rem)] lg:px-5 lg:pl-[8rem]">
                            <SeatMap rows={s.roomRows} cols={s.roomCols} seat={s.seat} room={s.room} />
                            <div className="text-sm text-ink-2">
                              <p className="font-[640] text-ink">{s.room}</p>
                              <p className="mt-1">Rows run back from the board. Seats are numbered from the left as you face the board.</p>
                              <p className="mt-3">
                                Bring your admit card and student ID. <Link to="/admit-card" className="link">Admit Card</Link>
                              </p>
                            </div>
                          </div>
                        </Disclosure>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="panel">
                  <EmptyState scene="signal" title="Routine not published yet">
                    {schedule.note} The departure board on top of every page will show your first exam once it is out.
                  </EmptyState>
                </div>
              )}
            </div>
          ) : null}
        </Reveal>
      </div>
    </>
  );
}

type Student = NonNullable<ReturnType<typeof useStudent>["data"]>["student"];

/**
 * What prints: the routine as an official paper, every exam in one table with its room and seat,
 * instead of the screen's list of drop-downs (which would print one seat plan and blank gaps).
 * Always one sheet: the table tightens as the list grows.
 */
export function ExamRoutineDoc({ schedule, student }: { schedule: ExamSchedule; student: Student }) {
  return (
    <article className="print-only doc" data-print-fit data-density={printDensity(schedule.sittings.length)}>
      <DocHead title="Exam routine" subtitle={schedule.exam} />
      <DocFields
        className="mt-4"
        items={[
          { k: "Student name", v: student.name },
          { k: "Student ID", v: <span className="num">{student.id}</span> },
          { k: "Level-Term", v: student.levelTerm },
          { k: "Section", v: student.section },
        ]}
      />
      <div className="mt-5">
        <DocTable
          head={["Date", "Time", "Course", "Slot", "Room", "Seat"]}
          rows={schedule.sittings.map((s) => [
            <span className="num whitespace-nowrap">
              <span className="font-[650]">{fmt.weekday(s.date)}</span> {fmt.long(s.date)}
            </span>,
            <span className="num whitespace-nowrap">
              {s.start}–{s.end}
            </span>,
            <span>
              <span className="whitespace-nowrap font-[650]">{s.code}</span> {s.title}
            </span>,
            s.slot,
            <span className="whitespace-nowrap">{s.room}</span>,
            <span className="num whitespace-nowrap font-[650]">
              Row {s.seat.row}, seat {s.seat.col}
            </span>,
          ])}
        />
      </div>
      <ul className="mt-5 list-disc pl-5 text-xs text-[var(--doc-ink-2)]">
        <li>Rows run back from the board. Seats are numbered from the left as you face the board.</li>
        <li>Be seated 15 minutes before the exam starts, with your printed admit card and your student ID card.</li>
      </ul>
    </article>
  );
}
