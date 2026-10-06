---
name: Smart Campus
description: The BAUST student portal, set as a Bangladesh Railway timetable and departure board.
colors:
  rail: "#006a4e"
  rail-deep: "#00553e"
  rail-hover: "#0a7558"
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
---

# Design System: Smart Campus

## Overview

**Creative North Star: "Saidpur Line"**

The portal is a station. Bangladesh Railway at Saidpur supplies the whole material: a flag-green rail down the left edge, a board-black departure strip that always says what leaves next, and a platform-white concourse ruled by concrete hairlines. Everything a student reads is either a signboard, a timetable, or a signal. Records (results, receipts, admit cards) leave the station's voice and become paper: official BAUST documents on white, in both themes.

Density is operational, not decorative. Panels sit edge to edge on a 20px gutter, each opened by a condensed capital band and closed by its own hairline, so a laptop screen reads like a timetable page and a phone reads like the same timetable folded into one column. Colour carries meaning before it carries mood: green is the railway and the way forward, amber is "now" and "you are here", maroon is bad news stated plainly. The one authored motion is the board's character roll; every other change is a short exponential ease-out from a visible default, and all of it goes instant under reduced motion.

Light is the daylight platform and the default. Dark is the night-station rendition (deep rail green, near-black ground, mint primary, salmon danger) and keeps every role, including amber, unchanged in meaning.

**Key Characteristics:**
- Flag-green rail and primary actions; board-black strip with amber tabular capitals as the signature.
- Archivo on its width axis: condensed capitals for signboards, bands and timetable heads; normal width for UI and reading.
- Hairline-ruled white panels on a platform-white ground; shadows only for things that float.
- State as signal aspects: green proceed, amber caution or now, maroon danger.
- Tabular figures wherever numbers align; currency in the Taka sign.
- Exponential ease-out motion at 150 to 500 ms, no overshoot; the board roll is the one authored moment.

## Colors

A railway palette: one green that means "the line", one amber that means "now", one maroon that means "stop", over cool concrete neutrals.

### Primary
- **Flag Green** (rail / primary): the desktop rail, the phone header band, primary buttons, the selected tab underline, the "you" avatar, and completed stops on the term line. Its pressed and hover steps (primary-hover, primary-press) deepen it; it never lightens on light ground.
- **Rail Deep** (rail-deep): the active module row on the rail, a darker cut of the same green so the active row reads as recessed track, not a highlight.
- **Signal Link Green** (link): inline text links, panel "go to module" links, with a 35% tinted underline that goes solid on hover.

### Secondary
- **Board Amber** (amber): departure-board values, the "Now" signal, the you-are-here dot on the active rail item, the current stop on the term line, the student's own seat in the seat plan, the notification count, text selection, and the focus ring on rail and board. Amber marks presence in time or place; it is never decoration.
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

**The Amber Is Now Rule.** Amber appears only where it answers "when is it" or "where am I": the board, the current class, the current stop, the active module, your seat. If an amber element answers neither, it is wrong.

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

