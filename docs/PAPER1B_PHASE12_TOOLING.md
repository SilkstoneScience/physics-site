# Paper 1B Phase 12: tooling safeguards and Batch 1 presentation

8 October 2026. Branch `paper1b-batch2`. Records what Phase 12 built and changed. No Batch 2 dataset was generated, and
nothing was approved. The rules here are implemented and tested, but they are **not yet part of
`docs/PAPER1B_SPECIFICATION.md`**: section 7 lists what Phase 13 should make permanent.

---

## 1. Tooling status (T1–T10)

| # | Capability | Status | Where | Tests |
|---|---|---|---|---|
| T1 | Repeated context families | **Implemented** | `contexts.mjs`, `batch.mjs` | unit tests |
| T2 | Too-regular data | **Implemented** | `safeguards.mjs`, `validate.mjs` | unit tests, 1 broken fixture |
| T3 | Values read from outside the graph axes | **Implemented** | `validate.mjs` | 2 broken fixtures, 2 tests |
| T4 | Mark-scheme and stem giveaways | **Implemented** | `safeguards.mjs`, `validate.mjs` | 4 broken fixtures, 1 test |
| T5 | Ratio and whole-multiple claims | **Implemented** (required by A3-B01, D2-B01, C2-B01) | `safeguards.mjs`, `validate.mjs` | unit tests, 3 broken fixtures |
| T6 | Graphs without a fit, model curves, reference lines | **Implemented** (A3-B01, B2-B01, C2-B01) | `graph.mjs`, `generate.mjs`, `validate.mjs` | a good fixture, 4 broken fixtures |
| T7 | Area under a graph, sensor traces, data without a student table | **Implemented** (A2-B03) | the same, plus `tableless` | a good fixture, unit tests, 8 broken fixtures |
| T8 | Instrument-scale image with read-back | **Implemented** (E1-B01) | `diagrams.mjs` (`scaleReading`), `validate.mjs` | a good fixture, 4 broken fixtures |
| T9 | Observational-data mode | **Deferred** | none | none |
| T10 | Published values against a stored source copy | **Implemented** (B2-B01, E1-B01, E4-B01; applied to D1-B01) | `validate.mjs` | 11 tests (temporary source copy) |
| P1 | Error bars that can't be seen; y error bars only (from the Batch 1 audit) | **Implemented** | `graph.mjs`, `generate.mjs`, `validate.mjs` | 4 broken fixtures, 3 tests |

Tests: 460 before Phase 12, **543 after**. The new "broken dataset" fixtures are in `fixtures/broken.mjs` (11) and
`fixtures/phase12.mjs` (19); each must fail with its stated error code.

### T1 Repeated context families
- Every dataset now declares `contextFamily` (one of `CONTEXT_FAMILIES`) and `contextObjects` (from `CONTEXT_OBJECTS`). These are design metadata: not published and not fingerprinted.
- The check also reads the free-text `apparatus` with keyword patterns, so an object the author forgot to declare is still found. An undeclared object, or an unknown or missing family, makes a dataset AMBER.
- **Diversity warnings**, which block batch acceptance unless the teacher waives them:
  - the same family twice in one batch;
  - the same main object in two datasets of a batch;
  - a family already used by 2 or more other datasets in the bank;
  - an object already used by 3 or more.
- Each warning names the datasets involved, the family or object, and why it counts as repetition.
- Everyday instruments (ruler, stopwatch, slotted masses, thermometer, water bath) are not counted as repetition.
- **Result on Batch 1:** it flags exactly what the retrospective found by reading: two elastic-stretching datasets, a spring in A2-B01 and C1-B01, and two electrical-heating datasets.
- **Limitation:** families are a controlled list a person maintains, and borderline set-ups still need judgement.

### T2 Too-regular data
- **Findings** on measured columns (thresholds in `REGULARITY`, documented in the code):
  - `equal-steps`: at least 80 % of successive differences are identical;
  - `too-little-scatter`: the scatter about the model is under 0.35 of what the declared noise and rounding predict (fewer than 1 % of honest six-point datasets fall this low);
  - `exact-ratios`: y/x is identical to 3 s.f. in at least 80 % of rows;
  - `repeated-digit`: every value ends in the same digit although the resolution allows others.
