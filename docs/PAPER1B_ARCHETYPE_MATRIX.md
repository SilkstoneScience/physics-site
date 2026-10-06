# Paper 1B archetype matrix

Version 1, 6 October 2026. Branch `paper-1b`. Planning document: nothing here is generated, approved or published.
In `docs/`, which `_config.yml` keeps off the website.

**Sources:** `docs/PAPER1B_SPECIFICATION.md` (the authority; section and skill IDs such as DH8, GR15, S2 refer to
it); the 2025 guide; the legacy Paper 3 Section A analysis (17 sessions) and the 2025 Paper 1B papers; the five
pilots; the pilot audit; the October 2026 fixes (AO tags, `verdict` claims, `asks.unit`, `asks.valuePm`).
Tags as in the specification: **[IB]** 2025 guide, **[Legacy]** assessment evidence, **[Design]** our choice,
**[Impl]** generator detail.

An **archetype** is a reusable pattern for one Paper 1B question (5–12 marks): a data source, a mathematical
relationship, a characteristic analysis, and a typical sequence of parts. It is not a template: two datasets of the
same archetype must differ in context, numbers and wording, and may differ in sequence. **[Design]**

---

## 1. Summary matrix

Status: ✓ demonstrated by a pilot · ◐ demonstrated weakly or partly supported · ○ supported by the generator but not
yet demonstrated · ✗ not currently supported. Risk = expected teacher-review risk (section 5). Priority: **1** first
batch, **2** second batch, **3** later.

| ID | Archetype | Source | Relationship | Marks | Diff. | AO3 share | Risk | Status | Priority |
|---|---|---|---|---|---|---|---|---|---|
| M1 | Repeated readings → mean → uncertainty | primary | none / any | 4–7 | 1–2 | low–med | LOW | ✓ A1 | 1 |
| M2 | Calculated value ± uncertainty, correct rounding | primary | formula | 5–8 | 1–2 | low–med | LOW | ○ | **1** |
| M3 | Instrument or image reading → derived quantity | primary (image) | formula | 5–8 | 1–2 | low–med | MEDIUM | ✗ | 2 |
| M4 | Random scatter and reliability | primary | any | 4–8 | 2 | med | MEDIUM | ◐ E3, A1 | 2 |
| L1 | Linear graph → gradient → physical constant | primary | linear | 6–10 | 1–2 | low | LOW | ✓ (4 pilots) | 3 (limit) |
| L2 | Linear graph → intercept and extrapolation | primary | linear, offset | 6–10 | 2 | med | LOW | ✓ B5 | **1** |
| L3 | Proportionality test (graph and table) | any | linear / not | 5–9 | 1–2 | med–high | LOW | ◐ D3 | 2 |
| L4 | Max/min lines → uncertainty of gradient and intercept | any | linear | 6–10 | 2–3 | med | HIGH | ◐ (band only) | 2 |
| N1 | Inverse relationship → reciprocal plot | primary | y ∝ 1/x | 6–10 | 2 | low–med | LOW | ✓ C4 | 3 |
| N2 | Power law with known exponent → linearise | primary | y ∝ xⁿ, n known | 6–10 | 2 | low–med | LOW | ✓ A1 | 3 |
| N3 | Non-linear recognition → choose a transformation | any | curved | 7–11 | 2–3 | med–high | MEDIUM | ✗ | **1** |
| N4 | Log–log analysis: unknown exponent | secondary / primary | y = kxⁿ | 7–11 | 3 | med–high | MEDIUM | ✗ | **1** |
| N5 | Exponential change: half-life, constant ratio (SL) | primary / analogue | exponential | 6–10 | 2 | med | MEDIUM | ✓ E3 | 3 |
| G1 | Area under a graph | primary / sensor | any | 5–9 | 2 | low–med | MEDIUM | ✗ | 2 |
| G2 | Tangent: instantaneous rate of change | primary / sensor | curved | 5–9 | 2–3 | med | HIGH | ✗ | 3 |
| G3 | Prediction at an unmeasured value | any | any | 4–8 (as part of another) | 1–2 | med | LOW | ◐ C4 | **1** |
| V1 | Model versus data comparison | primary / model | any | 6–10 | 2–3 | high | MEDIUM | ✗ | 2 |
| V2 | Model validity range | primary | model + breakdown | 7–11 | 3 | high | HIGH | ✗ | **1** |
| V3 | Evidence for or against a hypothesis or claim | any | any | 5–10 | 2–3 | high | MEDIUM | ✓ A1 (g), D3 (d) | 2 |
| E1 | Systematic offset / zero error | primary | linear + offset | 6–10 | 2 | med–high | MEDIUM | ○ | **1** |
| E2 | Multiplicative systematic effect (calibration, energy loss) | primary | any | 6–10 | 2–3 | high | HIGH | ○ | **1** |
| E3 | Anomaly / outlier evaluation | primary | any | 4–9 | 1–2 | med–high | LOW | ✓ B5 | 2 |
| E4 | Method evaluation tied to data | primary | any | 5–8 | 2–3 | high | HIGH | ◐ B5 (e), E3 (e) | 2 |
| D1 | Secondary / database data testing a law | secondary | any (often power) | 7–11 | 2–3 | med–high | HIGH | ✗ | **1** |
| D2 | Astronomical or field observations | observational | any | 6–10 | 2–3 | med–high | HIGH | ✗ | 2 |
| D3 | Simulation or model output (incl. design choice) | model | any | 5–9 | 2–3 | high | HIGH | ✗ | 3 |

