import type { Grade } from "../lib/grades";

export type CourseType = "Theory" | "Sessional";
export type RegType = "Regular" | "Retake" | "Referred" | "Improvement" | "Backlog";

export interface Student {
  id: string;
  registrationNo: string;
  name: string;
  program: string;
  programLong: string;
  department: string;
  syllabus: string;
  batch: string;
  section: string;
  levelTerm: string;
  father: string;
  mother: string;
  phone: string;
  email: string;
  dob: string;
  gender: string;
  quota: string;
  scholarship: string;
  waiver: string;
  stipend: string;
  track: string;
  status: "Active" | "Inactive";
  advisorId: string;
  admittedIn: string;
}

export interface Teacher {
  id: string;
  name: string;
  designation: string;
  department: string;
  phone: string;
  email: string;
  room: string;
}

export interface Course {
  code: string;
  title: string;
  type: CourseType;
  credit: number;
  contactHours: number;
}

export interface Offering extends Course {
  slug: string;
  semester: string;
  section: string;
  teacherIds: string[];
  regType: RegType;
  status: "Registered" | "Pending";
}

export interface RoutineSlot {
  day: number; // 0 Saturday … 6 Friday
  period: number; // 1 … 9
  span: number; // periods covered (labs span 3)
  code: string;
  room: string;
}

export interface ClassSession {
  id: string;
  code: string;
  start: Date;
  end: Date;
  period: number;
  span: number;
  room: string;
}

export interface AttendanceRecord {
  code: string;
  date: Date;
  period: number;
  status: "P" | "A";
  remarks?: string;
}

export interface Assessment {
  code: string;
  name: string;
  max: number;
  obtained: number | null;
  highest: number | null;
  date: Date | null;
  obe?: string;
  submittedBy?: string;
  state: "published" | "pending" | "upcoming";
}

export type PostBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "note"; text: string };

export interface Comment {
  id: string;
  author: string;
  authorRole: "student" | "teacher";
  at: Date;
  text: string;
}

export interface Post {
  id: string;
  code: string;
  authorId: string;
  at: Date;
  title: string;
  blocks: PostBlock[];
  pinned: boolean;
  comments: Comment[];
}

export interface Resource {
  name: string;
  kind: "pdf" | "slides" | "zip" | "link" | "video";
  size?: string;
}

export interface Bundle {
  id: string;
  code: string;
  title: string;
  at: Date;
  authorId: string;
  resources: Resource[];
}

export interface Assignment {
  id: string;
  code: string;
  title: string;
  brief: string;
  due: Date;
  max: number;
  state: "open" | "submitted" | "graded";
  marks?: number;
  submittedAt?: Date;
}

export interface Person {
  id: string;
  name: string;
  roll: string;
  regType: "Regular" | "Retake";
  isYou?: boolean;
}

export interface ResultRow {
  code: string;
  title: string;
  type: CourseType;
  regType: RegType;
  credit: number;
  grade: Grade;
}

export interface ExamResult {
  id: string;
  exam: string; // "Final Examination Winter 2026", "RIB Exam of Winter 2026"
  semester: string;
  levelTerm: string;
  kind: "regular" | "rib";
  publishedOn: Date;
  rows: ResultRow[];
}

export interface BacklogCourse {
  code: string;
  title: string;
  credit: number;
  status: "Referred" | "Backlog";
  attempts: { exam: string; regType: RegType; grade: Grade }[];
  nextChance: string;
}

export interface FeeLine {
  name: string;
  amount: number;
}

export interface Bill {
  id: string;
  number: string;
  date: Date;
  title: string;
  type: "Semester Fee" | "RIB Fee";
  semester: string;
  amount: number;
  lines: FeeLine[];
  dueDate?: Date;
}

export interface Payment {
  id: string;
  date: Date;
  billId: string;
  amount: number;
  method: "Offline counter" | "Mobile banking";
  provider?: string;
  reference?: string;
  receivedBy: string;
}

export interface Adjustment {
  id: string;
  date: Date;
  billId: string;
  description: string;
  amount: number;
}

export interface ExamSitting {
  id: string;
  exam: string;
  code: string;
  title: string;
  date: Date;
  start: string;
  end: string;
  slot: string;
  room: string;
  seat: { row: number; col: number };
  roomRows: number;
  roomCols: number;
}

export interface ExamSchedule {
  exam: string;
  kind: "mid" | "final" | "rib";
  published: boolean;
  note?: string;
  sittings: ExamSitting[];
}

export interface AdmitCard {
  exam: string;
  status: "Approved" | "Not issued" | "Awaiting registration";
  issuedOn?: Date;
  lastDownloaded?: Date;
  courses: { code: string; title: string; credit: number; regType: RegType; type: CourseType }[];
  note?: string;
}

export interface RibOfferCourse {
  code: string;
  title: string;
  credit: number;
  type: CourseType;
  regType: "Referred" | "Improvement" | "Backlog";
  previousGrade: Grade;
  required: boolean;
  fee: number;
}

export interface RibOffer {
  exam: string;
  deadline: Date;
  examDate: Date;
  courses: RibOfferCourse[];
  registered: string[];
  submittedAt?: Date;
}

export interface Notice {
  id: string;
  at: Date;
  title: string;
  body: string;
  to: string;
  tone: "info" | "caution" | "danger";
  read: boolean;
}
