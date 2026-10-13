import { useState } from "react";
import { Printer } from "lucide-react";
import { roomShort } from "../../api/derive";
import * as seed from "../../data/seed";
import { examDuties, SECTION_LABEL, teacher, teaches } from "../../data/campus";
import { atTime, BREAK, now, PERIODS, routineDayIndex } from "../../lib/clock";
import { fmt, plural, until } from "../../lib/format";
import { useTitle } from "../../lib/useTitle";
import { useIsPhone } from "../../lib/useMediaQuery";
import { Button } from "../../components/Button";
import { PageHeader, Panel, Signal, Tag } from "../../components/Data";
import { RoutineDayView, RoutineGrid } from "../../components/RoutineGrid";
import { ScrollX } from "../../components/ScrollRegion";
import { slugOf } from "./parts";

const slots = seed.routine.filter((s) => teaches(s.code));
const hours = slots.reduce((s, x) => s + x.span * (50 / 60), 0);

export default function TeachRoutine() {
  useTitle("Class Routine");
  const phone = useIsPhone();
  const today = routineDayIndex(now());
  const [day, setDay] = useState(String(today));
  const at = now();
  const duties = [...examDuties].sort((a, b) => a.date.getTime() - b.date.getTime());
  return (
    // prints like the student's routine: the whole week on one landscape sheet, with the exam duties
    <div className="print-landscape" data-print-fit="landscape">
      <PageHeader
        title="Class Routine"
        description={`${seed.SEMESTER} · ${teacher.name} · ${plural(slots.length, "class", "classes")} a week, ${hours.toFixed(1)} contact hours, all with Section ${SECTION_LABEL}. Break ${BREAK.start}–${BREAK.end}.`}
        actions={
          <Button variant="secondary" className="no-print" icon={<Printer size={16} strokeWidth={1.75} />} onClick={() => window.print()}>
            Print or save PDF
          </Button>
        }
      />
      {/* the printed routine is always the whole week, without today's marks */}
      <div className="print-only">
        <RoutineGrid slots={slots} label={`${teacher.name}'s weekly routine, ${seed.SEMESTER}`} today={-1} linkFor={(s) => `/teach/courses/${slugOf(s.code)}/roll`} />
      </div>
      <div className="no-print">
        {phone ? (
          <RoutineDayView slots={slots} day={Number(day)} setDay={setDay} today={today} linkFor={(s) => `/teach/courses/${slugOf(s.code)}/roll`} metaFor={() => `Section ${SECTION_LABEL}`} empty="No classes to teach this day." />
        ) : (
          <RoutineGrid slots={slots} label={`${teacher.name}'s weekly routine, ${seed.SEMESTER}`} today={today} linkFor={(s) => `/teach/courses/${slugOf(s.code)}/roll`} />
        )}
      </div>

      <Panel id="duties" title="Exam duties" className="mt-6">
        <ScrollX label="Exam duties">
          <table className="table min-w-[40rem]">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Time</th>
                <th scope="col">Course</th>
                <th scope="col">Duty</th>
                <th scope="col">Room</th>
                <th scope="col" className="no-print">
                  <span className="sr-only">When</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {duties.map((d) => {
                const start = atTime(d.date, d.start);
                const past = start < at;
                return (
                  <tr key={d.id}>
                    <td className="whitespace-nowrap text-ink">{fmt.dayShort(d.date)}</td>
                    <td className="num whitespace-nowrap text-ink-2">
                      {d.start}–{d.end}
                    </td>
                    <th scope="row" className="font-normal">
                      <span className="font-[700] text-ink [font-stretch:88%]">{d.code}</span> <span className="text-ink-2">{d.title}</span>
                      <span className="block text-xs text-ink-3">{d.exam}</span>
                    </th>
                    <td>
                      <Tag>{d.role}</Tag>
                    </td>
                    <td className="text-ink-2">{roomShort(d.room)}</td>
                    <td className="n no-print">{past ? <Signal tone="neutral" dot={false}>Done</Signal> : <span className="text-xs text-ink-3">{until(start)}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollX>
        <p className="border-t border-line px-4 py-3 text-xs text-ink-3 lg:px-5">
          The examiner sets and marks the paper; invigilators supervise the room. Periods run {PERIODS[0].start} to {PERIODS[8].end}.
        </p>
      </Panel>
    </div>
  );
}
