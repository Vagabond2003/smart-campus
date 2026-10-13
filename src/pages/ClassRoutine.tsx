import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Printer } from "lucide-react";
import { useRoutine } from "../api/hooks";
import * as seed from "../data/seed";
import { BREAK, now, routineDayIndex } from "../lib/clock";
import { useTitle } from "../lib/useTitle";
import { useIsPhone } from "../lib/useMediaQuery";
import { Button } from "../components/Button";
import { PageHeader } from "../components/Data";
import { Bars, ErrorState, Reveal } from "../components/Feedback";
import { RoutineDayView, RoutineGrid } from "../components/RoutineGrid";

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
            <RoutineDayView
              slots={data}
              day={Number(day)}
              setDay={setDay}
              today={today}
              linkFor={(sl) => `/courses/${seed.offeringByCode[sl.code].slug}`}
              metaFor={(sl) => seed.teachers[seed.offeringByCode[sl.code].teacherIds[0]].name}
              empty="Your section has classes from Sunday to Thursday."
            />
          ) : (
            <RoutineGrid slots={data} label={`Weekly class routine, ${seed.SEMESTER}`} today={today} linkFor={(sl) => `/courses/${seed.offeringByCode[sl.code].slug}`} />
          )
        ) : null}
      </Reveal>
      <p className="mt-4 text-xs text-ink-3 no-print">
        Lab sessions span three periods. Rooms are in the Academic Building unless marked as a lab. Need the dates? <Link to="/exams" className="link">Exam Routine</Link>
      </p>
    </>
  );
}

