# Paper 1B handoff (for the next Claude Code session)

Written 6 October 2026 on the teacher's first computer, after inspecting the repository and git state.
This file is in `docs/`, which `_config.yml` keeps off the published website.

> **Read section 0 first.** The repository is not in the state the teacher's handoff brief expected:
> all five pilots have since been **APPROVED**. Nothing has been changed to "fix" this; the teacher must decide.

---

## 0. IMPORTANT: verified state differs from the brief

The brief for this handoff expected: commit `75df41e`, D3/B5/E3 **TEACHER-REVIEWED**, A1/C4 **PHYSICS-REVIEWED**,
nothing APPROVED, and `questions/1b.json` **empty**. The repository actually shows (verified 6 October 2026):

| | Expected in the brief | Actual (verified) |
|---|---|---|
| Branch HEAD | `75df41e` | **`43ba436`** "Paper 1B: teacher approves all five pilots" |
| D3-B01, B5-B01, E3-B01 | TEACHER-REVIEWED | **APPROVED** |
| A1-B01, C4-B01 | PHYSICS-REVIEWED | **TEACHER-REVIEWED, then APPROVED** |
| `questions/1b.json` | empty | **contains all five datasets** (plus `questions/1b/<id>.json` data files) |

Why: after `75df41e`, the teacher wrote "approve those questions" in chat. Claude asked which ones; the teacher
chose **"All five"**. Claude then recorded, with `tools/1b/review.mjs`, TEACHER-REVIEWED for A1 and C4 and APPROVED
for all five, each `--by "Mr Silkstone (teacher)"` with `--recorded-by "Claude, from the teacher's instruction in chat"`,
and committed and pushed this as `43ba436` on `paper-1b` (not `main`).

**This handoff does not change any status** (as instructed). If the teacher's intention is that nothing should be
APPROVED yet, the next session should ask the teacher before doing anything, and, only with their agreement, either
revert commit `43ba436` on `paper-1b` (which restores the previous statuses and the empty `questions/1b.json`) or
record new statuses with `review.mjs`. Do not decide this alone.

The rest of this document describes the **actual** state.

---

## 1. Current git state (verified)

| Item | Value |
|---|---|
| Current branch | `paper-1b` |
| Current commit | `43ba436` Paper 1B: teacher approves all five pilots |
| `main` | `55295b2` (same as `origin/main`): **not modified** by any Paper 1B work |
| `origin/paper-1b` | `43ba436` (everything on `paper-1b` has been pushed; nothing unpushed) |
| Uncommitted changes | none before this handoff file was written; this file itself is **uncommitted** |
| Branches | `main`, `paper-1b` (local and on GitHub) |

Commits on `paper-1b` that are not in `main` (newest first):
```
43ba436 Paper 1B: teacher approves all five pilots
75df41e Paper 1B pre-scaling changes: review gate, freeze, traced numbers, independent audit
fda34d8 Paper 1B: two more pilots (A1-B01 launcher, C4-B01 standing waves)
903189f Paper 1B graphs: smaller point markers, error bars drawn on top
7b2dc9d Paper 1B: explicit physics models from vetted laws; fix E3 measurement model
d822ae3 Paper 1B dataset infrastructure: generator, validator, graphs, diagrams, tests
```
GitHub Pages publishes `main` only, so **none of the Paper 1B work is on the live site**. No pull request exists.
`paper-1b` has never been merged.

---

## 2. Project goal

Build a high-quality, **original** IB DP Physics **Paper 1B** question bank for the website.

- **Paper 1B is common to SL and HL.** The 2025 SL and HL Paper 1B papers are identical apart from the cover.
  Datasets use `level: "SL_HL"` and SL material only; HL-only topics (A.4, A.5, B.4, D.4, E.2) cannot have 1B datasets.
  (Paper 1A is **not** common: HL 1A includes HL material.)
- Paper 1B is **not** Paper 1A multiple choice with a table attached. Each question is a coherent experimental or
  observational investigation (dataset + linked parts) that genuinely assesses experimental and data-analysis skills.

