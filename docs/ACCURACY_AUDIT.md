# Accuracy audits of the site

A record of what has been checked for accuracy, so the next audit can skip pages that haven't changed and look only at what is new. This file is not published on the website.

## Before starting another audit

1. Run `node tools/audit-status.mjs`. It lists the audited pages as **unchanged** (skip them unless the teacher asks) or **changed since their audit**.
2. For a changed page, run `node tools/audit-status.mjs --diff themes/a1.html` and check **only the changed parts** (and anything they affect, such as a number reused later on the page).
3. Don't raise again the points the teacher has already decided (see "Decisions" below) or the optional points listed in `docs/audit-2026-11-fix-list.md`, Part 3, unless the page has changed there.
4. When a page has been checked and its fixes applied, record it: `node tools/audit-status.mjs --record <audit-name> themes/a1.html` (or `topics` for all 24 topic pages). The record is `tools/audit/audited.json`.

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