The ramp is a fixed rem scale at a ratio of about 1.2 (0.6875, 0.75, 0.8125, 0.9375, 1.0625, 1.25, 1.5, 1.875, 2.375rem). It is not fluid. One root font size (15, 16 or 18px from the user's text-size control) drives every rem.

### Named Rules
**The Two Widths Rule.** Condensed capitals are for things a station would paint on a sign: page titles, bands, column heads, the board. Anything a student reads as a sentence is normal width, sentence case.

**The Columns Align Rule.** Every number that sits in a column or can change in place (money, credits, GPA, times, board values, seat numbers) uses tabular lining figures. Only the single headline figure of a panel goes proportional.

## Layout

Desktop is a two-column shell: a fixed 264px flag-green rail, then a content column under a 64px sticky top bar holding the departure board and tools. Content is capped at 84rem and padded 32px (40px from the xl breakpoint). Below the large breakpoint the rail becomes a green header band with the board full-bleed directly beneath it and a 64px bottom tab bar, safe-area aware.

The dashboard overview is a two-column grid of equal-weight panels at 20px gaps on large screens, stacking to one column below. Inside panels the rhythm is 16 to 20px horizontal padding and 12px vertical row padding, with rows separated by hairlines rather than space. Spacing follows a 4px base; 8, 12, 16 and 20px carry almost all of it.

The departure board responds to its own width through a container query, not the viewport: below 40rem the service type and room fold into the time label and the pager leaves; below 30rem the cells tighten. The course title always stays and truncates.

## Elevation & Depth

Flat at rest. Depth on the platform comes from tone (white panels on platform-white ground) and hairlines, never from shadow. Shadows exist for exactly two things: surfaces that float above the page (menus, popovers, dialogs, sheets, and document paper) and the bottom tab bar's upward edge. Halo rings (a 3px spread of amber or surface colour, no offset) mark small live indicators such as the you-are-here dot and the current term-line stop.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 0 0 1px rgb(18 22 20 / 0.06), 0 4px 10px -2px rgb(18 22 20 / 0.08), 0 16px 40px -12px rgb(18 22 20 / 0.18)`): menus, popovers, dialogs, sheets, and official document paper.
- **Bar** (`box-shadow: 0 -1px 0 0 var(--line), 0 -8px 24px -12px rgb(18 22 20 / 0.12)`): the phone tab bar only.

### Named Rules
**The Ruled Panel Rule.** A panel is a white surface with a 1px hairline and a 10px radius. If it has a shadow, it is not a panel; it is floating.

**The Paper Rule.** Admit cards, receipts and other official records render as white paper with the float shadow and a 4px radius in both themes, carrying the sample watermark, and print without shadow or radius.

## Shapes

Gently squared. Controls (buttons, fields, menu items, rail items) use 6px corners; panels and menus 10px; the board 8px; tags, seats, skeleton bars and document paper 4px. Fully round shapes are reserved for signals, avatars, dots and the sheet grabber. Meter bars keep a square baseline and round only the data end. Borders are always 1px hairlines; there are no thick rules except the 2px tab underline and the 2px "now" marker on the routine.

## Components

### Buttons
Firm and quiet: medium weight (570), no shadow, a 0.96 press scale.
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

### Cards / Containers (Panels)
- **Corner Style:** 10px.
- **Background:** panel white.
- **Shadow Strategy:** none (see The Ruled Panel Rule).
- **Border:** 1px hairline; danger panels switch to danger-line with a washed head.
- **Head:** a 52px band row with a hairline under it, the band voice on the left and a green module link with a chevron on the right.

### Inputs / Fields
- **Style:** 44px tall, panel white, 1px strong-hairline border, 6px radius, 14px side padding; label above in 0.8125rem medium ink-2.
- **Focus:** border goes to ink, plus a 3px green halo at 18% strength.
- **Error:** border turns maroon; the field shakes once using the shake recipe.

### Tables
Timetable voice: sticky concrete-2 head in the label style, 16px cell padding, hairline rows, tabular right-aligned numbers, and a concrete-2 footer under a strong hairline for totals. Row hover tints to concrete 2 at 60%.

### Navigation
- **Desktop rail:** flag green, crest and wordmark at the top, modules grouped under condensed-capital labels in rail-ink-2, 18px lucide line icons. Rows are 40px with 6px radius; hover goes rail-hover. The active row recesses to rail-deep, switches to the band voice, turns its icon amber and carries an amber you-are-here dot.
- **Tabs:** a sliding pill on a concrete track for in-page filters; an underline variant with a 2px green bar for course-space tabs.
- **Mobile:** green header band, full-bleed board, five-slot bottom tab bar with the bar shadow.
- **Command menu and menus:** floating white, 10px radius, 6px inner padding, 38px items with 6px radius.

### Departure Board (signature)
A board-black strip, 44px high (48px and full-bleed on phones), split into cells by board-line rules. Each cell stacks a dim amber label over an amber or cream tabular capital value: NOW, UNTIL, COURSE (code in amber, title in cream), ROOM, with pause and pager controls at the right. Cell widths are fixed so the character roll never shifts layout. When the next service changes or the board rotates, values roll character by character (GSAP ScrambleText, about 0.5s plus 12ms per character). The roll is pausable and is skipped entirely under reduced motion, which also stops rotation and the live dot's pulse.

### Term Line
A horizontal timeline of the term's stops (classes began, CT-1, CT-2, Mid Term, CT-3, last class, finals, results). Passed stops are filled green on a green track; the current point is an amber dot with a surface and amber halo; the next stop is an open green ring; future stops are open grey rings on a hairline track. Labels sit underneath in the label voice with dates in body small.

### Motion
transitions.dev recipes with a single easing, `cubic-bezier(0.22, 1, 0.36, 1)`: dropdowns and dialogs open at 250ms and close at 150ms with a 0.96 to 0.97 scale, panels and sheets slide at 400/350ms, toasts at 350/250ms, tabs slide at 250ms, tooltips appear at 150ms after an 80ms delay, and skeleton content reveals at 400ms through a 2px blur. Reordering lists use GSAP Flip. The success check settles without a bob. No page-load choreography.

## Do's and Don'ts

### Do:
- **Do** use flag green for the rail and the one primary action in a view, and keep secondary actions secondary or ghost.
- **Do** set page titles in the signboard voice and panel heads in the module band; keep everything readable as a sentence in normal-width sentence case.
- **Do** use tabular lining figures for every aligned or live-changing number, and the Taka sign for money.
- **Do** separate content with 1px hairlines inside 10px-radius white panels on the platform-white ground.
- **Do** map every state onto ok, caution or danger, and use amber only for now and you-are-here.
- **Do** state bad news in maroon where the student will see it, with the action to resolve it alongside.
- **Do** animate only with the exponential ease-out at 150 to 500ms, and make every animation instant under reduced motion.
- **Do** render official records as white paper with the sample watermark in both themes.

### Don't:
- **Don't** put a shadow on a panel or a card; shadows belong to floating surfaces and the tab bar only.
- **Don't** use overshoot or bounce easings, or add page-load choreography; the board roll is the only authored moment.
- **Don't** introduce a new state colour, or use amber as decoration.
- **Don't** set body copy, descriptions or form labels in condensed capitals.
- **Don't** soften dues, failed or referred courses, or attendance shortfalls into grey.
- **Don't** add gamification devices (badges, streaks, confetti, emoji on records).
- **Don't** show photographs of people; avatars are tinted initials.
