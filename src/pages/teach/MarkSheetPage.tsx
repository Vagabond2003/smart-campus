import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link, Navigate, useParams } from "react-router";
import { CalendarClock } from "lucide-react";
import { useSaveMarks, useStoreVersion } from "../../api/hooks";
import { findAssessment, sheetRow, teacherAssignments } from "../../api/teach";
import * as seed from "../../data/seed";
import { roster, rollSuffix, teaches } from "../../data/campus";
import type { Assessment } from "../../data/types";
import { fmt, plural, until } from "../../lib/format";
import { useTitle } from "../../lib/useTitle";
import { Button } from "../../components/Button";
import { PageHeader, Tag } from "../../components/Data";
import { EmptyState } from "../../components/Feedback";
import { Dialog } from "../../components/Overlay";
import { ScrollX } from "../../components/ScrollRegion";
import { useToast } from "../../components/Toast";
import { scoreError, SheetSignal } from "./parts";

export default function MarkSheetPage() {
  const { slug = "", name = "" } = useParams();
  useStoreVersion();
  const o = seed.offeringBySlug[slug];
  const a = o ? findAssessment(o.code, decodeURIComponent(name)) : undefined;
  useTitle(a ? `${a.name} · ${a.code}` : "Marks");
  if (!o || !teaches(o.code)) return <Navigate to="/teach/courses" replace />;
  if (!a) return <Navigate to={`/teach/courses/${slug}/marks`} replace />;
  const linked = teacherAssignments(o.code).find((x) => x.assessment === a.name);
  if (linked) return <Navigate to={`/teach/courses/${slug}/assignments/${linked.id}`} replace />;
  return <Sheet key={`${a.code}-${a.name}`} a={a} />;
}

const parse = (v: string) => (v.trim() === "" ? null : Number(v));

