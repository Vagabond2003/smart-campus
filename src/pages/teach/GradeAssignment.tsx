import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Navigate, useParams } from "react-router";
import { FileText } from "lucide-react";
import { useSaveGrades, useStoreVersion } from "../../api/hooks";
import { gradeState, submissionsFor } from "../../api/teach";
import { store } from "../../api/store";
import * as seed from "../../data/seed";
import { rollSuffix, TEACHER_ID } from "../../data/campus";
import type { Assignment } from "../../data/types";
import { fmt, plural, until } from "../../lib/format";
import { now } from "../../lib/clock";
import { cn } from "../../lib/cn";
import { useTitle } from "../../lib/useTitle";
import { Button } from "../../components/Button";
import { PageHeader, Signal, Tag } from "../../components/Data";
import { Dialog } from "../../components/Overlay";
import { ScrollX } from "../../components/ScrollRegion";
import { Segmented } from "../../components/Tabs";
import { useToast } from "../../components/Toast";
import { scoreError } from "./parts";

export default function GradeAssignment() {
  const { slug = "", id = "" } = useParams();
  useStoreVersion();
  const a = store.assignments.find((x) => x.id === id && x.authorId === TEACHER_ID);
  useTitle(a ? `${a.code} · ${a.title}` : "Assignment");
  if (!a || seed.offeringByCode[a.code].slug !== slug) return <Navigate to="/teach/courses" replace />;
  return <Grading key={a.id} a={a} />;
}

type Filter = "all" | "in" | "late" | "missing";

