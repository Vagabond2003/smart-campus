import {
  BookCheck,
  BookMarked,
  BookOpen,
  CalendarCheck2,
  CalendarRange,
  ClipboardList,
  FileClock,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  ReceiptText,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useLocation } from "react-router";
import { SECTION_LABEL } from "../data/campus";

export interface NavItem {
  label: string; // module names are product truth: they never change
  to: string;
  icon: LucideIcon;
  keywords?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, keywords: "home today" },
      { label: "My Profile", to: "/profile", icon: UserRound, keywords: "personal information advisor" },
    ],
  },
  {
    label: "Academics",
    items: [
      { label: "Running Courses", to: "/courses", icon: BookOpen, keywords: "classes lectures materials assignments discussion" },
      { label: "Class Routine", to: "/routine", icon: CalendarRange, keywords: "timetable schedule periods rooms" },
      { label: "Attendance Summary", to: "/attendance", icon: CalendarCheck2, keywords: "present absent percentage" },
      { label: "Results", to: "/results", icon: GraduationCap, keywords: "cgpa gpa grades transcript referred backlog" },
    ],
  },
  {
    label: "Exams",
    items: [
      { label: "Exam Routine", to: "/exams", icon: ClipboardList, keywords: "exam schedule seat room mid term final" },
      { label: "Admit Card", to: "/admit-card", icon: IdCard, keywords: "download print exam" },
    ],
  },
  {
    label: "Registration",
    items: [
      { label: "Regular Course Registration", to: "/registration/regular", icon: BookMarked, keywords: "offered courses register" },
      { label: "RIB Course Registration", to: "/registration/rib", icon: FileClock, keywords: "referred improvement backlog retake" },
    ],
  },
  {
    label: "Accounts",
    items: [{ label: "Bills", to: "/bills", icon: ReceiptText, keywords: "dues fees payment receipt money" }],
  },
];

export const NAV_ITEMS = NAV.flatMap((g) => g.items);

/** Phone tab bar: the four most-used modules, plus More for the rest. */
export const TAB_ITEMS = ["/dashboard", "/courses", "/routine", "/results"].map((to) => NAV_ITEMS.find((i) => i.to === to)!);

/* ─── The teacher's side of the sandbox ──────────────────────────────────── */

export const TEACH_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/teach", icon: LayoutDashboard, keywords: "home today section" }],
  },
  {
    label: "Teaching",
    items: [
      { label: "My Courses", to: "/teach/courses", icon: BookOpen, keywords: "roll attendance marks discussion lectures materials assignments" },
      { label: "Class Routine", to: "/teach/routine", icon: CalendarRange, keywords: "timetable schedule exam duty invigilation" },
    ],
  },
  {
    label: "Advising",
    items: [
      { label: `Section ${SECTION_LABEL}`, to: "/teach/advising", icon: UsersRound, keywords: "advisees students attendance backlog referred" },
      { label: "Registration Approvals", to: "/teach/approvals", icon: BookCheck, keywords: "rib registration approve return remind" },
    ],
  },
];

export const TEACH_NAV_ITEMS = TEACH_NAV.flatMap((g) => g.items);
export const TEACH_TAB_ITEMS = ["/teach", "/teach/courses", "/teach/routine", "/teach/advising"].map((to) => TEACH_NAV_ITEMS.find((i) => i.to === to)!);

/** The teacher view is a place, not a setting: everything under /teach. */
export const isTeachPath = (path: string) => path === "/teach" || path.startsWith("/teach/");

export function useTeacherView() {
  return isTeachPath(useLocation().pathname);
}