function Sheet({ a }: { a: Assessment }) {
  const o = seed.offeringByCode[a.code];
  const row = sheetRow(a);
  const save = useSaveMarks();
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(roster.map((p) => [p.id, row.scores[p.id] != null ? String(row.scores[p.id]) : ""])));
  const [confirm, setConfirm] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const published = row.status === "published";

  const stats = useMemo(() => {
    const nums = roster.map((p) => parse(values[p.id])).filter((n): n is number => n != null && !Number.isNaN(n));
    const errors = roster.filter((p) => scoreError(values[p.id], a.max)).length;
    return {
      entered: nums.length,
      blank: roster.length - nums.length - errors,
      errors,
      average: nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : null,
      highest: nums.length ? Math.max(...nums) : null,
      lowest: nums.length ? Math.min(...nums) : null,
      below: nums.filter((n) => n < a.max / 2).length,
    };
  }, [values, a.max]);

  const dirty = roster.some((p) => (row.scores[p.id] != null ? String(row.scores[p.id]) : "") !== values[p.id]);

  if (row.status === "upcoming") {
    return (
      <>
        <PageHeader crumbs={[{ label: "My Courses", to: "/teach/courses" }, { label: a.code, to: `/teach/courses/${o.slug}/marks` }, { label: a.name }]} title={a.name} />
        <div className="panel">
          <EmptyState icon={<CalendarClock size={20} strokeWidth={1.75} />} title="Marks open after the test" action={<Button asChild variant="secondary"><Link to={`/teach/courses/${o.slug}/marks`}>Back to marks</Link></Button>}>
            {a.code} {a.name} is on {fmt.dayShort(a.date!)}, {until(a.date!)}. Its sheet opens here that day.
          </EmptyState>
        </div>
      </>
    );
  }

  const scores = () => Object.fromEntries(roster.flatMap((p) => (parse(values[p.id]) != null ? [[p.id, parse(values[p.id]) as number]] : [])));

  const run = (publish: boolean) =>
    save.mutate(
      { code: a.code, name: a.name, scores: scores(), publish },
      {
        onSuccess: () => {
          setConfirm(false);
          toast(
            publish
              ? { title: `${a.name} marks ${published ? "updated" : "published"} for ${a.code}`, description: `${roster.length} students can see them now${stats.blank ? `; ${plural(stats.blank, "blank entry", "blank entries")} recorded as absent` : ""}.` }
              : { title: "Draft saved", description: "Students don't see a draft. Publish when the sheet is complete." },
          );
        },
      },
    );

  const move = (i: number, d: 1 | -1) => inputs.current[i + d]?.focus();
  const onKey = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      move(i, 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(i, -1);
    }
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: "My Courses", to: "/teach/courses" }, { label: a.code, to: `/teach/courses/${o.slug}/marks` }, { label: a.name }]}
        title={a.name}
        description={
          <>
            <span className="font-[620] text-ink">{a.code}</span> {o.title} · Out of {a.max}
            {a.obe ? ` · OBE ${a.obe}` : ""}
            {a.date ? ` · Held ${fmt.dayShort(a.date)}` : ""}
          </>
        }
        actions={<SheetSignal status={row.status} date={a.date} />}
      />

      <dl className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-5 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
        {[
          { k: "Entered", v: `${stats.entered} of ${roster.length}` },
          { k: "Average", v: stats.average != null ? stats.average.toFixed(1) : "—" },
          { k: "Highest", v: stats.highest ?? "—" },
          { k: "Lowest", v: stats.lowest ?? "—" },
          { k: "Under half", v: stats.below, danger: stats.below > 0 },
        ].map((x) => (
          <div key={x.k} className="bg-surface px-4 py-3">
            <dt className="caps text-ink-3">{x.k}</dt>
            <dd className={`num text-lg font-[680] ${x.danger ? "text-danger" : "text-ink"}`}>{x.v}</dd>
          </div>
        ))}
      </dl>

      <p className="mb-3 text-sm text-ink-2">Enter moves to the next student. Leave a blank for anyone who missed it; blanks publish as absent.</p>

      <ScrollX label={`${a.name} marks for ${a.code}`} className="panel">
        <table className="table [&_td]:px-3 [&_th]:px-3 sm:[&_td]:px-4 sm:[&_th]:px-4">
          <caption className="sr-only">
            {a.name} marks for {a.code}, out of {a.max}, in roll order
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-14 sm:w-20">
                Roll
              </th>
              <th scope="col">Student</th>
              <th scope="col" className="n w-28 sm:w-36">
                Marks / {a.max}
              </th>
            </tr>
          </thead>
          <tbody>
            {roster.map((p, i) => {
              const err = scoreError(values[p.id], a.max);
              const id = `score-${p.id}`;
              return (
                <tr key={p.id}>
                  <td className="num font-[700] text-ink [font-stretch:84%]">{rollSuffix(p)}</td>
                  <th scope="row" className="font-normal">
                    <label htmlFor={id} className="text-ink">
                      {p.name}
                    </label>
                    {p.regType === "Retake" ? <Tag className="ml-2">Retake</Tag> : null}
                    {err ? (
                      <span id={`${id}-err`} className="ml-2 text-xs font-[560] text-danger">
                        {err}
                      </span>
                    ) : null}
                  </th>
                  <td className="n">
                    <input
                      ref={(el) => void (inputs.current[i] = el)}
                      id={id}
                      className="score-field"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={a.max}
                      step={0.5}
                      value={values[p.id]}
                      aria-invalid={err ? true : undefined}
                      aria-describedby={err ? `${id}-err` : undefined}
                      onChange={(e) => setValues((v) => ({ ...v, [p.id]: e.target.value }))}
                      onKeyDown={onKey(i)}
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
          {stats.errors ? (
            <span className="font-[600] text-danger">{plural(stats.errors, "entry needs", "entries need")} fixing</span>
          ) : published ? (
            row.publishedAt ? `Published ${fmt.dayShort(row.publishedAt)}, ${fmt.time(row.publishedAt)}. Corrections notify students again.` : "Published. Corrections notify students again."
          ) : (
            <>
              <span className="num font-[680] text-ink">{stats.entered}</span> of {roster.length} entered{row.status === "draft" && row.updatedAt ? ` · draft saved ${fmt.time(row.updatedAt)}` : ""}
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {!published ? (
            <Button variant="secondary" disabled={save.isPending || !!stats.errors || !dirty} onClick={() => run(false)}>
              Save draft
            </Button>
          ) : null}
          <Button disabled={save.isPending || !!stats.errors || !stats.entered || (published && !dirty)} onClick={() => setConfirm(true)}>
            {published ? "Publish corrections" : "Publish marks"}
          </Button>
        </div>
      </div>

      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        title={published ? `Publish corrections to ${a.name}?` : `Publish ${a.name} marks for ${a.code}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)} disabled={save.isPending}>
              Back
            </Button>
            <Button onClick={() => run(true)} disabled={save.isPending}>
              {save.isPending ? "Publishing…" : `Publish to ${roster.length} students`}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-[0.9375rem] text-ink">
          <p>Every student sees their own mark and the class highest at once, and gets a notification.</p>
          <ul className="flex flex-col gap-1.5 text-sm text-ink-2">
            <li>
              <span className="num font-[640] text-ink">{stats.entered}</span> marks entered · average <span className="num font-[640] text-ink">{stats.average?.toFixed(1) ?? "—"}</span> · highest <span className="num font-[640] text-ink">{stats.highest ?? "—"}</span>
            </li>
            {stats.blank ? <li className="text-danger">{plural(stats.blank, "blank entry", "blank entries")} will be recorded as absent.</li> : null}
          </ul>
          <p className="text-sm text-ink-2">Published marks can be corrected later, but not withdrawn.</p>
        </div>
      </Dialog>
    </>
  );
}
