# Paper 2 questions

Design rules: `docs/PAPER2_SPECIFICATION.md` (agreed with the teacher, 14 October 2026). This file explains how to
write a question file and what the tools check.

Questions are **built, never typed into the question bank**: each question is a file in `tools/p2/questions/`,
and every number in it comes from its given values and its calculation.

```
tools/p2/questions/A1-P01.mjs   one file per question (this is what you edit)
        ↓  node tools/p2/build.mjs
questions/p2.json               APPROVED questions only: never edit by hand (the checker would fail)
questions/p2-preview.json       everything else that passes the checks: local only, never committed
```

## Review status

As for Paper 1B: **DRAFT → AUTO-VALIDATED → PHYSICS-REVIEWED → TEACHER-REVIEWED → APPROVED**, recorded in
`tools/p2/reviews.json` with a fingerprint, and a snapshot in `tools/p2/frozen/`. **Only APPROVED questions are
published.** The question bank shows the others only on `localhost`, marked "Preview only". If a reviewed question
changes, `node tools/check.mjs` fails until the change is undone or the question is reset and reviewed again.
A review can only be recorded on a computer with the reference cache, because the originality check needs it.
Never record TEACHER-REVIEWED or APPROVED without the teacher's explicit decision.

```
node tools/p2/review.mjs status
node tools/p2/review.mjs set A1-P01 PHYSICS-REVIEWED --by "<name>" --note "…"
node tools/p2/review.mjs set A1-P01 TEACHER-REVIEWED --by "Mr Silkstone (teacher)" --note "…"
node tools/p2/review.mjs reset A1-P01 --by "…" --note "why it changed"
node tools/p2/review.mjs batch batch-1
node tools/p2/review.mjs accept-batch batch-1 --by "Mr Silkstone (teacher)" --note "…" [--waive <id> "<reason>"]
```

## Commands (from the physics-site folder)

| Command | What it does |
|---|---|
| `node tools/p2/build.mjs` | Builds and checks every question; writes `questions/p2.json` and the preview only if there are no errors |
| `node tools/p2/build.mjs --audit` | The same, and prints each question's given values, results, syllabus IDs, examiner notes, originality and checks, for the reviewer |
| `node tools/p2/test.mjs` | The tools' own tests (every rule is broken on purpose and must be caught) |
| `node tools/check.mjs` | The whole-site checker: also runs both of the above |

## Writing a question file

The full worked example is `GOOD_SHORT` in `fixtures/examples.mjs` (and `GOOD_LINKING` for a 20-mark question).

Short questions also need **sub-part tags**: `sections: [...]` on the question (sections of the topic page it uses,
main one first, e.g. `['projectiles', 'drag']`) and `sections` on every part. They are checked by
`tools/check-sections.mjs` and are **not** part of the review fingerprint (`canonicalContent` in `build.mjs` removes
them), so adding or changing them never affects a question's review. Linking questions aren't tagged.

```js
export default {
  id: 'A1-P01',                 // short: <first topic>-P<nn>; linking: LQ-S<nn> (SL) or LQ-H<nn> (HL). Never change once published
  title: 'Drone dropping a package',
  type: 'short',                // or 'linking' (exactly 20 marks, 4–6 lettered parts, 3+ themes)
  level: 'SL',                  // HL questions must test some AHL content
  difficulty: 2,
  topics: ['A.1'],              // the main topic first
  batch: 'batch-1',
  situation: 'package released from a descending drone',  // a few words naming the scenario (required from batch 2), compared with every other question
  originality: {
    inspiredBy: 'Daily Questions/A.1 - Kinematics/Q12.png',  // or null
    transcript: 'p2-daily/A.1/Q12.txt',  // its text, typed into the reference cache (never into physics-site)
    note: 'Same situation (an object released from a moving aircraft); new wording, numbers and parts.',
  },
  given: {                      // every given value, in the unit the question quotes it in
    h: { value: 45, sf: 2, unit: 'm', range: [10, 150], what: 'release height' },
  },
  calc: (v, K, h) => ({         // v: given values in SI units; K: data-booklet constants; h.sf(x, n) rounds
    t: { value: Math.sqrt(2 * v.h / K.g), unit: 's', sf: 3 },
  }),
  stem: '<p>… a height of [[h]] …</p>',
  parts: [{
    label: 'a', command: 'Show that', marks: 2, syllabus: ['A.1.7'],
    question: 'Show that the package falls for about [[t:2u]].',
    showThat: { result: 't', sf: 2 },
    markscheme: ['$[[h:n]] = \\tfrac{1}{2} \\times [[K.g]] \\times t^2$ ✓', '$t = [[t:3]]\\ \\text{s}$ ✓'],
    examinerNote: 'Vertical motion from rest.',
  }],
};
```

