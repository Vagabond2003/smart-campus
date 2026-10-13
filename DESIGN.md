---
name: Smart Campus
description: The BAUST student and teacher portal, set as a Bangladesh Railway timetable and departure board.
colors:
  rail: "#006a4e"
  rail-deep: "#00553e"
  rail-hover: "#0a7558"
  rail-ink: "#ffffff"
  rail-ink-2: "#c2e3d7"
  primary: "#006a4e"
  primary-hover: "#005a42"
  primary-press: "#004d39"
  link: "#00664b"
  board: "#121314"
  board-2: "#1b1d1e"
  board-line: "#2b2e30"
  amber: "#ffb000"
  amber-dim: "#b98a2c"
  board-text: "#f3ead2"
  ground: "#f4f5f2"
  surface: "#ffffff"
  surface-2: "#eceeea"
  surface-3: "#e3e6e1"
  line: "#d9ddd7"
  line-strong: "#bdc4bd"
  ink: "#121614"
  ink-2: "#464f4a"
  ink-3: "#636c67"
  ok: "#00704f"
  ok-wash: "#e2f1ea"
  caution: "#7a4f00"
  caution-wash: "#fff1d1"
  caution-fill: "#c98300"
  danger: "#8e1b1b"
  danger-wash: "#f7e5e3"
  danger-line: "#e3b9b4"
typography:
  display:
    fontFamily: "Archivo Variable, Taka Sign, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 730
    lineHeight: 1.02
    letterSpacing: "0.012em"
    fontVariation: "'wdth' 76"
  display-num:
    fontFamily: "Archivo Variable, Taka Sign, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.375rem"
    fontWeight: 680
    lineHeight: "2.6rem"
    letterSpacing: "-0.015em"
    fontFeature: "'pnum' 1, 'lnum' 1"
    fontVariation: "'wdth' 88"
  headline:
    fontFamily: "Archivo Variable, Taka Sign, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 690
    lineHeight: 1.2
    letterSpacing: "0.05em"
    fontVariation: "'wdth' 80"
  title:
    fontFamily: "Archivo Variable, Taka Sign, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 640
    lineHeight: "1.5rem"
  body:
    fontFamily: "Archivo Variable, Taka Sign, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: "1.45rem"
  body-sm:
    fontFamily: "Archivo Variable, Taka Sign, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.25rem"
  label:
    fontFamily: "Archivo Variable, Taka Sign, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 620
    lineHeight: "1rem"
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 78"
  board-value:
    fontFamily: "Archivo Variable, Taka Sign, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 640
    lineHeight: "1.15rem"
    letterSpacing: "0.045em"
    fontFeature: "'tnum' 1, 'lnum' 1"
    fontVariation: "'wdth' 80"
  board-label:
    fontFamily: "Archivo Variable, Taka Sign, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: "0.75rem"
    letterSpacing: "0.1em"
    fontVariation: "'wdth' 75"
  roster-num:
    fontFamily: "Archivo Variable, Taka Sign, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 720
    lineHeight: 1
    letterSpacing: "0.02em"
    fontFeature: "'tnum' 1, 'lnum' 1"
    fontVariation: "'wdth' 80"
  display-landing:
    fontFamily: "Archivo Variable, Taka Sign, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3.25rem, 8.5vw, 7rem)"
    fontWeight: 760
    lineHeight: 0.95
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 86"
  display-signin:
    fontFamily: "Archivo Variable, Taka Sign, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 760
    lineHeight: 0.95
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 86"
  subtitle-landing:
    fontFamily: "Archivo Variable, Taka Sign, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 1.9vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.3
