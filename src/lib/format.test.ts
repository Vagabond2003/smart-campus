import { describe, expect, it } from "vitest";
import { ago, taka, until } from "./format";

// Amounts put a thin space (U+2009) between the Taka sign and the figure.
const T = " ";

describe("taka", () => {
  it("groups thousands and shows whole Taka by default", () => {
    expect(taka(152000)).toBe(`৳${T}152,000`);
    expect(taka(0)).toBe(`৳${T}0`);
    expect(taka(999.6)).toBe(`৳${T}1,000`);
  });

  it("shows paise when a document needs them", () => {
    expect(taka(1000.5, { decimals: true })).toBe(`৳${T}1,000.50`);
  });

  it("puts a true minus sign in front of money leaving the balance", () => {
    expect(taka(-37500)).toBe(`−৳${T}37,500`);
  });
});

describe("until", () => {
  const from = new Date("2026-10-07T09:20:00+06:00");
  const inMinutes = (min: number) => new Date(from.getTime() + min * 60_000);

  it.each([
    [-5, "now"],
    [0, "now"],
    [0.5, "in 1 min"],
    [30, "in 30 min"],
    [120, "in 2 h"],
    [130, "in 2 h 10 min"],
  ])("%s min ahead reads “%s”", (min, text) => {
    expect(until(inMinutes(min), from)).toBe(text);
  });

  it("names tomorrow, then counts calendar days", () => {
    expect(until(new Date("2026-10-08T08:00:00+06:00"), from)).toBe("tomorrow");
    expect(until(new Date("2026-10-13T09:00:00+06:00"), from)).toBe("in 6 days");
  });
});

describe("ago", () => {
  const from = new Date("2026-10-07T09:20:00+06:00");
  const minutesAgo = (min: number) => new Date(from.getTime() - min * 60_000);

  it.each([
    [0.5, "just now"],
    [5, "5 min ago"],
    [180, "3 h ago"],
  ])("%s min back reads “%s”", (min, text) => {
    expect(ago(minutesAgo(min), from)).toBe(text);
  });

  it("names yesterday, counts days within the week, then shows the date", () => {
    expect(ago(new Date("2026-10-06T22:00:00+06:00"), from)).toBe("yesterday");
    expect(ago(new Date("2026-10-04T10:00:00+06:00"), from)).toBe("3 days ago");
    expect(ago(new Date("2026-08-09T10:00:00+06:00"), from)).toBe("9 Aug");
  });
});