---

## 3. Current development status

The pre-scaling architecture work (audit items C1, C2, H1–H6) is **complete**. Everything lives in `tools/1b/`
(not published; see `tools/1b/README.md`, the authoring guide).

| Part | Where | What it does |
|---|---|---|
| Physics laws | `laws.mjs` | 13 vetted laws with SI units, hand-worked reference values, limiting cases; each tested for dimensional consistency |
| Generator | `generate.mjs` | physics model → deterministic data (seeded) → derived columns → fits → results → table/graph/diagram/question text |
| Explicit physics | each dataset's `physics` block | scenario, principles, assumptions, derivation, relationship, parameters with units and plausible ranges; models built only from vetted laws, units checked at every step |
| Validator | `validate.mjs` | reads the published table and SVGs back; checks data, units, uncertainties, fits, claims, answers, graphs, vectors, circuits, standing waves, physics completeness, noise-free inversion, number tracing, propagation |
| Independent audit | `independent.mjs` | separate first-principles physics, units and fits for each dataset (section 8) |
| Uncertainty | `uncertainty.mjs` | declared propagation, IB worst-case sums (section 9) |
| Systematic effects | `systematic.mjs` | zero offset, calibration, drift, heat loss (section 11) |
| Graphs | `graph.mjs` | SVG graphs drawn from the data; site colour classes (dark mode); markers r = 3.2 with error bars drawn on top |
| Diagrams | `diagrams.mjs` | components: arrows/vectors, labels, current balance, circuits from a netlist, launcher (exact projectile path), vibrating string (exact standing-wave envelope) |
| Questions and mark schemes | dataset `parts` templates | every number printed through traced helpers; typed answers linked to computed results with accepted ranges; examiner graph/diagram shown in mark schemes |
| Review and freeze | `registry.mjs`, `review.mjs`, `reviews.json`, `frozen/`, `fingerprint.mjs` | statuses, fingerprints, snapshots, field-by-field change reports (sections 6–7) |
| Build | `build.mjs` | builds every dataset twice (determinism), validates, audits, works out status, writes production and preview files; `--report`, `--audit` |
| Tests | `test.mjs`, `fixtures/broken.mjs` | **264 / 264 passing** (verified 6 October 2026), including 54 deliberately broken datasets that must each be caught |
| Site checker | `tools/check.mjs` | runs all of the above on every push (GitHub Actions); verified **no errors** |

Website side: `js/questions.js` shows Paper 1B data (tables, inline SVG figures), an "SL & HL" tag, "↑ Data" links,
mark-scheme figures, lazy-loads each dataset's data file, and (on localhost only) the local preview with a
"Preview only: STATUS" badge.

**Number of pilots: 5** (section 4). Plus one older hand-written Paper 1B question, B3-001 in `questions/b.json`
(not part of the generator system).

---

## 4. The five pilots (actual current status: all APPROVED)

| Dataset | Topic | Context | Main data skills | Status (verified) | Fingerprint |
|---|---|---|---|---|---|
| A1-B01 | A.1 | horizontal spring launcher, 5 repeat ranges per height | mean and half-range, R² against h, gradient, testing a manufacturer's claim | **APPROVED** | `d80e06c3d542c364` |
| B5-B01 | B.5 | internal resistance of a cell, one anomaly | anomaly, intercept (emf), gradient (r), % uncertainty | **APPROVED** | `cea3828f8232c42c` |
| C4-B01 | C.4 | standing waves on a string | f against 1/L, given equation v = √(T/μ), μ, third-harmonic prediction | **APPROVED** | `21a693d524e9c792` |
| D3-B01 | D.3 | current balance | force direction, gradient, B, proportionality, combined uncertainty | **APPROVED** | `ee5c885af38c0e59` |
| E3-B01 | E.3 | half-life with background | background correction, completing a table, half-life from a curve, √N | **APPROVED** | `1178133f092a313a` |