rounded:
  xs: "3px"
  sm: "4px"
  md: "6px"
  board: "8px"
  lg: "10px"
  xl: "14px"
  full: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-primary-active:
    backgroundColor: "{colors.primary-press}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-2}"
  button-ghost:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "44px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
  panel-head:
    typography: "{typography.headline}"
    textColor: "{colors.ink}"
    padding: "12px 16px 12px 18px"
    height: "52px"
  table-head:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    padding: "0 16px"
    height: "40px"
  signal-ok:
    backgroundColor: "{colors.ok-wash}"
    textColor: "{colors.ok}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "24px"
  signal-caution:
    backgroundColor: "{colors.caution-wash}"
    textColor: "{colors.caution}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "24px"
  signal-danger:
    backgroundColor: "{colors.danger-wash}"
    textColor: "{colors.danger}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "24px"
  signal-now:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.board}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "24px"
  signal-neutral:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "24px"
  tag:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "24px"
  departure-board:
    backgroundColor: "{colors.board}"
    textColor: "{colors.amber}"
    typography: "{typography.board-value}"
    rounded: "{rounded.board}"
    height: "44px"
  board-action:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.board}"
    typography: "{typography.board-value}"
  roster-cell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.roster-num}"
    rounded: "{rounded.sm}"
    padding: "8px 6px 7px 7px"
    height: "56px"
    width: "70px"
  roster-cell-absent:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface}"
  roster-cell-late:
    backgroundColor: "{colors.caution-wash}"
    textColor: "{colors.caution}"
  roster-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    padding: "8px 16px"
    height: "44px"
  action-bar:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "12px 12px 12px 16px"
  score-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "36px"
    width: "72px"
  rail-item:
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
    height: "40px"
  rail-item-hover:
    backgroundColor: "{colors.rail-hover}"
  rail-item-active:
    backgroundColor: "{colors.rail-deep}"
    typography: "{typography.headline}"
  menu:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "6px"
  menu-item-hover:
    backgroundColor: "{colors.surface-2}"
  concept-plate:
    backgroundColor: "{colors.caution-wash}"
    textColor: "{colors.caution}"
    rounded: "{rounded.sm}"
    padding: "10px 14px 11px 12px"
---

# Design System: Smart Campus

## Overview

**Creative North Star: "Saidpur Line"**

The portal is a station. Bangladesh Railway at Saidpur supplies the whole material: a flag-green rail down the left edge, a board-black departure strip that always says what leaves next, and a platform-white concourse ruled by concrete hairlines. Everything a student reads is either a signboard, a timetable, or a signal. Records (results, receipts, admit cards) leave the station's voice and become paper: official BAUST documents on white, in both themes. The teacher portal is the same station seen from the staff side: the same rail, board and panels, with a section drawn as a roster of numbered cells.

Density is operational, not decorative. Panels sit edge to edge on a 20px gutter, each opened by a condensed capital band and closed by its own hairline, so a laptop screen reads like a timetable page and a phone reads like the same timetable folded into one column. Colour carries meaning before it carries mood: green is the railway and the way forward, amber is "now" and "you are here", maroon is bad news stated plainly. Motion splits the same way the portal does: what a visitor does answers back on a spring (a press gives and returns, a dialog lands, a finished task is stamped and marked with a short burst of tickets), and what a visitor reads stays calm on the house ease-out (records fade in and meters fill, but nothing about a result, a due or a shortfall bounces or celebrates). The board's character roll is the portal's signature moment and the front door has the world's single arrival sequence (see Landing Intro). Under reduced motion every movement stops and the state changes remain.

Light is the daylight platform and the default. Dark is the night-station rendition (deep rail green, near-black ground, mint primary, salmon danger) and keeps every role, including amber, unchanged in meaning.

**Key Characteristics:**
- Flag-green rail and primary actions; board-black strip with amber tabular capitals as the signature.
- Archivo on its width axis: condensed capitals for signboards, bands and timetable heads; normal width for UI and reading.
- Hairline-ruled white panels on a platform-white ground; shadows only for things that float.
- State as signal aspects: green proceed, amber caution or now, maroon danger.
- Tabular figures wherever numbers align; currency in the Taka sign.
- Playful actions, calm records: springs, bursts and opt-in sounds for what a visitor does; the exponential ease-out for records. The board roll is the portal's signature moment, and the landing intro on "/" is the one authored arrival sequence.

## Colors

A railway palette: one green that means "the line", one amber that means "now", one maroon that means "stop", over cool concrete neutrals.

### Primary
- **Flag Green** (rail / primary): the desktop rail, the phone header band, primary buttons, the selected tab underline, the "you" avatar, and completed stops on the term line. Its pressed and hover steps (primary-hover, primary-press) deepen it; it never lightens on light ground.
- **Rail Deep** (rail-deep): the active module row on the rail, a darker cut of the same green so the active row reads as recessed track, not a highlight.
- **Signal Link Green** (link): inline text links, panel "go to module" links, with a 35% tinted underline that goes solid on hover.

