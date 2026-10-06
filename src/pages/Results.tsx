import { useState } from "react";
import { Link } from "react-router";
import { useResults } from "../api/hooks";
import { calendar as C } from "../lib/clock";
import { cn } from "../lib/cn";
import { credits, fmt, gpa } from "../lib/format";
import { GRADE_SCALE, pointFor } from "../lib/grades";
import { useTitle } from "../lib/useTitle";
import { Button } from "../components/Button";
import { Meter, PageHeader, Panel, Signal } from "../components/Data";
import { Bars, ErrorState, Reveal } from "../components/Feedback";
import { Disclosure } from "../components/Accordion";
import { Select } from "../components/Select";

export default function Results() {
  useTitle("Results");
  const { data, isLoading, isError, refetch } = useResults();
  const [exam, setExam] = useState("all");
  if (isError) return <ErrorState what="results" onRetry={() => refetch()} />;
  const shown = (data?.results ?? []).filter((r) => exam === "all" || r.id === exam).slice().reverse();

  return (
    <>
      <PageHeader title="Results" description="Grades by examination, your standing after each, and every course still to clear." />
      <Reveal loading={isLoading} skeleton={<Bars rows={8} />}>
        {data ? (
          <div className="flex flex-col gap-5">
            {data.backlog.map((b) => (
              <Panel key={b.code} id={`bk-${b.code}`} tone="danger" title={`${b.status} course: ${b.code}`} action={<Signal tone="danger">Not cleared</Signal>}>
                <div className="grid gap-5 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-5">
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-[620] text-ink">{b.title}</p>
                    <p className="text-sm text-ink-2">{credits(b.credit)} credits · left out of your CGPA until it is cleared</p>
                    <ol className="mt-4 flex flex-col gap-0 sm:flex-row sm:items-start">
                      {b.attempts.map((a) => (
                        <li key={a.exam} className="flex items-start gap-3 sm:flex-1 sm:flex-col sm:gap-2">
                          <span className="mt-1 flex items-center sm:mt-0 sm:w-full">
                            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-danger text-[0.6875rem] font-[750] text-white dark:text-[#1c0b0a]">F</span>
                            <span className="hidden h-[2px] flex-1 bg-danger-line sm:block" aria-hidden />
                          </span>
                          <span className="pb-3 sm:pb-0 sm:pr-4">
                            <span className="block text-sm font-[600] text-ink">{a.exam}</span>
                            <span className="block text-xs text-ink-3">{a.regType} attempt · grade {a.grade}</span>
                          </span>
                        </li>
                      ))}
                      <li className="flex items-start gap-3 sm:flex-1 sm:flex-col sm:gap-2">
                        <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full border-2 border-dashed border-danger bg-surface sm:mt-0" aria-hidden />
                        <span>
                          <span className="block text-sm font-[650] text-ink">{b.nextChance}</span>
                          <span className="block text-xs text-ink-3">Registration open until {fmt.dayShort(C.ribRegistrationDeadline)}</span>
                        </span>
                      </li>
                    </ol>
                  </div>
                  <Button asChild variant="danger" className="justify-self-start">
                    <Link to="/registration/rib">Register for {b.nextChance.replace("RIB Exam of ", "RIB ")}</Link>
                  </Button>
                </div>
              </Panel>
            ))}

            <Panel id="standing" title="Standing after each examination">
              <div className="scroll-x">
                <table className="table min-w-[40rem]">
                  <caption className="sr-only">GPA and CGPA after each examination, on a fixed 0 to 4 scale</caption>
                  <thead>
                    <tr>
                      <th scope="col">Examination</th>
                      <th scope="col" className="n">
                        Credits
                      </th>
                      <th scope="col" className="n">
                        Earned
                      </th>
                      <th scope="col" className="w-[30%]">
                        GPA
                      </th>
                      <th scope="col" className="n">
                        CGPA after
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.standing.terms.map((t) => (
                      <tr key={t.id}>
                        <th scope="row">
                          <span className="block text-sm font-[620] text-ink">{t.exam}</span>
                          <span className="block text-xs text-ink-3">{t.levelTerm}</span>
                        </th>
                        <td className="n text-ink-2">{credits(t.credits)}</td>
                        <td className={cn("n", t.earned < t.credits ? "font-[620] text-danger" : "text-ink-2")}>{credits(t.earned)}</td>
                        <td>
                          <div className="flex items-center gap-3">
                            <Meter value={t.gpa} max={4} tone={t.gpa === 0 ? "danger" : "ok"} label={`GPA ${gpa(t.gpa)} of 4`} className="flex-1" />
                            <span className="num w-9 text-right text-sm font-[640] text-ink">{gpa(t.gpa)}</span>
                          </div>
                        </td>
                        <td className="n text-sm font-[660] text-ink">{gpa(t.cgpaAfter)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Now</td>
                      <td />
                      <td className="n">{credits(data.standing.earned)}</td>
                      <td className="text-xs font-normal text-ink-2">
                        {credits(data.standing.earned)} of {data.standing.totalCredits} credits toward the degree
                      </td>
                      <td className="n text-md font-[740]">{gpa(data.standing.cgpa)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Panel>

            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="band text-md text-ink">Grades</h2>
              <Select
                label="Examination"
                className="w-full sm:w-80"
                value={exam}
                onValueChange={setExam}
                options={[{ value: "all", label: "All examinations" }, ...data.results.map((r) => ({ value: r.id, label: r.exam, hint: r.levelTerm }))]}
              />
            </div>

            {shown.map((r) => {
              const t = data.standing.terms.find((x) => x.id === r.id)!;
              return (
                <Panel key={r.id} id={r.id} title={r.exam} action={<span className="text-sm text-ink-2">Published {fmt.long(r.publishedOn)}</span>}>
                  <div className="scroll-x">
                    <table className="table min-w-[44rem]">
                      <thead>
                        <tr>
                          <th scope="col">Course</th>
                          <th scope="col">Type</th>
                          <th scope="col">Registration</th>
                          <th scope="col" className="n">
                            Credit
                          </th>
                          <th scope="col" className="c">
                            Grade
                          </th>
                          <th scope="col" className="n">
                            Point
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.rows.map((x) => (
                          <tr key={x.code} className={x.grade === "F" ? "bg-danger-wash/45" : undefined}>
                            <th scope="row">
                              <span className="font-[700] text-ink [font-stretch:88%]">{x.code}</span> <span className="text-ink-2">{x.title}</span>
                            </th>
                            <td className="text-ink-2">{x.type}</td>
                            <td className="text-ink-2">{x.regType}</td>
                            <td className="n text-ink-2">{credits(x.credit)}</td>
                            <td className="c">
                              <span className={cn("inline-block min-w-8 rounded-sm px-1.5 py-0.5 text-center text-sm font-[720]", x.grade === "F" ? "bg-danger text-white dark:text-[#1c0b0a]" : "bg-surface-2 text-ink")}>{x.grade}</span>
                            </td>
                            <td className="n text-ink">{pointFor(x.grade).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3}>
                            Term GPA <span className="num ml-1">{gpa(t.gpa)}</span>
                            <span className="ml-4 font-normal text-ink-2">
                              Earned <span className="num">{credits(t.earned)}</span> of <span className="num">{credits(t.credits)}</span>
                            </span>
                          </td>
                          <td className="n">{credits(t.credits)}</td>
                          <td />
                          <td className="n">CGPA {gpa(t.cgpaAfter)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </Panel>
              );
            })}

            <div className="panel">
              <Disclosure headClassName="px-4 py-3.5 lg:px-5" summary={<span className="text-[0.9375rem] font-[640] text-ink">How grades and CGPA are calculated</span>}>
                <div className="grid gap-5 px-4 pb-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:px-5">
                  <table className="table rounded-md border border-line">
                    <thead>
                      <tr>
                        <th scope="col">Marks</th>
                        <th scope="col" className="c">
                          Grade
                        </th>
                        <th scope="col" className="n">
                          Point
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {GRADE_SCALE.map((g, i) => (
                        <tr key={g.grade}>
                          <td className="num py-1.5 text-ink-2">{i === 0 ? "80 and above" : g.min === 0 ? "Below 40" : `${g.min} to ${GRADE_SCALE[i - 1].min - 1}`}</td>
                          <td className="c py-1.5 font-[680]">{g.grade}</td>
                          <td className="n py-1.5">{g.point.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="max-w-[60ch] text-sm text-ink-2">
                    <p>Term GPA weighs each course's grade point by its credits, over every credit registered in that examination. An F counts as 0.00.</p>
                    <p className="mt-2">In this concept, CGPA counts each course once at its best grade and leaves a failed course out until it is cleared. That rule is illustrative; confirm the official rule with the exam office.</p>
                  </div>
                </div>
              </Disclosure>
            </div>
          </div>
        ) : null}
      </Reveal>
    </>
  );
}
