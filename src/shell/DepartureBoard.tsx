import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { boardItems, type BoardItem } from "../api/derive";
import { useBills } from "../api/hooks";
import { now } from "../lib/clock";
import { until } from "../lib/format";
import { gsap, prefersReducedMotion, useGSAP } from "../lib/motion";
import { cn } from "../lib/cn";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const ROTATE_MS = 7000;

function countdown(item: BoardItem) {
  const u = until(item.target);
  if (item.countdownPrefix === "ends") return u === "now" ? "Ending" : `Ends ${u}`;
  if (item.countdownPrefix === "due") return u === "now" ? "Due now" : `Due ${u}`;
  return u === "now" ? "Starting" : u;
}

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** The text each rolling field shows for an item. */
function fieldsOf(item: BoardItem) {
  return {
    kind: item.label,
    time: item.live ? hhmm(item.target) : item.when,
    code: item.code,
    title: item.title,
    place: item.place,
  };
}

function timeLabel(item: BoardItem) {
  if (item.kind === "class") return item.live ? "Until" : "Time";
  return item.kind === "exam" ? "Date" : "Due";
}

function describe(item: BoardItem) {
  const c = countdown(item).toLowerCase();
  if (item.kind === "dues") return `Dues: ${item.code} for ${item.title}, ${item.when.toLowerCase()}, ${c}.`;
  if (item.kind === "assignment") return `Assignment for ${item.code}: ${item.title}, due ${item.when}, ${c}.`;
  if (item.kind === "exam") return `${item.label}: ${item.code} ${item.title} on ${item.when}, ${item.placeLabel.toLowerCase()} ${item.place}, ${c}.`;
  return `${item.label}: ${item.code} ${item.title}, ${item.live ? `until ${hhmm(item.target)}` : `at ${item.when}`}, room ${item.place}, ${c}.`;
}

/**
 * The departure board: the one line every student reads first. It rotates through what
 * departs next (class, mid term, assignment, dues), rolling its characters on each change.
 * Fields: kind (with the countdown as its label), time, course code + title, place.
 */
export function DepartureBoard({ className }: { className?: string }) {
  const { data: bills } = useBills();
  // The board's own clock: countdowns re-derive every 20 s.
  const [at, setAt] = useState(now);
  const items = useMemo(() => boardItems(at, bills?.totals.due), [at, bills?.totals.due]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [announce, setAnnounce] = useState(false);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const root = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLSpanElement | null>>({});
  const first = useRef(true);

  const item = items.length ? items[index % items.length] : null;
  const fields = item ? fieldsOf(item) : null;
  const rotating = !paused && !holding && !reduced && items.length > 1;

  useEffect(() => {
    const t = window.setInterval(() => setAt(now()), 20_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const t = window.setInterval(() => {
      setAnnounce(false);
      setIndex((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => window.clearInterval(t);
  }, [rotating, items.length]);

  const signature = fields ? Object.values(fields).join("|") : "";

  useGSAP(
    () => {
      if (!fields) return;
      const order: (keyof typeof fields)[] = ["kind", "time", "code", "title", "place"];
      const instant = first.current || reduced;
      order.forEach((key, i) => {
        const el = refs.current[key];
        const text = fields[key];
        if (!el) return;
        if (instant || el.textContent === text) {
          el.textContent = text;
          return;
        }
        gsap.to(el, {
          duration: 0.5 + Math.min(text.length, 24) * 0.012,
          delay: i * 0.045,
          overwrite: true,
          ease: "none",
          scrambleText: { text, chars: SCRAMBLE_CHARS, revealDelay: 0.16, speed: 0.9, tweenLength: false },
        });
      });
      first.current = false;
    },
    { dependencies: [signature], scope: root },
  );

  if (!item) {
    return (
      <div className={cn("board", className)} data-on-board>
        <div className="board-cell is-grow">
          <span className="board-label">Board</span>
          <span className="board-value">Nothing scheduled</span>
        </div>
      </div>
    );
  }

  const step = (d: 1 | -1) => {
    setAnnounce(true);
    setIndex((i) => (i + d + items.length) % items.length);
  };
  const setRef = (key: string) => (el: HTMLSpanElement | null) => void (refs.current[key] = el);

  return (
    <div
      ref={root}
      className={cn("board", className)}
      data-on-board
      onPointerEnter={() => setHolding(true)}
      onPointerLeave={() => setHolding(false)}
      onFocus={() => setHolding(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setHolding(false)}
    >
      <Link to={item.to} className="board-link" aria-label={`${describe(item)} Open details.`}>
        <span className="board-cell board-w-kind" aria-hidden>
          <span className="board-label board-count">{countdown(item)}</span>
          <span className="board-kind">
            <span className={cn("board-dot", item.live && "is-live")} />
            <span ref={setRef("kind")} className="board-value" />
          </span>
        </span>
        <span className="board-cell board-w-time" aria-hidden>
          <span className="board-label">
            <span className="board-label-wide">{timeLabel(item)}</span>
            <span className="board-label-narrow">
              {item.live ? <span className="board-dot is-live size-1.5" /> : null}
              {item.label}
            </span>
          </span>
          <span ref={setRef("time")} className="board-value" />
        </span>
        <span className="board-cell is-grow" aria-hidden>
          <span className="board-label">
            <span className="board-label-wide">{item.kind === "dues" ? "Amount · for" : "Course"}</span>
            {/* narrow boards fold the place and the countdown into this label, so no field is lost */}
            <span className="board-label-narrow board-label-meta">
              {item.placeLabel} {item.place} · {countdown(item)}
            </span>
          </span>
          <span className="board-value board-course">
            <span ref={setRef("code")} />
            <span ref={setRef("title")} className="board-title" />
          </span>
        </span>
        <span className="board-cell board-w-place" aria-hidden>
          <span className="board-label">{item.placeLabel}</span>
          <span ref={setRef("place")} className="board-value" />
        </span>
      </Link>

      {items.length > 1 ? (
        <div className="board-controls">
          <button type="button" className="board-btn board-prev" aria-label="Previous item" onClick={() => step(-1)}>
            <ChevronLeft size={16} strokeWidth={1.75} />
          </button>
          <span className="board-pager" aria-hidden>
            {(index % items.length) + 1}/{items.length}
          </span>
          {!reduced ? (
            <button type="button" className="board-btn" aria-label={paused ? "Resume board rotation" : "Pause board rotation"} aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
              {paused ? <Play size={14} strokeWidth={1.75} /> : <Pause size={14} strokeWidth={1.75} />}
            </button>
          ) : null}
          <button type="button" className="board-btn" aria-label="Next item" onClick={() => step(1)}>
            <ChevronRight size={16} strokeWidth={1.75} />
          </button>
        </div>
      ) : null}

      <p className="sr-only" aria-live={announce ? "polite" : "off"}>
        {describe(item)}
      </p>
    </div>
  );
}