### Secondary
- **Board Amber** (amber): departure-board values, the board's action cell while the class on now has its roll due, the "Now" signal, the you-are-here dot on the active rail item, the current stop on the term line, the student's own seat in the seat plan, the notification count, text selection, and the focus ring on rail and board. Amber marks presence in time or place; it is never decoration.
- **Board Black** (board / board-2 / board-line): the departure strip and its hover and cell rules. Board text (board-text, a warm platform cream) carries secondary words on the board, such as the course title.
- **Amber Dim** (amber-dim): board cell labels and the pager, the receding half of the board's two-level voice.

### Tertiary
- **Signal Maroon** (danger, with danger-wash and danger-line): amounts due, referred and backlog courses, failed grades, attendance below the line, danger panels (a maroon hairline with a washed head), and the danger button.
- **Proceed Green** (ok, ok-wash): paid, passed, done-and-fine states and meters above the line.
- **Caution Ochre** (caution text, caution-wash ground, caution-fill for dots and meter fills): due-soon and approaching-threshold states. Caution-fill was chosen to stay distinguishable from ok and danger under colour-vision deficiency and to hold 3:1 on white.

### Neutral
- **Platform White** (ground): the concourse behind everything; slightly cooler and greyer than paper so white panels lift off it without shadow.
- **Panel White** (surface): panels, menus, fields, tables.
- **Concrete 2 / Concrete 3** (surface-2, surface-3): table heads and footers, hovered rows and menu items, quiet buttons, skeleton bars, the tab track.
- **Hairline / Strong Hairline** (line, line-strong): panel borders and row rules; field borders, table footers and scrollbar thumbs.
- **Station Ink / Ink 2 / Ink 3** (ink, ink-2, ink-3): primary text and the light-theme focus ring; secondary text and column heads; metadata, placeholders and labels.

### Named Rules
**The Three Aspects Rule.** State is shown with exactly three signal colours (ok, caution, danger) plus amber for "now". A new state maps onto one of them; it does not get a new hue.

**The Amber Is Now Rule.** Amber appears only where it answers "when is it" or "where am I": the board, the current class and the action due for it now (the teacher's roll), the current stop, the active module, your seat, and the burst that marks a task finished this moment. If an amber element answers neither, it is wrong.

**The Bad News Is Maroon Rule.** Money owed, failed and referred courses and attendance shortfalls are set in maroon at full size where the student will see them, never softened to grey or buried behind a link.

## Typography

**Display Font:** Archivo Variable, condensed on its width axis (with Taka Sign for the ৳ glyph, then ui-sans-serif, system-ui)
**Body Font:** Archivo Variable at normal width
**Label Font:** Archivo Variable, condensed capitals

**Character:** One family, two widths. Condensed uppercase Archivo is the signage of the station; normal-width Archivo is the clerk's handwriting on the forms. The Taka Sign face covers only U+09F3 so currency renders correctly inside the Archivo line.

### Hierarchy
- **Display / Signboard** (730, 2.25rem from the small breakpoint up, 1.875rem on phones, line-height 1.02, width 76%, uppercase): page titles and the dashboard greeting. One per page.
- **Display Number** (680, width 88%, proportional lining figures, -0.015em): the headline figure of a panel, such as amount due or attendance percentage at 2.375rem, or profile CGPA at 1.5rem.
- **Headline / Module Band** (690, 0.9375rem, width 80%, uppercase, 0.05em): panel heads, section heads such as Statement and Grades (at 1.0625rem), the term-line title, and the active rail item.
- **Title** (640, 1.0625rem): empty-state titles, post titles and other in-panel headings in sentence case.
- **Body** (400, 0.9375rem / 1.45rem): base reading text and page descriptions, capped at 68ch.
- **Body Small** (400, 0.8125rem / 1.25rem): the workhorse of tables, menus, list rows and metadata; the most used size in the build.
- **Label / Timetable Head** (620, 0.6875rem, width 78%, uppercase, 0.06em): table column heads, navigation group labels, definition-list keys, period and day heads on the routine.
- **Board Value / Board Label** (640 at 0.9375rem, width 80%, 0.045em, tabular, uppercase; 600 at 0.625rem, width 75%, 0.1em): the departure board only.
- **Roster Number** (720, 1.0625rem, width 80%, 0.02em, tabular lining): the last three digits of a roll in a roster cell or row, the number a teacher calls out. The name beside it stays normal width.
- **Landing Display** (760, width 86%, -0.035em, line-height 0.95, sentence case): the "Smart Campus" title on the flag-green panel, and nowhere else. The landing intro sets it fluid at clamp(3.25rem, 8.5vw, 7rem) and scales it down onto the sign-in title, which steps 2.75rem, 3.5rem from the small breakpoint and 4.75rem from the large.
- **Landing Subtitle** (400, line-height 1.3, rail-ink-2): "Student portal" under the landing title; fluid at clamp(1.125rem, 1.9vw, 1.5rem) in the intro, landing on the sign-in subtitle at 1.25rem (1.5rem from the large breakpoint).

The portal ramp is a fixed rem scale at a ratio of about 1.2 (0.6875, 0.75, 0.8125, 0.9375, 1.0625, 1.25, 1.5, 1.875, 2.375rem). It is not fluid. The landing and sign-in display steps above sit outside it on purpose: they belong to the flag-green front door only, and the intro's two clamps are the only fluid sizes in the system. One root font size (15, 16 or 18px from the user's text-size control) drives every rem.

