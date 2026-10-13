import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ClipboardCheck, Search, Undo2 } from "lucide-react";
import { useSaveRoll, useStoreVersion } from "../../api/hooks";
import { roomShort } from "../../api/derive";
import { meetingByKey } from "../../api/teach";
import * as seed from "../../data/seed";
import { roster, rollSuffix, teaches } from "../../data/campus";
import { now, startOfDay } from "../../lib/clock";
import { fmt, plural, until } from "../../lib/format";
import { useTitle } from "../../lib/useTitle";
import { useIsPhone } from "../../lib/useMediaQuery";
import { Button } from "../../components/Button";
import { PageHeader, Signal } from "../../components/Data";
import { EmptyState } from "../../components/Feedback";
import { Segmented } from "../../components/Tabs";
import { useToast } from "../../components/Toast";
import { RosterToggle } from "./parts";

type Mode = "absent" | "late";

export default function TakeRoll() {
  const { key = "" } = useParams();
  useStoreVersion();
  const m = meetingByKey(key);
  useTitle(m ? `Roll · ${m.session.code}` : "Roll");
  if (!m || !teaches(m.session.code)) return <Navigate to="/teach/courses" replace />;
  // Remount per meeting, so each roll starts from its own saved state.
  return <RollSheet key={key} meetingKey={key} />;
}

