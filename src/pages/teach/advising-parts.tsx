/** The advisor's rows: an RIB registration to approve or return, an advisee to remind. */
import { useState } from "react";
import { Link } from "react-router";
import { BellRing } from "lucide-react";
import { useDecideRegistration, useRemind } from "../../api/hooks";
import type { AdviseeStatus } from "../../api/teach";
import * as seed from "../../data/seed";
import { ME, rollSuffix } from "../../data/campus";
import { ago, pct } from "../../lib/format";
import { Button } from "../../components/Button";
import { Avatar, Signal, Tag } from "../../components/Data";
import { useToast } from "../../components/Toast";
import { firstName } from "./parts";

/** Why an advisee is marked, in the words the grid's label reads out. */
export function reasons(a: AdviseeStatus) {
  const out: string[] = [];
  for (const r of a.under) out.push(`${r.code} attendance ${pct(r.pct)}, under the line`);
  for (const r of a.watch) out.push(`${r.code} attendance ${pct(r.pct)}, close to the line`);
  const unreg = a.record.carries.filter((c) => c.regType !== "Improvement");
  if (unreg.length && (a.rib.state === "none" || a.rib.state === "returned")) out.push(`${unreg.map((c) => c.code).join(", ")} not registered for RIB`);
  else if (a.record.carries.length) out.push(`carries ${a.record.carries.map((c) => `${c.code} (${c.regType})`).join(", ")}`);
  if (a.waiting) out.push("RIB registration waiting for you");
  return out;
}

/** The same reasons, short enough to sit under a name in a phone row. */
export function brief(a: AdviseeStatus) {
  const out: string[] = [];
  if (a.under.length) out.push(`Under ${seed.ATTENDANCE_LINE}%: ${a.under.map((r) => `${r.code} ${pct(r.pct)}`).join(", ")}`);
  if (a.watch.length) out.push(`Close: ${a.watch.map((r) => `${r.code} ${pct(r.pct)}`).join(", ")}`);
  const unreg = a.record.carries.filter((c) => c.regType !== "Improvement");
  if (unreg.length && (a.rib.state === "none" || a.rib.state === "returned")) out.push(`RIB not registered: ${unreg.map((c) => c.code).join(", ")}`);
  else if (a.record.carries.length) out.push(`RIB ${a.rib.state === "approved" ? "approved" : a.rib.state === "submitted" ? "registered" : "course"}: ${a.record.carries.map((c) => c.code).join(", ")}`);
  return out.join(" · ");
}

export function ApprovalRow({ a, compact }: { a: AdviseeStatus; compact?: boolean }) {
  const decide = useDecideRegistration();
  const toast = useToast();
  const [returning, setReturning] = useState(false);
  const [note, setNote] = useState("");
  const p = a.record.person;
  const run = (decision: "approved" | "returned") =>
    decide.mutate(
      { personId: p.id, decision, note: decision === "returned" ? note : undefined },
      {
        onSuccess: () => {
          setReturning(false);
          toast({ title: decision === "approved" ? `Approved ${p.name}` : `Returned to ${p.name}`, description: p.id === ME ? "It shows on their RIB Course Registration page now." : undefined });
        },
      },
    );
  return (
    <li className="border-b border-line px-4 py-3 last:border-b-0 lg:px-5">
      <div className="flex items-start gap-3">
        <Avatar name={p.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <Link to={`/teach/students/${p.id}`} className="font-[640] text-ink no-underline hover:underline">
              {p.name}
            </Link>{" "}
            <span className="num text-xs text-ink-3">{rollSuffix(p)}</span>
          </p>
          <p className="mt-1 flex flex-wrap gap-1.5">
            {a.rib.courses.map((code) => {
              const c = a.record.carries.find((x) => x.code === code) ?? (p.id === ME ? seed.ribOffer.courses.find((x) => x.code === code) : undefined);
              return (
                <Tag key={code} className="whitespace-nowrap">
                  <span className="font-[680] text-ink [font-stretch:88%]">{code}</span>
                  {c ? <span className="ml-1">{c.regType}</span> : null}
                </Tag>
              );
            })}
          </p>
          {!compact && a.rib.at ? <p className="mt-1 text-xs text-ink-3">Submitted {ago(a.rib.at)}</p> : null}
        </div>
      </div>
      {!returning ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5 pl-12">
          <Button size="sm" disabled={decide.isPending} onClick={() => run("approved")}>
            Approve
          </Button>
          <Button size="sm" variant="secondary" disabled={decide.isPending} onClick={() => setReturning(true)}>
            Return
          </Button>
        </div>
      ) : null}
      {returning ? (
        <form
          className="mt-3 flex flex-col gap-2 pl-12"
          onSubmit={(e) => {
            e.preventDefault();
            run("returned");
          }}
        >
          <label htmlFor={`note-${p.id}`} className="field-label mb-0">
            What should {firstName(p.name)} change?
          </label>
          <textarea id={`note-${p.id}`} className="field-area min-h-20" value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example: add PHY 1131 to improve your grade." maxLength={400} />
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant="danger" disabled={!note.trim() || decide.isPending}>
              Return with note
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setReturning(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </li>
  );
}

/** An advisee who owes a RIB registration. `compact` drops the name, for use on their own record. */
export function RemindRow({ a, compact }: { a: AdviseeStatus; compact?: boolean }) {
  const remindIt = useRemind();
  const toast = useToast();
  const p = a.record.person;
  const owed = a.record.carries.filter((c) => c.regType !== "Improvement");
  return (
    <li className="flex items-center gap-3 px-4 py-2.5 lg:px-5">
      {compact ? (
        <p className="min-w-0 flex-1 text-sm text-ink-2">{a.rib.state === "returned" ? "Returned and not resubmitted yet." : `${owed.map((c) => c.code).join(", ")} isn't registered yet.`}</p>
      ) : (
        <div className="min-w-0 flex-1 text-sm">
          <Link to={`/teach/students/${p.id}`} className="font-[620] text-ink no-underline hover:underline">
            {p.name}
          </Link>{" "}
          <span className="num text-xs text-ink-3">{rollSuffix(p)}</span>
          <span className="block text-xs text-danger">
            {owed.map((c) => `${c.code} ${c.regType.toLowerCase()}`).join(", ")}
            {a.rib.state === "returned" ? " · returned, not resubmitted" : ""}
          </span>
        </div>
      )}
      {a.reminded ? (
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-[600] text-ink-2">
          <BellRing size={14} strokeWidth={1.75} aria-hidden />
          Reminded
        </span>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          disabled={remindIt.isPending}
          onClick={() => remindIt.mutate(p.id, { onSuccess: () => toast({ title: `Reminder sent to ${p.name}`, description: p.id === ME ? "It's in their notifications now." : undefined }) })}
        >
          Remind
        </Button>
      )}
    </li>
  );
}


/** Where an advisee's RIB registration stands, as a signal. */
export function RibSignal({ a }: { a: AdviseeStatus }) {
  const owes = a.record.carries.some((c) => c.regType !== "Improvement");
  switch (a.rib.state) {
    case "approved":
      return <Signal tone="ok">Approved</Signal>;
    case "submitted":
      return <Signal tone="caution">Waiting for you</Signal>;
    case "returned":
      return <Signal tone="danger">Returned</Signal>;
    default:
      return owes ? <Signal tone="danger">Not registered</Signal> : <Signal tone="neutral" dot={false}>Optional</Signal>;
  }
}