### Named Rules
**The Two Widths Rule.** Condensed capitals are for things a station would paint on a sign: page titles, bands, column heads, the board. Anything a student reads as a sentence is normal width, sentence case. People's names count as sentences: they are never narrowed to fit a box; the box grows, or each name gets its own row.

**The Columns Align Rule.** Every number that sits in a column or can change in place (money, credits, GPA, times, board values, seat numbers) uses tabular lining figures. Only the single headline figure of a panel goes proportional.

## Layout

Desktop is a two-column shell: a fixed 264px flag-green rail, then a content column under a 64px sticky top bar holding the departure board and tools. Content is capped at 84rem and padded 32px (40px from the xl breakpoint). Below the large breakpoint the rail becomes a green header band with the board full-bleed directly beneath it and a 64px bottom tab bar, safe-area aware.

The dashboard overview is a two-column grid of equal-weight panels at 20px gaps on large screens, stacking to one column below. Inside panels the rhythm is 16 to 20px horizontal padding and 12px vertical row padding, with rows separated by hairlines rather than space. Spacing follows a 4px base; 8, 12, 16 and 20px carry almost all of it.

The departure board responds to its own width through a container query, not the viewport: below 40rem the service type and room fold into the time label and the pager leaves; below 30rem the cells tighten. The course title always stays and truncates.

The Bills statement ledger also answers to its own width, because beside the rail on a small laptop it has no more room than a tablet. Narrow, each entry stacks as label and value pairs (labels in ink-3, zero amounts omitted). From 42rem it becomes a table with a label-voice head, and fee, paid and adjusted fold into one signed Amount column, since an entry only ever carries one of them. From 60rem every column shows. Thresholds are in rem so they follow the text-size control.

Content too wide for its column (wide result and registration tables, the term line) scrolls sideways inside a labelled region rather than squeezing. The region joins the tab order only while it actually overflows, re-measured as the box, its content or the web font changes, so keyboard users can reach and arrow-scroll it without meeting an empty tab stop on wide screens.

## Elevation & Depth

Flat at rest. Depth on the platform comes from tone (white panels on platform-white ground) and hairlines, never from shadow. Shadows exist for exactly two things: surfaces that float above the page (menus, popovers, dialogs, sheets, document paper, and the sticky action bar) and the bottom tab bar's upward edge. Halo rings (a 3px spread of amber or surface colour, no offset) mark small live indicators such as the you-are-here dot and the current term-line stop.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 0 0 1px rgb(18 22 20 / 0.06), 0 4px 10px -2px rgb(18 22 20 / 0.08), 0 16px 40px -12px rgb(18 22 20 / 0.18)`): menus, popovers, dialogs, sheets, the sticky action bar, and official document paper.
- **Bar** (`box-shadow: 0 -1px 0 0 var(--line), 0 -8px 24px -12px rgb(18 22 20 / 0.12)`): the phone tab bar only.