function RollSheet({ meetingKey }: { meetingKey: string }) {
  const m = meetingByKey(meetingKey)!;
  const s = m.session;
  const o = seed.offeringByCode[s.code];
  const save = useSaveRoll();
  const toast = useToast();
  const nav = useNavigate();
  const [absent, setAbsent] = useState<Set<string>>(() => new Set(m.roll?.absent ?? []));
  const [late, setLate] = useState<Set<string>>(() => new Set(m.roll?.late ?? []));
  const [mode, setMode] = useState<Mode>("absent");
  const [q, setQ] = useState("");
  const [reason, setReason] = useState("");
  const phone = useIsPhone();
  const at = now();
  const editing = !!m.roll;
  const needsReason = editing && s.start < startOfDay(at);
  const same = (a: Set<string>, b: string[] = []) => a.size === b.length && b.every((x) => a.has(x));
  const changed = !same(absent, m.roll?.absent) || !same(late, m.roll?.late);

  if (s.start > at) {
    return (
      <>
        <PageHeader crumbs={[{ label: "My Courses", to: "/teach/courses" }, { label: s.code, to: `/teach/courses/${o.slug}/roll` }, { label: "Roll" }]} title="Take roll" />
        <div className="panel">
          <EmptyState icon={<ClipboardCheck size={20} strokeWidth={1.75} />} title="This class hasn't started" action={<Button asChild variant="secondary"><Link to={`/teach/courses/${o.slug}/roll`}>Back to the roll register</Link></Button>}>
            The roll for {s.code} on {fmt.dayShort(s.start)} opens at {fmt.time(s.start)}, {until(s.start)}.
          </EmptyState>
        </div>
      </>
    );
  }

  const toggle = (id: string) => {
    if (mode === "absent") {
      setAbsent((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      setLate((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      setLate((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      setAbsent((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const needle = q.trim().toLowerCase();
  const matches = (name: string, roll: string) => !needle || name.toLowerCase().includes(needle) || roll.endsWith(needle) || roll.slice(-3).includes(needle);
  const present = roster.length - absent.size;
  // Phones take the roll down a list, one student per row; a search narrows the list rather than dimming the grid.
  const listed = phone ? roster.filter((p) => matches(p.name, p.roll)) : roster;

  const onSave = () => {
    if (needsReason && !reason.trim()) return;
    save.mutate(
      { key: meetingKey, absent: [...absent], late: [...late], reason: needsReason ? reason.trim() : undefined },
      {
        onSuccess: () => {
          toast({ title: `Roll ${editing ? "updated" : "saved"} for ${s.code}`, description: `${present} of ${roster.length} present${absent.size ? `, ${plural(absent.size, "absence")}` : ""}${late.size ? `, ${late.size} late` : ""}.` });
          nav(`/teach/courses/${o.slug}/roll`);
        },
      },
    );
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: "My Courses", to: "/teach/courses" }, { label: s.code, to: `/teach/courses/${o.slug}/roll` }, { label: "Roll" }]}
        title={editing ? "Edit roll" : "Take roll"}
        description={
          <>
            <span className="font-[620] text-ink">{s.code}</span> {o.title} · {fmt.full(s.start)} · Period {s.period}, {fmt.time(s.start)}–{fmt.time(s.end)} · {s.span > 1 ? s.room : `Room ${roomShort(s.room)}`}
          </>
        }
        actions={m.live ? <Signal tone="now">In progress · ends {until(s.end)}</Signal> : editing ? <Signal tone="ok">{m.roll?.source === "taken" ? `Taken ${fmt.time(m.roll.takenAt ?? s.start)}` : "Recorded"}</Signal> : <Signal tone="danger">Not taken yet</Signal>}
      />

      <p className="mb-4 max-w-[68ch] text-[0.9375rem] text-ink-2">Everyone starts present. Tap the students who are absent; switch to Late for anyone who came in after the roll.</p>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="field-label mb-0" aria-hidden>
            Tap marks as
          </span>
          <Segmented
            label="Tap marks as"
            value={mode}
            onChange={setMode}
            options={[
              { value: "absent", label: "Absent" },
              { value: "late", label: "Late" },
            ]}
          />
        </div>
        <div className="sm:w-72">
          <label htmlFor="roll-q" className="field-label">
            Find a roll or name
          </label>
          <div className="field h-10">
            <Search size={16} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
            <input id="roll-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. 042" inputMode="search" autoComplete="off" />
          </div>
        </div>
      </div>

      {listed.length ? (
        <ul className={phone ? "roster-list panel overflow-hidden" : "roster-grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))]"} aria-label={`Class list for ${s.code}, in roll order`}>
          {listed.map((p) => {
            const state = absent.has(p.id) ? "absent" : late.has(p.id) ? "late" : "present";
            return (
              <li key={p.id} className={phone ? undefined : "contents"}>
                <RosterToggle
                  person={p}
                  state={state}
                  match={matches(p.name, p.roll)}
                  row={phone}
                  label={`Roll ${rollSuffix(p)}, ${p.name}${p.regType === "Retake" ? ", retake" : ""}: ${state}`}
                  onToggle={() => toggle(p.id)}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="panel px-4 py-6 text-sm text-ink-2">No student matches “{q.trim()}”. Try the last digits of a roll or part of a name.</p>
      )}

      {needsReason ? (
        <div className="mt-5 max-w-xl">
          <label htmlFor="roll-reason" className="field-label">
            Reason for changing a past roll
          </label>
          <textarea id="roll-reason" className="field-area min-h-20" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="For example: medical certificate submitted for this date." maxLength={200} />
          <p className="mt-1.5 text-xs text-ink-3">Kept with the roll, so the change can be traced.</p>
        </div>
      ) : null}

      <div className="action-bar mt-6">
        <p className="text-sm text-ink-2" role="status">
          <span className="num font-[680] text-ink">{present}</span> present · <span className={absent.size ? "num font-[680] text-danger" : "num"}>{absent.size}</span> absent · <span className="num">{late.size}</span> late
        </p>
        <div className="flex flex-wrap gap-2">
          {absent.size || late.size ? (
            <Button
              variant="ghost"
              icon={<Undo2 size={16} strokeWidth={1.75} />}
              onClick={() => {
                setAbsent(new Set());
                setLate(new Set());
              }}
            >
              Everyone present
            </Button>
          ) : null}
          <Button onClick={onSave} disabled={save.isPending || (editing && !changed) || (needsReason && !reason.trim())}>
            {save.isPending ? "Saving…" : editing ? "Save changes" : "Save roll"}
          </Button>
        </div>
      </div>
    </>
  );
}
