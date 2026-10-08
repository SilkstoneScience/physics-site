# Paper 1B datasets

Paper 1B (data-based questions) is the **same paper for SL and HL**, so every dataset uses SL material only
and has `level: "SL_HL"`. HL-only topics (A.4, A.5, B.4, D.4, E.2) can't have Paper 1B datasets.

Questions are **generated, never typed**: each dataset file describes the physics, and the generator
produces the table, graph, diagram and every number in the question and mark scheme. The validator then
checks the result before it can reach the question bank.

```
tools/1b/datasets/D3-B01.mjs   one file per dataset (this is what you edit)
        ↓  node tools/1b/build.mjs
questions/1b.json              generated: never edit by hand (the checker would fail)
```

## Review status and the freeze (read this first)

Every dataset has a status: **DRAFT → AUTO-VALIDATED → PHYSICS-REVIEWED → TEACHER-REVIEWED → APPROVED**.
**Only APPROVED datasets are published** in `questions/1b.json` (plus one data file each in `questions/1b/`).
Everything else that passes the checks goes into `questions/1b-preview.json` and `questions/1b-preview/`,
which are never committed or published; the question bank shows them only on `localhost`, marked
"Preview only: STATUS". Passing the automatic checks is AUTO-VALIDATED, never a review.

Reviews are recorded in `tools/1b/reviews.json` with the reviewer, date and the dataset's **fingerprint**
(a hash of its physics model and laws, data, uncertainties, wording, answers, ranges and mark scheme, but not
its drawings). A snapshot is kept in `tools/1b/frozen/`. If a reviewed dataset would change, for example
because shared code changed, `node tools/check.mjs` **fails**, saying which fields changed, with the old and
new fingerprints. Then either undo the change, or reset the dataset and review it again:

```
node tools/1b/review.mjs status
node tools/1b/review.mjs set D3-B01 APPROVED --by "Mr Silkstone (teacher)" --note "…"
node tools/1b/review.mjs reset D3-B01 --by "…" --note "why it changed"
```
Reviews go in order (no skipping); TEACHER-REVIEWED and APPROVED must name a person, not an assistant or a
script. If someone records a review on the reviewer's behalf, add `--recorded-by "<who>"`.

**Batches** (docs/PAPER1B_SPECIFICATION.md section 16): new datasets carry `batch`, `archetypes` (IDs from
docs/PAPER1B_ARCHETYPE_MATRIX.md), `apparatus` and an `originality` note (none of these is fingerprinted).
`review.mjs batch <id>` classifies every dataset RED / AMBER / GREEN with reasons and suggests the GREEN sample;
the teacher reviews AMBER datasets (or waives them with a reason) and the sample individually, then
`review.mjs accept-batch <id> --by "<teacher>" --note "…" --systemic-ok [--waive <id> "<reason>"]` records one batch
decision and promotes the batch to APPROVED. Each dataset's record says whether the teacher inspected it
(`basis: batch`, `inspected: false` and a BATCH-ACCEPTED entry for those not inspected); batch acceptance never
records TEACHER-REVIEWED.

```
node tools/1b/review.mjs batch batch-1
node tools/1b/review.mjs accept-batch batch-1 --by "Mr Silkstone (teacher)" --note "…" --systemic-ok --waive E1-B01 "…"
```

## Commands (run from the physics-site folder)

| Command | What it does |
|---|---|
| `node tools/1b/build.mjs` | Generates and validates every dataset. Writes `questions/1b.json` only if there are no errors. |
| `node tools/1b/build.mjs --report` | The same, and prints each dataset's fit and results (useful while writing one). |
| `node tools/1b/build.mjs --audit` | The same, and prints each dataset's physics (scenario, principles, assumptions, derivation, laws, parameters, measurement models, expected magnitudes, and the noise-free check) for the teacher to review. |
| `node tools/1b/test.mjs` | Runs the generator/validator tests, including the deliberately broken datasets. |
| `node tools/check.mjs` | The whole-site checker: also runs the two above and fails if `1b.json` is out of date. |