26 archetypes. The 30 suggested topics are covered as follows: 4 (direct model/data comparison) and 13 (model curve
versus data) are one archetype, V1; 24 (extrapolation) belongs in L2 and V2; 25–27 (gradient uncertainty, intercept
uncertainty, max/min gradients) are one archetype, L4, because they are one technique; 22 (simulation data) and
design choice from modelled curves are one archetype, D3. Nothing was added only to reach a number.

---

## 2. Archetype details

Each block: description; contexts (SL only); data; skills; sequence; graph, uncertainty and evaluation needs; AO
balance; difficulty; SL/HL; generator needs and status; related pilot; priority; review risk.

### M — Measurement and uncertainty

**M1 Repeated readings → mean → uncertainty**
- *Description:* students process a set of repeated readings: mean, half-range, why repeat, effect of an outlying trial.
- *Contexts:* light-gate times for a trolley (A.1), bounce heights (A.3), fall times (A.1), current in a heating element over time (B.5), oscillation times (C.1).
- *Data:* experimental, primary; one row of trials plus a summary table.
- *Primary skills:* DH3, DH4, EX8. *Secondary:* EU1, EU9 (a trial far from the others), DH8.
- *Sequence:* state why readings were repeated → mean → half-range → value ± uncertainty → judge whether a trial should be excluded.
- *Marks:* 4–7. *Graph:* optional. *Uncertainty:* half-range; value ± uncertainty. *Evaluation:* exclusion of a trial, number of repeats.
- *AO:* mostly AO2, one or two AO3 marks. *Difficulty:* 1–2. *SL/HL:* neutral.
- *Generator:* `trials`, `halfRange`, `trialsTable`, `asks.valuePm` (supported). Needs a **trial-level anomaly** (one outlying repeat) for the outlier variant: **✗ small gap**.
- *Pilot:* A1 (b), (c). *Priority:* 1 (as the Difficulty 1 dataset). *Risk:* LOW.

**M2 Calculated value ± uncertainty with correct rounding** (sequence S2)
- *Description:* a single result calculated from several measured quantities, with propagated uncertainty quoted to correct significant figures, then a systematic-error or improvement judgement.
- *Contexts:* specific heat capacity of a block from heater energy and temperature rise (B.1), resistivity (B.5), density of an irregular solid by displacement (A.2 context), power output of a motor lifting a load (A.3), refractive index from measured lengths (C.3).
- *Data:* experimental; a short list of readings with ± values (no graph needed).
- *Primary:* DH2, DH6, DH7, DH8. *Secondary:* EU2/EU3, EV4, DH9.
- *Sequence:* identify the largest source of uncertainty → calculate the value → propagate → state value ± uncertainty → direction of a named systematic error or a specific improvement.
- *Marks:* 5–8. *Graph:* none. *Uncertainty:* central (sums and products, a power). *Evaluation:* one systematic or improvement mark.
- *AO:* AO2-heavy with 1–2 AO3. *Difficulty:* 1–2. *SL/HL:* neutral.
- *Generator:* measured singles with uncertainties, declared propagation, `asks.valuePm`, `asks.unit`: **○ supported, not demonstrated.** No graph is needed; confirm the validator handles a dataset with only singles and results (small check).
- *Pilot:* D3 (e) (partly). *Priority:* **1**. *Risk:* LOW.

**M3 Instrument or image reading → derived quantity** (sequence S5)
- *Description:* students read a scale, display or image themselves (including a zero error or parallax), then use the reading.
- *Contexts:* caliper or micrometer with zero error (A.1/B.5), protractor reading for refraction (C.3), meter scale (B.5), multiflash photograph of a falling object (A.1), trace on a moving strip (C.1 / A.1), ruler next to an extended spring (A.2).
- *Data:* experimental; generated SVG of the instrument or image.
- *Primary:* EX5, EX4, DH6. *Secondary:* EU2 (zero error), DH7, IN9.
- *Sequence:* read the instrument → correct for zero error → uncertainty from the scale → derived quantity → compare with reference value.
- *Marks:* 5–8. *Graph:* none, or a simple one. *Uncertainty:* reading uncertainty, % uncertainty. *Evaluation:* how to improve the reading.
- *AO:* AO2 with AO3 in the comparison. *Difficulty:* 1–2. *SL/HL:* neutral.
- *Generator:* **✗ instrument-scale and image diagrams with read-back validation** (specification 19.1 item 8).
- *Pilot:* none. *Priority:* 2 (needs the diagram components). *Risk:* MEDIUM (drawing must be read unambiguously at phone size).

