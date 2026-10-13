import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Inbox, Search } from "lucide-react";
import { useSection } from "../../api/hooks";
import type { AdviseeStatus } from "../../api/teach";
import * as seed from "../../data/seed";
import { ME, rollSuffix, SECTION_LABEL } from "../../data/campus";
import { cn } from "../../lib/cn";
import { pct, plural } from "../../lib/format";
import { useTitle } from "../../lib/useTitle";
import { useIsPhone } from "../../lib/useMediaQuery";
import { PageHeader, Tag } from "../../components/Data";
import { Bars, EmptyState, Reveal } from "../../components/Feedback";
import { ScrollX } from "../../components/ScrollRegion";
import { Segmented } from "../../components/Tabs";
import { RibSignal } from "./advising-parts";

type Filter = "all" | "under" | "rib" | "waiting";

export default function Advising() {
  useTitle(`Section ${SECTION_LABEL}`);
  const { data, isLoading } = useSection();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const phone = useIsPhone();
  const list = useMemo(() => data?.advisees ?? [], [data]);
  const counts = {
    under: list.filter((a) => a.under.length).length,
    rib: list.filter((a) => a.record.carries.length).length,
    waiting: list.filter((a) => a.waiting).length,
  };
  const rows = list.filter((a) => {
    const s = q.trim().toLowerCase();
    if (s && !a.record.person.name.toLowerCase().includes(s) && !a.record.person.roll.includes(s)) return false;
    return filter === "all" || (filter === "under" ? a.under.length > 0 : filter === "rib" ? a.record.carries.length > 0 : a.waiting);
  });

  return (
    <>
      <PageHeader
        title={`Section ${SECTION_LABEL}`}
        description={`${seed.student.batch} batch, Section ${seed.student.section} · ${seed.student.program} · ${seed.student.levelTerm} · ${plural(list.length || 45, "advisee")}. Attendance is across all six courses this term.`}
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        {/* the four filters outgrow a phone: they scroll in their own strip rather than widening the page */}
        <div className="scroll-x -mx-4 min-w-0 px-4 sm:mx-0 sm:px-0">
          <Segmented
            label="Show"
            value={filter}
            onChange={setFilter}
            className="w-max"
            options={[
              { value: "all", label: "Everyone" },
              { value: "under", label: `Under the line ${data ? counts.under : ""}`.trim() },
              { value: "rib", label: `RIB courses ${data ? counts.rib : ""}`.trim() },
              { value: "waiting", label: `Waiting on you ${data ? counts.waiting : ""}`.trim() },
            ]}
          />
        </div>
        <div className="lg:w-80">
          <label htmlFor="adv-q" className="field-label">
            Find an advisee
          </label>
          <div className="field h-10">
            <Search size={16} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
            <input id="adv-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or roll" autoComplete="off" />
          </div>
        </div>
      </div>
      <Reveal loading={isLoading} skeleton={<Bars rows={10} />}>
        {rows.length && phone ? (
          <ul className="panel divide-y divide-line" aria-label={`Advisees in Section ${SECTION_LABEL}, in roll order`}>
            {rows.map((a) => (
              <AdviseeListRow key={a.record.person.id} a={a} />
            ))}
          </ul>
        ) : rows.length ? (
          <ScrollX label={`Advisees in Section ${SECTION_LABEL}`} className="panel">
            <table className="table min-w-[52rem]">
              <caption className="sr-only">Advisees in roll order, with their lowest course attendance and RIB courses</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-20">
                    Roll
                  </th>
                  <th scope="col">Student</th>
                  <th scope="col">Lowest attendance</th>
                  <th scope="col">RIB courses</th>
                  <th scope="col">Registration</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <AdviseeRow key={a.record.person.id} a={a} />
                ))}
              </tbody>
            </table>
          </ScrollX>
        ) : (
          <div className="panel">
            <EmptyState scene="search" title="No advisee by that name or roll">
              Try another filter, part of a name or the last digits of a roll.
            </EmptyState>
          </div>
        )}
      </Reveal>
    </>
  );
}

/** An advisee on a phone: who, their lowest attendance, what they carry and where it stands, stacked. */
function AdviseeListRow({ a }: { a: AdviseeStatus }) {
  const p = a.record.person;
  const w = a.worst;
  const tone = w.standing === "below" ? "text-danger" : w.standing === "watch" ? "text-caution" : "text-ink";
  return (
    <li className="px-4 py-3">
      <Link to={`/teach/students/${p.id}`} className="flex items-baseline gap-2 no-underline">
        <span className="num w-9 shrink-0 font-[700] text-ink-2 [font-stretch:84%]">{rollSuffix(p)}</span>
        <span className="min-w-0 flex-1 font-[620] text-ink">
          {p.name}
          {p.id === ME ? <span className="ml-2 text-xs font-normal text-ink-3">sample student</span> : null}
        </span>
        {p.regType === "Retake" ? <Tag>Retake</Tag> : null}
      </Link>
      <p className="mt-1 pl-11 text-sm text-ink-2">
        Lowest <span className={cn("num font-[640]", tone)}>{pct(w.pct, 1)}</span> in {w.code}
        {a.under.length > 1 ? <span className="text-danger"> · {a.under.length} courses under the line</span> : null}
      </p>
      {a.record.carries.length ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-11">
          {a.record.carries.map((c) => (
            <Tag key={c.code} className={cn("whitespace-nowrap", c.regType === "Improvement" ? "" : "border-danger-line text-danger")}>
              {c.code} · {c.regType}
            </Tag>
          ))}
          <RibSignal a={a} />
        </div>
      ) : null}
    </li>
  );
}

function AdviseeRow({ a }: { a: AdviseeStatus }) {
  const p = a.record.person;
  const w = a.worst;
  const tone = w.standing === "below" ? "text-danger" : w.standing === "watch" ? "text-caution" : "text-ink";
  return (
    <tr>
      <td className="num font-[700] text-ink [font-stretch:84%]">{rollSuffix(p)}</td>
      <th scope="row" className="font-normal">
        <Link to={`/teach/students/${p.id}`} className="font-[620] text-ink no-underline hover:underline">
          {p.name}
        </Link>
        {p.regType === "Retake" ? <Tag className="ml-2">Retake</Tag> : null}
        {p.id === ME ? <span className="ml-2 text-xs text-ink-3">sample student</span> : null}
      </th>
      <td>
        <span className={cn("num font-[640]", tone)}>{pct(w.pct, 1)}</span> <span className="text-ink-2">{w.code}</span>
        {a.under.length > 1 ? <span className="block text-xs text-danger">{a.under.length} courses under the line</span> : null}
      </td>
      <td>
        {a.record.carries.length ? (
          <span className="flex flex-wrap gap-1.5">
            {a.record.carries.map((c) => (
              <Tag key={c.code} className={c.regType === "Improvement" ? "" : "border-danger-line text-danger"}>
                {c.code} · {c.regType}
              </Tag>
            ))}
          </span>
        ) : (
          <span className="text-ink-3">None</span>
        )}
      </td>
      <td>
        {a.record.carries.length ? (
          <span className="flex items-center gap-2">
            <RibSignal a={a} />
            {a.waiting ? <Inbox size={14} strokeWidth={2} className="text-ink-2" aria-label="Waiting for you" /> : null}
          </span>
        ) : (
          <span className="text-ink-3" aria-label="Not needed">
            —
          </span>
        )}
      </td>
    </tr>
  );
}
