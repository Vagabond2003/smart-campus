/**
 * The portal's clock and academic calendar.
 *
 * All synthetic data is anchored to "today" so the concept always reads as a live term:
 * the current term is always in its ninth teaching week. Append `?now=2026-10-05T09:20`
 * to any URL to pin the clock for demos and screenshots.
 */

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const pinned = (() => {
  try {
    const raw = new URLSearchParams(window.location.search).get("now");
    if (raw) {
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) {
        sessionStorage.setItem("sc.now", raw);
        return d;
      }
    }
    const stored = sessionStorage.getItem("sc.now");
    if (stored) {
      const d = new Date(stored);
      if (!Number.isNaN(d.getTime())) return d;
    }
  } catch {
    /* storage can be unavailable; fall back to the real clock */
  }
  return null;
})();

const pinnedAt = Date.now();

/** Current time. When pinned, time still advances from the pinned moment. */
export function now(): Date {
  if (pinned) return new Date(pinned.getTime() + (Date.now() - pinnedAt));
  return new Date();
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** BAUST's routine runs Saturday to Friday. */
export const WEEK_DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

/** 0 = Saturday … 6 = Friday */
export function routineDayIndex(d: Date): number {
  return (d.getDay() + 1) % 7;
}

export function weekStart(d: Date): Date {
  return addDays(startOfDay(d), -routineDayIndex(d));
}

export function seasonOf(d: Date): { season: "Winter" | "Summer"; year: number; label: string } {
  const season = d.getMonth() < 6 ? "Winter" : "Summer";
  return { season, year: d.getFullYear(), label: `${season} ${d.getFullYear()}` };
}

/** Teaching periods, from the incumbent routine. Break sits between periods 3 and 4. */
export const PERIODS = [
  { n: 1, start: "08:00", end: "08:50" },
  { n: 2, start: "09:00", end: "09:50" },
  { n: 3, start: "10:00", end: "10:50" },
  { n: 4, start: "11:30", end: "12:20" },
  { n: 5, start: "12:30", end: "13:20" },
  { n: 6, start: "13:30", end: "14:20" },
  { n: 7, start: "14:30", end: "15:20" },
  { n: 8, start: "15:30", end: "16:20" },
  { n: 9, start: "16:30", end: "17:20" },
] as const;
export const BREAK = { start: "10:50", end: "11:30" } as const;

export function atTime(day: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const x = startOfDay(day);
  x.setHours(h, m, 0, 0);
  return x;
}

const today = now();
const termStart = addDays(weekStart(today), -8 * 7); // a Saturday; today is always in week 9

const at = (offsetDays: number) => addDays(termStart, offsetDays);

/** The academic calendar every module reads from. */
export const calendar = {
  today: startOfDay(today),
  termStart,
  week: 9,
  weeks: 14,
  current: seasonOf(addDays(termStart, 1)),
  previous: seasonOf(addDays(termStart, -196 + 1)),
  first: seasonOf(addDays(termStart, -364 + 1)),
  classesBegin: at(1),
  ct1: at(24),
  ct2: at(47),
  midTermStart: at(66),
  midTermEnd: at(71),
  ct3: at(80),
  lastClass: at(96),
  finalsStart: at(106),
  finalsEnd: at(118),
  results: at(130),
  duesDeadline: at(67),
  ribRegistrationDeadline: at(75),
  ribExam: at(125),
  /** previous term (Winter) anchors */
  prevTermStart: at(-196),
  prevFinalsStart: at(-196 + 149),
  prevRibExam: at(-196 + 183),
  /** first term (Summer, a year earlier) */
  firstTermStart: at(-364),
  at,
};

export function weekOf(d: Date): number {
  return Math.floor((startOfDay(d).getTime() - termStart.getTime()) / (7 * DAY)) + 1;
}
