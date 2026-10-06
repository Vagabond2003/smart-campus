---
version: 1
slug: "src-pages-dashboard-tsx"
primary_target: "src/pages/Dashboard.tsx"
related_targets: ["src/shell/AppShell.tsx","src/pages/Login.tsx"]
---

## Scope

Whole Smart Campus student portal (concept redesign), first surface: the signed-in Dashboard inside the app shell. Visitor mode: Operate. Login, all eleven modules, and the course space inherit this world.

## Audience, task, constraints

BAUST undergraduates on phones and laptops in equal measure. On the Dashboard they want a balanced overview at equal weight: today's classes, academic standing, dues, latest course posts. Bad news (dues, referred/backlog courses, attendance shortfall) is stated plainly, never buried. Not gamified, not generic SaaS, not a stiff government form. Module names stay exactly as today. Synthetic data only, labelled as sample data.

## Direction contract

THESIS: The portal always shows what departs next. It refuses the incumbent launcher grid and the KPI-card dashboard: one shell, a departure board for "next", and a balanced four-area overview under it.

OWN-WORLD: Bangladesh Railway at Saidpur. Flag green #006A4E owns the rail and primary actions; board black #121314 carries the departure strip in amber #FFB000 tabular capitals; platform white #F5F6F4 ground with concrete hairlines, white panels, no shadow cards; maroon #8E1B1B for bad news; signal aspects for state (green proceed, amber caution, maroon danger). Archivo on its width axis: condensed capitals for the board, timetable heads and module bands, normal width for UI, tabular figures wherever numbers align.

STORY: A student sees what is next, how they stand, what they owe and what is new in one view on a phone or a laptop, opens any module in a tap, and finds every record (result, receipt, admit card) reading as an official BAUST document.

FIRST VIEWPORT: Desktop 1440: 248px green rail (crest, grouped modules, amber you-are-here notch). Top bar: departure board spanning the content width (NEXT, time, course code, title, room, countdown, status), tools at right. Greeting with date, then the term line (Registration, CT-1, CT-2, Mid Term, CT-3, Final, Results) marking where the student is. A 2x2 balanced grid: Today (today's classes as a timeline with now and next, attendance warnings), Standing (CGPA large, term GPA by term at one fixed scale, referred courses in maroon), Dues (amount due, due date, last payment, the way to pay), Posts (latest three, pinned first). Mobile 390: green header with crest, board directly under it, the four areas stacked, bottom tab bar. Signature interaction: the board's character roll (GSAP ScrambleText) whenever the next service changes or the board rotates, pausable, instant under reduced motion. Motion grammar: 150 to 250 ms exponential ease-out state changes from visible defaults; Flip for layout changes; no page-load choreography.

FORM: Saidpur Line, the Bangladesh Railway timetable and departure board; position 1 on my ordered list (chosen by the user as IMPECCABLE'S PICK over the roll's assigned position 3, Cantonment Order); seed key cee47b05.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Memorable moment

The departure board rolling its characters to the next class and room, the one line every student reads before anything else.

## Unresolved decisions

Attendance threshold policy is not confirmed (shown as an illustrative 75% line, labelled). Payment gateway, notifications delivery, and Bangla localisation are out of scope for this concept.