### Named Rules
**The Ruled Panel Rule.** A panel is a white surface with a 1px hairline and a 10px radius. If it has a shadow, it is not a panel; it is floating.

**The Paper Rule.** Admit cards, receipts, the exam routine and other official records render as white paper with the float shadow and a 4px radius in both themes, carrying the sample watermark, and print without shadow or radius. A print is always the daylight rendition, whatever the visitor's theme, and every printed document is one page on whatever paper and orientation the print dialog chooses (iOS ignores requested page sizes and adds its own header and footer): a document keeps a fixed design width (44rem, or 66rem for the routines), its height is measured, and the print stylesheet sizes the rem in vw and vh, the page area, so the whole box fits both ways. Tables tighten from 13px rows to 12px past 10 rows and 11px past 18, so long lists stay as large as they can. The routines ask for a landscape sheet where the browser honours it.

## Shapes

Gently squared. Controls (buttons, fields, menu items, rail items) use 6px corners; panels and menus 10px; the board 8px; tags, seats, roster cells, skeleton bars and document paper 4px; the roster legend's swatches 3px. Fully round shapes are reserved for signals, avatars, dots and the sheet grabber. Meter bars keep a square baseline and round only the data end. Borders are always 1px hairlines; there are no thick rules except the 2px tab underline and the 2px "now" marker on the routine.

## Components

### Buttons
Firm and quiet: medium weight (570), no shadow, a springy press: down to 0.96 in 90ms, back past rest and settled on the press spring.
- **Shape:** gently squared (6px), heights 32, 40 and 48px for small, medium and large.
- **Primary:** flag green with white text, 16px side padding at medium. Hover deepens to primary-hover, press to primary-press.
- **Secondary:** panel white with a strong-hairline border and ink text; hover fills concrete 2.
- **Ghost:** ink-2 text only; hover fills concrete 2 and darkens text to ink.
- **Quiet:** concrete 2 fill, hover concrete 3.
- **Danger:** maroon with white text (dark ink text in the dark theme); hover brightens 10%.
- **Hover / Focus:** 150ms ease-out colour transitions; focus is a 2px ink outline at 2px offset (amber on rail and board). Disabled drops to 45% opacity.
- **Icon buttons:** 40px or 32px squares at 6px radius, with tones for platform, rail and board. Small sizes carry an invisible 4px hit-area extension.

### Signals and Tags
- **Signal:** a 24px fully round pill, 0.75rem semibold text, a 6px dot in the aspect colour, on the aspect wash. The "now" signal inverts to amber fill with board-black text.
- **Tag:** a 24px squared label (4px), hairline border, ink-2 text, for neutral categorisation such as course type.

### Concept Plate (unofficial-concept notice)
A station notice in the caution aspect, bolted under the BAUST name on the sign-in frame's flag-green panel at every size. It exists because the public site uses BAUST's name and crest, so it is never hidden, collapsed or staged as part of any animation.
- **Style:** caution wash ground, caution text, a 1px border of caution-fill at 55%, 4px corners, 10px 14px 11px 12px padding, capped at 27rem.
- **Content:** a 16px line warning-triangle icon beside a condensed capital plate title (700, 0.75rem, width 78%, 0.07em) over one body-small sentence. It is announced as a note.

### Cards / Containers (Panels)
- **Corner Style:** 10px.
- **Background:** panel white.
- **Shadow Strategy:** none (see The Ruled Panel Rule).
- **Border:** 1px hairline; danger panels switch to danger-line with a washed head.
- **Head:** a 52px band row with a hairline under it, the band voice on the left and a green module link with a chevron on the right.
- **Group head:** a group of rows inside a panel can open with a band-voice head at 0.8125rem over a hairline ("5 under 75%", "Not registered yet"). It is ink-2, or maroon on a 45% danger-wash block when the group is bad news. It heads rows; it is never a kicker over a title.