**Placeholders** (`tools/p2/generate.mjs`): `[[h]]` value with unit; `[[h:n]]` number only; `[[t:3]]` number to
3 s.f.; `[[t:3u]]` with unit; `[[x:lo]]`/`[[x:hi]]` the ends of a typed answer's accepted range; `[[K.g]]` a constant as
the data booklet prints it. Inside `$…$` they are written as MathJax, outside as page text. Backslashes are doubled,
as in JSON.

**Results**: `{ value (in SI units), unit (the unit shown), sf, range? }`. A result named `wrong_…` is a common
wrong answer, used only as `numeric.mistakes` feedback. `inUnit: true` means the value is already in its shown unit
(e.g. MeV from 931.5 MeV per u); such results are not dimension-checked.

**Parts**: `command` (an IB command term, which must start the task), `marks` (1–4), `syllabus` (IDs from
`syllabus.mjs`), `markscheme` (one ✓ per marking point; note lines start with OR, Allow, Accept, Do not accept,
Award, Note or "Any n from"), `examinerNote`, and optionally `dependsOn: ['a']` (then the mark scheme must allow
ECF), `numeric: { result, accept?: 0.05 or [lo, hi], tolerance?, anySign?, mistakes?: [{ result, feedback }] }`,
`anyOf: n` and `showThat: { result, sf }`.

**Click-to-plot graphs** (November 2026; `js/plot.js`). **Rule (teacher, 12 November 2026): every new "Draw" or "Plot" part that asks for a graph of data has a `plot`.** The validator warns (`plot-missing`) otherwise; a part that can't use it (a sketched curve, for example) gives the reason in `noPlot: '<reason>'`, which is not published. How it works: a "Draw" or "Plot" part can have `plot: { title, x: { min, max, step, major, symbol, unit }, y: { … }, points: [['I1', 'V1'], …], line: { gradient: 'grad', intercept: 'eps', toYAxis: true }, axes: 'questions/diagrams/….svg', ms: '…-ms.svg', msTitle }`. `step` is one small square and `major` the numbered lines; the points and the line are **named** given values or results, never typed. On the website the student taps to plot the points and drags to draw the line, and "Check my graph" marks it (every point within half a small square and no extra points; the line within one small square of the expected line across the data, reaching the y axis when `toYAxis`); the marks split as `marks: { line: 1 }` (default) with the rest for the points. `axes` must be the question's `diagram` (the blank axes, which printed revision sheets use), and `ms` the examiner's graph shown in the mark scheme. Both pictures are written from the same settings by `node tools/p2/plot-axes.mjs <ID>`: run it after changing a plot, or the build fails.

Units: written like `m s^-1`, `J kg^-1 K^-1`, `MeV c^-2`; `°C` is a temperature (+ 273, as in the booklet), `Δ°C` a
temperature change. The list is in `units.mjs`.

## What the build checks (`validate.mjs`)