function Grading({ a }: { a: Assignment }) {
  const o = seed.offeringByCode[a.code];
  const subs = submissionsFor(a);
  const g = gradeState(a);
  const save = useSaveGrades();
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(subs.map((s) => [s.person.id, s.score != null ? String(s.score) : ""])));
  const [filter, setFilter] = useState<Filter>("all");
  const [confirm, setConfirm] = useState(false);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const published = g.state === "published";
  const open = a.due > now();

  const shown = subs.filter((s) => (filter === "all" ? true : filter === "in" ? !!s.at : filter === "late" ? s.late : !s.at));
  const entered = useMemo(() => Object.values(values).filter((v) => v.trim() !== "" && !scoreError(v, a.max)).length, [values, a.max]);
  const errors = Object.values(values).filter((v) => scoreError(v, a.max)).length;
  const dirty = subs.some((s) => (s.score != null ? String(s.score) : "") !== values[s.person.id]);

  const scores = () => Object.fromEntries(Object.entries(values).flatMap(([id, v]) => (v.trim() !== "" && !scoreError(v, a.max) ? [[id, Number(v)]] : [])));
  const run = (publish: boolean) =>
    save.mutate(
      { assignmentId: a.id, scores: scores(), publish },
      {
        onSuccess: () => {
          setConfirm(false);
          toast(
            publish
              ? { title: `Grades ${published ? "updated" : "published"} for ${a.code}`, description: a.assessment ? `They also fill the ${a.assessment} column in Assessments.` : undefined, celebrate: published ? "small" : "big" }
              : { title: "Draft saved", description: "Students see grades only when you publish." },
          );
        },
      },
    );

  const order = shown.map((s) => s.person.id);
  const onKey = (id: string) => (e: KeyboardEvent<HTMLInputElement>) => {
    const i = order.indexOf(id);
    const to = e.key === "Enter" || e.key === "ArrowDown" ? order[i + 1] : e.key === "ArrowUp" ? order[i - 1] : undefined;
    if (to == null) return;
    e.preventDefault();
    inputs.current[to]?.focus();
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: "My Courses", to: "/teach/courses" }, { label: a.code, to: `/teach/courses/${o.slug}/assignments` }, { label: a.title.replace(/^(Assignment \d+): .*/, "$1") }]}
        title={a.title}
        description={
          <>
            <span className="font-[620] text-ink">{a.code}</span> · Due {fmt.dayShort(a.due)}, {fmt.time(a.due)} · Out of {a.max}
            {a.assessment ? ` · fills ${a.assessment} in Assessments` : ""}
          </>
        }
        actions={published ? <Signal tone="ok">Grades published</Signal> : open ? <Signal tone="caution">Open · due {until(a.due)}</Signal> : <Signal tone="danger">Closed · to grade</Signal>}
      />

      <dl className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
        {[
          { k: "Handed in", v: `${g.submitted} of ${g.total}` },
          { k: "Late", v: g.late, tone: g.late ? "text-caution" : "" },
          { k: "Missing", v: g.total - g.submitted, tone: g.total - g.submitted ? "text-danger" : "" },
          { k: "Graded", v: `${entered} of ${g.submitted}` },
        ].map((x) => (
          <div key={x.k} className="bg-surface px-4 py-3">
            <dt className="caps text-ink-3">{x.k}</dt>
            <dd className={cn("num text-lg font-[680] text-ink", x.tone)}>{x.v}</dd>
          </div>
        ))}
      </dl>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Everyone" },
            { value: "in", label: "Handed in" },
            { value: "late", label: "Late" },
            { value: "missing", label: "Missing" },
          ]}
        />
        <p className="text-xs text-ink-3">Files are listed by name for now; opening them arrives with file sharing.</p>
      </div>

      <ScrollX label={`Submissions for ${a.title}`} className="panel">
        <table className="table [&_td]:px-3 [&_th]:px-3 sm:[&_td]:px-4 sm:[&_th]:px-4">
          <caption className="sr-only">Submissions and grades for {a.title}</caption>
          <thead>
            <tr>
              <th scope="col" className="w-14 sm:w-20">
                Roll
              </th>
              <th scope="col">Student</th>
              <th scope="col" className="hidden md:table-cell">
                Handed in
              </th>
              <th scope="col" className="hidden lg:table-cell">
                File
              </th>
              <th scope="col" className="n w-28 sm:w-36">
                Marks / {a.max}
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((s) => {
              const v = values[s.person.id] ?? "";
              const err = scoreError(v, a.max);
              const id = `grade-${s.person.id}`;
              return (
                <tr key={s.person.id}>
                  <td className="num font-[700] text-ink [font-stretch:84%]">{rollSuffix(s.person)}</td>
                  <th scope="row" className="font-normal">
                    <label htmlFor={id} className="text-ink">
                      {s.person.name}
                    </label>
                    {s.person.regType === "Retake" ? <Tag className="ml-2">Retake</Tag> : null}
                    {err ? <span className="ml-2 text-xs font-[560] text-danger">{err}</span> : null}
                    {/* narrow screens fold the hand-in time under the name */}
                    <span className="block text-xs text-ink-3 md:hidden">
                      {s.at ? `${fmt.short(s.at)}, ${fmt.time(s.at)}${s.late ? " · late" : ""}` : <span className="font-[600] text-danger">Not handed in</span>}
                    </span>
                  </th>
                  <td className="hidden whitespace-nowrap md:table-cell">
                    {s.at ? (
                      <span className="flex items-center gap-2">
                        <span className="num text-ink-2">
                          {fmt.short(s.at)}, {fmt.time(s.at)}
                        </span>
                        {s.late ? <Signal tone="caution">Late</Signal> : null}
                      </span>
                    ) : (
                      <Signal tone="danger">Not handed in</Signal>
                    )}
                  </td>
                  <td className="hidden max-w-[16rem] lg:table-cell">
                    {s.file ? (
                      <span className="flex items-center gap-2 text-ink-2">
                        <FileText size={15} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
                        <span className="truncate">{s.file}</span>
                        <span className="num shrink-0 text-xs text-ink-3">{s.size}</span>
                      </span>
                    ) : (
                      <span className="text-ink-3">—</span>
                    )}
                  </td>
                  <td className="n">
                    <input
                      ref={(el) => void (inputs.current[s.person.id] = el)}
                      id={id}
                      className="score-field"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={a.max}
                      step={0.5}
                      value={v}
                      aria-invalid={err ? true : undefined}
                      onChange={(e) => setValues((x) => ({ ...x, [s.person.id]: e.target.value }))}
                      onKeyDown={onKey(s.person.id)}
                      onFocus={(e) => e.currentTarget.select()}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollX>

      <div className="action-bar mt-6">
        <p className="text-sm text-ink-2" role="status">
          {errors ? <span className="font-[600] text-danger">{plural(errors, "grade needs", "grades need")} fixing</span> : published ? "Published. Corrections notify students again." : `${entered} of ${g.submitted} handed-in pieces graded`}
        </p>
        <div className="flex flex-wrap gap-2">
          {!published ? (
            <Button variant="secondary" disabled={save.isPending || !!errors || !dirty} onClick={() => run(false)}>
              Save draft
            </Button>
          ) : null}
          <Button disabled={save.isPending || !!errors || !entered || (published && !dirty)} onClick={() => setConfirm(true)}>
            {published ? "Publish corrections" : "Publish grades"}
          </Button>
        </div>
      </div>

      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        title={published ? "Publish corrected grades?" : `Publish grades for ${a.title.replace(/^(Assignment \d+): .*/, "$1")}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)} disabled={save.isPending}>
              Back
            </Button>
            <Button onClick={() => run(true)} disabled={save.isPending}>
              {save.isPending ? "Publishing…" : "Publish grades"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-[0.9375rem] text-ink">
          <p>
            Students see their grade on the assignment{a.assessment ? `, and it fills the ${a.assessment} column in their Assessments` : ""}. Each gets a notification.
          </p>
          <p className="text-sm text-ink-2">
            <span className="num font-[640] text-ink">{entered}</span> graded{g.submitted - entered > 0 ? `, ${plural(g.submitted - entered, "handed-in piece")} still ungraded` : ""}. Students without a grade are recorded as not graded.
          </p>
        </div>
      </Dialog>
    </>
  );
}
