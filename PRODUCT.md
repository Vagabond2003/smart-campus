# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated by the user ("choose the correct required framework and tech stack"). Chosen: a client-rendered single-page app, because the whole product sits behind a student login (no SEO, no public pages). The academic data is synthetic; Firebase (added at the user's request) provides accounts and saves what each student does.

- Vite + React + TypeScript (strict), React Router for nested app routes.
- Tailwind CSS v4 over a CSS custom-property token layer; transitions.dev motion tokens and CSS recipes for component-level transitions.
- GSAP (with `@gsap/react`, Flip, SplitText where earned) for orchestrated, timeline-driven motion; every animation honours `prefers-reduced-motion`.
- Radix UI primitives for accessible dialogs, tabs, menus, popovers, tooltips and selects.
- TanStack Query over an in-memory store seeded with synthetic data (with simulated latency), so loading, empty and error states are real.
- Firebase: Authentication (student-ID accounts plus an anonymous sample sandbox), Cloud Firestore for each student's own records (RIB registration, demo payments, comments, read notifications), Hosting at https://smart-campus-baust.web.app, and Analytics. Without Firebase config the app falls back to an offline sample login.
- Print stylesheets (not a PDF library) for admit card, payment receipt, and routine export.
- Deployed to Firebase Hosting; still a static build that any static host could serve.

## Users

Undergraduate students of Bangladesh Army University of Science and Technology (BAUST), Saidpur. Example profile: a B.Sc. Engg. in CSE student in a numbered batch and section, at a given Level-Term (e.g. Level-2, Term-I), who may also be repeating courses (Retake) and carrying Referred or Backlog courses. They open the portal on phones and on laptops in roughly equal measure (confirmed).

Their recurring jobs: check today's classes and rooms; watch attendance per course; read class-test and mid-term marks; follow course announcements, lectures and materials; register regular and RIB courses each term; check results, GPA and CGPA; see dues and payment receipts; download the admit card; find the exam date, room and seat.

## Product Purpose

Smart Campus is the student portal for BAUST. This project is a **personal concept redesign** (confirmed) of its front end: a complete, navigable prototype that shows how the portal could feel and work for students, built on synthetic data. Success means every task the current portal supports is faster to find and easier to understand, on a phone as much as on a laptop, and the redesign is free to reorganise navigation and add student-facing features (confirmed: free reinvention).

## Positioning

The incumbent portal is a launcher: a grid of module icons, each opening a table. The redesign's claim is that the portal already knows a student's whole academic position (their Level-Term, routine, attendance per course, assessment marks, referred/backlog trail, dues, admit-card status and exam seats) and can answer "what do I need to know or do now?" directly, instead of making the student open ten modules to assemble it.

## Operating Context

- Academic structure: Levels and Terms (Level-2, Term-I); semesters named by season and year (Summer 2026, Winter 2026); a syllabus year (e.g. B.Sc. in CSE - 2021); batch (e.g. 19th) and class section (A).
- RIB = Referred / Improvement / Backlog: separate RIB exams follow regular semesters (e.g. "RIB Exam of Winter 2026"), with their own registration, offer summary (course count and credits per type), fees and results.
- Course registration types: Regular, Retake/Repeat, Referred, Improvement, Backlog. Offer types and registration status ("Registered") per course.
- Assessments per theory course: CT-1, CT-2, CT-3 (out of 15), Mid Term (out of 45), Assignment (out of 15), with an OBE column and the submitting teacher.
- Class routine: week runs Saturday to Friday; nine periods from 08:00 to 17:20 with a break 10:50 to 11:30; cells show course code, section and room (e.g. "309 (Academic)").
- Attendance: per class date, day, period, status (P/A) and remarks; per-course totals and percentage.
- Course spaces: People (teachers, classmates with Regular/Retake marks), Attendance, Assessments, Discussion (posts by teachers, pinned for all sections, comments), Lectures (weekly resource bundles), Materials, Assignments.
- Results: per exam (regular semester or RIB exam) course grades and grade points, total and earned credit, term GPA, consolidated GPA, CGPA; a Referred/Backlog panel listing each failed course's attempt history.
- Bills: a running ledger in Taka (fees such as Semester Fee and RIB Fee, payments by offline counter or mobile banking with a reference, adjustments), totals for bills, payments, adjustment and due; per-bill details with fee categories and bank account; per-payment receipts with balance after payment and the receiving officer.
- Admit card: per exam, with overall status, approval status, registered courses and credits, downloadable and printable.
- Exam routine: per examination, date, time, course, slot, room, and a seat map of the room (rows by columns) locating the student's seat.
- Shell utilities present today: a text-size control and a fullscreen toggle; profile name, student ID and photo in the header; due and referred/backlog counters in the header.

## Capabilities and Constraints

- No custom server: Firebase is the backend. All academic data is synthetic; only what a student does in the portal is stored, privately, per account.
- Must cover every capability above; may reorganise and extend them (confirmed).
- Decided for the concept: accounts are activated with any 16-digit ID (no real ID needed) and have no email, so there is no password reset.
- Undecided: real payment integration, Bangla localisation, notification delivery.

## Brand Commitments

- Name: "Smart Campus", the BAUST student portal.
- Institution: Bangladesh Army University of Science and Technology (BAUST), Saidpur Cantonment, Nilphamari. Established 2015.
- The BAUST crest is the identity mark: green shield, navy gear, yellow lettering, with the motto "Discipline · Knowledge · Morality". Asset: `Screenshots and BAUST Logo/BAUST LOGO.png`.
- Module names stay exactly as they are today (confirmed): Dashboard, My Profile, Regular Course Registration, RIB Course Registration, Running Courses, Attendance Summary, Results, Class Routine, Bills, Admit Card, Exam Routine. Navigation may be regrouped and new modules added, but these labels do not change.
- The incumbent indigo-gradient admin look is not a commitment; it is the look being replaced.

## Evidence on Hand

- 22 screenshots of the current portal in `Screenshots and BAUST Logo/`, documenting every screen, data shape and state listed above (including an empty Assignments state, Details and Receipt dialogs, and a Seat Location dialog).
- The BAUST crest PNG (`Screenshots and BAUST Logo/BAUST LOGO.png`).
- The screenshots contain a real student's and real staff members' names, IDs, phone numbers, family details and photos. None of it may be reproduced: the user requires synthetic mock data, and synthetic people get synthetic names and non-photographic avatars.
- No real university policies (attendance thresholds, grading scale details beyond what the screens show, fee amounts) are confirmed; anything shown beyond the screenshots is illustrative and labelled as sample data.

## Product Principles

1. Answer first, navigate second: surface what the student needs to know or do now before asking them to open a module.
2. Phone and laptop are equal citizens: every task is complete and comfortable on both.
3. Official records stay official: admit cards, receipts and results remain precise, printable, and unmistakably BAUST documents.
4. Speak BAUST's language: keep the institution's terms (Level-Term, RIB, Referred, Backlog, CT, OBE) rather than generic substitutes.
5. Synthetic by default: never display real student or staff data.
6. Bad news is never buried (confirmed): dues, failed and referred courses, and attendance shortfalls are stated plainly where the student will see them, without alarmism and without softening.
7. Serious, not stiff (confirmed): no gamification (badges, streaks, confetti, emoji on records), no generic startup-dashboard sameness, and no cold government-form density. It should read unmistakably as BAUST's own.

## Accessibility & Inclusion

The incumbent ships a user text-size control, so adjustable text size is an existing product need to keep. Beyond that no specific standard was set; WCAG 2.2 AA is the working baseline (assumed, not confirmed).