**M4 Random scatter and reliability**
- *Description:* students interpret the spread of data: why points scatter, how the spread affects confidence, counting statistics, how more readings or longer counts help.
- *Contexts:* radioactive counts (E.3), repeated timings (A.1), sensor readings with noise (any), background count variation (E.3).
- *Data:* experimental; tables with repeats or Poisson counts.
- *Primary:* EU1, EU4, EU7, EU10. *Secondary:* EV4, EV6.
- *Sequence:* identify the random variation → quantify it (half-range, √N) → explain its effect on a result or on a later reading → propose a realistic improvement.
- *Marks:* 4–8. *Graph:* optional, error bars. *Uncertainty:* central. *Evaluation:* reliability and improvements.
- *AO:* balanced AO2/AO3. *Difficulty:* 2. *SL/HL:* neutral.
- *Generator:* Poisson and Gaussian noise, `trials`: **◐ supported**; wording quality is the risk.
- *Pilot:* E3 (d), (e); A1 (c). *Priority:* 2. *Risk:* MEDIUM.

### L — Linear graphs

**L1 Linear graph → gradient → physical constant**
- *Description:* the familiar route: a straight-line graph, its gradient, and a constant from it.
- *Contexts:* any SL relationship that is linear in measured variables.
- *Primary:* GR6, DH2, DH9. *Secondary:* GR4, IN3.
- *Sequence:* gradient with unit → constant → comparison.
- *Marks:* 6–10. *AO:* AO2-heavy. *Difficulty:* 1–2. *Risk:* LOW. *Status:* ✓ (A1, B5, C4, D3).
- *Rule:* **[Design] overrepresented.** No more than about one dataset in four may use gradient → constant as its main route, and every new L1 dataset must add a distinctive second element (unit in base units, intercept meaning, verdict, systematic effect, prediction at an unmeasured value). *Priority:* 3.

**L2 Linear graph → intercept and extrapolation**
- *Description:* the intercept carries the physics (emf, zero offset, initial value, absolute zero) and is found by extrapolation; students judge whether extrapolation is reasonable.
- *Contexts:* pressure against temperature extrapolated to zero pressure (B.3), terminal p.d. against current (B.5), length of a spring against load giving the natural length (A.2), velocity against time giving the initial velocity (A.1), resistance against temperature of a metal (B.5 context).
- *Data:* experimental. *Primary:* GR7, GR13. *Secondary:* GR6, IN7, EV2.
- *Sequence:* extend the line → read the intercept with its meaning → its uncertainty (from L4 lines) → comment on the reliability of the extrapolation.
- *Marks:* 6–10. *Graph:* linear, axes chosen so the intercept is readable. *Uncertainty:* intercept range. *Evaluation:* extrapolation limits.
- *AO:* AO2 with 2–3 AO3. *Difficulty:* 2. *SL/HL:* neutral.
- *Generator:* linear fit, `check: 'intercept'`, `d.interceptRange()`, `basis: 'lines'`: **○/✓ supported**.
- *Pilot:* B5 (b). *Priority:* **1** (the absolute-zero extrapolation variant). *Risk:* LOW.

**L3 Proportionality test**
- *Description:* decide whether y ∝ x, from a graph (straight line through the origin within error bars) or from the table (ratios of non-adjacent rows).
- *Contexts:* force against extension (A.2), current against p.d. for a resistor or filament (B.5), pressure against temperature in °C and K (B.3), force on a wire against current (D.3).
- *Primary:* IN3, IN4. *Secondary:* GR4, EV2, IN8.
- *Sequence:* ratio test from the table → graph test → conclusion → physical reason for any failure.
- *Marks:* 5–9. *AO:* AO3-rich. *Difficulty:* 1–2.
- *Generator:* `throughOrigin` claim ✓; **table-ratio result ✗ (small gap)**.
- *Pilot:* D3 (d). *Priority:* 2. *Risk:* LOW.