- These are **warnings** (so the dataset is AMBER), not errors. An intended relationship is never rejected; only data cleaner than the declared measurement could give are flagged.
- An author may accept a finding with a physical reason (`columns.<k>.regularity`). The dataset then stays AMBER, so a person agrees.
- Where the declared scatter is below the instrument's resolution (D3-B01), values rounded to the model are honest data and are correctly **not** flagged.
- **Result:** only A2-B01 is flagged (4 of 5 steps exactly 20 mm). See section 3.

### T3 Values read from outside the graph axes
- A part declares the values students read from a graph: `reads: [{ figure, x, y, tol }]` (metadata, not fingerprinted).
- Each value must lie inside that graph's axes, read from its own tick labels. A tolerance smaller than half a small grid square is reported.
- Points left for students to plot must lie inside the axes.
- Wording that implies reading from a graph ("Use the graph", "where the line meets", "extend the line") without declared reads gives a warning.
- **Found a genuine error in an approved pilot:** B5-B01 (b) asks students to extend the line to read the emf (1.52 V), but the axis stopped at 1.5 V. This is fixed in the drawing only (section 3), so the fingerprint and approval are unchanged.
- Reads are now declared on every graph-reading part in the bank.
- **Limitation:** values students read are found from declarations plus wording, not inferred from free text.

### T4 Giveaways
Students see the stem, then each part's question, then its mark scheme. The check covers numbers, units, answer text and conclusions:
- **Numbers.** Each result's value (at 2 and 3 s.f.) belongs to the first part whose mark scheme states it while its question doesn't. It must not appear earlier: not in the stem, figure captions, alt text or axis titles, and not in the questions or mark schemes of earlier parts. Values printed in the data table are skipped (they are data).
- **Units.** `asks.unit` may not be given by an earlier question or mark scheme.
- **Answer text.** `asks.answerText` (for example `T^2` in C1-B01 (b)) may not appear before the part or in its own question.
- **Conclusions.** `asks.conclusion` may not be stated before the part. A "whether" question without a declared conclusion gives a warning. Conclusions are now declared on all such parts.
- **Result:** no giveaways found in the current bank.
- **Limitations:** the number check uses 2–3 significant figures and skips small integers, so a giveaway written in words or rounded differently is not caught. The unit check matches the TeX forms the generator writes.

### T5 Ratio and whole-multiple claims
- `constantValue` and `constantRatio` (successive ratios, fractional uncertainties added): "constant" means the uncertainty ranges share a value; "not constant" means a gap of at least 4 % of the mean (`VERDICT_MARGIN`).
- `integerMultiples`: every value is within its uncertainty of a whole multiple (at least 1) of a factor; each multiple is unambiguous (uncertainty under a quarter of the factor); and no larger factor also fits. A smaller factor always fits, so data can't exclude it. Questions must not claim they do.
- **A real finding in testing:** in E3-B01 the first four count rates fall by a constant ratio, but over seven rows they do not (17.8 → 16.8 s⁻¹). The claim reports this honestly.

### T6 Graphs without a fit, model curves and reference lines
- `fit: 'none'` gives points only.
- `modelCurve` + `modelCurveLabel` draws the physics model on the examiner's graph only, and is checked point by point.
- `referenceLine: { m, c, label }` (for example "observed = model") is drawn dashed on both graphs and labelled in the caption. It may not coincide with the line of best fit, so it can't draw the answer.
- A result that needs a fitted line on a graph with no fit is an error.

