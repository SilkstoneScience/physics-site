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
| `diagrams.mjs` | Diagram components: arrows (vectors), labels, current balance, circuits from a netlist |
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
6. **Claims**: what the questions say is true (`linear`, `throughOrigin`, `agrees`, `anomaly`, `trend`).
   The validator checks each one against the data, so a question can't claim something the data don't show.
7. **Presentation**: `figures` (diagrams), `intro` (the question text), and `parts`. In parts, write every
   number with a template (`${d.sf(d.r.B.value, 2)}`) and every typed answer as `numeric: d.num('B')`.
   `msFigure: 'graph-ms'` shows the examiner's graph (with the fit lines) inside the mark scheme.
   **Every number in the text must be traceable**: print it with `d.sf`, `d.dp`, `d.text`, `d.int` or `d.stated`.
   A number the question states that isn't in the data (a manufacturer's claim, a length given in cm) is a
   **stated constant**: `stated: { L_cm: { value: 5.0, dp: 1, unit: 'cm', source: '…', from: (p) => p.L * 100 } }`
   (`from` is checked against the parameter when there is one). Only integers 0–12 and 100 may appear untraced.
8. **Independent audit**: add an entry for the dataset to `AUDITS` in `independent.mjs`: its physics derived again
   from first principles (in SI units), the dimensions of each term, limiting cases, the expected magnitude, and
   how to recover the parameters and answers from the published table. Don't copy the formula from `laws.mjs`:
   derive it again, so that a mistake in one shows up as a disagreement.

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