Review history (in `tools/1b/reviews.json`): all five PHYSICS-REVIEWED by Claude (independent physics audit,
2026-10-06); D3/B5/E3 TEACHER-REVIEWED (recorded from the teacher's message that they were "reviewed and approved for
continued development"); A1/C4 TEACHER-REVIEWED and all five APPROVED from the teacher's chat instruction (section 0).

Status meanings:
- **PHYSICS-REVIEWED**: independently checked by Claude's physics audit, not yet reviewed by the teacher.
- **TEACHER-REVIEWED**: reviewed by the teacher for continued development, not yet approved for students.
- **APPROVED**: explicitly approved by the teacher for production. **Only APPROVED datasets are published.**

None of the five uses systematic effects (`systematic:` appears in none of the dataset files).

---

## 5. Production and preview

- **Production:** `questions/1b.json` (question "cards") plus `questions/1b/<id>.json` (each dataset's tables and
  figures). Only APPROVED, unchanged datasets go here. **At present it holds all five** (section 0). If nothing were
  approved it would be `[]`, and that is intentional.
- **Preview:** `questions/1b-preview.json` and `questions/1b-preview/` hold every other dataset that passes validation.
  They are in `.gitignore` and `_config.yml`'s exclude list (never committed, never published), and the question bank
  loads them only on `localhost`, marked "Preview only: STATUS". With all five approved, the preview is currently empty.
- The system **never publishes a dataset just because it passes automated validation.** Only an explicit APPROVED
  record (with a matching fingerprint) does. This is deliberate and part of the safety architecture.

---

## 6. Freeze / fingerprints (C1)

Every reviewed dataset (PHYSICS-REVIEWED and above) has a **fingerprint**: a SHA-256 hash of its physics block,
model expressions, noise, systematic effects, the **source code of every law it uses**, the data (rows, trials,
singles), every uncertainty value, the question wording, table HTML, captions and alt text, answers, accepted ranges,
mistakes and mark scheme. **Drawings (SVG) are excluded** (presentation). Derived-uncertainty *rules* are frozen
through their values, so rewriting a rule that gives identical values is not a change; any changed value is.

A snapshot of the fingerprinted content is kept in `tools/1b/frozen/<id>.json`. If a reviewed dataset would build
differently, for example because a shared law, rounding, fit or generator change, `node tools/check.mjs` **fails**
and reports the dataset, the changed fields (with the text around the change) and the previous and new fingerprints.
To change a reviewed dataset deliberately: `node tools/1b/review.mjs reset <id> --by "…" --note "why"`, then review it
again. Tests confirm that rewording, a physics change, a rounding change and a **shared-law change** each break the
freeze, and that a drawing-only change does not.

Why: at scale, a shared change must never silently alter assessment content that a person has already reviewed.

---

## 7. Review gate (C2)

```
DRAFT → AUTO-VALIDATED → PHYSICS-REVIEWED → TEACHER-REVIEWED → APPROVED
```
- Automated validation is **not** teacher approval; AUTO-VALIDATED is never stored, it is simply "passes, unreviewed".
- Physics review is **not** teacher approval.
- Only the teacher can approve for production. `review.mjs` refuses TEACHER-REVIEWED or APPROVED if `--by` names an
  assistant, AI, script or bot; anyone recording on the teacher's behalf adds `--recorded-by`.
- Records live in `tools/1b/reviews.json`: status, fingerprint, and a history of entries with reviewer, date,
  fingerprint, note (and `recordedBy` where relevant).
- Transitions only with `tools/1b/review.mjs` (`status`, `set <id> <STATUS> --by …`, `reset <id> --by … --note …`);
  reviews go in order (no skipping); a dataset can only be reviewed while it passes every check and is unchanged.

---

## 8. Independent physics audit (H2)

Principle: the system must distinguish **"the numbers are internally consistent"** from **"the underlying physics is
correct."**

`tools/1b/independent.mjs` is deliberately separate from the generator's physics: it imports nothing from `laws.mjs`
or `lib.mjs` (only the generator's *output*). For each dataset it holds a first-principles derivation and checks:
dimensions of every term (and dimensionless exponent arguments), limiting cases, expected magnitudes, that the
generator's noise-free values equal the independent physics (to 1 part in 10⁹), that the **published** data scatter
fairly about it (no bias, given the declared noise and any systematic effect), parameter recovery from the published
table (within its own max/min-line range), and the published answers. Every dataset must have an entry or it fails.

Result: **all five pilots pass.** The original E3 physics error (counts modelled as instantaneous rate × Δt instead of
the rate integrated over the counting interval, about 4.5 % too high) was replayed exactly as a test: **the generator's
own validator found nothing; the independent audit found 11 errors** (462.5 vs 484.0 counts at t = 0).
**This is a key architectural feature: do not remove or weaken it.**

---

## 9. Uncertainty system (H3)

Measured columns: constant uncertainty, `halfRange` of repeat readings, or none. Derived columns **declare** their
propagation in `uncertainty.mjs` form, using the IB convention of **worst-case linear sums**: absolute uncertainties
add for sums/differences; fractional uncertainties add for products/quotients; a power multiplies by |n|
(first-order, not quadrature). Terms can use `'poisson'` (√N); deliberately ignored inputs are listed in `neglect`
with a reason. The validator **recomputes every derived uncertainty independently** by numerically differentiating the
column's own formula, and fails if the declaration doesn't match the formula, misses an input, or "neglects" something
that isn't small (more than a third of the total). The pilots' uncertainty values were **unchanged** by this work
(fingerprints confirmed).

---

## 10. Units (H4)

`K` and `°C` are temperatures (°C → K adds 273.15); `ΔK` and `Δ°C` are temperature differences (no offset); `rad` and
`°` are angles, with their own pseudo-dimension. Rules: a temperature difference can't be used where a temperature is
needed (or the reverse); `°C` can't appear in a compound unit (use `Δ°C`, e.g. `J kg^-1 Δ°C^-1`); degrees are always
converted to radians; a plain number is never accepted as an angle, nor an angle as a plain number. Laws using these:
`thermal-energy` (Q = mcΔT), `pressure-law`, `force-component`. Existing unit conversions are unchanged.

---

## 11. Systematic effects (H5)

`systematic.mjs`: `zero-offset`, `calibration` (factor 0.8–1.25 only), `drift` (rate × a driver column),
`heat-loss` (k × driver must stay below 0.5). Each must state a physical **cause** and a **justification**, has
required parameters, is applied deterministically to the physics value before random scatter, appears in the
`--audit` report, and is reproduced separately by the independent audit. Noise-free physics checks use the pure
physics (without systematic effects). **None of the five pilots uses a systematic effect.** Tests show, for example,
that an un-zeroed balance (+0.05 g) shifts every D3 reading by 0.05 g and correctly breaks the "through the origin" claim.

---

## 12. Number tracing (H1)

Every number in question text, mark schemes, captions and alt text must be printed by a template helper (`d.sf`,
`d.dp`, `d.text`, `d.int`, `d.stated`), be shown in a data table (including the ± values in headings), or be on the
small whitelist: **integers 0–12 and 100**. Exponents, subscripts and `\tfrac12` are ignored. Numbers the question
states that aren't in the data are **stated constants** (`stated: { name: { value, dp, unit, source, from } }`): a
source is required, and `from` (when given) is checked against the parameter it comes from. The purpose is to stop
wording drifting away from the data and model. The 12 typed numbers found in the pilots were converted with
character-identical output (fingerprints unchanged).

---

## 13. Payload and loading (H6)

Measured: before, 162 KB of Paper 1B content was loaded on every visit to the question bank. Now
`questions/1b.json` holds only the question cards (**about 20 KB** for five datasets, currently 19.9 KB) and each
dataset's tables and figures are in `questions/1b/<id>.json` (21–29 KB each), fetched only when that question is shown,
with each figure stored once. Expected at about 50 datasets: about 200 KB up front instead of about 1.6 MB.
Verified at 375, 768 and 1440 px (light and dark): all data load, no overflow, no console errors.

---

## 14. Architecture audit and outcome

The architecture audit before scaling found:
- **CRITICAL**: C1 approved datasets not frozen; C2 no formal review gate.
- **HIGH**: H1 untraceable numbers in text; H2 independent audit outside the repository; H3 hand-written uncertainty
  propagation; H4 no °C/angle units; H5 no systematic-error modelling; H6 payload duplication and loading.

All were implemented in `75df41e`. Latest result: **no remaining CRITICAL or HIGH issues.**

---

## 15. Deferred MEDIUM/LOW items (not started; do not implement without the teacher's agreement)

- **Graphs**: log scales, tangent gradients, axis-break symbol, multiple series.
- **Diagrams**: further components (ray diagrams, field lines, wavefronts, thermal set-ups, multi-loop circuits).
- **Validator independence**: it still reads generated SVG by its markup and shares some code (fits, context) with the generator.
- **Accepted-range policy**: range widths are chosen per dataset (1 %, 3 %, 4 %, 5 %, 12 %).
- **Data realism**: seed acceptance rules (seeds are not chosen by a stated rule); "too perfect" check only for linear fits.
- **Input-level scatter** (noise on inputs propagated through the physics, e.g. reaction time).
- **x-uncertainty significance check** (B5 ignores a 10 % x-uncertainty at 0.10 A in its max/min lines).
- **Uncertainty rounding policy** (1 vs 2 significant figures; E3 shows ΔR to 2 s.f.).
- **Question structure**: (i)/(ii) sub-parts; row references by label instead of index; command-term checking;
  detecting a later part that gives away an earlier answer.
- **Mark schemes/UI**: revealing a mark scheme locks the typed-answer box; no automatic method marks.
- **Mobile**: graph text about 10 px on phones; no column-width check (5 columns fit at 375 px exactly).
- **Originality**: manual only (B5's values resemble a Nov 2025 Paper 2 question: r ≈ 0.8 Ω).
- **Other**: assembled "paper" view (2–3 datasets = 20 marks), print view, screen-reader label for the blank "?" cell,
  E3's omitted point has no plotting task, D3's clamp rod is drawn inside the magnet gap, A1 is 11 marks (slightly long),
  C4's graph includes the origin (data use part of the axis), splitting `validate.mjs` by area.

---

## 16. Paper 1B design principles (agreed during development)

- Paper 1B is common to SL and HL (SL material only).
- Data must be central; parts form a coherent, linked investigation.
- The dataset must be physically plausible; the physics model is explicit and built from vetted laws.
- Experimental variation must have a defensible physical/measurement basis: **no arbitrary random noise**.
- Graphs are generated directly from the validated dataset, never drawn to fit an answer.
- Diagrams must be physically correct (directions, geometry, circuits, wave patterns are checked).
- Accepted ranges must be justified.
- Physics must be independently checked.
- Automated validation does not replace human assessment judgement; human review remains essential for wording,
  pedagogy, originality and reasoning.
- Existing reviewed or approved content must never silently change.
- Do not scale until the assessment specification is robust.

---

## 17. Error bars and graph visuals

Some error bars were hard to see because the point markers (radius 4.5) covered them; E3's shortest bar was hidden
entirely. Fixed in `903189f` by rendering only: markers radius 3.2, error bars drawn on top of the points, caps ±5.
Point positions, bar end coordinates, data and uncertainties were verified unchanged.

**Rule: never increase numerical uncertainties to make error bars easier to see.** Uncertainty values must stay
scientifically correct; fix visibility in the drawing only.

---

## 18. NEXT MAJOR TASK: legacy Paper 3 analysis

This is the most important next task.

**Scope:** analyse **only the initial experimental/data-analysis questions** of the previous syllabus's **Paper 3**:
the questions that come **before** the option-topic sections (Section A). **Do not analyse the option-topic questions.**

**Where:** `physics-source/copyrighted-reference/Past Papers/` (physics-source's location on each computer is in
`CLAUDE.local.md`). The relevant papers are the previous syllabus (first exams 2016, last Nov 2024): folders
`2016` to `2024` (some years have few or no Paper 3 files). **Verify** that each paper actually has an
experimental section A: the older 2009-syllabus papers (`2013`–`2015`, `Pre 2013`) are believed to have option-only
Paper 3s and are probably out of scope; confirm rather than assume, and ask the teacher before widening the scope
(for example to the old Paper 2 data-analysis question). Read PDFs with `tools/pdf-extract` (see `CLAUDE.md`) and save
extracted text in this computer's reference cache (e.g. a `past-papers-legacy/` folder), **never inside physics-site**.

**Why:** Section A assessed experimental and data-analysis skills relevant to current Paper 1B. The format has
changed: old Paper 3 was tied to prescribed practicals, while current Paper 1B can use any appropriate practical or
observational context. So use the old material to identify **transferable skills and question structures**, not to
reproduce old practicals or formats.

**Investigate:** repeated measurements, averages, range and half-range, uncertainty, instrument resolution,
significant figures, variables and control variables, data processing, transformations/linearisation,
proportionality, gradients, intercepts, graphing, anomalies, experimental design, random and systematic errors,
evaluation, apparatus, experimental reasoning, model testing, question sequencing and progression of difficulty.
Then **compare the findings with the five current pilots** (what they cover, what is missing or weak).

**During this analysis do NOT:** create questions or datasets, modify the generator, modify the five pilots,
change review statuses, merge, or deploy.

---

## 19. Sources and originality

IB past papers, mark schemes, textbooks and other sources are **reference only**. Do not copy or lightly paraphrase
question wording, datasets, numbers, diagrams, answer choices, mark schemes or contexts. Use them only to understand
assessment patterns, command terms and skills. All future Paper 1B material must be genuinely original (see the
copyright rules in `CLAUDE.md`).

---

## 20. What not to do

The next session must NOT:
- merge `paper-1b` into `main`, or deploy;
- create 40–50 datasets at once;
- approve datasets automatically, or record a teacher review without the teacher's explicit instruction;
- recreate the five pilots unnecessarily;
- copy old IB questions;
- treat validator success as teacher approval;
- silently modify reviewed or approved datasets (if the checker reports `frozen-changed`, stop and tell the teacher);
- change numerical uncertainties to improve graph appearance;
- analyse the old option-topic Paper 3 questions as part of the next task.

---

## 21. New-computer setup

1. `git pull` (on `paper-1b`: `git checkout paper-1b` if needed). Check `CLAUDE.local.md` exists for that computer.
2. Run `node tools/1b/build.mjs` to rebuild the generated files and the local preview (the preview is not stored in
   git). With all five approved, the preview will currently be empty and the five appear from `questions/1b.json`.
3. Run `node tools/check.mjs` (expect "No errors") and `node tools/1b/test.mjs` (expect 264 passed).
4. `node tools/1b/review.mjs status` shows each dataset's status and fingerprint.
5. Preview the site with `preview.bat` or the `physics-site` preview, then open `questions.html?paper=1B`.

---

## 22. Recommended next steps

1. Read this handoff.
2. Inspect the repository.
3. Verify the git state.
4. Confirm the handoff matches the actual repository (and raise section 0 with the teacher).
5. Analyse ONLY the initial experimental/data-analysis section of the legacy Paper 3 papers.
6. Produce the legacy Paper 3 skill/assessment analysis.
7. STOP for human review.
8. Use that analysis, together with the current IB Paper 1B requirements and the five pilots, to develop a formal
   Paper 1B assessment specification.
9. Review and refine the five pilots against that specification.
10. Only after the assessment specification and pilots are satisfactory should scaling begin.
11. Scale in controlled batches rather than generating the whole bank at once.
12. Keep human review in the production pipeline.

---

## 23. How to resume

Do not assume previous conversational context.

Read this handoff first.
Inspect the repository and verify the actual git state.
The immediate next task is the legacy Paper 3 analysis described above.

Analyse ONLY the initial experimental/data-analysis questions before the old option-topic sections.

Do not create questions, datasets or code changes during that analysis.

Stop and report the findings for human review.