| Check | Rule |
|---|---|
| Format | id pattern, type, level, topics, labels in order, marks 1–4, MathJax ($ pairs, doubled backslashes), units outside MathJax |
| Structure | short: 5–11 marks, at most one 4-mark part, an explanation part and a calculation part; linking: 20 marks, 4–6 lettered parts, a "Show that" used later |
| Command terms | on the IB list, and the task starts with it |
| Syllabus | known IDs from the question's topics; no AHL content in SL questions; HL questions test AHL content (linking: 4+ marks); short questions mainly their first topic; linking questions span 3+ themes |
| Not on the syllabus | the group 1 terms in `syllabus.mjs` fail the build unless the teacher waives them (`waivers.excluded.<id>: { by, reason }`) |
| Guidance limits | the group 2 limits are listed as warnings for the reviewer (and make the question AMBER) |
| Typed numbers | no number typed into the text (only placeholders, single digits, or `literals: { '60': 'reason' }`); no number typed into `calc` except 0–4 (or `calcLiterals` with a reason): constants come from `constants.mjs` |
| Dimensions | every result is recalculated with the base units rescaled, and must scale exactly as its unit says |
| Independent check | every result (except `wrong_…`) equals the separate calculation in `independent.mjs` to 0.01 % |
| Show that | the stated value is within 5 % of the true value and is a placeholder; the mark scheme gives more figures |
| Mark scheme | ✓ count equals the marks (or "Any n from" with more points); ECF where an earlier answer is used; examiner note |
| Typed answers | the stored answer is accepted; listed mistakes aren't; no typed answer on Show that / Explain parts |
| Plausible values | every given value (and any result with a range) inside its plausible range; given values not more precise than stated |
| Diagrams | file exists, alt text, `<title>`, font sizes on `<text>` not `<g>` |
| Originality | no 8-word run shared with an IB Paper 2 or mark scheme (2016–2025; runs in 5+ papers are stock phrasing and ignored); no 6-word run shared with the transcript of the Daily Question that inspired it. Needs the reference cache (found from `CLAUDE.local.md`) |
| Click-to-plot graphs | axes a whole number of small squares; every point on the axes and in the axis's unit; the named gradient and intercept agree with the least-squares line through the points; the correct graph earns full marks, and an empty graph, a point one small square out and a line two small squares out do not; the axes and examiner's-graph pictures match the settings exactly; the mark scheme shows the examiner's graph |
| Similarity | against every other Paper 2 question, generated or hand-written (`similarity.mjs`): a warning when the two share 20 % or more of their content words (same situation described twice?), an error at 40 % or when two generated questions declare the same `situation`; a warning when 3, and an error when 4, consecutive parts have the same command term and syllabus id as another generated question (vary the sequence of parts). Teacher's rule of 7 November 2026: the same concepts may be tested, but in a different situation and with a different sequence of parts |
| Show that (next figure) | a warning when the true value's next significant figure is 0 ("about 5.4" with 5.40): a student shows the value by giving one more figure, so change a given value |
| Determinism | building twice gives the same question |

## Files

| File | Job |
|---|---|
| `questions/` | the question files |
| `syllabus.mjs` | the 2025 understandings (our own short labels), the not-on-the-syllabus and guidance-limit lists, command terms |
| `constants.mjs` | the data-booklet constants (with units, for the dimension check) |
| `units.mjs` | units, SI conversion and number formatting |
| `generate.mjs` | builds the site question from a file: placeholders, results, typed answers, the dimension check |
| `validate.mjs` | every check above |
| `independent.mjs` | the independent calculation of every question's results (imports nothing) |
| `originality.mjs` | the overlap checks against the reference cache |
| `plot-axes.mjs` | writes the blank axes and the examiner's graph for click-to-plot parts (drawing shared with the website's `js/plot.js`) |
| `build.mjs` | builds everything, review status, the freeze, the outputs and the audit |
| `registry.mjs`, `review.mjs`, `reviews.json`, `frozen/` | review records and the review tool (rules shared with Paper 1B) |
| `test.mjs`, `fixtures/` | the tests and the example questions they use |