### Inputs / Fields
- **Style:** 44px tall, panel white, 1px strong-hairline border, 6px radius, 14px side padding; label above in 0.8125rem medium ink-2.
- **Focus:** border goes to ink, plus a 3px green halo at 18% strength.
- **Error:** border turns maroon; the field shakes once using the shake recipe.
- **Text area:** the same recipe for longer text (posts, return notes, reasons), at least 7rem tall, 10px by 14px padding.
- **Score field:** a compact numeric field that sits in a table cell for marks entry: 72px wide, 36px tall, 10px side padding, tabular figures aligned right, no spinner buttons. Same focus recipe; the border turns maroon when the score is invalid, and the reason ("Out of 10") sits beside the student's name in maroon.

### Action Bar
A white bar with 10px corners and the float shadow that stays with the work on long sheets (the roll, marks entry, grading). It is sticky: 12px above the phone tab bar and safe area, 20px from the bottom on large screens. It holds the sheet's live count on the left ("44 present · 1 absent · 0 late") and its actions on the right, with the primary action last. It floats, so it is not a panel; it is the only sticky surface inside the content column.

### Tables
Timetable voice: sticky concrete-2 head in the label style, 16px cell padding, hairline rows, tabular right-aligned numbers, and a concrete-2 footer under a strong hairline for totals. Row hover tints to concrete 2 at 60%. Tables wider than their panel sit in a sideways-scrolling region (see Layout); the Bills statement is a ledger that reshapes by container width instead.

### Navigation
- **Desktop rail:** flag green, crest and wordmark at the top, modules grouped under condensed-capital labels in rail-ink-2, 18px lucide line icons. Rows are 40px with 6px radius; hover goes rail-hover. The active row recesses to rail-deep, switches to the band voice, turns its icon amber and carries an amber you-are-here dot.
- **Tabs:** a sliding pill on a concrete track for in-page filters; an underline variant with a 2px green bar for course-space tabs. When the underline strip is wider than its column (the course tabs on a phone), it scrolls sideways, brings the active tab into view, and fades each clipped edge out over 2rem so the hidden tabs read as more to scroll, not as missing.
- **Mobile:** green header band, full-bleed board, five-slot bottom tab bar with the bar shadow.
- **Command menu and menus:** floating white, 10px radius, 6px inner padding, 38px items with 6px radius.

### Departure Board (signature)
A board-black strip, 44px high (48px and full-bleed on phones), split into cells by board-line rules. Each cell stacks a dim amber label over an amber or cream tabular capital value: NOW, UNTIL, COURSE (code in amber, title in cream), ROOM, with pause and pager controls at the right. Cell widths are fixed so the character roll never shifts layout. When the next service changes or the board rotates, values roll character by character (GSAP ScrambleText, about 0.5s plus 12ms per character). The roll is pausable and is skipped entirely under reduced motion, which also stops rotation and the live dot's pulse.
- **Action cell:** when the class on now has an action due (on the teacher side, its roll), the place cell turns amber with board-black value text and offers it: ROOM 309 over TAKE ROLL. The whole board is the link; hover mixes 12% white into the amber. Only the live class can set it, and the board drops the action on the page it leads to. Nothing else on the board fills amber.