## Files

| File | Job |
|---|---|
| `independent.mjs` | **Independent physics audit**: each dataset's physics written again from first principles, with its own units, fits and table reading (it imports none of the generator's physics or maths). Every dataset needs an entry here. |
| `registry.mjs`, `review.mjs`, `reviews.json`, `frozen/` | Review status, the review tool, the review records and fingerprint snapshots |
| `fingerprint.mjs` | What is frozen, the fingerprint, and the field-by-field difference report |
| `uncertainty.mjs` | Propagation of uncertainties (IB worst-case sums) |
| `systematic.mjs` | Systematic effects (zero offset, calibration, drift, heat loss) |
| `laws.mjs` | **Vetted physics laws**: each with SI units, hand-worked reference values and limiting cases (all tested, including dimensional consistency). Every dataset's model is built from these. |
| `lib.mjs` | Seeded random numbers, rounding, significant figures, units, line fits, max/min gradient lines |
| `generate.mjs` | Model → measurements (seeded noise, rounded to the instrument) → derived columns → fits → results → table/graph/question |
| `graph.mjs` | Draws graphs from the data (axes, grid, points, error bars, fit lines/curves) |
| `diagrams.mjs` | Diagram components: arrows (vectors), labels, current balance, circuits from a netlist, instrument scales |
| `contexts.mjs` | Context families and objects, and the repetition check (diversity) |
| `safeguards.mjs` | Phase 12 safeguards: too-regular data, error-bar visibility, graph reads, giveaways, ratio and multiple claims |
| `fixtures/phase12.mjs` | Test datasets for the Phase 12 capabilities (never published) |
| `validate.mjs` | Reads the published table and graphs back and checks everything (see below) |
| `build.mjs` | Builds every dataset twice (must be identical), validates, writes `questions/1b.json` |
| `test.mjs`, `fixtures/broken.mjs` | Tests, and broken datasets that must each be caught |

## Writing a dataset

Copy the closest existing dataset and change it. The parts, in order:

1. **Identity**: `id` (`D3-B01`: topic, B, number; the file is called `D3-B01.mjs`), `topic`, `difficulty`,
   `context` (`experimental`, `observational` or `unfamiliar`), `skills`, and a `seed`.
   The seed fixes the "random" scatter: the same seed always gives the same data. Changing it gives a new
   version of the experiment. **Never change the seed or the id of a published dataset**: students' saved
   answers would no longer match the data.
2. **Physics model** (required, and written out by `--audit` for the teacher to check): a `physics` block with
   `scenario`, `principles`, `assumptions`, `derivation` (the steps from the principles to the relationship),
   `relationship`, and `params`, each `{ value, unit, range: [min, max] for a real experiment, note }`.
   `vectors` (x right, y up, z out of the page) when a diagram shows directions; `['cross', 'I', 'B']` works out I × B.
   `circuit` (a netlist) when a diagram shows a circuit.
   **Models are built only from vetted laws** in `laws.mjs`, never from a formula typed into the dataset:
   `model: { law: 'force-on-wire', inputs: { B: 'p.B', I: 'row.I', L: 'p.L' } }`, where inputs are parameters (`p.`),
   columns (`row.`), single readings (`s.`), fixed values (`{ value, unit }`) or another law. Units are converted and
   checked at every step, so a quantity with the wrong unit (for example a count *rate* where a *count* is needed)
   is refused. If the physics needs a law that isn't there, add it to `laws.mjs` with reference values and limiting cases.
