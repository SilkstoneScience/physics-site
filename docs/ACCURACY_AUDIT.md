# Accuracy audits of the site

A record of what has been checked for accuracy, so the next audit can skip pages that haven't changed and look only at what is new. This file is not published on the website.

## Before starting another audit

1. Run `node tools/audit-status.mjs`. Its report has four parts, and together they are the whole job list for the next audit: **audited and unchanged** (a count: skip these unless the teacher asks; `--all` lists them); **changed since their audit** (for the question bank and the other lists of items it names the **new** and **edited** items by id, so only those are audited); **never audited** (every page, data file and diagram on the site with no record, so new work can't slip past); and **layout** (whether the stylesheets have changed, or pages have been added, since every page was last checked at phone width and in dark mode).
2. For a changed page, run `node tools/audit-status.mjs --diff themes/a1.html` and check **only the changed parts** (and anything they affect, such as a number reused later on the page). For a changed list of items, audit only the ids the report names.
3. Don't raise again the points the teacher has already decided (see "Decisions" below) or the optional points listed in `docs/audit-2026-11-fix-list.md`, Part 3, unless the page has changed there.
4. When a file has been checked and its fixes applied, record it: `node tools/audit-status.mjs --record <audit-name> themes/a1.html` (or `topics` for all 24 topic pages, or `layout` after re-checking every page at 375 px and in dark mode). Recording a list of items saves a fingerprint for each item. The record is `tools/audit/audited.json`; nothing in it is ever marked "changed" by hand, because the tool compares the files with their saved fingerprints every time it runs.

## Method (use the same one next time)

- **First pass:** one independent reviewer per page (a fresh agent that edits nothing). It reads the whole page and checks: every number recalculated with a script (worked examples, checks, text, captions, tables); the physics of every statement, common mistake and diagram (from the SVG coordinates); key-equation boxes and the `DATA_BOOKLET` entry against both data booklets; every Understanding and Guidance item of the guide, HL marking and "New for 2028" tags; worked examples (data given, hints and visible figures don't give the answer away); in-page links.
- **Second pass:** a different reviewer per theme re-checks every finding and sorts it: **clear slip** (objective, one obvious fix), **teacher's decision**, or **rejected**. It also searches the revision sheets, slide data, question bank and Think deeper files for the same mistake.
- Clear slips are fixed; the teacher decides the rest, a few at a time. Changed diagrams are looked at in the preview.

## Audit 2026-11 (12 November 2026)

**Covered:** all 24 topic pages (`themes/a1.html` … `e5.html`) and their entries in the Σ equations panel.

**Not covered:** the question bank, the Skills, IA, EE, CSP and exam-technique pages, practicals and simulations, Think deeper, the review games, lesson-slide data and revision-sheet summaries (these were only searched for copies of mistakes found on the topic pages); layout at 375 px and in dark mode (only the changed diagrams and new paragraphs were looked at); the Maths AA/AI section numbers in the maths-link boxes; whether PhET simulation controls match the task wording (C.2 "Stopwatch"/"Timer" and "Increase the tension" need a look in the live simulation).

**Result:** 110 points raised after the second pass (6 first-pass findings were rejected).

- **31 clear slips fixed** (C1–C31). The main ones: B.4 coins entropy (10⁻²⁴ → 10⁻²³); C.1 a–x graph drawn with a positive gradient (the C.1 slide deck uses the same figure); D.2 solenoid field lines crossed; D.4 coil emf graph sign; E.3 "binding energy per nucleon" and neutrino numbers; B.4 483 °C; working lines that didn't reproduce their answers; the same spin-dryer slip in `teachers/slides/a4.json`.
- **33 teacher's decisions** (D1–D33), all settled, listed below.
- **46 optional points** (J1–J46): the pages are defensible as they are; the teacher has not gone through them. They are in `docs/audit-2026-11-fix-list.md`, Part 3.

The reviewers' reports, with the exact old and new text, are on the teacher's main computer in `C:\dp-physics\accuracy-audit-2026-11` (outside the repository).

### Decisions (keep following these)

| No. | Page | Decision |
|---|---|---|
| D1 | A.1 | Non-uniform acceleration is 2025 content: "New for 2028" tag and note removed (page and revision sheet). |
| D3 | A.2 | "Linear velocity" is clarified wording: tag and note removed (page and revision sheet). |
| D5 | A.3 | Note about "kinetic" energy and energy density per unit volume deleted. |
| D9 | B.1 | **Left as it is** (teacher's decision): the "luminosity is synonymous with radiated power" and "apparent brightness is synonymous with intensity" statements keep their "New for 2028" tags beside I = P/A. |
| D16 | C.2 | I ∝ A² is stated only inside its "New for 2028" block. |
| D33 | E.5 | **Left as it is** (teacher's decision): the Chandrasekhar and Oppenheimer–Volkoff limits stay named, untagged, in the evolution lists and a check answer, as well as in the tagged block. |
| D12 | B.2 | The resonance model's limitation: it can't explain absorption one photon at a time or the detailed pattern of sharp lines (not "why only certain frequencies"). |
| D17 | C.3 | White light, single slit: blue-inside, red-outside describes each side maximum. |
| D26 | E.1 | **Order of magnitude of a nucleus is 10⁻¹⁵ m** (Hodder, Kirk and the Skills page agree), so the atom is about 100 000 times wider. |
| D27 | E.1 | Visible hydrogen absorption lines need atoms already in n = 2 (hot hydrogen); one sentence added. |
| D8 | B.1 | The example says "average *translational* kinetic energy of a molecule in air" (air kept, not changed to helium). |
| D11 | B.2 | "The bend and the asymmetric stretch are the vibrations that absorb infrared." |
| D10 | B.2 | −18 °C is "without the greenhouse gases in its atmosphere". |
| D15 | C.1 | Angular frequency: the angle covered per second, ω = 2πf. |
| D2 | A.2 | Vertical-circle diagram kept; caption says the arrows are not to scale. |
| D22 | D.2 | Dipole equipotential caption says the lines are not at equal steps of potential. |
| D32 | E.5 | An 8-solar-mass star leaves a white dwarf "below" (not "well below") 1.4 solar masses. |
| D14 | B.5 | "A battery of emf 9.0 V". |
| D19 | D.1 | The satellite example gives GM and the Earth's radius. |
| D31 | E.5 | The Sun photo caption no longer gives the mass-loss rate (the worked example finds it). |
| D18 | C.4 | Guitar example: lengths given to 3 s.f. (0.650 m, 0.490 m). |
| D20 | D.1 | New paragraph: escaping from orbit (extra energy GMm/2r, speed × √2). |
| D21 | D.1 | New bullet: equipotentials in the uniform field near a surface. |
| D24 | D.4 | ε₀ = NBAω: "you won't be asked to quote it", but rotating-coil average emf can be calculated from ε = −NΔΦ/Δt. |
| D25 | D.4 | New paragraph: a magnet on a spring above a coil. |
| D4 | A.2 | The HL 2D-collisions part keeps its two HL tags only; the Collision Lab box after it is marked with a grey **SL** tag (`tag think-sl`) to show where SL resumes (teacher's choice, instead of the full HL layout). |
| D23 | D.1, D.2, E.1, E.3 | HL check questions use the orange HL tag, not plain "HL:". |
| D30 | E.4 | SL answers don't use "band of stability" (an HL term from E.3). |
| D6 | A.5 | Michelson–Morley: "no change, and later repeats at other times of year agreed". |
| D7 | A.5 | Lorentz found the equations; FitzGerald suggested length contraction. |
| D29 | E.2 | Planck: energy emitted in packets; Einstein: light itself travels as packets. |
| D13 | B.3 | The page description says "pressure from the rms speed". |
| D28 | E.2 | The Σ panel's Compton entry matches the key box: Δλ = λf − λi = … |

Done in the same session, outside the audit: **Theme B's own colour is raspberry** (`--theme-b-id`), so it no longer clashes with the HL orange.

## Audit 2026-11b (13 November 2026): question bank, Skills page, review games, layout

**Covered** (same two-pass method; recorded in `tools/audit/audited.json` as `2026-11b`):
- **Question bank, hand-written:** every question in `questions/a.json` … `e.json` (about 450), one reviewer per topic: answers re-solved, one correct option only, explanations and mark schemes, typed-answer fields and ranges, diagrams, levels and `y2028` tags.
- **Generated questions:** all 20 Paper 1B datasets and 31 Paper 2 questions, read as a student sees them. They are frozen after approval, so nothing was changed: every point is a teacher's decision that needs a recipe change and re-approval.
- **Skills page** (`skills.html`), against its agreed conventions, the guide's Tool 3 and the data booklet.
- **Review games:** the three mysteries and their teacher pages, the nine Newsroom articles, the Explanation builder, the estimation challenges, the word games and the Mission log (Mission to Europa) with its teacher page.
- **Layout:** all 73 published pages at 375 px wide (anything wider than the screen) and in dark mode (text contrast below 3:1, hard-coded colours).

**Not covered:** Think deeper (concept challenges and big questions: reviewed twice when written), the IA, EE, CSP, exam-technique and ToK pages, the practical and simulation pages' content, lesson-slide data, revision-sheet summaries, the escape room (it only reuses the question bank). Layout was checked by script, not by eye on every page; at the end of the session the preview pane stopped drawing, so two diagram fixes are waiting for a look (T56, T57).

**Result**
- **Question bank:** no wrong stored answer and no second correct option in any hand-written question. About 30 clear slips fixed: explanations that named the wrong slip (A2-011, A3-024, A3-025, B4-006, C2-002), working lines that didn't give their own result (A3-021, C3-022, E3-004), typed-answer ranges that rejected an answer the mark scheme accepts (A3-021, A3-022, C1-018, E4-012), stored answers that should be unrounded, the A4-013 dimension arrow, and "hotter and denser" for a massive star's core (E5-015 and `themes/e5.html`: the core is hotter but less dense).
- **Skills page:** one working line fixed (2.56 × 10⁹ s). The orders-of-magnitude rule against its table, and the free-body diagram, are teacher's decisions.
- **Games:** Meteorite kettle clue now gives the right feedback for 214 s; one Newsroom correction ("vertical velocity"); one Explanation builder order (EX-B4-01) and one decoy reason (EX-E2-01); teacher-page answer lists completed; Mission log docking feedback and marking description corrected.
- **Layout:** one fault found and fixed. Hidden screen-reader text in a scrolling table made the virtual pendulum page 556 px wide on a phone; `.table-wrap` is now `position: relative`. No dark-mode contrast problems (dark text on coloured Sankey bars is deliberate and reads well; question-bank diagrams sit on a white card).
- **Teacher's decisions:** 57 points, listed in `docs/audit-2026-11-part2-decisions.md` (T1–T57). Add each outcome here as it is decided, then record the changed files again with `node tools/audit-status.mjs --record 2026-11b <file>`.

**Lessons for the next audit**
- A reviewer that reports "all correct" must still write its report file: check the file exists (the first C.2 review was lost when a usage limit hit; the repeat found a point the first had missed).
- Typed-answer ranges are the commonest fault in structured questions: test what a student gets by carrying rounded values forward, with `js/numeric.js`, not just the unrounded answer.
- `position: absolute` hidden text inside an `overflow: auto` box can widen the page; the 375 px scan should measure `document.documentElement.scrollWidth`.

### Decisions from audit 2026-11b (14 November 2026; keep following these)

| No. | Where | Decision |
|---|---|---|
| T16–T18 | Skills page, orders of magnitude | The table stays; the rule says values with a between about 2 and 5 are borderline and either power of ten is accepted (speed of sound 10², visible light 10⁻⁷ m). |
| T21, T22, T24, T25 | Skills page | Matches the data booklet: conversions sentence corrected, a note that the booklet writes A_H and A_V, hecto/deca/deci added, volume of a prism added. |
| T23 | Skills page | The subtraction example gives (13 ± 1) °C: uncertainties from scale readings keep 1 s.f. |
| T56, T57 | Skills page; A.2 | Free-body diagrams are drawn to scale: with a rope pulling partly upwards, the normal force arrow is shorter than the weight by the rope's vertical part. |
| T39, T40 | Mission log | Failure texts and captain's-log prompts are worded to be true whether the number or the choice was wrong (data only; no code change). |
| T41, T42 | Mission log | 6.3 AU stands ("Jupiter is a little further from the Sun than its average 5.2 AU"); the lander undocks on day 662 and lands on day 663, so it is away exactly 10 days. |
| T36, T43 | Ravensby mystery | The investors' meeting is on Friday; the Carnot answer accepts 20 (range 19.3–20). |
| T8, T5, T6, T3 | C4-013, B4-013 (d), B5-010, B1-002 | "two successive lengths"; efficiency "as a decimal" with feedback for 10; "An NTC thermistor"; "average translational kinetic energy". |
| T4 | B1-020 | Tagged `y2028`, to match decision D9 for the B.1 page. |
| T7 | D4-011 | Stays; its explanation says self-induction is needed only for exams up to 2027 (the 2028 guide deletes the one sentence that mentioned it). |
| T1, T2, T14 | A1-014, A2-023, E2-009 | A stone, not a golf ball; clearer feedback; line spectra are evidence for energy levels. |
| T26–T28, T33, T34, T44 | Newsroom, Explanation builder, Odd one out, Mission log teacher page | Applied as proposed (siren "sounds lower in pitch"; "intensity of the starlight"; L = Iω wording; "two or three" neutrons; an "also" line for OO-17; about 3,100 words per route). |
| T9–T13, T15, T19, T20, T29–T32, T35, T37, T38 | various | **Left as they are** (teacher's decision): each is correct as it stands or follows the guide's or notes' wording. Don't raise them again. |
| T45–T55 | Generated Paper 1B and Paper 2 questions | Recipes changed and the ten questions reset to drafts (A1-P02, B2-P01, B5-P01, C2-P01, LQ-H01; A1-B01, A1-B02, B3-B01, C5-B01, D1-B01). **Approved by the teacher on 14 November 2026** (recorded in the review files) and published again. LQ-H01 (b)(i) now accepts 1.01 to 1.02: the builder's ranges go to 3 significant figures, and that was judged better than accepting 1.0. |

Also noted and left: four Paper 1B answers (A1-B01 (b), B3-B01 (f), B5-B01 (b), E1-B01 (c)) need 3 significant figures, as their mark schemes say.

## The optional points from audit 2026-11 (J1–J46), settled 14 November 2026

Recorded in `tools/audit/audited.json` as `2026-11c` for the 14 topic pages that changed.

- **Applied (22):** J1 (trajectory equation not required), J3 (reaction time only for hand timing), J4 (any non-conservative force; some add energy), J6 (spring launcher: height from the starting position), J7 (A.4 hints point to ½Iω² in section 9), J9 (A.4 maths-link tags: AA SL 5.1, 5.5, 5.7, 5.9; AI SL 5.1, 5.5; AI HL 5.10, checked against the AA guide), J10 (θ = 0 or 180°), J12 (kettle: 4.03 × 10⁵ J, "a little over 3 minutes"), J13 (bath model's hour is for the original plug hole), J14 (carbon released as CO₂), J16 ("input energy", as the booklet: page, Σ panel, revision sheet), J19 (lamp graph "turned half a turn about the origin"; repeated sentence removed), J25 (PhET Wave on a String: "Lower the tension", because the slider starts at its highest setting), J26 (optical-fibre communication is infrared; visible light: vision, photography, endoscope lighting), J27 ("a medium with a higher refractive index"), J29 (nodes have no kinetic energy), J34 (2.65 × 10⁷ ≈ 2.7 × 10⁷), J38 (E.1 panel constants k, mₑ, u), J39 (E_max depends on frequency, not on brightness), J41 (half-lives "can be measured very precisely"), J45 (where the instability strip sits; E.5 page and revision sheet), J46 ("arc-second").
- **Left as they are (teacher's decision; don't raise again):** J2, J5, J8, J11, J15 and J37 (rounded ratios are fine when the exact ratio isn't needed), J17, J18, J20, J21, J22, J23, J28, J30, J31, J32, J33, J35, J36, J40, J42, J43, J44.
- **False alarm:** J24. The PhET tick-box really is labelled "Stopwatch" (checked in the live simulation's own labels).

The AA guide's text is now in the reference cache as `Maths AA Guide.txt` (extracted from `Curriculum/mathematics-analysis-and-approaches-guide.pdf` in physics-source), so maths-link tags can be checked on this computer.

**Stacked equations, found and fixed (14 November 2026):** twice, on the first load of a topic page after the preview pane had been idle (A.2, then A.4), MathJax broke displayed equations into a vertical stack of symbols. Cause, reproduced in a test: `displayOverflow: 'linebreak'` wraps a displayed equation to the page width at the moment it is first drawn and never re-wraps, so a page drawn in a window with almost no width (a hidden pane) kept its equations stacked after the window widened. At 375 px and wider nothing was wrong, including inside hidden solutions. Fix in `js/site.js` (just under the MathJax settings): when the page's width changes, MathJax re-measures and lays the equations out again (`rerender(20)`), which also re-wraps equations when a phone is turned sideways. Tested: 0 → 1000 px and 40 → 375 px (stack gone), 375 → 812 px (re-wrapped), solutions, hints and the Σ panel still work, no console errors.
