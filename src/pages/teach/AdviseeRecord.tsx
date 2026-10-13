import { Link, Navigate, useParams } from "react-router";
import { Eye } from "lucide-react";
import { useSection, useStoreVersion } from "../../api/hooks";
import { sheetOf } from "../../api/records";
import { standing } from "../../api/derive";
import * as seed from "../../data/seed";
import { ME, personById, SECTION_LABEL } from "../../data/campus";
import { cn } from "../../lib/cn";
import { credits, gpa, pct } from "../../lib/format";
import { useTitle } from "../../lib/useTitle";
import { Button } from "../../components/Button";
import { Meter, PageHeader, Panel, Signal, Tag } from "../../components/Data";
import { Bars, Reveal } from "../../components/Feedback";
import { ScrollX } from "../../components/ScrollRegion";
import { ApprovalRow, RemindRow, RibSignal } from "./advising-parts";

export default function AdviseeRecord() {
  const { id = "" } = useParams();
  const p = personById[id];
  useTitle(p ? p.name : "Advisee");
  useStoreVersion();
  const { data, isLoading } = useSection();
  if (!p) return <Navigate to="/teach/advising" replace />;
  const a = data?.advisees.find((x) => x.record.person.id === id);
  const att = data?.attendance.byPerson[id] ?? [];
  const isMe = id === ME;

  return (
    <>
      <PageHeader
        crumbs={[{ label: `Section ${SECTION_LABEL}`, to: "/teach/advising" }, { label: p.name }]}
        title={p.name}
        description={
          <>
            Roll <span className="num font-[620] text-ink">{p.roll}</span> · {seed.student.batch} batch, Section {seed.student.section} · {seed.student.levelTerm}
            {p.regType === "Retake" ? " · repeating the term" : ""}
          </>
        }
        actions={
          isMe ? (
            <Button asChild variant="secondary" icon={<Eye size={16} strokeWidth={1.75} />}>
              <Link to="/dashboard">See their portal</Link>
            </Button>
          ) : null
        }
      />
      <Reveal loading={isLoading} skeleton={<Bars rows={8} />}>
        {a ? (
          <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
            <Panel id="att" title="Attendance this term">
              <ScrollX label={`${p.name}'s attendance by course`}>
                <table className="table [&_td]:px-3 [&_th]:px-3 sm:[&_td]:px-4 sm:[&_th]:px-4">
                  <thead>
                    <tr>
                      <th scope="col">Course</th>
                      <th scope="col" className="n hidden sm:table-cell">
                        Present
                      </th>
                      <th scope="col" className="w-36 sm:w-52">
                        Attendance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {att.map((r) => {
                      const tone = r.standing === "below" ? "danger" : r.standing === "watch" ? "caution" : "ok";
                      return (
                        <tr key={r.code}>
                          <th scope="row" className="font-normal">
                            <span className="font-[700] text-ink [font-stretch:88%]">{r.code}</span>
                            <span className="block text-xs text-ink-3">{seed.offeringByCode[r.code].title}</span>
                          </th>
                          <td className="n hidden text-ink-2 sm:table-cell">
                            {r.present}/{r.total}
                          </td>
                          <td>
                            <span className="flex items-center gap-3">
                              <Meter value={r.pct} max={100} line={seed.ATTENDANCE_LINE} tone={tone} label={`${r.code} ${pct(r.pct, 1)}`} className="flex-1" />
                              <span className={cn("num w-14 text-right font-[640]", tone === "danger" ? "text-danger" : tone === "caution" ? "text-caution" : "text-ink")}>{pct(r.pct, 1)}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollX>
              {a.under.length ? (
                <p className="border-t border-danger-line bg-danger-wash/45 px-4 py-3 text-sm text-ink lg:px-5">
                  <span className="font-[640] text-danger">Under the {seed.ATTENDANCE_LINE}% line in {a.under.map((r) => r.code).join(" and ")}.</span> Low attendance can affect eligibility for the final examination.
                </p>
              ) : null}
            </Panel>

            <div className="flex flex-col gap-5">
              <Panel id="rib" title="RIB and backlog" tone={a.mark === "danger" && a.record.carries.length ? "danger" : undefined}>
                {a.record.carries.length ? (
                  <>
                    <ul className="border-b border-line">
                      {a.record.carries.map((c) => (
                        <li key={c.code} className="flex items-center gap-3 border-b border-line px-4 py-2.5 text-sm last:border-b-0 lg:px-5">
                          <span className="min-w-0 flex-1">
                            <span className="font-[700] text-ink [font-stretch:88%]">{c.code}</span> <span className="text-ink-2">{c.title}</span>
                          </span>
                          <Tag className={c.regType === "Improvement" ? "" : "border-danger-line text-danger"}>{c.regType}</Tag>
                          <span className="num text-xs text-ink-3">{credits(c.credit)} cr</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-3 px-4 py-3 lg:px-5">
                      <span className="text-sm text-ink-2">{seed.ribOffer.exam}</span>
                      <RibSignal a={a} />
                    </div>
                    {a.rib.note ? <p className="px-4 pb-3 text-sm text-ink-2 lg:px-5">Your note: “{a.rib.note}”</p> : null}
                    {a.rib.state === "submitted" ? (
                      <ul className="border-t border-line">
                        <ApprovalRow a={a} compact />
                      </ul>
                    ) : a.rib.state === "none" || a.rib.state === "returned" ? (
                      <ul className="border-t border-line">
                        <RemindRow a={a} compact />
                      </ul>
                    ) : null}
                  </>
                ) : (
                  <p className="flex items-center gap-3 px-4 py-4 text-sm text-ink-2 lg:px-5">
                    <Signal tone="ok">Clear</Signal> No referred or backlog courses.
                  </p>
                )}
              </Panel>

              <Panel id="marks" title="Published marks">
                <ul>
                  {seed.offerings.map((o) => {
                    const done = seed.assessments.filter((x) => x.code === o.code).map((x) => ({ x, sheet: sheetOf(x.code, x.name) })).filter((s) => s.sheet.state === "published");
                    return (
                      <li key={o.code} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line px-4 py-2.5 last:border-b-0 lg:px-5">
                        <span className="w-20 shrink-0 text-sm font-[700] text-ink [font-stretch:88%]">{o.code}</span>
                        {done.length ? (
                          <span className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink-2">
                            {done.map(({ x, sheet }) => {
                              const v = sheet.scores[id];
                              return (
                                <span key={x.name}>
                                  {x.name}{" "}
                                  {v != null ? (
                                    <span className={cn("num font-[640]", v < x.max / 2 ? "text-danger" : "text-ink")}>
                                      {v}/{x.max}
                                    </span>
                                  ) : (
                                    <span className="font-[600] text-danger">absent</span>
                                  )}
                                </span>
                              );
                            })}
                          </span>
                        ) : (
                          <span className="text-sm text-ink-3">Nothing published yet</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Panel>

              {isMe ? <ResultsPanel /> : null}
            </div>
          </div>
        ) : null}
      </Reveal>
    </>
  );
}

function ResultsPanel() {
  const s = standing();
  return (
    <Panel id="results" title="Results">
      <ul>
        {s.terms.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-sm lg:px-5">
            <span className="min-w-0 text-ink">{t.kind === "rib" ? t.exam : t.levelTerm}</span>
            <span className={cn("num font-[640]", t.gpa === 0 ? "text-danger" : "text-ink")}>GPA {gpa(t.gpa)}</span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 bg-surface-2 px-4 py-3 text-sm font-[640] lg:px-5">
          <span>CGPA</span>
          <span className="num text-md">{gpa(s.cgpa)}</span>
        </li>
      </ul>
    </Panel>
  );
}
