import { useState } from "react";
import { Link } from "react-router";
import { IdCard, Printer } from "lucide-react";
import { useAdmitCards, useStudent } from "../api/hooks";
import type { AdmitCard as Card } from "../data/types";
import { credits, fmt } from "../lib/format";
import { useTitle } from "../lib/useTitle";
import { Button } from "../components/Button";
import { Avatar, PageHeader, Signal } from "../components/Data";
import { Bars, EmptyState, ErrorState, Reveal } from "../components/Feedback";
import { DocFields, DocHead, DocTable } from "../components/Docs";
import { Select } from "../components/Select";

const statusTone = (s: Card["status"]) => (s === "Approved" ? "ok" : s === "Awaiting registration" ? "danger" : "neutral");

export default function AdmitCard() {
  useTitle("Admit Card");
  const { data, isLoading, isError, refetch } = useAdmitCards();
  const { data: st } = useStudent();
  const [exam, setExam] = useState<string | null>(null);
  if (isError) return <ErrorState what="admit cards" onRetry={() => refetch()} />;
  const card = data?.find((c) => c.exam === exam) ?? data?.find((c) => c.status === "Approved") ?? data?.[0];
  const s = st?.student;

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Admit Card"
          description="Bring a printed admit card and your ID card to every examination."
          actions={
            card?.status === "Approved" ? (
              <Button icon={<Printer size={16} strokeWidth={1.75} />} onClick={() => window.print()}>
                Print or save PDF
              </Button>
            ) : null
          }
        />
      </div>
      <Reveal loading={isLoading} skeleton={<Bars rows={6} />}>
        {data && card ? (
          <div className="flex flex-col gap-5">
            <div className="no-print grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-end">
              <Select label="Examination" value={card.exam} onValueChange={setExam} options={data.map((c) => ({ value: c.exam, label: c.exam, hint: c.status }))} />
              <div className="panel flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <Signal tone={statusTone(card.status)}>{card.status}</Signal>
                <span className="text-sm text-ink-2">
                  {card.status === "Approved"
                    ? `Issued ${card.issuedOn ? fmt.long(card.issuedOn) : ""}${card.lastDownloaded ? ` · last downloaded ${fmt.long(card.lastDownloaded)}, ${fmt.time(card.lastDownloaded)}` : ""}`
                    : card.note}
                </span>
                {card.status === "Awaiting registration" ? (
                  <Button asChild size="sm" variant="danger" className="ml-auto">
                    <Link to="/registration/rib">Register RIB courses</Link>
                  </Button>
                ) : null}
              </div>
            </div>

            {card.status === "Approved" && s ? (
              <article className="doc doc-print-area mx-auto w-full max-w-3xl p-5 sm:p-8" aria-label={`Admit card, ${card.exam}`}>
                <DocHead
                  title="Admit card"
                  subtitle={card.exam}
                  right={
                    <div className="hidden w-24 shrink-0 flex-col items-center gap-1 sm:flex">
                      <Avatar name={s.name} you size="xl" className="rounded-md" />
                      <span className="text-center text-2xs text-[var(--doc-ink-2)]">Photo on file</span>
                    </div>
                  }
                />
                <p className="mt-4 text-sm font-[600] text-[var(--doc-ink)]">
                  {s.department} · {s.programLong}
                </p>
                <DocFields
                  className="mt-4"
                  items={[
                    { k: "Student name", v: s.name },
                    { k: "Student ID", v: <span className="num">{s.id}</span> },
                    { k: "Batch", v: s.batch },
                    { k: "Syllabus year", v: s.syllabus.split(" - ")[1] },
                    { k: "Level-Term", v: s.levelTerm },
                    { k: "Section", v: s.section },
                  ]}
                />
                <h3 className="mt-6 text-sm font-[700] uppercase tracking-[0.06em] text-[var(--doc-ink)] [font-stretch:82%]">Registered courses</h3>
                <div className="mt-2">
                  <DocTable
                    colClass={[undefined, undefined, "max-sm:hidden", "max-sm:hidden", "max-sm:hidden", undefined]}
                    head={["SL", "Course", "Title", "Type", "Registration", <span className="block text-right">Credit</span>]}
                    rows={card.courses.map((c, i) => [
                      <span className="num">{i + 1}</span>,
                      <span>
                        <span className="whitespace-nowrap font-[650]">{c.code}</span>
                        <span className="block text-xs sm:hidden">{c.title}</span>
                        <span className="block text-xs text-[var(--doc-ink-2)] sm:hidden">
                          {c.type} · {c.regType}
                        </span>
                      </span>,
                      c.title,
                      c.type,
                      c.regType,
                      <span className="num block text-right">{credits(c.credit)}</span>,
                    ])}
                    foot={["", "Total credits", "", "", "", <span className="num block text-right">{credits(card.courses.reduce((x, c) => x + c.credit, 0))}</span>]}
                  />
                </div>
                <ul className="mt-5 list-disc pl-5 text-xs text-[var(--doc-ink-2)]">
                  <li>Be seated 15 minutes before the exam starts. Phones and smart watches stay outside the hall.</li>
                  <li>Check your room and seat in Exam Routine before each exam.</li>
                </ul>
                <div className="mt-10 grid grid-cols-2 gap-10 text-center text-xs text-[var(--doc-ink-2)]">
                  <p className="border-t border-[var(--doc-line)] pt-1.5">Student's signature</p>
                  <p className="border-t border-[var(--doc-line)] pt-1.5">Controller of Examinations</p>
                </div>
              </article>
            ) : (
              <div className="panel">
                <EmptyState icon={<IdCard size={20} strokeWidth={1.75} />} title={card.status === "Awaiting registration" ? "Register to get this admit card" : "Not issued yet"}>
                  {card.note}
                  {card.courses.length ? <span className="mt-2 block">It will list {card.courses.length} courses: {card.courses.map((c) => c.code).join(", ")}.</span> : null}
                </EmptyState>
              </div>
            )}
          </div>
        ) : null}
      </Reveal>
    </>
  );
}
