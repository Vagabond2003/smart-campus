---
version: 1
slug: "src-pages-teach-teachdashboard-tsx"
primary_target: "src/pages/teach/TeachDashboard.tsx"
related_targets: ["src/pages/teach","src/shell/AppShell.tsx"]
---

## Scope

The Teacher portal inside the Smart Campus sandbox campus, first surface: the teacher dashboard ("Section watch") inside the shared app shell. Visitor mode: Operate. My courses, the teacher course space (roll, marks, discussion, lectures, materials, assignments, people), the roll-taking screen, marks entry, assignment grading, the teacher routine and the advisor pages (advisees, RIB registration approvals) inherit this surface.

## Audience, task, constraints

A visitor plays Arman Hossain, Lecturer in CSE: teaches CSE 2101 and the CSE 2102 sessional to 19th batch Section A and advises that section. Jobs: take the roll in class (phone, standing, everyone present by default, tap absentees or late), enter and publish marks (draft then publish, laptop), post to course discussions, pin and reply, list lecture and material files (names only, no upload yet), set and grade assignments, approve or return RIB registrations, remind advisees who have not registered. Every action lands on the sample student's side of the same sandbox. Synthetic data only, labelled. Office portal is out of scope for now.

## Direction contract

THESIS: The teacher's first screen is the section they answer for, not a KPI board or a launcher: who is slipping and who is waiting on them, read in one glance, then today's teaching.

OWN-WORLD: Saidpur Line unchanged. Flag-green rail, board-black strip with amber tabular capitals for the teacher's own "now", platform-white ground, hairline-ruled white panels, maroon for students under the line or carrying backlog, caution for watch, ok for approved. Archivo condensed capitals for bands and roll numbers, normal width for names and sentences.

STORY: Arman sees his class now on the board with a one-tap Take roll, sees which of 45 advisees are at risk and which registrations wait on him, acts inline, and finds every action reflected on the student's portal.

FIRST VIEWPORT: Desktop 1440: teacher rail; board on the current class with Take roll. Greeting with designation and advising line. Left 6/10: Section 19-A as a 45-cell grid (roll suffix large, short name), state as a mark in the cell (maroon under line or backlog, caution watch), legend and filter above. Right 4/10: approvals queue ranked by deadline (approve, return), unregistered backlog students with Remind. Below: Today (classes with roll status) and Marks to publish. Mobile 390: board, approvals first, then the section one student per row (roll, full name, why they're marked; filters remove rows), today, marks. Signature: board roll on the teacher's now; cells change state in place when a roll or approval lands.

FORM: Section watch (advisor's register opened before the timetable), position 7 on my ordered list, dealt as the lead; seed key aed6e36c.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Memorable moment

Tapping a student's cell on the roll and watching that student's attendance fall under the line on the Section watch, then on the student's own dashboard.

## Unresolved decisions

Real file sharing for lectures, materials and submissions comes later (user). Office portal later. Attendance threshold remains the illustrative 75% line.
