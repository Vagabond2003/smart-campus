import { useState } from "react";
import { Link } from "react-router";
import { useOfferings, useResults } from "../api/hooks";
import * as seed from "../data/seed";
import { addDays, calendar as C } from "../lib/clock";
import { credits, fmt } from "../lib/format";
import { useTitle } from "../lib/useTitle";
import { PageHeader, Signal } from "../components/Data";
import { Bars, ErrorState, Reveal } from "../components/Feedback";
import { Select } from "../components/Select";

export default function RegularRegistration() {
  useTitle("Regular Course Registration");
  const { data: offerings, isLoading, isError, refetch } = useOfferings();
  const { data: res } = useResults();
  const [sem, setSem] = useState(seed.SEMESTER);
  if (isError) return <ErrorState what="registration" onRetry={() => refetch()} />;

  const past = res?.results.filter((r) => r.kind === "regular") ?? [];
  const current = sem === seed.SEMESTER;
  const pastTerm = past.find((r) => r.semester === sem);
  const rows = current
    ? (offerings ?? []).map((o) => ({ code: o.code, title: o.title, type: o.type, credit: o.credit, contact: o.contactHours, regType: o.regType, status: o.status as string }))
    : (pastTerm?.rows ?? []).map((r) => ({ code: r.code, title: r.title, type: r.type, credit: r.credit, contact: r.type === "Theory" ? 3 : r.credit * 2, regType: r.regType, status: "Completed" }));
  const total = rows.reduce((s, r) => s + r.credit, 0);
  const advisor = seed.teachers[seed.student.advisorId];

  return (
    <>
      <PageHeader title="Regular Course Registration" description="The courses offered to your section each term, and where your registration stands." />
      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-end">
        <Select
          label="Semester"
          value={sem}
          onValueChange={setSem}
          options={[
            { value: seed.SEMESTER, label: seed.SEMESTER, hint: `${seed.student.levelTerm} · current` },
            ...past
              .slice()
              .reverse()
              .map((r) => ({ value: r.semester, label: r.semester, hint: r.levelTerm })),
          ]}
        />
        <div className="panel flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          {current ? (
            <>
              <Signal tone="ok">Registration complete</Signal>
              <span className="text-sm text-ink-2">
                Approved by {advisor.name}, your advisor, on {fmt.long(addDays(C.termStart, 3))}.
              </span>
            </>
          ) : (
            <>
              <Signal tone="neutral">Term completed</Signal>
              <span className="text-sm text-ink-2">{pastTerm?.levelTerm} · results published {pastTerm ? fmt.long(pastTerm.publishedOn) : ""}</span>
            </>
          )}
        </div>
      </div>

      <Reveal loading={isLoading} skeleton={<Bars rows={6} />}>
        <div className="panel scroll-x">
          <table className="table min-w-[46rem]">
            <caption className="sr-only">Courses for {sem}</caption>
            <thead>
              <tr>
                <th scope="col">Course</th>
                <th scope="col">Type</th>
                <th scope="col">Offer</th>
                <th scope="col" className="n">
                  Credit
                </th>
                <th scope="col" className="n">
                  Contact hrs
                </th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code}>
                  <th scope="row">
                    <span className="font-[700] text-ink [font-stretch:88%]">{r.code}</span> <span className="text-ink-2">{r.title}</span>
                  </th>
                  <td className="text-ink-2">{r.type}</td>
                  <td className="text-ink-2">{r.regType}</td>
                  <td className="n">{credits(r.credit)}</td>
                  <td className="n text-ink-2">{credits(r.contact)}</td>
                  <td>
                    <Signal tone={r.status === "Registered" ? "ok" : "neutral"} dot={r.status === "Registered"}>
                      {r.status}
                    </Signal>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>{rows.length} courses</td>
                <td className="n">{credits(total)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Reveal>

      {current ? (
        <p className="mt-4 max-w-[70ch] text-sm text-ink-2">
          Registration for the next term opens after {seed.SEMESTER} results are published, around {fmt.long(C.results)}. Courses you fail are offered again through{" "}
          <Link to="/registration/rib" className="link">
            RIB Course Registration
          </Link>
          .
        </p>
      ) : null}
    </>
  );
}
