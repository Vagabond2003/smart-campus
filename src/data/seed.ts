/**
 * Synthetic sample data. Every person, ID, phone number, amount and post here is
 * invented for this concept; none of it comes from a real BAUST record.
 * Dates are derived from the anchored calendar in lib/clock.ts.
 */
import { addDays, atTime, calendar as C, HOUR, now, PERIODS, routineDayIndex, startOfDay } from "../lib/clock";
import { rngFor, pick } from "../lib/rng";
import type {
  AdmitCard,
  Adjustment,
  Assessment,
  Assignment,
  AttendanceRecord,
  BacklogCourse,
  Bill,
  Bundle,
  ClassSession,
  ExamResult,
  ExamSchedule,
  ExamSitting,
  Notice,
  Offering,
  Payment,
  Person,
  Post,
  RibOffer,
  RoutineSlot,
  Student,
  Teacher,
} from "./types";

export const SEMESTER = C.current.label; // e.g. "Summer 2026"
export const PREV_SEMESTER = C.previous.label; // e.g. "Winter 2026"
export const FIRST_SEMESTER = C.first.label; // e.g. "Summer 2025"

const T = () => now();
const hoursAgo = (h: number) => new Date(T().getTime() - h * HOUR);
const daysAgoAt = (d: number, hhmm: string) => atTime(addDays(startOfDay(T()), -d), hhmm);

/* ─── People ─────────────────────────────────────────────────────────────── */

/** IDs use the obviously synthetic 9999 prefix so no sample record can collide with a real BAUST ID. */
export const SAMPLE_ID_PREFIX = "999920260000";

export const student: Student = {
  id: `${SAMPLE_ID_PREFIX}1042`,
  registrationNo: `${SAMPLE_ID_PREFIX}1042`,
  name: "Mahir Faisal",
  program: "B.Sc. Engg. in CSE",
  programLong: "Bachelor of Science in Computer Science and Engineering",
  department: "Department of Computer Science and Engineering",
  syllabus: "B.Sc. in CSE - 2021",
  batch: "19th",
  section: "A",
  levelTerm: "Level-2, Term-I",
  father: "Md. Faisal Karim",
  mother: "Nasrin Akter",
  phone: "+880 1000-000117",
  email: "mahir.faisal@student.example.edu",
  dob: "14/03/2005",
  gender: "Male",
  quota: "General",
  scholarship: "—",
  waiver: "Sibling waiver, 10% of tuition",
  stipend: "—",
  track: "—",
  status: "Active",
  advisorId: "t-nusrat",
  admittedIn: FIRST_SEMESTER,
};

export const teachers: Record<string, Teacher> = {
  "t-arman": { id: "t-arman", name: "Arman Hossain", designation: "Lecturer", department: "CSE", phone: "+880 1000-000201", email: "arman.hossain@example.edu", room: "Academic 412" },
  "t-tahmina": { id: "t-tahmina", name: "Tahmina Sultana", designation: "Assistant Professor", department: "CSE", phone: "+880 1000-000202", email: "tahmina.sultana@example.edu", room: "Academic 418" },
  "t-rafiq": { id: "t-rafiq", name: "Rafiqul Islam", designation: "Lecturer", department: "CSE", phone: "+880 1000-000203", email: "rafiqul.islam@example.edu", room: "Academic 409" },
  "t-kamrul": { id: "t-kamrul", name: "Dr. Kamrul Hasan", designation: "Associate Professor", department: "Mathematics", phone: "+880 1000-000204", email: "kamrul.hasan@example.edu", room: "Academic 305" },
  "t-sabbir": { id: "t-sabbir", name: "Sabbir Ahmed", designation: "Lecturer", department: "CSE", phone: "+880 1000-000205", email: "sabbir.ahmed@example.edu", room: "CSE Lab 4" },
  "t-nusrat": { id: "t-nusrat", name: "Nusrat Jahan", designation: "Lecturer", department: "CSE", phone: "+880 1000-000206", email: "nusrat.jahan@example.edu", room: "Academic 414" },
};

/* ─── Current term ───────────────────────────────────────────────────────── */

const offering = (o: Omit<Offering, "slug" | "semester" | "section" | "status" | "regType" | "contactHours"> & Partial<Offering>): Offering => ({
  slug: o.code.toLowerCase().replace(/\s+/g, "-"),
  semester: SEMESTER,
  section: "A",
  status: "Registered",
  regType: "Regular",
  contactHours: 3,
  ...o,
});

