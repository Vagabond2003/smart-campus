import { Mail, MapPin, Phone } from "lucide-react";
import { useResults, useStudent } from "../api/hooks";
import { useTitle } from "../lib/useTitle";
import { credits, gpa } from "../lib/format";
import { Avatar, KeyValues, PageHeader, Panel, Signal, Tag } from "../components/Data";
import { Bars, ErrorState, Reveal } from "../components/Feedback";

export default function Profile() {
  useTitle("My Profile");
  const { data, isLoading, isError, refetch } = useStudent();
  const { data: res } = useResults();
  if (isError) return <ErrorState what="your profile" onRetry={() => refetch()} />;
  const s = data?.student;
  const a = data?.advisor;

  return (
    <>
      <PageHeader title="My Profile" description="Your record as the registrar holds it. If anything is wrong, ask the exam office to correct it." />

      <Reveal loading={isLoading} skeleton={<Bars rows={6} />}>
        {s && a ? (
          <div className="flex flex-col gap-5">
            <section aria-label="Identity" className="panel flex flex-col gap-5 p-5 sm:flex-row sm:items-center lg:p-6">
              <Avatar name={s.name} you size="xl" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 className="text-xl font-[700] tracking-[-0.015em] text-ink">{s.name}</h2>
                  <Signal tone="ok">{s.status}</Signal>
                </div>
                <p className="num mt-0.5 text-[0.9375rem] text-ink-2">{s.id}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Tag>{s.program}</Tag>
                  <Tag>{s.levelTerm}</Tag>
                  <Tag>Section {s.section}</Tag>
                  <Tag>Batch {s.batch}</Tag>
                </div>
              </div>
              {res ? (
                <dl className="grid grid-cols-2 gap-x-8 gap-y-1 border-t border-line pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                  <dt className="text-sm text-ink-3">CGPA</dt>
                  <dt className="text-sm text-ink-3">Credits earned</dt>
                  <dd className="display-num text-xl text-ink">{gpa(res.standing.cgpa)}</dd>
                  <dd className="display-num text-xl text-ink">{credits(res.standing.earned)}</dd>
                </dl>
              ) : null}
            </section>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="flex min-w-0 flex-col gap-5">
                <Panel id="academic" title="Academic" bodyClassName="px-4 lg:px-5">
                  <KeyValues
                    columns={2}
                    items={[
                      { k: "Student ID", v: <span className="num">{s.id}</span> },
                      { k: "Registration no.", v: <span className="num">{s.registrationNo}</span> },
                      { k: "Program", v: s.programLong },
                      { k: "Department", v: s.department },
                      { k: "Syllabus", v: s.syllabus },
                      { k: "Level-Term", v: s.levelTerm },
                      { k: "Batch", v: s.batch },
                      { k: "Section", v: s.section },
                      { k: "Admitted in", v: s.admittedIn },
                      { k: "Track", v: s.track },
                    ]}
                  />
                </Panel>
                <Panel id="personal" title="Personal" bodyClassName="px-4 lg:px-5">
                  <KeyValues
                    columns={2}
                    items={[
                      { k: "Date of birth", v: <span className="num">{s.dob}</span> },
                      { k: "Gender", v: s.gender },
                      { k: "Father's name", v: s.father },
                      { k: "Mother's name", v: s.mother },
                      { k: "Mobile", v: <span className="num">{s.phone}</span> },
                      { k: "Email", v: <span className="break-all">{s.email}</span> },
                    ]}
                  />
                </Panel>
                <Panel id="funding" title="Quota and funding" bodyClassName="px-4 lg:px-5">
                  <KeyValues
                    columns={2}
                    items={[
                      { k: "Quota", v: s.quota },
                      { k: "Scholarship", v: s.scholarship },
                      { k: "Waiver", v: s.waiver },
                      { k: "Stipend", v: s.stipend },
                    ]}
                  />
                </Panel>
              </div>

              <Panel id="advisor" title="Advisor" className="self-start">
                <div className="flex items-center gap-3 px-4 pt-4 lg:px-5">
                  <Avatar name={a.name} size="lg" />
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-[640] text-ink">{a.name}</p>
                    <p className="text-sm text-ink-2">
                      {a.designation}, {a.department}
                    </p>
                  </div>
                </div>
                <ul className="flex flex-col gap-1 px-2 pb-3 pt-3 lg:px-3">
                  <li>
                    <a href={`tel:${a.phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-ink no-underline hover:bg-surface-2">
                      <Phone size={16} strokeWidth={1.75} className="text-ink-3" aria-hidden />
                      <span className="num">{a.phone}</span>
                    </a>
                  </li>
                  <li>
                    <a href={`mailto:${a.email}`} className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-ink no-underline hover:bg-surface-2">
                      <Mail size={16} strokeWidth={1.75} className="text-ink-3" aria-hidden />
                      <span className="break-all">{a.email}</span>
                    </a>
                  </li>
                  <li className="flex items-center gap-3 px-2 py-2 text-sm text-ink">
                    <MapPin size={16} strokeWidth={1.75} className="text-ink-3" aria-hidden />
                    {a.room}
                  </li>
                </ul>
                <p className="border-t border-line px-4 py-3 text-xs text-ink-3 lg:px-5">Your advisor approves course registration and can help with attendance or backlog planning.</p>
              </Panel>
            </div>
          </div>
        ) : null}
      </Reveal>
    </>
  );
}