**L4 Max/min lines → uncertainty in gradient and intercept**
- *Description:* students draw (or use drawn) steepest and shallowest lines through error bars and derive the uncertainty of a gradient-based or intercept-based result, then use it in a conclusion.
- *Contexts:* any L1/L2 context with significant error bars.
- *Primary:* GR8, GR9. *Secondary:* EV5, IN9, DH8.
- *Sequence:* draw lines (self-marked) → gradient range → result ± uncertainty → verdict on an accepted value.
- *Marks:* 6–10. *Uncertainty:* central. *Evaluation:* the verdict.
- *AO:* balanced. *Difficulty:* 2–3.
- *Generator:* band, `basis: 'lines'`, `verdict` with margin: **◐**; examiner-graph variant showing the intercept range, and accepted ranges that tolerate students' own lines, need review.
- *Pilot:* A1 (g), D3 (e) (given %). *Priority:* 2. *Risk:* **HIGH** (graph-drawing judgement; mark schemes must accept students' own lines).

### N — Non-linear relationships

**N1 Inverse relationship → reciprocal plot**
- *Contexts:* frequency against length (C.4), pressure against volume (B.3), resistance against cross-sectional area (B.5), intensity against distance squared (C/E contexts).
- *Primary:* GR14, IN2. *Sequence:* recognise the inverse trend → plot y against 1/x → gradient → constant.
- *Marks:* 6–10. *Difficulty:* 2. *Risk:* LOW. *Status:* ✓ C4. *Priority:* 3 (covered).

**N2 Power law with known exponent → linearise**
- *Contexts:* range² against height (A.1), period² against length or mass (C.1), kinetic energy against speed (A.3), distance against time² for free fall (A.1).
- *Primary:* GR14, IN2. *Sequence:* given relationship → which quantities to plot → gradient → constant.
- *Marks:* 6–10. *Difficulty:* 2. *Risk:* LOW. *Status:* ✓ A1. *Priority:* 3 (but see N3).

**N3 Non-linear recognition → choose a transformation**
- *Description:* students see curved data, use the error bars to show that no straight line fits, propose and justify a transformation from a given or suggested model, then test it. Distinct from N2: here the student decides that a transformation is needed and which one.
- *Contexts:* period of a mass–spring system against mass (C.1), time of fall against height (A.1), terminal p.d. against load resistance (B.5), sound intensity against distance (C.2 context, inverse square), fringe spacing against slit separation (C.3).
- *Data:* experimental. *Primary:* IN5, GR14, IN2. *Secondary:* GR2, DH9, IN8.
- *Sequence:* show the data are not linear (error bars) → choose what to plot to test the model → plot one point → gradient with unit → conclusion.
- *Marks:* 7–11. *Graph:* two graphs (raw curve, then transformed). *Uncertainty:* error bars carried to the transformed graph. *Evaluation:* does the transformed graph support the model.
- *AO:* AO3-rich. *Difficulty:* 2–3. *SL/HL:* neutral.
- *Generator:* derived columns ✓, two graphs in one dataset **✗**, `notLinear` claim **✗** (specification 19.1 item 5).
- *Pilot:* none. *Priority:* **1**. *Risk:* MEDIUM.

**N4 Log–log analysis: unknown exponent**
- *Description:* data spanning a wide range; students use log–log to find an exponent and compare it with a model. [IB] logs for all students; [Legacy: 2025 evidence] a database log–log context.
- *Contexts:* orbital period against orbital radius for planets or moons (D.1, Kepler's third law), intensity against distance from a source (C.2/E.5 contexts), power radiated against temperature (B.1, avoiding the 2025 star context), drag force against speed (A.2, given model).
- *Data:* secondary (database) or primary over a wide range.
- *Primary:* GR15, IN2. *Secondary:* D1 skills, DH10 (complete log columns), IN9.
- *Sequence:* complete log values in the table → interpret the gradient as the exponent → find the constant from the intercept → compare with the model → comment on the range of the data.
- *Marks:* 7–11. *Graph:* log–log on linear axes (log values plotted). *Uncertainty:* light (no propagation through logs: excluded by the guide). *Evaluation:* exponent agreement.
- *AO:* AO3-rich. *Difficulty:* 3. *SL/HL:* neutral (logs are Tool 3 for all).
- *Generator:* **✗ log columns as a vetted feature** (a log is taken of a quantity in a stated unit; units shown in the heading, e.g. lg(T / s)); no uncertainty propagation through logs; validator check of gradient = exponent.
- *Pilot:* none. *Priority:* **1** (with D1). *Risk:* MEDIUM.

**N5 Exponential change: half-life and constant ratio (SL-safe)**
- *Description:* decay-type curves analysed with SL tools: half-life from a curve, constant-ratio test, predicting a later value. **[IB]** the decay constant and N = N₀e^(−λt) are **HL only** (E.3), so a semi-log analysis with gradient −λ needs the relationship supplied in the question and a teacher check that it is fair to SL students.
- *Contexts:* radioactive decay with background (E.3), cooling of a liquid (B.1, modelled empirically), foam or water draining as an analogue model.
- *Primary:* GR5, GR12, IN2. *Secondary:* EU10, IN7.
- *Sequence:* half-life from the curve → constant-ratio test with two intervals → prediction at a later time.
- *Marks:* 6–10. *Difficulty:* 2. *Risk:* MEDIUM (SL boundary; analogue models need empirical-model support).
- *Generator:* exponential fit ✓; empirical (non-law) models **✗**. *Pilot:* E3. *Priority:* 3.

### G — Graph features

**G1 Area under a graph**
- *Contexts:* force–time from a force sensor → impulse (A.2), velocity–time → displacement (A.1), force–extension → work done (A.3), current–time → charge (B.5).
- *Data:* sensor-style, many points. *Primary:* GR10. *Secondary:* DH2, DH9, EV1.
- *Sequence:* identify what the area represents → estimate it (squares or shapes) → use it → evaluate the estimate.
- *Marks:* 5–9. *Uncertainty:* estimate method. *Difficulty:* 2. *Risk:* MEDIUM (accepted ranges for area estimates).
- *Generator:* **✗** (area result with justified range; sensor-like data). *Pilot:* none. *Priority:* 2.

**G2 Tangent: instantaneous rate of change**
- *Contexts:* displacement–time of an accelerating trolley (A.1), cooling curve (B.1), charge or count against time (E.3 context).
- *Primary:* GR11. *Secondary:* DH9, IN1.
- *Sequence:* draw a tangent at a stated point → gradient with unit → interpret → compare with a second point.
- *Marks:* 5–9. *Difficulty:* 2–3. *Risk:* **HIGH** (tangent-drawing judgement; wide ranges).
- *Generator:* **✗** (tangent support with ranges derived from plausible tangents). *Priority:* 3.

**G3 Prediction at an unmeasured value**
- *Description:* interpolation (or modest extrapolation) at a value that is **not** a measured row. Usually a part of another archetype, not a whole dataset.
- *Primary:* GR12, IN7. *Marks:* 2–3 within a question. *Difficulty:* 1–2. *Risk:* LOW.
- *Generator:* ✓, but **add a validator check that a prediction point is not a measured row** (the C4 audit finding). *Pilot:* C4 (f) (weak: measured row). *Priority:* **1** (as a component).

### V — Models and evidence

**V1 Model versus data comparison**
- *Description:* measured data compared with a theoretical model: a model curve or predicted values alongside data; students judge agreement using uncertainty and explain a systematic departure.
- *Contexts:* projectile range against angle (A.1), I–V of a filament against an ohmic model (B.5), period of a pendulum against the model (C.1), predicted against measured temperature rise (B.1).
- *Data:* experimental plus model. *Primary:* IN6, IN9, EV5. *Secondary:* EU3, EV2.
- *Sequence:* calculate one model value → compare with the measured value using uncertainty → describe where the data depart → suggest a physical reason.
- *Marks:* 6–10. *Graph:* data with a model curve (multi-series). *AO:* AO3-heavy. *Difficulty:* 2–3. *Risk:* MEDIUM.
- *Generator:* **✗** model-curve overlay on the students' graph; `agrees`/`verdict` ✓. *Priority:* 2.

**V2 Model validity range**
- *Description:* data follow a simple model over part of the range and depart from it elsewhere; students find where the model holds and explain why it fails (an approximation or assumption breaking down).
- *Contexts:* spring extension beyond the limit of proportionality (A.2), pendulum period at large amplitude (C.1, avoiding the 2017 approach), terminal p.d. at large currents as the cell heats (B.5), gas behaviour at high pressure (B.3).
- *Data:* experimental. *Primary:* EV2, GR13, IN6. *Secondary:* IN5, EV1.
- *Sequence:* identify the linear region → use it for a constant → identify where the model fails (error bars) → explain the failure → state the safe range for predictions.
- *Marks:* 7–11. *Difficulty:* 3. *Risk:* **HIGH** (physical realism of the breakdown model; judgement of where it begins).
- *Generator:* **✗** laws with an exact and an approximate form, or a vetted empirical breakdown; a `validRange` claim checked against the error bars. *Pilot:* none. *Priority:* **1**.

**V3 Evidence for or against a hypothesis or claim**
- *Description:* students decide whether data support a stated hypothesis, claim or accepted value, using uncertainty ranges and error bars.
- *Contexts:* manufacturer's claims (A.1 launcher), proportionality hypotheses, a literature value of a constant.
- *Primary:* IN8, IN9, EV5. *Secondary:* GR8/GR9.
- *Sequence:* range of the result → compare with the claim → conclusion → what further evidence would help.
- *Marks:* 2–4 within a question, or 5–10 as a whole. *Difficulty:* 2–3. *Risk:* MEDIUM (automated by the `verdict` margin; wording still needs care).
- *Generator:* `verdict`, `agrees`, `throughOrigin` ✓. *Pilot:* A1 (g), D3 (d). *Priority:* 2 (as a component of most datasets).

### E — Errors and evaluation

**E1 Systematic offset / zero error**
- *Description:* a constant offset (an unzeroed balance, a ruler not starting at zero, a timer delay) appears as an intercept; the gradient is unaffected. Students identify, explain and correct it.
- *Contexts:* spring extension measured from the wrong zero (A.2), balance not zeroed (D.3-like but new context), light gate offset in timing (A.1), thermometer offset (B.1).
- *Data:* experimental with a `zero-offset` systematic effect. *Primary:* EU2, EU3, GR7. *Secondary:* GR6, EV4.
- *Sequence:* notice the line misses the origin → explain why a zero error causes it → show the gradient-based result is unaffected → correct a reading.
- *Marks:* 6–10. *AO:* AO3-rich. *Difficulty:* 2. *Risk:* MEDIUM.
- *Generator:* `systematic: zero-offset` ✓, `throughOrigin: false` ✓: **○ supported, not demonstrated**. *Priority:* **1**.

**E2 Multiplicative systematic effect: calibration or energy loss**
- *Description:* a calibration factor or an energy loss biases every reading in one direction; students identify the direction of the effect on the final result and whether a graphical method removes it.
- *Contexts:* specific heat capacity with heat loss to the surroundings (B.1), a meter that reads 3 % high (B.5), friction in a pulley experiment (A.2), an energy-efficiency measurement (A.3).
- *Data:* experimental with `calibration` or `heat-loss`. *Primary:* EU3, EV3. *Secondary:* EV4, IN9.
- *Sequence:* result → compare with accepted value → identify a systematic cause consistent with the direction → explain how it affects the result → improvement.
- *Marks:* 6–10. *AO:* AO3-heavy. *Difficulty:* 2–3. *Risk:* **HIGH** (direction-of-effect reasoning is subtle; mark schemes must accept valid alternatives).
- *Generator:* `calibration`, `heat-loss` ✓: **○**. *Priority:* **1**.

**E3 Anomaly / outlier evaluation**
- *Contexts:* any; one reading inconsistent with the trend, with a plausible cause.
- *Primary:* EU9. *Secondary:* GR4, IN1. *Sequence:* identify → justify exclusion (no mathematical processing, [IB]) → refit or use the remaining data.
- *Marks:* 2–4 within a question. *Difficulty:* 1–2. *Risk:* LOW (validated: ≥ 4× normal scatter, no other point above 2.5×). *Status:* ✓ B5. *Priority:* 2.

**E4 Method evaluation tied to data** (sequence S3)
- *Description:* a short context whose marks are mostly about the method: controls, the main source of uncertainty, a weakness revealed by the data, a specific improvement.
- *Contexts:* any; especially where the data show the weakness (large spread at one end, too narrow a range, too few points).
- *Primary:* EX1, EX6, EV1, EV3, EV4. *Secondary:* EX7, EV6.
- *Sequence:* control variable → why a step was done → what the data show about the method → improvement and its effect.
- *Marks:* 5–8. *AO:* AO3-heavy. *Difficulty:* 2–3. *Risk:* **HIGH** (free-text mark schemes need many acceptable answers).
- *Generator:* text parts ✓; data-revealed weakness needs claims such as "range too narrow" **✗**. *Pilot:* B5 (e), E3 (a), (e). *Priority:* 2.

### D — Data sources

**D1 Secondary / database data testing a law**
- *Description:* real values from a public source (with provenance), processed to test a law. [IB] Tool 2: databases; [Legacy: 2025 evidence] a database context.
- *Contexts:* planetary or satellite orbits (D.1), material resistivities against temperature coefficient (B.5), Earth's albedo or solar data (B.2), half-lives and decay energies (E.3, SL parts only).
- *Data:* secondary; no invented scatter. *Primary:* IN6, IN9, GR15 or GR14. *Secondary:* DH10, EV6 (range and quality of the data).
- *Sequence:* complete processed values → graph → constant or exponent → compare with the model → comment on the data's range or selection.
- *Marks:* 7–11. *Uncertainty:* light (often significant figures of the data). *AO:* AO3-heavy. *Difficulty:* 2–3.
- *Generator:* **✗ secondary-data mode**: `source: 'secondary'`, provenance, values checked against the model by the independent audit, no noise model required, realism warnings adapted. *Pilot:* none. *Priority:* **1** (one dataset, with N4). *Risk:* **HIGH** (accuracy of real values, licensing, provenance, originality).

**D2 Astronomical or field observations**
- *Description:* observational data that cannot be controlled: changing brightness of a star, shadow length over a day, temperature of a pond, sound level outdoors.
- *Contexts:* stellar luminosity and brightness (E.5), Wien's law with star temperatures (B.1/E.5), shadow geometry (A.1 context), cooling of a lake (B.1).
- *Data:* observational (secondary or simulated observations). *Primary:* IN1, IN6, EV1 (uncontrolled variables). *Secondary:* GR15, EU1.
- *Marks:* 6–10. *Difficulty:* 2–3. *Risk:* **HIGH** (realism of observational scatter; uncontrolled variables).
- *Generator:* **✗** (observational noise models; secondary mode). *Priority:* 2.

**D3 Simulation or model output** (sequence S6)
- *Description:* noise-free model output used either as data to analyse (labelled as simulation) or to choose between set-ups.
- *Contexts:* field strength along an axis for different coil spacings (D.2/D.3 contexts), projectile range against angle with and without drag (A.1), energy of a satellite against radius (D.1, SL parts).
- *Data:* model, clearly labelled, no measurement scatter. *Primary:* EV7, IN6. *Secondary:* GR1, IN7.
- *Sequence:* compare the modelled options → choose and justify → use the chosen output → state a limitation of the model.
- *Marks:* 5–9. *AO:* AO3-heavy. *Difficulty:* 2–3. *Risk:* **HIGH** (fair design questions; model validity).
- *Generator:* **✗** (multi-panel or multi-series figures; `source: 'model'` with realism checks switched off by declaration). *Priority:* 3.

---

## 3. Classification

| Category | Archetypes |
|---|---|
| Already demonstrated | M1, L1, L2, N1, N2, N5, E3, V3 |
| Demonstrated weakly | M4, L3, L4, G3, E4 |
| Supported but not yet demonstrated | M2, E1, E2 |
| Not currently supported | M3, N3, N4, G1, G2, V1, V2, D1, D2, D3 |
| Better suited to Paper 2 or the IA (not archetypes) | full method design and research questions (IA); safety and ethics (IA); first-principles derivations and content recall (Paper 2); statistics beyond means and ranges (not assessed) |

---

## 4. Difficulty definitions **[Design]**

| Level | Meaning | Typical features | Not this |
|---|---|---|---|
| **1** | straightforward extraction and processing, limited inference, low cognitive load | read values, one-step calculations, a mean, a percentage uncertainty, a control variable, an obvious anomaly; familiar context; relationship given | a short version of a hard question |
| **2** | multi-step analysis, interpretation plus calculation, some evaluation | gradient or intercept to a constant, propagation to a rounded result, proportionality judgement, one evaluation point | more parts of the same kind |
| **3** | unfamiliar context, non-obvious transformation, model limitations, evidence evaluation, synthesis | choosing a transformation, log–log, model validity range, systematic-effect reasoning, secondary data, combining two lines of evidence | more calculations, harder algebra or obscure physics |

Bank target **[Design]**: about 25 % Difficulty 1, 50 % Difficulty 2, 25 % Difficulty 3. Each archetype states its
natural range; difficulty comes from the reasoning required, not from the number of steps.

---

## 5. Archetype review risk and the review model

The review model is defined in **specification section 16** (adopted 6 October 2026); this section only lists the
archetype risk levels it uses (`ARCHETYPE_RISK` in `tools/1b/batch.mjs`).

| Archetype risk | Meaning | Archetypes |
|---|---|---|
| **LOW** | standard physics, highly automatable, low ambiguity | M1, M2, L1, L2, L3, N1, N2, G3, E3 |
| **MEDIUM** | some judgement required | M3, M4, N3, N4, N5, G1, V1, V3, E1 |
| **HIGH** | graph-drawing judgement, model limitations, unusual data interpretation, subtle uncertainty conclusions | L4, G2, V2, E2, E4, D1, D2, D3 |

How these feed the dataset risk classes (specification 16.2): the first example of a MEDIUM or HIGH archetype is
**AMBER**; once one example has been individually reviewed and approved, later examples are judged by their own
features. The first example of a LOW archetype is **GREEN** but preferred for the teacher's sample. Other AMBER
triggers (first use of a judgement-heavy feature, an uncertainty-sensitive verdict, validator warnings, author
flags) apply whatever the archetype. Difficulty 3 is not a trigger by itself.

### 5.1 Expected classes for the first batch (section 7)

| # | Main archetype | Expected class | Why |
|---|---|---|---|
| 1 | M2 | GREEN (sample priority) | first example of a LOW-risk archetype |
| 2 | M1 | GREEN | established by A1 (a trial-level anomaly is a small, automatically checked feature) |
| 3 | E1 | AMBER | first E1 example; first use of a zero-offset systematic effect |
| 4 | L2 | GREEN | established by B5 |
| 5 | N3 | AMBER | first N3 example; first notLinear claim |
| 6 | E2 | AMBER | first E2 example; first heat-loss effect |
| 7 | D1 + N4 | AMBER | first secondary data and log graph |
| 8 | V2 | AMBER | first V2 example; first validity-range claim |

Proposed Batch 1 review (specification 16.3 item 4, for the teacher to confirm): inspect **7, 8 and 6** (the most
novel and judgement-heavy) and **1** (the GREEN sample); waive **3 and 5** with reasons if their automated checks
are clean, since zero offsets and linearisation are close to established patterns. That is 4 of 8 datasets inspected.


## 6. Diversity targets **[Design]**

The bank must not become *data → graph → gradient → constant*. Targets for the bank (and checked per batch once
the diversity check exists):

| Dimension | Target |
|---|---|
| Main analysis route | L1 (gradient → constant) as the main route in at most ~25 % of datasets |
| Data source | at least ~20 % secondary, observational, model or image data |
| Relationship | linear, inverse, power, log–log, exponential, non-linear-with-limit all represented; no type above ~35 % |
| Graph type | linear, transformed, curve, log–log, area/tangent, no-graph (M2-type) all represented |
| Uncertainty | each batch includes propagation with rounding, graphical (max/min), and repeated-reading uncertainty |
| Evaluation | each batch includes systematic error, model limits or hypothesis evaluation, and method improvement |
| AO | 40–60 % AO3 per batch of 40+ marks (`ao.mjs`) |
| Sequence | S1–S6 (specification 6.2) all used; no sequence above ~35 % of a batch |
| Context | themes A–E all represented; no apparatus repeated within a batch; standard practicals with new set-ups |
| Difficulty | ~25 / 50 / 25 % for Difficulties 1 / 2 / 3 |

---

## 7. Recommended first controlled batch (planning only; nothing generated)

Eight datasets, chosen for the audit's gaps. Contexts are candidates, to be checked for originality before writing.
Batch ID `batch-1`.

| # | Archetype(s) | Candidate context (SL topic) | Diff. | Fills gap | Needs first | Risk |
|---|---|---|---|---|---|---|
| 1 | **M2** + G3 component | specific heat capacity of a metal block from heater readings and temperature rise (B.1): value ± uncertainty, largest uncertainty, heat-loss direction | 1 | value ± uncertainty, Difficulty 1, S2 | confirm a no-graph dataset validates | LOW |
| 2 | **M1** + E3 (trial outlier) | repeated light-gate times for a trolley released from rest (A.1): mean, half-range, excluding one outlying trial, speed ± uncertainty | 1 | Difficulty 1, measurement-first | trial-level anomaly | LOW |
| 3 | **E1** + L2 | extension of a spring measured with a ruler whose zero is offset (A.2): line misses the origin, spring constant unaffected, correct the readings | 2 | systematic error | none | MEDIUM |
| 4 | **L2** + G3 + V3 | pressure of a fixed volume of gas against temperature in °C (B.3): extrapolate to absolute zero, intercept uncertainty from the lines, compare with −273 °C, predict at an unmeasured temperature | 2 | prediction at an unmeasured value, intercept uncertainty | prediction-not-measured check | MEDIUM |
| 5 | **N3** | period of a mass–spring oscillator against mass (C.1): curve rejected by error bars, choose T² against m, gradient → spring constant, unit in base units | 2 | non-linear → linearisation | `notLinear` claim; two graphs | MEDIUM |
| 6 | **E2** | specific heat capacity of water or a liquid by electrical heating with heat loss (B.1): result too high or too low, direction reasoning, graphical method that reduces the effect | 3 | systematic error direction, Difficulty 3 | none (heat-loss exists) | HIGH |
| 7 | **D1** + **N4** | orbital period against orbital radius for moons of one planet from published values (D.1): log–log, exponent ≈ 1.5, mass of the planet from the constant | 3 | secondary data, log–log, Difficulty 3 | secondary-data mode; log columns | HIGH |
| 8 | **V2** | extension of a spring against load beyond the limit of proportionality (A.2): linear region, where Hooke's law fails, safe range for predictions | 3 | model-limit reasoning | breakdown model and `validRange` claim | HIGH |

This batch is about 70 marks (eight questions of 7–10 marks). Expected AO3 is about 45 % by design, which the AO
report will check. Datasets 3 and 8 both use springs; if the diversity check forbids repeated apparatus, replace 8 with
the large-current terminal p.d. variant of V2 (B.5) or move it to batch 2.

**Capabilities needed before the batch (in order):**
1. `notLinear` claim and two graphs per dataset (N3).
2. Prediction-not-at-a-measured-row check (G3).
3. Trial-level anomaly (M1 variant).
4. Secondary-data mode and log columns (D1 + N4).
5. Breakdown models and a `validRange` claim (V2).
6. Batch-level AO report and a first diversity report (archetype, source, relationship, difficulty), so the batch is checked as a batch.

Datasets 1, 3, 6 need no new capability and could be written first (sub-batch 1a); 2, 4, 5 need small additions
(1b); 7 and 8 need the larger ones (1c). Every dataset still needs its independent audit entry.

**Second batch candidates:** M3 (instrument reading), L4 (graph-based uncertainty in full), G1 (area under a
force–time graph), V1 (model curve against data), E4 (method evaluation), D2 (observational), L3 (table-ratio test).

---

## 8. Decisions requiring teacher approval

1. ~~Adopting sample-based batch acceptance~~: adopted 6 October 2026 (specification section 16).
2. Confirming the proposed Batch 1 review (section 5.1): which AMBER datasets to inspect and which to waive.
3. The first batch's archetypes and contexts (section 7), and the use of real published data for D1.
4. Allowing semi-log analysis of exponential decay with the relationship supplied (N5), given that the decay constant is HL content.
5. The diversity targets (section 6), especially the limit on L1 and the share of non-laboratory data.
6. Empirical (non-law) models for analogue and breakdown contexts (N5, V2).
