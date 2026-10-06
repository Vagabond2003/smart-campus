import { DAY, HOUR, MINUTE, now, sameDay, addDays } from "./clock";

const THIN = " ";
const nf0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ৳ 11,000 — whole taka by default; documents ask for paisa precision. */
export function taka(amount: number, opts: { decimals?: boolean } = {}) {
  const sign = amount < 0 ? "−" : "";
  const n = Math.abs(amount);
  return `${sign}৳${THIN}${opts.decimals ? nf2.format(n) : nf0.format(n)}`;
}

export function credits(n: number) {
  return n.toFixed(2);
}

export function gpa(n: number | null | undefined) {
  return n == null ? "—" : n.toFixed(2);
}

export function pct(n: number, digits = 0) {
  return `${n.toFixed(digits)}%`;
}

const dShort = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const dLong = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const dFull = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const dWeekday = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const dWeekdayLong = new Intl.DateTimeFormat("en-GB", { weekday: "long" });
const dNumeric = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

export const fmt = {
  /** 5 Oct */
  short: (d: Date) => dShort.format(d),
  /** 5 Oct 2026 */
  long: (d: Date) => dLong.format(d),
  /** Monday, 5 October 2026 */
  full: (d: Date) => dFull.format(d),
  /** Mon */
  weekday: (d: Date) => dWeekday.format(d),
  /** Monday */
  weekdayLong: (d: Date) => dWeekdayLong.format(d),
  /** Mon 5 Oct */
  dayShort: (d: Date) => `${dWeekday.format(d)} ${dShort.format(d)}`,
  /** 05/10/2026 — the format BAUST's documents use */
  numeric: (d: Date) => dNumeric.format(d),
  /** 08:00 */
  time: (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
};

/** "in 12 min", "in 1 h 20 min", "in 3 days", "tomorrow" */
export function until(target: Date, from: Date = now()): string {
  const ms = target.getTime() - from.getTime();
  if (ms <= 0) return "now";
  if (ms < HOUR) return `in ${Math.max(1, Math.round(ms / MINUTE))} min`;
  if (sameDay(target, from)) {
    const h = Math.floor(ms / HOUR);
    const m = Math.round((ms - h * HOUR) / MINUTE);
    return m ? `in ${h} h ${m} min` : `in ${h} h`;
  }
  if (sameDay(target, addDays(from, 1))) return "tomorrow";
  const days = Math.round((startOf(target) - startOf(from)) / DAY);
  return `in ${days} days`;
}

/** "5 min ago", "3 h ago", "yesterday", "12 Sep" */
export function ago(past: Date, from: Date = now()): string {
  const ms = from.getTime() - past.getTime();
  if (ms < MINUTE) return "just now";
  if (ms < HOUR) return `${Math.round(ms / MINUTE)} min ago`;
  if (sameDay(past, from)) return `${Math.round(ms / HOUR)} h ago`;
  if (sameDay(past, addDays(from, -1))) return "yesterday";
  const days = Math.round((startOf(from) - startOf(past)) / DAY);
  if (days < 7) return `${days} days ago`;
  return dShort.format(past);
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((startOf(b) - startOf(a)) / DAY);
}

function startOf(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export function initials(name: string) {
  const parts = name
    .replace(/^(Md\.|Mst\.|Dr\.|Lec|Asst Prof|Assoc Prof|Prof)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