### Roster (teacher side)
A section drawn as its students, in roll order. The teacher's dashboard reads it (who is slipping, who is waiting); the roll writes it (who is absent).
- **Grid (tablet and desktop):** cells at least 70px (4.375rem) wide on a 6px gap, at least 56px tall, panel white with a 1px hairline and 4px corners. The roster number sits at the top; the first name sits under it in body text at 0.6875rem, ink-2, normal width. Students who share a first name get as much of the surname as tells them apart ("Sourav Ra", "Sourav Ro"); the full name is in the cell's label.
- **Rows (phones):** one student per row, ruled by hairlines like a panel's rows, 44px minimum, 16px side padding: the roster number, then the full name at 0.8125rem, then anything the row needs to say (why the student is marked, or Absent / Late). On a phone a filter or search removes rows instead of dimming them.
- **Section watch marks:** danger-wash with a danger hairline and a maroon number (under the line, or a RIB course not registered); caution-wash with a 40% caution-fill hairline and an ochre number (close to the line, or carrying a RIB course). An inbox glyph in the corner means the student is waiting on the teacher. A filter (or the roll's search) dims the cells it leaves out to 32%, so the grid keeps its shape.
- **Roll states:** absent fills the cell solid maroon with white text (dark ink in the dark theme); late takes the caution aspect. Everyone starts present, so present is the plain cell. Colour changes run 220ms on the house ease and go instant under reduced motion. A tapped cell gives (in to 0.88, back on the press spring) and, with sounds on, ticks; the cells arrive one after another, 7ms apart, like a board filling in. Grid cells press at 0.96 like buttons; full-width rows don't scale.

### Term Line
A horizontal timeline of the term's stops (classes began, CT-1, CT-2, Mid Term, CT-3, last class, finals, results). Passed stops are filled green on a green track; the current point is an amber dot with a surface and amber halo; the next stop is an open green ring; future stops are open grey rings on a hairline track. Labels sit underneath in the label voice with dates in body small.

### Landing Intro (the one arrival)
The world's one sanctioned page-load sequence. It plays only on "/", once per browser tab session, for signed-out visitors who allow motion; reduced-motion visitors and signed-in students never see it and go straight to sign-in or the dashboard. When it is due, the document's first paint is already the platform green (deep rail green in the dark theme), and the sign-in page waits underneath with its signs hidden.
- **Grammar:** one GSAP timeline with expo.out arrivals. The crest assembles from its own parts: the shield and ribbon go solid, the gear turns onto its axle, the buildings rise bar by bar, the pulse line wipes left to right, the lettering settles. The title rises out of a mask, then the subtitle and the board arrive, and the board rolls a station announcement with ScrambleText.
- **Glide:** a power3.inOut glide of about 0.95s narrows the platform green onto the sign-in panel while every sign (crest, title, subtitle, board, concept plate) lands on its live counterpart in the sign-in page, and the form slides in. As it lands the board re-rolls to the sign-in board's values, in the same fixed cells, clipping characters rather than showing an ellipsis mid-roll.
- **The plate stays:** the concept plate is never part of the animation. It is on screen from the first frame and never leaves. It also never hides the crest's flight: side by side (desktop), the plate holds at top centre while the crest flies past, then slides into its slot once the crest has landed, and the two never overlap; stacked (phone), where the plate's slot lies across the crest's path, the plate settles first and the crest, already near its final size, passes briefly over the plate's left end.
- **Crest on green:** the crest's black year ("2015") takes the reversed white form (rail ink) on the platform green; nothing else in the crest changes.
- **Skip:** a "Skip intro" button on the green (rail-line inset border, rail-hover on hover), any key that is not a navigation or modifier key, or a tap.

**The Calm Records Rule.** Springs, bursts and sounds belong to what a visitor does. Records (results, GPA, dues, attendance, referred and backlog courses) only fade in and fill; they never bounce, celebrate or chime.

**The One Arrival Rule.** The landing intro is the only authored arrival sequence in the system. No other route may borrow its timeline, its glide or its crest assembly. Pages inside the portal may arrive (see Motion), but only as a quick fade and a capped stagger that never holds back input.

### Motion
Playful actions, calm records. transitions.dev recipes on one easing, `cubic-bezier(0.22, 1, 0.36, 1)`, carry everything a visitor reads; three springs, sampled from damped springs into CSS `linear()` curves, carry everything a visitor touches.
- **Springs:** `--spring-press` (650ms, back past rest by about a fifth of the press depth) for presses; `--spring-pop` (590ms, about 13% overshoot) for things that land: dialogs, menus, toasts, new rows, roster cells; `--spring-soft` (470ms, about 3%) for things that slide: the tab pill, the search lens. Overlays land on a spring and leave on the quick ease.
- **Pages:** a page fades in over 160ms while its header and panels rise 14px one after another, 45ms apart, on a spring (the motion library's variants). Everything is clickable from the first frame. Course spaces keep the page still and slide the tab content in from the side the new tab sits on.
- **Lists:** rows in a queue (registrations waiting for approval) leave sideways and the rest close the gap; rows and posts the visitor has just added pop into place.
- **Records:** meters fill from empty when they first appear (900ms, ease-out, no overshoot); skeletons reveal at 400ms through a 2px blur. Nothing on a record bounces.
- **Sheets:** on phones a sheet follows a drag on its head; let go past 96px or with a quick flick and it closes, short of that it springs home.
- **Bell:** when a new notice arrives the bell rings once and the count pops; the first load stays still.
- **Theme:** a theme chosen from the display menu spreads from where it was chosen, a circle wiping across the page (a view transition, 560ms).
- **Finished tasks:** see Celebrations.
- **Reduced motion:** springs, staggers, slides, bursts and scenes stop; fades, fills and colour changes that carry state remain, and the theme simply switches.
- Reordering lists use GSAP Flip. The board's roll stays GSAP ScrambleText.

### Celebrations
A finished task is stamped, like a ticket at the barrier. The success toast swaps its icon for a stamp (a mint ring with a check, set at -9°, landing from 1.9x with its ink spreading a moment later), and a burst of tickets and squares in flag green, amber, platform cream and proceed green goes off from the button that finished the task.
- **Big** (two bursts, about 120 pieces, the three-note chime): RIB registration received, a payment made, marks or grades published.
- **Small** (one burst, about 34 pieces, the two-note chime): work handed in, a roll saved, a registration approved, a post, a lecture or an assignment put up, marks or grades updated.
- **Never:** on reading a record, on a draft, on returning a registration, on any bad news. Bursts are lazy-loaded (canvas-confetti), never block input, and don't play under reduced motion.

### Sounds
Off until a visitor turns them on (display menu, "Sounds"). Synthesised with Web Audio, no files, all quiet: a tick and a tock for toggles (roster cells, pins, segmented filters), a soft pop when something appears, a two-note station chime for a finished task and a three-note one for a big one, a filtered whoosh for the theme, and a low thud when something didn't save.

### Empty and Error Scenes
Empty states and error pages open with a small railway scene (200 by 120, line work in ink-3, the train in primary green, lamps in the signal aspects) that plays once on hover or tap. Each scene has a meaning: the **platform** (nothing has arrived yet; a train pulls in and out), the **semaphore** (not open yet; the arm lifts and the lamp turns green), the **lens over a dead-end track** (nothing matched; the lens follows the pointer), the **guard's green flag** (all clear; it waves), the **level crossing** (something is blocked; the lamps take turns and the barrier tries to lift), and the **buffer stop** (end of the line, page not found; a train rolls up and bumps). Titles may carry the railway voice ("No lectures have pulled in yet"), but the sentence under them still says what will appear and what to do. Scenes are hidden from assistive tech and still under reduced motion.

## Do's and Don'ts

### Do:
- **Do** use flag green for the rail and the one primary action in a view, and keep secondary actions secondary or ghost.
- **Do** set page titles in the signboard voice and panel heads in the module band; keep everything readable as a sentence in normal-width sentence case.
- **Do** use tabular lining figures for every aligned or live-changing number, and the Taka sign for money.
- **Do** separate content with 1px hairlines inside 10px-radius white panels on the platform-white ground.
- **Do** map every state onto ok, caution or danger, and use amber only for now and you-are-here.
- **Do** state bad news in maroon where the student will see it, with the action to resolve it alongside.
- **Do** answer what a visitor does on a spring and mark a finished task with the stamp and a burst sized to it; keep records on the exponential ease-out; stop every movement under reduced motion.
- **Do** render official records as white paper with the sample watermark in both themes.
- **Do** keep long sheets' save and publish actions in the sticky action bar, with the live count beside them.

### Don't:
- **Don't** put a shadow on a panel or a card; shadows belong to floating surfaces and the tab bar only.
- **Don't** let motion hold up a task: pages are usable from the first frame, staggers are capped, and no route borrows the landing intro's timeline, glide or crest.
- **Don't** introduce a new state colour, or use amber as decoration.
- **Don't** set body copy, descriptions or form labels in condensed capitals.
- **Don't** soften dues, failed or referred courses, or attendance shortfalls into grey.
- **Don't** put springs, bursts or sound on records or bad news, and don't add badges, streaks or emoji; a burst is only for a task the visitor just finished.
- **Don't** show photographs of people; avatars are tinted initials.
- **Don't** narrow a person's name to fit a cell; widen the cell, or give each student a row.
- **Don't** hide, collapse, fade or stage the unofficial-concept plate on the sign-in frame or the landing intro; its only movement is travelling with the intro's glide.
