import { vi } from "vitest";

// The synthetic calendar is anchored to "today", so every test runs on the same day:
// Wednesday 7 October 2026, 09:20 in Dhaka, during CSE 2103 (09:00 to 09:50).
// Only Date is faked; timers stay real.
vi.useFakeTimers({ toFake: ["Date"] });
vi.setSystemTime(new Date("2026-10-07T09:20:00+06:00"));