### T7 Area under a graph, sensor traces, no student table
- `style: 'trace'` draws sensor data as one line through every reading. Every vertex is read back, and no error bars are drawn.
- `shade: { from, to, baseline, label }` shades the area on the examiner's graph only. Shading on the students' graph is an error, because it is the answer.
- A result with `check: 'area'` is recalculated by the trapezium rule from the data.
- **Accepted-range policy (proposed, needs the teacher's decision):** the range must cover the value ± 5 % and the count-the-squares estimate on the students' graph, and must be no wider than ± 20 %. This is `AREA_POLICY`.
- `tableless: { reason, readFrom }`: students get no table when every shown column is readable from a declared figure. Validation still runs on the complete internal table, which is never published.

### T8 Instrument-scale read-back
- `scaleReading` draws a straight instrument scale with marks at the data values. Its smallest-division ticks are drawn in the axis style, so they are visible on a phone (checked at 375 px).
- `diagramChecks: [{ figure, scale: { column } }]` reads every mark back: evenly spaced labels; the smallest division at least 6 units (about 4 px on a phone); each mark within half a division of its value; marks less than one division apart reported.
- The column's uncertainty can't be smaller than half a division.

### T9 Observational-data mode: deferred
- Only C5-B01 needs it, and C5-B01 is flagged in section 2 for a teacher decision (simulated observations, SL fairness, originality).
- Uneven sampling and model curves already work (T6). What is missing is a required "simulated" label and realism checks adapted to observations.
- Build it with C5-B01 if the teacher keeps it.

### T10 Published values against a stored source copy
- Every catalogue column now needs `provenance.fields` (the source's own column heading, what it means, and a unit scale).
- `provenance.extract` (file, SHA-256, source row names) points to a copy of the values as printed, kept **outside the repository** in the reference cache (`P1B_SOURCES`, default `../reference-cache`).
- Every value must match the copy. A changed copy (checksum) or a mismatch is an error. No copy is a warning. A copy that isn't on this computer (for example on GitHub) is a warning.
- **D1-B01:** the NASA Jovian satellite fact sheet was re-read on 8 October 2026. All 8 semi-major axes and 8 periods match the dataset, and the copy is stored at `reference-cache/p1b-sources/D1-B01-nssdca-jovian.json`. This changes metadata only, so D1-B01 stays APPROVED.
- **Observed values (added because B2-B01 and E4-B01 need it):** a catalogue column may be `observed: { reason }`. These are published values the question compares with a model (Venus is hotter than the no-atmosphere model) rather than values expected to follow it. Such a column has no model and no agreement tolerance, and it requires provenance fields.
- **Limitation:** the stored copy is made by a person from the source page, and the check proves the dataset matches that copy, not the live website.

### P1 Error bars that can't be seen; y error bars only
- A student graph whose longest y error bar is shorter than `VISIBLE_BAR` (the marker radius plus 1.5 units) gives a warning.
- `errorBars: 'too-small'` draws no bars and states the uncertainty in the caption ("The uncertainty in extension (±1 mm) is too small to show as error bars."). No question or mark scheme may then mention error bars.
- Declaring `'too-small'` when the bars would be visible is an error. The uncertainties are unchanged and still drive every max/min line and verdict.
- Only y error bars are drawn. `xErrorBars` may still put the x uncertainty into the max/min lines when no bars are drawn (B3-B01). The pilots A1-B01 and C4-B01 keep their drawn x bars because they were approved before this rule.
- `graph.height` gives a taller plot where a graph needs it. It is a drawing option and doesn't change the fingerprint.

---

## 2. Batch 2 capability assessment (the 8 proposed datasets; none generated)

Status of each capability: **E** = exists now (including Phase 12), **M** = must be built when the dataset is written (a
new law, diagram or audit entry: normal dataset work), **D** = can defer.

| Dataset | Physics scope | Originality | Generator | Renderer | Validator | Independent audit | External data | Uncertainty | Graph | Table | Safe to generate after Phase 12? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A3-B01 bouncing ball | LOW (A.3) | LOW | M: empirical `bounce-height-ratio` law | E: points-only graph, model curve, Plot | E: `constantRatio`, `predictAt`, T2–T4 | M: entry | none | E: ±1 cm, ratio propagation | E | E | **Yes**, once the teacher approves the empirical law |
| E1-B01 spectrum | LOW (E.1 SL) | LOW–MED | M: `photon-energy` law; lines as published values | E: `scaleReading`; D: level diagram (give levels as text or a small table) | E: scale read-back, `tableless`, T10 | M: entry | NIST levels and lines (copy + teacher approval) | E: ± half a division enforced | none | none (image) | **Yes**, after the NIST copy and the teacher's approval of the source |
| A2-B03 force plate | LOW–MED (A.2 impulse) | LOW | M: empirical force-pulse law; dense times | E: trace, shading; D: force-plate diagram (text description) | E: area result, `tableless` | M: entry (independent integration) | none | E (sensor, no bars) | E | none | **Yes**, after the teacher decides the area-range policy |
| B2-B01 planets | LOW (B.2) | LOW | M: `energy-balance-temperature` law | E: reference line | E: `observed` published values, T10, verdict claims | M: entry | NASA planetary fact sheets (copy) | E | E | E | **Yes**, after the NASA copy |
| C5-B01 binary star | MED (systemic velocity is subtle for SL) | MED (astrophysics option papers) | M: radial-velocity law; uneven sampling exists | E: points + model curve; Sketch as a self-marked part with an examiner figure | **D: T9 not built** | M: entry | none (simulated), or real data (teacher) | E | E | E | **No: flagged.** Disproportionate assessment risk and an open decision on simulated observations. Recommend replacing it, or moving it to Batch 3 |
| D2-B01 Millikan | LOW–MED | LOW–MED | M: `millikan-balance` law; calibration systematic exists | E: table; D: plates diagram | E: `integerMultiples`, calibration feature | M: entry | none | E: r³ propagation | none | E | **Yes** |
| E4-B01 reactor | LOW (E.4) | LOW | M: `mass-energy` law, energy chain | E | E: `observed` published values, T10 | M: entry | IAEA PRIS or operator figures (copy; **licence decision needed**) | E | none | E | **Yes, technically**; the licence and source decision is open |
| C2-B01 LED tube | MED (exact line-source law is beyond SL; used only to generate data) | MED (May 2018 Paper 3) | M: `line-source-irradiance` law (exact + point-source limit) | E: points-only graph with model curve | E: `constantValue` over row ranges (where the inverse square holds and where it doesn't) | M: entry (numerical integration) | none | E: derived I·d² with propagation | E | E | **Yes**, after the teacher approves the law |

The plan is unchanged (`docs/PAPER1B_BATCH2_PLAN.md`): C5-B01 is flagged, not removed.

---

## 3. Batch 1 graph and data-presentation audit (the teacher reopened Batch 1 on 8 October 2026)

All eight Batch 1 graphs and tables were checked in the rendered output (desktop and 375 px), alongside the numerical
measurements. **Main finding:** every Batch 1 error bar was 1.0 to 3.6 units each side of its point, shorter than the
3.2-unit marker, so students could not see them. Yet four mark schemes asked students to judge "within the error bars".
The uncertainties are realistic for the instruments (a metre rule, a vernier, a gauge, a stopwatch timing ten
oscillations), so they were **not** enlarged. The presentation and wording were changed instead.

| Dataset | Graph change | Wording change | Table | Status |
|---|---|---|---|---|
| A2-B01 | No bars drawn; caption states ±1 mm | (a): "the points lie on a straight line (each extension is uncertain by only ±1 mm)"; the line misses the origin "by far more than the ±1 mm uncertainty" | kept (part (e) uses the last row) | **reset** |
| A2-B02 | No bars; caption states ±0.05 mm | (a): consistent with Hooke's law "within their uncertainty of ±0.05 mm" | kept ((c) compares a measured value) | **reset** |
| B3-B01 | No bars; caption states ±0.5 kPa; x bars no longer drawn (the ±0.5 °C still counts in the max/min lines) | (b), (c) mark schemes no longer mention error bars; **(d) now states the intercept range (−285 °C to −255 °C)** that students could not draw through invisible bars | kept ((a) uses two rows) | **reset** |
| C1-B01 | No bars on either graph; captions state ±0.010 s | (a): "a clear curve: no straight line fits them, even allowing for the uncertainty in T (±0.010 s)" | kept (T² is calculated) | **reset** |
| D1-B01 | none (database data: no bars, as stated) | none | kept (log columns) | APPROVED (provenance metadata only) |
| A1-B02, B1-B01, B1-B02 | no graph | none | kept: each table is used for calculation | APPROVED, unchanged |

- **Data, answers and accepted ranges are unchanged** in all four reset datasets. Only captions, alt text, three mark-scheme points and the B3-B01 (d) question changed. The freeze report was checked field by field before resetting.
- **No uncertainty value was changed.**
  - A2-B01: a more pessimistic scatter (0.7 mm instead of 0.4 mm) was tried, to answer the "too regular" finding. It made the independent audit fail to recover k within the ±1 mm max/min lines, so it was reverted. The regular 20 mm steps are now an author-accepted finding with a reason, and the dataset is AMBER for the teacher to judge.
  - B3-B01: dropping the ±0.5 °C temperature uncertainty from the max/min lines would have narrowed the range to −277 °C … −262 °C, putting −273 °C at its edge. That would change the conclusion for a presentation reason, so the uncertainty stays in the analysis and only the drawing changed.
- **Tables:** no Batch 1 table is redundant. Each feeds a calculation, a ratio test or a comparison, so all are kept.
- **Resets:** A2-B01, A2-B02, B3-B01 and C1-B01 were reset with `review.mjs reset` (recorded as the teacher's decision in chat, recorded by Claude). They are now AUTO-VALIDATED and appear only in the local preview. **Production on this branch: 9 datasets.** `main` is unchanged until a merge.
- **Approved pilots** (not reopened; drawing-only changes keep their fingerprints):
  - B5-B01: y axis extended to 1.6 V so the emf can be read (T3 finding), and the plot made taller (`height: 480`) so the ±0.01 V bars stay visible. Fingerprint unchanged (`cea3828f…`).
  - C4-B01: its error bars (at most 3.1 units) are hidden under the markers, so it **keeps a P1 warning**. Fixing it needs a caption change, which would reset an approved pilot: a teacher decision.
- **Metadata added to every dataset** (not fingerprinted): context family and objects, graph reads, conclusions and answer text.

---

## 4. Verification (8 October 2026)

- `node tools/1b/test.mjs`: **543 of 543** pass.
- `node tools/1b/build.mjs`: every dataset passes validation and the independent physics audit. Production 9 APPROVED, preview 4.
- `node tools/check.mjs`: **no errors**; 1 warning (C4-B01 error-bar visibility, above).
- The rendered graphs were inspected in the browser at desktop width and at 375 px. These included the four changed Batch 1 graphs, B5-B01, and the new trace, shading, model-curve, reference-line and scale components (test fixtures).

---

## 5. Re-approval of the reset Batch 1 datasets (teacher decision)

Batch 1 was accepted as `batch-1`, and `accept-batch` refuses a batch that has already been decided. There are two routes:
- **Individually:** `review.mjs set <id> PHYSICS-REVIEWED`, then `TEACHER-REVIEWED`, then `APPROVED`, for each of A2-B01, A2-B02, B3-B01 and C1-B01. A2-B02 and C1-B01 were inspected individually before.
- **As a new batch:** set their `batch` to, for example, `batch-1r` (not fingerprinted) and accept that batch.
  - The batch report would show the new diversity warnings (springs, the elastic family) and A2-B01's accepted regularity, for the teacher to waive or not.

---

## 6. Readiness

**NOT READY for Batch 2 generation.** The tooling is ready, but these decisions are open:
1. Re-approval of the four reset Batch 1 datasets (section 5), so production on this branch is complete again before any merge.
2. C5-B01: replace, defer, or keep. Keeping it means building T9.
3. The area accepted-range policy (T7), the empirical laws (bounce, force pulse), the exact line-source law, and the external sources (NIST, NASA planetary, IAEA PRIS licence).
4. The retrospective's proposals C1–C6 (they change the risk classes in the Batch 2 plan).
5. C4-B01's invisible error bars (approved pilot).

## 7. For Phase 13: rules to make permanent in the specification (once agreed)

- Context families and their limits (T1); the regularity thresholds (T2).
- Declared graph reads (T3); the giveaway rules (T4).
- Y error bars only, with `'too-small'` when bars can't be seen (P1); the marker-visibility threshold.
- The area accepted-range policy (T7).
- Stored source copies for all published data (T10).
- Section 14 (graph requirements) and section 15 (diagram requirements) of the specification should list the new graph types and the scale component.