3. **Measurements**: `columns`, each `kind: 'set'` (the independent variable, with `values`), `'measured'`
   (with `model`, `expect: [min, max]` expected magnitude, `measurement: { instrument, reading, noise }` saying how the
   reading is made and what physically causes its scatter, `noise`, `resolution`, `uncertainty`, optional `anomaly`)
   or `'derived'` (calculated from the other columns, with `value` and `dp`). An uncertainty is a number (the same for
   every row), a function (for example √N), or `null`. `hide: [row]` leaves a calculated cell for students to fill in.
   `singles` are single readings such as a background count (same fields as a measured column).
   Noise types: `gauss` (`sd` in the column's unit), `gauss-relative` (`sd` as a fraction, for scatter proportional
   to the value, e.g. shot-to-shot variation in launch speed) and `poisson` (counts).
   **Repeated readings**: `trials: 5` on a measured column takes five readings per row; the column shows their mean and
   `uncertainty: 'halfRange'` gives half their range. `trialsTable: { column, row, caption }` shows one row's readings
   (add `'trials'` to `present`); that row's mean may then be left blank (`hide`) for students to calculate.
   `uncSymbol` sets the heading of a per-row uncertainty column (for example `'\\Delta(1/L)'`).
   `diagramChecks: [{ figure, harmonic: n }]` makes the validator check that a standing-wave diagram shows n loops
   with nodes at both fixed ends.
   **Derived uncertainties are declared, not written as formulas**: `propagation: { form: 'product', terms: [{ of: 'R', n: 2 }] }`
   or `{ form: 'sum', terms: [{ of: 'N', coef: (p) => 1 / p.dt, unc: 'poisson' }], neglect: [{ single: 'Nb', reason: '…' }] }`
   (see `uncertainty.mjs`: IB worst-case sums). The validator recomputes every derived uncertainty independently by
   differentiating the column's own formula, so a declaration that doesn't match the formula, a missing input or a
   "neglected" term that isn't small is caught.
   **Systematic effects** go on a measured column: `systematic: [{ type: 'zero-offset' | 'calibration' | 'drift' | 'heat-loss', …, cause, justification }]`
   (see `systematic.mjs`). They are deterministic, need a physical cause and justification, appear in `--audit`, and
   are not a way of adding noise.
   **Units**: temperatures `K`, `°C` (offset 273.15) and temperature differences `ΔK`, `Δ°C`; angles `rad`, `°`.
   A difference can't be used as a temperature (or the reverse), °C can't appear in a compound unit (use Δ°C), and a
   plain number is never taken as an angle.
4. **Graph**: `graph: { x, y, fit: 'linear' | 'exponential', band: true (max/min lines), exclude: [anomaly rows],
   omit: [rows students plot themselves], zero: { x, y } }`.
5. **Results**: every number an answer needs, each worked out from `d` (the data): `d.fit`, `d.band`,
   `d.rows`, `d.r` (earlier results). Give a `unit`, the `dims` it should have (for example `{ of: 'y/x' }`
   for a gradient), and `check: 'gradient' | 'minusGradient' | 'intercept' | 'halfLife'` so the validator
   compares it with its own fit. Use `range` for answers read from a graph (`d.widen(d.gradientRange(), v, 0.04)`).
   A result that measures a model parameter says so with `estimates: 'B'`: run on noise-free data, it must give
   back exactly that parameter, which proves the analysis is the true inverse of the physics model.
6. **Claims**: what the questions say is true (`linear`, `throughOrigin`, `agrees`, `verdict`, `anomaly`, `trend`).
   The validator checks each one against the data, so a question can't claim something the data don't show.
   `agrees` (expect `true` only) checks that the data recover a model value. **A conclusion students must reach**
   by comparing a stated value with the max/min-line range ("do the data support the manufacturer's value?") is a
   `verdict`: `{ type: 'verdict', result: 'uLines', value: 2.6, expect: 'outside' }`. Its result must have
   `basis: 'lines'` (a range from the steepest and shallowest lines only, not a widened answer tolerance), and the
   value must be at least 4 % of the result clear of the range's edge (`VERDICT_MARGIN` in `validate.mjs`), so that
   students' own lines give the same conclusion. The mark scheme must credit a conclusion consistent with the
   candidate's own lines.
