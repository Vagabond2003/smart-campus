---
version: 1
slug: "src-pages-welcome-tsx"
primary_target: "src/pages/Welcome.tsx"
related_targets: ["src/pages/AuthFrame.tsx","src/pages/Login.tsx"]
---

## Scope

The landing intro at "/" (src/pages/Welcome.tsx), shown once per browser session to signed-out visitors, ending on the existing sign-in page. Visitor mode: Experience (the arrival itself is the work), handing over to Operate at sign-in.

## Audience, task, constraints

Anyone opening the public concept site, mostly BAUST students on phones and laptops. They should feel they have arrived somewhere specific, then sign in, activate an account or open the sample sandbox without friction. About 4 seconds, never blocking: Skip intro, any key or a tap skips; reduced motion and signed-in students skip it entirely. The unofficial-concept plate stays visible. Synthetic data only.

## Direction contract

THESIS: Arriving at Smart Campus is arriving at a station: the crest is put up like platform signage, the departure board announces the service, and the platform itself turns into the sign-in page. It refuses the category's splash (logo fade plus spinner) and the marketing hero with a call-to-action button.

OWN-WORLD: Saidpur Line unchanged. Flag-green rail drenches the whole viewport; the full-colour BAUST crest; the board-black strip with amber condensed tabular capitals; the caution-ochre unofficial-concept plate; Archivo on its width axis for the signboard title.

STORY: The visitor watches the crest assemble (shield, gear turning onto its axle, buildings rising bar by bar, the pulse line running, BAUST and the motto settling letter by letter, 2015), the board rolls SMART CAMPUS beside NOW BOARDING, then the green platform glides aside and every sign lands on its twin in the sign-in page, where they sign in or activate.

FIRST VIEWPORT: Desktop 1440x900: rail green full bleed; plate top centre at its sign-in width; crest centred, about 40vh tall; "Smart Campus" beneath at about 7rem with "Student portal"; the board centred under them at its sign-in width; Skip intro bottom right. Phone 390: the same column, crest about 50vw, title about 3.4rem, board full width, Skip intro bottom centre. Signature interaction: the glide, crest shrinking onto the sign-in crest while the board re-rolls to Today, Term, Week, Mid term as it lands. Motion grammar: one GSAP timeline, expo.out arrivals, ScrambleText for the board, power3.inOut for the glide.

FORM: Saidpur Line, inherited; storyboard pinned by the user ("Cinematic intro", once per visit); no concept roll (no seed); code-led, no image generation on this machine.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Memorable moment

The glide: the green platform slides aside while the big crest flies into the small crest of the sign-in page and the board re-rolls into the day's values.

## Unresolved decisions

None.