export const offerings: Offering[] = [
  offering({ code: "CSE 2101", title: "Digital Logic Design", type: "Theory", credit: 3, teacherIds: ["t-arman"] }),
  offering({ code: "CSE 2102", title: "Digital Logic Design Sessional", type: "Sessional", credit: 1.5, teacherIds: ["t-arman"] }),
  offering({ code: "CSE 2103", title: "Data Structures and Algorithm I", type: "Theory", credit: 3, teacherIds: ["t-tahmina"] }),
  offering({ code: "CSE 2104", title: "Data Structures and Algorithm I Sessional", type: "Sessional", credit: 1.5, teacherIds: ["t-sabbir", "t-tahmina"] }),
  offering({ code: "CSE 2105", title: "Applied Statistics for Computer Science", type: "Theory", credit: 3, teacherIds: ["t-rafiq"] }),
  offering({ code: "MATH 2145", title: "Vector Calculus, Linear Algebra and Complex Variable", type: "Theory", credit: 3, teacherIds: ["t-kamrul"] }),
];

export const offeringByCode = Object.fromEntries(offerings.map((o) => [o.code, o]));
export const offeringBySlug = Object.fromEntries(offerings.map((o) => [o.slug, o]));

const ROOM = "309 (Academic)";
export const routine: RoutineSlot[] = [
  { day: 1, period: 1, span: 1, code: "CSE 2101", room: ROOM },
  { day: 1, period: 2, span: 1, code: "CSE 2103", room: ROOM },
  { day: 1, period: 4, span: 3, code: "CSE 2104", room: "CSE Lab 4" },
  { day: 2, period: 1, span: 1, code: "CSE 2105", room: ROOM },
  { day: 2, period: 2, span: 1, code: "MATH 2145", room: ROOM },
  { day: 2, period: 3, span: 1, code: "CSE 2101", room: ROOM },
  { day: 3, period: 1, span: 1, code: "CSE 2101", room: ROOM },
  { day: 3, period: 2, span: 1, code: "CSE 2103", room: ROOM },
  { day: 3, period: 3, span: 1, code: "CSE 2105", room: ROOM },
  { day: 4, period: 1, span: 1, code: "MATH 2145", room: ROOM },
  { day: 4, period: 2, span: 1, code: "CSE 2103", room: ROOM },
  { day: 4, period: 4, span: 3, code: "CSE 2102", room: "CSE Lab 2" },
  { day: 5, period: 2, span: 1, code: "CSE 2105", room: ROOM },
  { day: 5, period: 3, span: 1, code: "MATH 2145", room: ROOM },
];

