/** UGC Bangladesh uniform grading scale, as used on BAUST transcripts. */
export const GRADE_SCALE = [
  { grade: "A+", min: 80, point: 4.0 },
  { grade: "A", min: 75, point: 3.75 },
  { grade: "A-", min: 70, point: 3.5 },
  { grade: "B+", min: 65, point: 3.25 },
  { grade: "B", min: 60, point: 3.0 },
  { grade: "B-", min: 55, point: 2.75 },
  { grade: "C+", min: 50, point: 2.5 },
  { grade: "C", min: 45, point: 2.25 },
  { grade: "D", min: 40, point: 2.0 },
  { grade: "F", min: 0, point: 0.0 },
] as const;

export type Grade = (typeof GRADE_SCALE)[number]["grade"];

export function pointFor(grade: Grade): number {
  return GRADE_SCALE.find((g) => g.grade === grade)?.point ?? 0;
}

export function isFail(grade: Grade) {
  return grade === "F";
}
