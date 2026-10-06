import { describe, expect, it } from "vitest";
import { attendanceSummary, billBalance, ledger, ledgerTotals, standing } from "./derive";
import { ATTENDANCE_LINE } from "../data/seed";
import type { Adjustment, Bill, ExamResult, Payment, ResultRow } from "../data/types";

const day = (d: string) => new Date(`${d}T10:00:00+06:00`);

const bills: Bill[] = [
  { id: "b-sem", number: "2026008117", date: day("2026-08-13"), title: "Semester fee", type: "Semester Fee", semester: "Summer 2026", amount: 50000, lines: [] },
  { id: "b-rib", number: "2026005301", date: day("2026-10-06"), title: "RIB fee", type: "RIB Fee", semester: "Summer 2026", amount: 1000, lines: [] },
];
const payments: Payment[] = [
  { id: "p-1", date: day("2026-09-01"), billId: "b-sem", amount: 37500, method: "Mobile banking", provider: "bKash", reference: "SAMPLE1", receivedBy: "Accounts Office (online)" },
];
const adjustments: Adjustment[] = [{ id: "a-1", date: day("2026-09-10"), billId: "b-sem", description: "Sibling waiver", amount: 3600 }];

describe("ledger", () => {
  const rows = ledger(bills, payments, adjustments);

  it("lists every bill, payment and adjustment oldest first", () => {
    expect(rows.map((r) => r.id)).toEqual(["b-sem", "p-1", "a-1", "b-rib"]);
    expect(rows.map((r) => r.kind)).toEqual(["bill", "payment", "adjustment", "bill"]);
  });

  it("carries a running balance: fees add, payments and waivers subtract", () => {
    expect(rows.map((r) => r.balance)).toEqual([50000, 12500, 8900, 9900]);
  });

  it("puts each entry's amount in exactly one column", () => {
    for (const r of rows) expect([r.fee, r.paid, r.adjusted].filter(Boolean)).toHaveLength(1);
  });

  it("refers payments and waivers to the bill number students see", () => {
    expect(rows[1].detail).toBe("For bill 2026008117 · Ref SAMPLE1");
    expect(rows[2].detail).toBe("On bill 2026008117");
  });
});

describe("totals and per-bill balances agree", () => {
  it("totals billed minus paid minus waived", () => {
    expect(ledgerTotals(bills, payments, adjustments)).toEqual({ billed: 51000, paid: 37500, adjusted: 3600, due: 9900 });
  });

  it("splits what is due bill by bill", () => {
    expect(billBalance(bills[0], payments, adjustments)).toEqual({ paid: 37500, adjusted: 3600, payable: 46400, due: 8900 });
    expect(billBalance(bills[1], payments, adjustments)).toEqual({ paid: 0, adjusted: 0, payable: 1000, due: 1000 });
  });

  it("matches the statement's closing balance", () => {
    const rows = ledger(bills, payments, adjustments);
    const perBill = bills.reduce((s, b) => s + billBalance(b, payments, adjustments).due, 0);
    expect(rows[rows.length - 1].balance).toBe(ledgerTotals(bills, payments, adjustments).due);
    expect(perBill).toBe(ledgerTotals(bills, payments, adjustments).due);
  });
});

describe("standing (sample CGPA rule)", () => {
  const row = (code: string, credit: number, grade: ResultRow["grade"]): ResultRow => ({ code, title: code, type: "Theory", regType: "Regular", credit, grade });
  const exam = (id: string, kind: ExamResult["kind"], rows: ResultRow[]): ExamResult => ({ id, exam: id, semester: "S", levelTerm: "L1-T1", kind, publishedOn: day("2026-01-01"), rows });

  const results = [
    exam("term-1", "regular", [row("MATH 1", 3, "A+"), row("PHY 1", 3, "F")]),
    exam("rib-1", "rib", [row("PHY 1", 3, "B")]),
    exam("term-2", "regular", [row("MATH 1", 3, "A"), row("CSE 1", 1.5, "B+")]),
  ];
  const s = standing(results);

  it("counts a failed course in the term GPA but not toward credits earned", () => {
    expect(s.terms[0]).toMatchObject({ credits: 6, earned: 3, gpa: 2 });
  });

  it("leaves a failed course out of the CGPA until it is cleared", () => {
    expect(s.terms[0].cgpaAfter).toBe(4);
    expect(s.terms[0].earnedAfter).toBe(3);
  });

  it("counts a cleared course once, at its new grade", () => {
    expect(s.terms[1]).toMatchObject({ earnedAfter: 6, cgpaAfter: 3.5 });
  });

  it("keeps the best grade when a retake scores lower", () => {
    // MATH 1 at A (3.75) does not replace A+ (4.0); CSE 1 adds 1.5 credits at 3.25
    expect(s.terms[2].earnedAfter).toBe(7.5);
    expect(s.terms[2].cgpaAfter).toBe(Math.round(((4 * 3 + 3 * 3 + 3.25 * 1.5) / 7.5) * 100) / 100);
  });

  it("reports the CGPA and credits after the latest result", () => {
    expect(s.cgpa).toBe(s.terms[2].cgpaAfter);
    expect(s.earned).toBe(7.5);
  });

  it("has nothing to report before any result is published", () => {
    expect(standing([])).toMatchObject({ terms: [], cgpa: 0, earned: 0 });
  });
});

describe("attendance outlook", () => {
  const line = ATTENDANCE_LINE / 100;
  const rows = attendanceSummary();

  it("covers every running course with consistent counts", () => {
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r.present + r.absent).toBe(r.total);
      expect(r.pct).toBeCloseTo(r.total ? (r.present / r.total) * 100 : 100, 10);
    }
  });

  it("classes each course against the line", () => {
    for (const r of rows) {
      const expected = r.pct < ATTENDANCE_LINE ? "below" : r.pct < ATTENDANCE_LINE + 7 ? "watch" : "ok";
      expect(r.standing, r.code).toBe(expected);
    }
  });

  it("asks for the fewest classes in a row that get a course back over the line", () => {
    for (const r of rows.filter((x) => x.advice.kind === "need")) {
      const n = (r.advice as { n: number }).n;
      expect(n, r.code).toBeLessThanOrEqual(r.remaining);
      expect((r.present + n) / (r.total + n), r.code).toBeGreaterThanOrEqual(line);
      expect((r.present + n - 1) / (r.total + n - 1), r.code).toBeLessThan(line);
    }
  });

  it("only allows misses that keep the final percentage at the line", () => {
    for (const r of rows.filter((x) => x.advice.kind === "can-miss")) {
      const n = (r.advice as { n: number }).n;
      const finalTotal = r.total + r.remaining;
      expect(r.absent + n, r.code).toBeLessThanOrEqual(Math.floor(finalTotal * (1 - line)));
      expect(r.absent + n + 1, r.code).toBeGreaterThan(Math.floor(finalTotal * (1 - line)));
    }
  });

  it("says when a course can no longer reach the line this term", () => {
    for (const r of rows.filter((x) => x.advice.kind === "unreachable")) {
      expect((r.present + r.remaining) / (r.total + r.remaining), r.code).toBeLessThan(line);
    }
  });

  it("flags the sample student's CSE 2105 as below the line, as the dashboard shows", () => {
    expect(rows.find((r) => r.code === "CSE 2105")?.standing).toBe("below");
  });
});