7. **Presentation**: `figures` (diagrams), `intro` (the question text), and `parts`. In parts, write every
   number with a template (`${d.sf(d.r.B.value, 2)}`) and every typed answer as `numeric: d.num('B')`.
   `msFigure: 'graph-ms'` shows the examiner's graph (with the fit lines) inside the mark scheme.
   **Every number in the text must be traceable**: print it with `d.sf`, `d.dp`, `d.text`, `d.int` or `d.stated`.
   A number the question states that isn't in the data (a manufacturer's claim, a length given in cm) is a
   **stated constant**: `stated: { L_cm: { value: 5.0, dp: 1, unit: 'cm', source: '…', from: (p) => p.L * 100 } }`
   (`from` is checked against the parameter when there is one). Only integers 0–12 and 100 may appear untraced.
   **Every part has an AO tag**: `ao: 'AO2'`, or `ao: { AO1: 1, AO2: 1 }` for a part whose marks are split (the
   numbers must add up to the part's marks). The tags are design metadata for reports: not shown to students, not
   published and not in the fingerprint. `node tools/1b/ao.mjs --parts` prints AO marks by part, dataset, batch
   (a dataset's `batch` field) and the whole bank, and warns when a batch of 40+ marks is outside 40–60 % AO3.
   Individual datasets don't need to hit the target.
   **"State the unit" parts**: `asks: { unit: 'gradient' }`, with the unit printed by `d.unitTex('gradient')` or
   `d.baseUnitTex('gradient')` (SI base units) in the mark scheme; the validator checks it and that the question
   doesn't give the unit away. **"Value ± uncertainty" parts**: `asks: { valuePm: ['B', 'dB'] }` (optional `sf: 2`),
   with `d.pm('B', 'dB')` in the mark scheme: the uncertainty to 1 s.f. and the value to the same decimal place,
   checked against the results recalculated from the published table.
8. **Independent audit**: add an entry for the dataset to `AUDITS` in `independent.mjs`: its physics derived again
   from first principles (in SI units), the dimensions of each term, limiting cases, the expected magnitude, and
   how to recover the parameters and answers from the published table. Don't copy the formula from `laws.mjs`:
   derive it again, so that a mistake in one shows up as a disagreement.

9. **Phase 12 metadata and options** (details and reasons: `docs/PAPER1B_PHASE12_TOOLING.md`). None of the metadata is
   published or fingerprinted.
   - **Context** (required): `contextFamily` (one id from `CONTEXT_FAMILIES` in `contexts.mjs`) and `contextObjects`
     (ids from `CONTEXT_OBJECTS`). A repeated family or main object in a batch, or a family already common in the bank, is a
     diversity warning.
   - **Graph reads**: a part that expects a value read from a graph declares `reads: [{ figure: 'graph', x, y, tol }]`;
     each value must be on that graph's axes.
   - **What a part asks for**: `asks: { answerText: ['T^2'] }` (a relationship or quantity that must not appear earlier,
     or in the part's own question) and `asks: { conclusion: ['support'] }` for "whether …" parts (the conclusion must not
     be stated earlier). Every result's value is also checked automatically against everything shown before the part that
     establishes it.
   - **Regular data**: if the validator says the data step too evenly or scatter too little, fix the measurement model;
     only if the instrument genuinely reads that way, declare `columns.<k>.regularity = { accept: [codes], reason }`
     (the dataset is then AMBER).
   - **Error bars**: only y error bars are drawn. If they would be shorter than the markers, set
     `graph.errorBars: 'too-small'` (the caption states the uncertainty; no part may mention error bars). `graph.height`
     makes a taller plot (drawing only). When no part uses the uncertainty at all, set `errorBars: 'none'` (nothing drawn
     or said; the examiner's graph has no steepest and shallowest lines) and `showUncertainty: false` on the column (no ± in
     the table heading; the uncertainty stays internal for validation). `xErrorBars` is allowed only with `'too-small'`, to keep the x uncertainty in the
     max/min lines.
   - **Graphs**: `fit: 'none'` (points only), `modelCurve: (d) => (x) => y` with `modelCurveLabel` (examiner's graph),
     `referenceLine: { m, c, label }` (both graphs), `style: 'trace'` (sensor data), `shade: { from, to, baseline, label }`
     (examiner's graph).
   - **Claims**: `constantValue` and `constantRatio` (`{ column, rows?, expect }`), `integerMultiples` (`{ column, factor, expect: true }`).
   - **Area**: a result with `check: 'area'`, `area: { from, to, baseline }`, `dims: { of: 'xy' }` and a range (policy:
     covers ±5 % and the count-the-squares estimate; no wider than ±20 %).
   - **No student table**: `tableless: { reason, readFrom: [{ figure, columns }] }` and leave `'table'` out of `present`.
   - **Instrument scale**: `scaleReading(alt, { min, max, major, minor, title, marks })` in `diagrams.mjs`, with
     `diagramChecks: [{ figure, scale: { column } }]`.
   - **Published data**: `provenance.fields` (source column heading, definition, scale) for every catalogue column, and
     `provenance.extract: { file, sha256, rows }`: a copy of the source values as printed, kept in the reference cache
     (`P1B_SOURCES`, default `../reference-cache`), never in this repository. Observed values that the question compares
     with a model (not expected to follow it) are `observed: { reason }` instead of `model`/`agree`.

Then run `node tools/1b/build.mjs --report` and fix anything it reports. Look at the question in the preview
at 375 px and in dark mode, and get the teacher's approval before it goes live.

## What the validator checks

- **Identity**: id pattern, topic exists and is not HL-only, level `SL_HL`, marks.
- **Physics**: the physics block is complete; parameters are in their plausible ranges; every model is built from
  vetted laws with consistent units; noise-free model values are in the expected magnitude range; every measured
  quantity says how it is measured and what causes its scatter; and each result marked `estimates` recovers its
  parameter from noise-free data (within 0.5 %). The laws themselves are tested in `test.mjs` (reference values,
  limiting cases, dimensional consistency).
- **What it still can't check**: whether the *chosen* law and measurement model describe the experiment in the
  question text, and whether the wording and reasoning are good. That needs a person: read the `--audit` report
  alongside the question.
- **Table**: headings show `symbol / unit ± uncertainty`; every value has the column's decimal places and is a
  reading the instrument can show; measured values are within 5 standard deviations of the model (catches typing
  errors) unless marked as the anomaly; calculated columns match their inputs; uncertainties follow their rule,
  have at most 2 significant figures, the same decimal places as the values, and are not smaller than half the resolution.
- **Units**: every unit is known; each result has the dimensions it should (for example gradient = y-unit ÷ x-unit).
- **Fits and results**: the validator fits the published table itself and compares it with the dataset's
  results; a straight line must pass through every error bar when max/min lines are used; accepted ranges contain the value.
- **Claims**: linear, through the origin, agreement within the range, a single clear anomaly (at least 4× the normal
  scatter, with no other point above 2.5×), increasing or decreasing.
- **Answers**: each typed answer is linked to a result and equals it; its range and unit match; the site's marker
  accepts it and rejects each listed mistake; the mark scheme states the value.
- **Graphs**: read back from the SVG: axis labels, evenly spaced ticks, every point where the table says (to
  within 0.6 px), the right points left for students to plot, error-bar lengths, nothing outside the axes, no fit
  line on the students' graph, and fit lines/curves on the examiner's graph that match the fit.
- **Diagrams**: alt text; no colours written into the SVG (so dark mode works); labels fit on a phone; arrows
  point along their vectors (to within 2°); dots and crosses match into/out of the page; circuits: ammeters in
  series, voltmeters across the right components, no loose wires, and the drawing's wiring matches the netlist.
- **Determinism**: building twice gives identical output, and `questions/1b.json` is exactly the generator's output.
