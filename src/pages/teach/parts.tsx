/** Pieces the teacher's screens share: the roster cell, roll and mark-sheet signals, small helpers. */
import { type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router";
import { Inbox } from "lucide-react";
import * as seed from "../../data/seed";
import { roster, rollSuffix } from "../../data/campus";
import type { Person } from "../../data/types";
import type { RollStatus, SheetStatus } from "../../api/teach";
import { fmt, until } from "../../lib/format";
import { cn } from "../../lib/cn";
import { Signal } from "../../components/Data";
import { play } from "../../lib/feel";
import { prefersReducedMotion } from "../../lib/motion";

export const slugOf = (code: string) => seed.offeringByCode[code].slug;
export const firstName = (name: string) => name.split(" ")[0];
/**
 * The name a roster cell shows: the first name, plus as much of the surname as it takes to tell
 * apart students who share that first name ("Sourav M" beside "Sourav Ra" and "Sourav Ro"), so no
 * two cells read the same. The full name is in the cell's label.
 */
export const shortName = (name: string) => {
  const parts = name.split(" ");
  const first = parts[0];
  const last = parts.slice(1).join(" ");
  // counted on each call: an activated account plays the student under its own name
  const others = roster.map((p) => p.name).filter((n) => n !== name && firstName(n) === first).map((n) => n.split(" ").slice(1).join(" "));
  if (!last || !others.length) return first;
  let k = 1;
  while (k < last.length && others.some((o) => o.startsWith(last.slice(0, k)))) k++;
  return `${first} ${last.slice(0, k)}`;
};

/** What's wrong with a typed score, if anything. Blank is fine: it means absent or not handed in. */
export function scoreError(v: string, max: number) {
  if (v.trim() === "") return null;
  const n = Number(v);
  if (Number.isNaN(n)) return "Enter a number";
  if (n < 0) return "Can't be negative";
  if (n > max) return `Out of ${max}`;
  if (Math.round(n * 2) !== n * 2) return "Use whole or half marks";
  return null;
}

export function greeting(d: Date) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

type CellProps = {
  person: Person;
  /** Section watch: the advisee's standing. */
  mark?: "danger" | "caution" | "ok";
  /** The roll: what the teacher has marked. */
  state?: "present" | "absent" | "late";
  waiting?: boolean;
  dim?: boolean;
  label: string;
  className?: string;
  /** Phones: one student per row, with the full name (and why they're marked) beside the roll. */
  row?: boolean;
  note?: string;
  /** Position in the roster: cells arrive one after another, like a board filling in. */
  index?: number;
};

const order = (index?: number) => (index != null ? ({ "--i": index } as CSSProperties) : undefined);

/** A tapped cell gives a little: in, then back past rest on a spring. */
function give(el: HTMLElement) {
  if (prefersReducedMotion()) return;
  const spring = getComputedStyle(document.documentElement).getPropertyValue("--spring-press").trim() || "ease-out";
  el.animate([{ scale: 1, easing: "ease-out" }, { scale: 0.88, offset: 0.16, easing: spring }, { scale: 1 }], { duration: 640 });
}

function CellBody({ person, waiting, row, note, state }: Pick<CellProps, "person" | "waiting" | "row" | "note" | "state">) {
  if (row) {
    return (
      <>
        <span className="roster-roll">{rollSuffix(person)}</span>
        <span className="roster-who">
          <span className="roster-name">{person.name}</span>
          {note ? <span className="roster-note">{note}</span> : null}
        </span>
        {waiting ? <Inbox size={14} strokeWidth={2} className="roster-flag" aria-hidden /> : null}
        {state && state !== "present" ? (
          <span className="roster-state" aria-hidden>
            {state === "absent" ? "Absent" : "Late"}
          </span>
        ) : null}
      </>
    );
  }
  return (
    <>
      <span className="roster-roll">{rollSuffix(person)}</span>
      <span className="roster-name">{shortName(person.name)}</span>
      {waiting ? <Inbox size={13} strokeWidth={2} className="roster-flag" aria-hidden /> : null}
    </>
  );
}

/** A roster cell that opens the advisee's record. */
export function RosterLink({ person, mark, waiting, dim, label, className, to, row, note, index }: CellProps & { to: string }) {
  return (
    <Link to={to} className={cn("roster-cell", className)} style={order(index)} data-mark={mark} data-dim={dim ? "true" : undefined} aria-label={label} title={row ? undefined : label}>
      <CellBody person={person} waiting={waiting} row={row} note={note} />
    </Link>
  );
}

/** A roster cell the teacher taps while taking the roll. */
export function RosterToggle({ person, state = "present", label, className, onToggle, match = true, row, index }: CellProps & { onToggle: () => void; match?: boolean }) {
  return (
    <button
      type="button"
      className={cn("roster-cell", className)}
      style={order(index)}
      data-state={state}
      data-match={match ? undefined : "false"}
      aria-pressed={state !== "present"}
      aria-label={label}
      onClick={(e) => {
        onToggle();
        give(e.currentTarget);
        play(state === "present" ? "tick" : "tock");
      }}
    >
      <CellBody person={person} row={row} state={state} />
    </button>
  );
}

export function RollSignal({ status, live, start, children }: { status: RollStatus; live?: boolean; start?: Date; children?: ReactNode }) {
  if (status === "taken") return <Signal tone="ok">{children ?? "Roll taken"}</Signal>;
  if (status === "recorded") return <Signal tone="neutral" dot={false}>{children ?? "Recorded"}</Signal>;
  if (status === "due") return live ? <Signal tone="now">Now · roll open</Signal> : <Signal tone="danger">Roll not taken</Signal>;
  return (
    <Signal tone="neutral" dot={false}>
      {start ? `Later · ${until(start)}` : "Later"}
    </Signal>
  );
}

export function SheetSignal({ status, date }: { status: SheetStatus; date?: Date | null }) {
  if (status === "published") return <Signal tone="ok">Published</Signal>;
  if (status === "draft") return <Signal tone="caution">Draft</Signal>;
  if (status === "awaiting") return <Signal tone="danger">Awaiting marks</Signal>;
  return (
    <Signal tone="neutral" dot={false}>
      {date ? `${fmt.dayShort(date)} · ${until(date)}` : "Upcoming"}
    </Signal>
  );
}

/** Legend swatch for the section grid. */
export function Swatch({ mark }: { mark: "danger" | "caution" }) {
  return <span className={cn("inline-block size-3 shrink-0 rounded-[3px] border", mark === "danger" ? "border-danger-line bg-danger-wash" : "border-caution-fill/40 bg-caution-wash")} aria-hidden />;
}