/** Every class meeting between two dates (inclusive of `from`, exclusive of `to`). */
export function sessionsBetween(from: Date, to: Date): ClassSession[] {
  const out: ClassSession[] = [];
  for (let d = startOfDay(from); d < to; d = addDays(d, 1)) {
    if (d < C.classesBegin || d > C.lastClass) continue;
    const di = routineDayIndex(d);
    for (const s of routine.filter((r) => r.day === di)) {
      const startP = PERIODS[s.period - 1];
      const endP = PERIODS[s.period - 1 + s.span - 1];
      const start = atTime(d, startP.start);
      const end = atTime(d, endP.end);
      if (start >= to) continue;
      out.push({ id: `${s.code}-${d.getTime()}-${s.period}`, code: s.code, start, end, period: s.period, span: s.span, room: s.room });
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/* ─── Attendance ─────────────────────────────────────────────────────────── */

const ABSENCES: Record<string, number> = {
  "CSE 2101": 3,
  "CSE 2102": 1,
  "CSE 2103": 1,
  "CSE 2104": 0,
  "CSE 2105": 7,
  "MATH 2145": 2,
};

function buildAttendance(): AttendanceRecord[] {
  const held = sessionsBetween(C.classesBegin, T()).filter((s) => s.end <= T());
  const out: AttendanceRecord[] = [];
  for (const o of offerings) {
    const mine = held.filter((s) => s.code === o.code);
    const r = rngFor(`absent:${o.code}`);
    const absentIdx = new Set<number>();
    const want = Math.min(ABSENCES[o.code] ?? 0, Math.max(0, mine.length - 2));
    while (absentIdx.size < want) absentIdx.add(Math.floor(r() * Math.max(1, mine.length - 1)));
    mine.forEach((s, i) => {
      const absent = absentIdx.has(i);
      const late = !absent && r() < 0.06;
      out.push({ code: o.code, date: s.start, period: s.period, status: absent ? "A" : "P", remarks: late ? "Late, 10 min" : undefined });
    });
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}
export const attendance = buildAttendance();

/** Illustrative only; BAUST's real attendance rule is not confirmed. */
export const ATTENDANCE_LINE = 75;

/* ─── Assessments ────────────────────────────────────────────────────────── */

const ct = (code: string, name: string, date: Date, obtained: number | null, highest: number | null, obe: string, teacherId: string, max = 15): Assessment => ({
  code,
  name,
  max,
  obtained,
  highest,
  date,
  obe,
  submittedBy: obtained != null ? teachers[teacherId].name : undefined,
  state: date > T() ? "upcoming" : obtained == null ? "pending" : "published",
});

export const assessments: Assessment[] = [
  ct("CSE 2101", "CT-1", C.ct1, 13, 15, "CO1", "t-arman"),
  ct("CSE 2101", "CT-2", C.ct2, 14, 15, "CO2", "t-arman"),
  ct("CSE 2101", "CT-3", C.ct3, null, null, "CO3", "t-arman"),
  ct("CSE 2101", "Mid Term", C.midTermStart, null, null, "CO1, CO2", "t-arman", 45),
  ct("CSE 2101", "Assignment", C.lastClass, null, null, "CO3", "t-arman"),

  ct("CSE 2103", "CT-1", addDays(C.ct1, 1), 12, 15, "CO1", "t-tahmina"),
  ct("CSE 2103", "CT-2", addDays(C.ct2, -2), 13, 15, "CO2", "t-tahmina"),
  ct("CSE 2103", "CT-3", addDays(C.ct3, 1), null, null, "CO3", "t-tahmina"),
  ct("CSE 2103", "Mid Term", addDays(C.midTermStart, 1), null, null, "CO1, CO2", "t-tahmina", 45),
  ct("CSE 2103", "Assignment", addDays(T(), 3), null, null, "CO2", "t-tahmina"),

  ct("CSE 2105", "CT-1", addDays(C.ct1, 2), 9, 14, "CO1", "t-rafiq"),
  ct("CSE 2105", "CT-2", addDays(C.ct2, -1), 8, 15, "CO2", "t-rafiq"),
  ct("CSE 2105", "CT-3", addDays(C.ct3, 2), null, null, "CO3", "t-rafiq"),
  ct("CSE 2105", "Mid Term", addDays(C.midTermStart, 2), null, null, "CO1, CO2", "t-rafiq", 45),
  { code: "CSE 2105", name: "Assignment", max: 15, obtained: 13, highest: 15, date: addDays(C.ct2, 6), obe: "CO2", submittedBy: teachers["t-rafiq"].name, state: "published" },

  ct("MATH 2145", "CT-1", addDays(C.ct1, 5), 11, 15, "CO1", "t-kamrul"),
  { code: "MATH 2145", name: "CT-2", max: 15, obtained: null, highest: null, date: addDays(C.ct2, 3), obe: "CO2", state: "pending" },
  ct("MATH 2145", "CT-3", addDays(C.ct3, 5), null, null, "CO3", "t-kamrul"),
  ct("MATH 2145", "Mid Term", C.midTermEnd, null, null, "CO1, CO2", "t-kamrul", 45),

  ct("CSE 2102", "Lab performance", addDays(C.ct2, 5), 18, 20, "CO1", "t-arman", 20),
  ct("CSE 2102", "Lab report 1–4", addDays(C.ct2, 5), 9, 10, "CO2", "t-arman", 10),
  ct("CSE 2102", "Lab test", addDays(C.lastClass, -6), null, null, "CO3", "t-arman", 30),

  ct("CSE 2104", "Lab tasks 1–5", addDays(C.ct2, 4), 19, 20, "CO1", "t-sabbir", 20),
  ct("CSE 2104", "Online test 1", addDays(C.ct2, 4), 16, 20, "CO2", "t-sabbir", 20),
  ct("CSE 2104", "Final lab test", addDays(C.lastClass, -4), null, null, "CO3", "t-sabbir", 30),
];

/* ─── Course spaces: posts, lectures, materials, assignments ─────────────── */

export const posts: Post[] = [
  {
    id: "p-2101-mid",
    code: "CSE 2101",
    authorId: "t-arman",
    at: hoursAgo(26),
    title: "Mid term syllabus",
    blocks: [
      { kind: "p", text: "The mid term covers chapters 1 to 7: number systems through combinational logic design, including multiplexers and decoders." },
      { kind: "note", text: "Bring your own calculator. Programmable calculators are not allowed in the exam hall." },
    ],
    pinned: true,
    comments: [
      { id: "c1", author: "Tasnim Chowdhury", authorRole: "student", at: hoursAgo(20), text: "Sir, will K-maps with don't-care conditions be included?" },
      { id: "c2", author: "Arman Hossain", authorRole: "teacher", at: hoursAgo(18), text: "Yes, up to four variables." },
    ],
  },
  {
    id: "p-2101-ct2",
    code: "CSE 2101",
    authorId: "t-arman",
    at: atTime(addDays(C.ct2, -2), "16:10"),
    title: "Class Test 02: syllabus and instructions",
    blocks: [
      { kind: "p", text: "Syllabus:" },
      { kind: "list", items: ["Chapter 6, in full"] },
      { kind: "p", text: `The test starts at 11:00 on ${C.ct2.toLocaleDateString("en-GB", { day: "numeric", month: "long" })} in Room 309.` },
      { kind: "note", text: "Keep only a pen and a pencil at your desk. Leave bags at the front of the room before the test begins." },
    ],
    pinned: true,
    comments: [],
  },
  {
    id: "p-2101-lab",
    code: "CSE 2101",
    authorId: "t-arman",
    at: daysAgoAt(9, "13:05"),
    title: "Trainer kits for Lab 5",
    blocks: [{ kind: "p", text: "Trainer kits for the multiplexer lab are in CSE Lab 2. Collect them from the lab assistant against your ID card." }],
    pinned: false,
    comments: [{ id: "c3", author: "Raisa Islam", authorRole: "student", at: daysAgoAt(9, "15:40"), text: "Is the lab open on Thursday afternoon?" }],
  },
  {
    id: "p-2101-ct1",
    code: "CSE 2101",
    authorId: "t-arman",
    at: atTime(addDays(C.ct1, -3), "12:30"),
    title: "Class Test 01: syllabus and instructions",
    blocks: [
      { kind: "p", text: "Syllabus:" },
      { kind: "list", items: ["Chapter 3, sections 3.1 to 3.13", "Chapter 4, sections 4.1 to 4.10"] },
      { kind: "p", text: "The test starts at 11:00 in Room 309." },
    ],
    pinned: false,
    comments: [],
  },
  {
    id: "p-2103-asg",
    code: "CSE 2103",
    authorId: "t-tahmina",
    at: hoursAgo(5),
    title: "Assignment 1 is open: linked list operations",
    blocks: [
      { kind: "p", text: "Implement insertion, deletion and reversal for a singly linked list, and analyse each operation's running time." },
      { kind: "note", text: "Submit one PDF with your code and analysis through the Assignments tab. Late submissions lose 20% per day." },
    ],
    pinned: true,
    comments: [],
  },
  {
    id: "p-2103-makeup",
    code: "CSE 2103",
    authorId: "t-tahmina",
    at: daysAgoAt(3, "18:20"),
    title: "Make-up class on Thursday",
    blocks: [{ kind: "p", text: "We will make up the missed class on Thursday, 11:30 to 12:20, in Room 309." }],
    pinned: false,
    comments: [],
  },
  {
    id: "p-2105-ct2",
    code: "CSE 2105",
    authorId: "t-rafiq",
    at: hoursAgo(50),
    title: "CT-2 marks are published",
    blocks: [
      { kind: "p", text: "CT-2 marks are now in the Assessments tab. The class average was 10.4 out of 15." },
      { kind: "p", text: "If you scored below 9, come to office hours on Wednesday, 14:30 to 15:30, in Academic 409." },
    ],
    pinned: false,
    comments: [],
  },
  {
    id: "p-2105-att",
    code: "CSE 2105",
    authorId: "t-rafiq",
    at: daysAgoAt(6, "10:55"),
    title: "Attendance reminder",
    blocks: [{ kind: "p", text: "Several of you have missed more than a few classes. Low attendance can affect your eligibility for the final examination, so please check your Attendance Summary." }],
    pinned: true,
    comments: [],
  },
  {
    id: "p-math-ps3",
    code: "MATH 2145",
    authorId: "t-kamrul",
    at: daysAgoAt(2, "21:10"),
    title: "Problem set 3 solutions uploaded",
    blocks: [{ kind: "p", text: "Worked solutions for problem set 3 (line and surface integrals) are in Materials." }],
    pinned: false,
    comments: [],
  },
];

const LECTURE_TOPICS: Record<string, string[]> = {
  "CSE 2101": ["Number systems and codes", "Boolean algebra", "Logic gates and simplification", "Karnaugh maps", "Combinational logic design", "Adders, subtractors and comparators", "Multiplexers and decoders", "Encoders and code converters"],
  "CSE 2102": ["Lab 1: Logic gates on a breadboard", "Lab 2: Universal gates", "Lab 3: Half and full adders", "Lab 4: Comparators", "Lab 5: Multiplexers", "Lab 6: Decoders and seven-segment displays", "Lab 7: Encoders", "Lab 8: Code converters"],
  "CSE 2103": ["Arrays and complexity", "Linked lists", "Stacks", "Queues", "Recursion", "Trees and traversals", "Binary search trees", "Heaps"],
  "CSE 2104": ["Lab 1: Arrays", "Lab 2: Searching", "Lab 3: Singly linked lists", "Lab 4: Doubly linked lists", "Lab 5: Stacks", "Lab 6: Queues", "Lab 7: Recursion", "Lab 8: Binary trees"],
  "CSE 2105": ["Descriptive statistics", "Probability", "Random variables", "Discrete distributions", "Continuous distributions", "Sampling", "Estimation", "Hypothesis testing"],
  "MATH 2145": ["Vectors and vector functions", "Gradient, divergence and curl", "Line integrals", "Surface integrals", "Matrices", "Systems of linear equations", "Eigenvalues and eigenvectors", "Complex numbers"],
};

function slugTopic(s: string) {
  return s.replace(/^Lab \d+: /, "").replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ").slice(0, 3).join(" ");
}

export const lectures: Bundle[] = offerings.flatMap((o) => {
  const topics = LECTURE_TOPICS[o.code];
  const r = rngFor(`lectures:${o.code}`);
  return topics.map((topic, i) => {
    const week = i + 1;
    const at = atTime(addDays(C.termStart, (week - 1) * 7 + 1 + Math.floor(r() * 3)), "17:40");
    const isLab = o.type === "Sessional";
    const res = [
      { name: `${isLab ? "Lab" : "L"}${String(week).padStart(2, "0")} ${slugTopic(topic)}.pdf`, kind: "pdf" as const, size: `${(0.6 + r() * 2.4).toFixed(1)} MB` },
      ...(r() > 0.55 ? [{ name: isLab ? "Starter code.zip" : "Practice sheet.pdf", kind: isLab ? ("zip" as const) : ("pdf" as const), size: `${Math.round(120 + r() * 600)} KB` }] : []),
    ];
    return { id: `lec-${o.slug}-${week}`, code: o.code, title: isLab ? topic : `Week ${week}: ${topic}`, at, authorId: o.teacherIds[0], resources: res };
  }).filter((b) => b.at <= T()).reverse();
});

export const materials: Bundle[] = [
  { id: "mat-2101-1", code: "CSE 2101", title: "Chapter 6 practice problems with solutions", at: atTime(addDays(C.ct2, -3), "19:00"), authorId: "t-arman", resources: [{ name: "Chapter 6 practice.pdf", kind: "pdf", size: "1.1 MB" }] },
  { id: "mat-2101-2", code: "CSE 2101", title: "Logic family datasheets", at: atTime(addDays(C.termStart, 9), "12:00"), authorId: "t-arman", resources: [{ name: "74xx datasheet pack.zip", kind: "zip", size: "4.6 MB" }] },
  { id: "mat-2103-1", code: "CSE 2103", title: "Reference: big-O cheat sheet", at: atTime(addDays(C.termStart, 4), "10:30"), authorId: "t-tahmina", resources: [{ name: "Complexity cheat sheet.pdf", kind: "pdf", size: "420 KB" }] },
  { id: "mat-2105-1", code: "CSE 2105", title: "Statistical tables", at: atTime(addDays(C.termStart, 23), "09:15"), authorId: "t-rafiq", resources: [{ name: "Normal and t tables.pdf", kind: "pdf", size: "300 KB" }, { name: "Chi-square table.pdf", kind: "pdf", size: "180 KB" }] },
  { id: "mat-math-1", code: "MATH 2145", title: "Problem set 3 solutions", at: daysAgoAt(2, "21:05"), authorId: "t-kamrul", resources: [{ name: "PS3 solutions.pdf", kind: "pdf", size: "2.3 MB" }] },
  { id: "mat-math-2", code: "MATH 2145", title: "Recorded tutorial: surface integrals", at: daysAgoAt(8, "20:00"), authorId: "t-kamrul", resources: [{ name: "Tutorial recording", kind: "video" }] },
];

export const assignments: Assignment[] = [
  { id: "asg-2103-1", code: "CSE 2103", title: "Assignment 1: Linked list operations", brief: "Implement insertion, deletion and reversal for a singly linked list and analyse each operation's running time. Submit one PDF.", due: atTime(addDays(startOfDay(T()), 3), "23:59"), max: 15, state: "open" },
  { id: "asg-2105-1", code: "CSE 2105", title: "Assignment 1: Probability distributions", brief: "Fit binomial and Poisson models to the supplied dataset and compare them.", due: atTime(addDays(C.ct2, 4), "23:59"), max: 15, state: "graded", marks: 13, submittedAt: atTime(addDays(C.ct2, 3), "22:41") },
  { id: "asg-math-1", code: "MATH 2145", title: "Problem set 4", brief: "Problems 1 to 12 from chapter 5. Show every step.", due: atTime(addDays(startOfDay(T()), 9), "17:00"), max: 0, state: "open" },
];

/* ─── Classmates (synthetic) ─────────────────────────────────────────────── */

const FIRST = ["Tanvir", "Rakib", "Shahriar", "Nafis", "Imran", "Fahim", "Sakib", "Arif", "Mehedi", "Rifat", "Zubair", "Tahmid", "Asif", "Nayeem", "Riyad", "Ahnaf", "Labib", "Pritom", "Sourav", "Nusrat", "Farzana", "Sadia", "Tasnim", "Raisa", "Maliha", "Nabila", "Anika", "Sumaiya", "Lamia", "Mithila", "Jannat", "Ishrat", "Afia", "Samira", "Arpita", "Ananya"];
const LAST = ["Ahmed", "Hossain", "Rahman", "Islam", "Chowdhury", "Karim", "Haque", "Sarker", "Uddin", "Akter", "Khan", "Alam", "Siddique", "Talukder", "Mahmud", "Bhuiyan", "Roy", "Das", "Saha", "Paul"];

function buildClassmates(): Person[] {
  const r = rngFor("classmates");
  const used = new Set<string>([student.name]);
  const people: Person[] = [];
  for (let seq = 1; seq <= 45; seq++) {
    const roll = `${SAMPLE_ID_PREFIX}10${String(seq).padStart(2, "0")}`;
    if (roll === student.id) {
      people.push({ id: "me", name: student.name, roll, regType: "Regular", isYou: true });
      continue;
    }
    let name = "";
    do {
      name = `${pick(r, FIRST)} ${pick(r, LAST)}`;
    } while (used.has(name));
    used.add(name);
    people.push({ id: `s-${seq}`, name, roll, regType: r() < 0.07 ? "Retake" : "Regular" });
  }
  return people;
}
export const classmates = buildClassmates();

/** The sample student every demo session starts as. */
export const SAMPLE_STUDENT = { name: student.name, id: student.id } as const;

/**
 * Swap in the signed-in student's own name and ID (Firebase accounts). Everything else stays
 * synthetic sample data; the class list keeps the student in their roll position.
 */
export function setStudentIdentity(next: { name: string; id: string }) {
  student.name = next.name;
  student.id = next.id;
  student.registrationNo = next.id;
  const me = classmates.find((p) => p.isYou);
  if (me) {
    me.name = next.name;
    me.roll = next.id;
  }
}

/* ─── Results ────────────────────────────────────────────────────────────── */

export const results: ExamResult[] = [
  {
    id: "res-l1t1",
    exam: `Final Examination ${FIRST_SEMESTER}`,
    semester: FIRST_SEMESTER,
    levelTerm: "Level-1, Term-I",
    kind: "regular",
    publishedOn: addDays(C.firstTermStart, 140),
    rows: [
      { code: "CSE 1101", title: "Structured Programming Language", type: "Theory", regType: "Regular", credit: 3, grade: "A-" },
      { code: "CSE 1102", title: "Structured Programming Language Sessional", type: "Sessional", regType: "Regular", credit: 1.5, grade: "A" },
      { code: "EEE 1163", title: "Introduction to Electrical Engineering", type: "Theory", regType: "Regular", credit: 3, grade: "B" },
      { code: "EEE 1164", title: "Introduction to Electrical Engineering Sessional", type: "Sessional", regType: "Regular", credit: 0.75, grade: "A" },
      { code: "PHY 1131", title: "Physics", type: "Theory", regType: "Regular", credit: 3, grade: "C" },
      { code: "PHY 1132", title: "Physics Sessional", type: "Sessional", regType: "Regular", credit: 0.75, grade: "B+" },
      { code: "MATH 1141", title: "Differential and Integral Calculus", type: "Theory", regType: "Regular", credit: 3, grade: "B+" },
      { code: "HUM 1121", title: "Functional English", type: "Theory", regType: "Regular", credit: 2, grade: "A-" },
    ],
  },
  {
    id: "res-l1t2",
    exam: `Final Examination ${PREV_SEMESTER}`,
    semester: PREV_SEMESTER,
    levelTerm: "Level-1, Term-II",
    kind: "regular",
    publishedOn: addDays(C.prevTermStart, 172),
    rows: [
      { code: "CSE 1201", title: "Discrete Mathematics", type: "Theory", regType: "Regular", credit: 3, grade: "B+" },
      { code: "CSE 1203", title: "Object Oriented Programming", type: "Theory", regType: "Regular", credit: 3, grade: "A-" },
      { code: "CSE 1204", title: "Object Oriented Programming Sessional", type: "Sessional", regType: "Regular", credit: 1.5, grade: "A" },
      { code: "EEE 1269", title: "Electronic Circuits", type: "Theory", regType: "Regular", credit: 3, grade: "B-" },
      { code: "EEE 1270", title: "Electronic Circuits Sessional", type: "Sessional", regType: "Regular", credit: 0.75, grade: "B+" },
      { code: "MATH 1243", title: "Ordinary Differential Equations and Partial Differential Equations", type: "Theory", regType: "Regular", credit: 3, grade: "F" },
      { code: "CHEM 1201", title: "Chemistry", type: "Theory", regType: "Regular", credit: 3, grade: "B" },
      { code: "CHEM 1202", title: "Chemistry Sessional", type: "Sessional", regType: "Regular", credit: 0.75, grade: "A-" },
    ],
  },
  {
    id: "res-rib-prev",
    exam: `RIB Exam of ${PREV_SEMESTER}`,
    semester: PREV_SEMESTER,
    levelTerm: "Level-1, Term-II",
    kind: "rib",
    publishedOn: addDays(C.prevRibExam, 21),
    rows: [{ code: "MATH 1243", title: "Ordinary Differential Equations and Partial Differential Equations", type: "Theory", regType: "Referred", credit: 3, grade: "F" }],
  },
];

export const backlog: BacklogCourse[] = [
  {
    code: "MATH 1243",
    title: "Ordinary Differential Equations and Partial Differential Equations",
    credit: 3,
    status: "Backlog",
    attempts: [
      { exam: `Final Examination ${PREV_SEMESTER}`, regType: "Regular", grade: "F" },
      { exam: `RIB Exam of ${PREV_SEMESTER}`, regType: "Referred", grade: "F" },
    ],
    nextChance: `RIB Exam of ${SEMESTER}`,
  },
];

/* ─── RIB registration ───────────────────────────────────────────────────── */

export const ribOffer: RibOffer = {
  exam: `RIB Exam of ${SEMESTER}`,
  deadline: atTime(C.ribRegistrationDeadline, "23:59"),
  examDate: C.ribExam,
  courses: [
    { code: "MATH 1243", title: "Ordinary Differential Equations and Partial Differential Equations", credit: 3, type: "Theory", regType: "Backlog", previousGrade: "F", required: true, fee: 1000 },
    { code: "PHY 1131", title: "Physics", credit: 3, type: "Theory", regType: "Improvement", previousGrade: "C", required: false, fee: 1000 },
  ],
  registered: [],
};

/* ─── Bills, payments, adjustments ───────────────────────────────────────── */

const semesterFeeLines = [
  { name: "Tuition", amount: 36000 },
  { name: "Laboratory", amount: 4500 },
  { name: "Examination", amount: 3500 },
  { name: "Development", amount: 3500 },
  { name: "Library", amount: 1500 },
  { name: "Student welfare", amount: 1000 },
];

export const bills: Bill[] = [
  { id: "b1", number: `${C.firstTermStart.getFullYear()}004117`, date: addDays(C.firstTermStart, 5), title: `Semester fee, ${FIRST_SEMESTER}`, type: "Semester Fee", semester: FIRST_SEMESTER, amount: 50000, lines: semesterFeeLines },
  { id: "b2", number: `${C.prevTermStart.getFullYear()}000412`, date: addDays(C.prevTermStart, 4), title: `Semester fee, ${PREV_SEMESTER}`, type: "Semester Fee", semester: PREV_SEMESTER, amount: 50000, lines: semesterFeeLines },
  { id: "b3", number: `${C.prevRibExam.getFullYear()}005219`, date: addDays(C.prevRibExam, -14), title: `RIB fee, RIB Exam of ${PREV_SEMESTER}`, type: "RIB Fee", semester: PREV_SEMESTER, amount: 1000, lines: [{ name: "RIB examination, 1 course", amount: 1000 }] },
  { id: "b4", number: `${C.termStart.getFullYear()}008117`, date: addDays(C.termStart, 5), title: `Semester fee, ${SEMESTER}`, type: "Semester Fee", semester: SEMESTER, amount: 50000, lines: semesterFeeLines, dueDate: atTime(C.duesDeadline, "16:00") },
];

export const payments: Payment[] = [
  { id: "pay1", date: addDays(C.firstTermStart, 12), billId: "b1", amount: 50000, method: "Mobile banking", provider: "bKash", reference: "SAMPLE7Q2X91M4", receivedBy: "Accounts Office (online)" },
  { id: "pay2", date: addDays(C.prevTermStart, 18), billId: "b2", amount: 50000, method: "Offline counter", receivedBy: "Accounts Office, Counter 2" },
  { id: "pay3", date: addDays(C.prevRibExam, -12), billId: "b3", amount: 1000, method: "Mobile banking", provider: "Nagad", reference: "SAMPLE3K8LQ20D", receivedBy: "Accounts Office (online)" },
  { id: "pay4", date: addDays(C.termStart, 24), billId: "b4", amount: 37500, method: "Mobile banking", provider: "bKash", reference: "SAMPLE9TW4E7RB", receivedBy: "Accounts Office (online)" },
];

export const adjustments: Adjustment[] = [
  { id: "adj1", date: addDays(C.termStart, 33), billId: "b4", description: `Sibling waiver, 10% of tuition (${SEMESTER})`, amount: 3600 },
];

export const PAYMENT_ACCOUNT = "Collection account 0000-0000000 (sample)";

/* ─── Exams ──────────────────────────────────────────────────────────────── */

const sit = (exam: string, code: string, title: string, date: Date, start: string, end: string, slot: string, room: string, row: number, col: number): ExamSitting => ({
  id: `${exam}-${code}`.replace(/\s+/g, "-").toLowerCase(),
  exam,
  code,
  title,
  date,
  start,
  end,
  slot,
  room,
  seat: { row, col },
  roomRows: 5,
  roomCols: 6,
});

export const examSchedules: ExamSchedule[] = [
  {
    exam: `Mid Term Examination ${SEMESTER}`,
    kind: "mid",
    published: true,
    sittings: [
      sit(`Mid Term Examination ${SEMESTER}`, "CSE 2101", "Digital Logic Design", C.midTermStart, "10:00", "11:30", "A", "206 (Academic)", 2, 4),
      sit(`Mid Term Examination ${SEMESTER}`, "CSE 2103", "Data Structures and Algorithm I", addDays(C.midTermStart, 1), "10:00", "11:30", "A", "206 (Academic)", 3, 2),
      sit(`Mid Term Examination ${SEMESTER}`, "CSE 2105", "Applied Statistics for Computer Science", addDays(C.midTermStart, 2), "10:00", "11:30", "A", "207 (Academic)", 1, 5),
      sit(`Mid Term Examination ${SEMESTER}`, "MATH 2145", "Vector Calculus, Linear Algebra and Complex Variable", C.midTermEnd, "10:00", "11:30", "A", "206 (Academic)", 4, 3),
    ],
  },
  {
    exam: `Final Examination ${SEMESTER}`,
    kind: "final",
    published: false,
    note: `The exam office publishes the final routine after the last class on ${C.lastClass.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}.`,
    sittings: [],
  },
  {
    exam: `RIB Exam of ${PREV_SEMESTER}`,
    kind: "rib",
    published: true,
    sittings: [sit(`RIB Exam of ${PREV_SEMESTER}`, "MATH 1243", "Ordinary Differential Equations and Partial Differential Equations", C.prevRibExam, "10:00", "13:00", "B", "105 (Academic)", 1, 2)],
  },
  {
    exam: `Final Examination ${PREV_SEMESTER}`,
    kind: "final",
    published: true,
    sittings: results[1].rows
      .filter((r) => r.type === "Theory")
      .map((r, i) => sit(`Final Examination ${PREV_SEMESTER}`, r.code, r.title, addDays(C.prevFinalsStart, i * 3), "10:00", "13:00", "B", i % 2 ? "207 (Academic)" : "206 (Academic)", (i % 4) + 1, ((i * 2) % 6) + 1)),
  },
];

/* ─── Admit cards ────────────────────────────────────────────────────────── */

const theoryNow = offerings.filter((o) => o.type === "Theory").map((o) => ({ code: o.code, title: o.title, credit: o.credit, regType: o.regType, type: o.type }));

export const admitCards: AdmitCard[] = [
  { exam: `Final Examination ${SEMESTER}`, status: "Not issued", courses: theoryNow, note: "Admit cards appear here once the exam office issues them for this examination." },
  { exam: `RIB Exam of ${SEMESTER}`, status: "Awaiting registration", courses: [], note: "Register your RIB courses first. The admit card lists only the courses you register." },
  {
    exam: `RIB Exam of ${PREV_SEMESTER}`,
    status: "Approved",
    issuedOn: addDays(C.prevRibExam, -6),
    lastDownloaded: atTime(addDays(C.prevRibExam, -3), "16:22"),
    courses: [{ code: "MATH 1243", title: "Ordinary Differential Equations and Partial Differential Equations", credit: 3, regType: "Referred", type: "Theory" }],
  },
  {
    exam: `Final Examination ${PREV_SEMESTER}`,
    status: "Approved",
    issuedOn: addDays(C.prevFinalsStart, -8),
    lastDownloaded: atTime(addDays(C.prevFinalsStart, -5), "21:03"),
    courses: results[1].rows.filter((r) => r.type === "Theory").map((r) => ({ code: r.code, title: r.title, credit: r.credit, regType: r.regType, type: r.type })),
  },
];

/* ─── Notices ────────────────────────────────────────────────────────────── */

export const notices: Notice[] = [
  { id: "n1", at: hoursAgo(5), title: "Assignment 1 is open in CSE 2103", body: "Linked list operations. Due in 3 days at 23:59.", to: "/courses/cse-2103/assignments", tone: "info", read: false },
  { id: "n2", at: hoursAgo(26), title: "New post in CSE 2101", body: "Mid term syllabus: chapters 1 to 7.", to: "/courses/cse-2101/discussion", tone: "info", read: false },
  { id: "n3", at: hoursAgo(50), title: "CT-2 marks published for CSE 2105", body: "You scored 8 out of 15.", to: "/courses/cse-2105/assessments", tone: "caution", read: false },
  { id: "n4", at: daysAgoAt(4, "09:00"), title: `RIB registration is open for ${SEMESTER}`, body: `Register MATH 1243 before ${C.ribRegistrationDeadline.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.`, to: "/registration/rib", tone: "danger", read: true },
  { id: "n5", at: daysAgoAt(7, "11:00"), title: "Semester fee balance due", body: `Pay the remaining balance by ${C.duesDeadline.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.`, to: "/bills", tone: "caution", read: true },
];

/** Sample sign-in for the concept build (synthetic account, not a real credential). */
export const SAMPLE_PASSWORD = "campus2026";
