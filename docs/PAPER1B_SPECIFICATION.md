# Paper 1B question bank: design specification

Version 3, 8 October 2026 (after Batch 2: section 21 records every rule the system now enforces, each tied to its checks and
regression tests; version 2: Phase 13, the Phase 12 rules made permanent; version 1: 6 October 2026).
Branch `paper1b-batch2`. This file is in `docs/`, which `_config.yml` keeps off the published website. Implementation
details and reasons for the version 2 rules: `docs/PAPER1B_PHASE12_TOOLING.md`.

This is the **authoritative design specification** for the Paper 1B system. Where it conflicts with an older note
(including `docs/PAPER1B_HANDOFF.md` or `tools/1b/README.md`), this file wins for *design*; the README remains the
authority on *how to write a dataset file*. Changes to this specification need the teacher's agreement.

## How to read this document

Every rule is tagged with where its authority comes from. Do not present a lower tag as if it were a higher one.

| Tag | Meaning | Authority |
|---|---|---|
| **[IB]** | Stated in the 2025 DP Physics guide (first assessment 2025) | IB requirement |
| **[Legacy]** | Evidence from Section A of legacy Paper 3 (2016 guide, exams May 2016 to Nov 2024) or from the 2025 papers | Evidence of assessment practice, not a requirement |
| **[Design]** | Our decision for this practice question bank | Agreed design choice; changeable with the teacher's agreement |
| **[Impl]** | How our generator implements a rule | Implementation detail; changeable by engineering if the [Design] rule still holds |

**Evidence base.** The 2025 guide (assessment outline, assessment objectives, "Skills in the study of physics": Tools 1–3
and Inquiry 1–3); the 2016 guide (Paper 3 outline, sub-topic 1.2, mathematical requirements); Section A and mark
schemes of all 17 legacy Paper 3 sessions in the teacher's archive (May 2016 to Nov 2024; 2021 and 2022 not held);
the five 2025 Paper 1B papers held (May TZ1–3, Nov TZ1 and TZ3); the five pilot datasets; the code in `tools/1b/`.
The full analysis (skill matrix, evidence codes, classification A–D) is the teacher-reviewed report
"Legacy Paper 3 Analysis" (claude.ai artifact `WGssD9pBMF4CSeQCN5VMs6`); its conclusions are summarised in Appendix A.
IB papers, mark schemes and guides are reference material only: nothing in this file reproduces their wording.

---

## 1. Purpose

The system produces **authentic, original, data-based IB DP Physics Paper 1B practice questions** that assess the
interpretation, analysis, application and evaluation of supplied scientific data and context. **[Design]**

- *Authentic*: same demands, command terms, mark density and conventions as real Paper 1B. **[Design]** (benchmarked on [Legacy] and 2025 papers)
- *Original*: no IB question, dataset, context or sequence is reproduced or lightly modified (section 9). **[Design]**
- *Data-based*: the data or context must be needed to answer (section 3). **[IB]** "data-based questions"; the rest **[Design]**
- *Correct*: every number comes from an explicit, independently audited physics model and is validated (sections 10–11). **[Design]**
- *Reviewed*: nothing reaches students without an explicit teacher decision: an individual approval, or acceptance of a batch whose risky and sampled datasets the teacher reviewed (section 16). **[Design]**

It is a practice bank for students on the question bank page (`questions.html?paper=1B`), with typed answers marked
automatically where possible and IB-style mark schemes for self-marking. **[Design]**

---

## 2. Current IB structure

### 2.1 What the 2025 guide states **[IB]**

| Item | SL | HL |
|---|---|---|
| Paper 1 duration | 1 h 30 min | 2 h |
| Paper 1 weighting | 36 % | 36 % |
| Paper 1 marks | 45 | 60 |
| Paper 1A | 25 multiple-choice marks, SL material only | 40 multiple-choice marks, SL and AHL material |
| **Paper 1B** | **20 marks, data-based questions** | **20 marks, data-based questions** |

- Paper 1A and Paper 1B are separate booklets completed together without interruption; the split of time between them is not prescribed. **[IB]**
- Paper 1 tests AO1, AO2 and AO3, weighted about 50 % AO1 + AO2 and 50 % AO3. **[IB]**
- AO3 includes analysing, evaluating and synthesising experimental procedures, primary and secondary data, trends, patterns and predictions. **[IB]**
- A calculator and a clean data booklet are allowed. **[IB]**
- Some exam content may link to the nature of science, but definitions within a NOS aspect are not assessed. **[IB]**
- **Paper 1B is common to SL and HL.** **[Design: inferred]** The guide gives the same Paper 1B line for both levels; the 2025 SL and HL Paper 1B papers held are identical apart from the cover **[Legacy: 2025 evidence]**. Because SL candidates sit it, it uses SL material only.

### 2.2 Relationship to other components

- **Paper 1A:** knowledge and application through multiple choice. A Paper 1B question that a Paper 1A item could replace (one fact, one formula, decorative table) is not a Paper 1B question. **[Design]**
- **Paper 2:** short-answer and extended response on the syllabus content. Derivations from first principles and content recall belong there. Paper 1B may need content knowledge to *use* the data, but should not *test* it for its own sake. **[Design]**, based on the AO weighting **[IB]**
- **Internal assessment (scientific investigation):** the only component that assesses AO4 (carrying out an investigation). Formulating a research question, designing a full method, piloting, safety and ethics, and choosing sources belong to the IA. Paper 1B may ask students to *evaluate* a method or *suggest* an improvement, but not to design an investigation. **[IB]** (AO4 is IA only) + **[Design]**

### 2.3 Current Paper 1B vs legacy Paper 3 Section A

| Feature | Legacy Paper 3 Section A (2016 guide) | Current Paper 1B (2025 guide) |
|---|---|---|
| Stated content | "One data-based question and several short-answer questions on experimental work" **[Legacy]** | "Data-based questions" **[IB]** |
| Marks | 15 (SL and HL Section A shared) **[Legacy]** | 20 **[IB]** |
| Observed shape | 2–3 questions; Q1 6–10 marks **[Legacy]** | 2–3 questions of 6–12 marks each **[Legacy: 2025 evidence]** |
| Paper | Inside Paper 3 with an option section | Inside Paper 1 with Paper 1A |
| Data sources | Student laboratory data only | Laboratory, database, model or simulation output, images (2025 evidence; Tool 2) **[IB]** |
| Logarithms | HL only **[Legacy]** | All students; log scales listed in Tool 3 **[IB]** |
| Outliers | Rarely assessed **[Legacy]** | Named skill, with no mathematical processing **[IB]** |
| Practicals | Suggested, **not prescribed** (2016 Physics guide: "could include (but are not limited to)") **[Legacy]** | Not prescribed **[IB]** |
| Statistics (SD, chi-squared, correlation coefficients) | Only in the 2016 NOS text; never assessed in Section A **[Legacy]** | Not listed in the Tools **[IB]**; not used in 2025 papers |

Consequences: the old "one data question + short experimental questions" split is a **format label, not a design to
copy** (most legacy short questions also contained data). The skills transfer; the template does not. **[Design]**

---

## 3. What counts as a Paper 1B question

### 3.1 Definition **[Design]** (built on the [IB] description "data-based questions" and AO3)

A Paper 1B **question** is one context (a "dataset" in our system) of linked sub-questions in which **the student must
use supplied information** (data, graphs, diagrams, procedures or model output) to interpret, analyse, apply or
evaluate. A **paper** (practice set) is 20 marks of such questions.

A valid question provides some combination of:

- experimental, observational or secondary data (table, graph or chart);
- simulation or model output;
- a diagram of apparatus, a set-up or an observation;
- a described procedure;
- a model or hypothesis to test, or a model prediction;

and requires the student to do something with it.

### 3.2 Tests a question must pass **[Design]**

1. **Necessity:** most marks cannot be earned without the data or context shown.
2. **Coherence:** the parts belong to one investigation or one set of data.
3. **AO3 presence:** at least one part analyses or evaluates (not only calculates).
4. **Not Paper 1A:** no part is a recall item that would work as multiple choice without the data.
5. **Not Paper 2:** content knowledge and derivations may only *support* the data analysis. Two cases:
   - *Supporting set-up* (allowed, at most **2 marks per question**): a short step that the later data analysis depends on, such as a "show that" rearrangement giving the straight-line form that is then plotted, or a direction read from the question's own diagram that explains the measured change.
   - *Free-standing content* (at most **1 mark per question**): recall or derivation that no later part uses and that needs neither the data nor the diagram.

   New questions should prefer giving the relationship and testing it (section 13). *(Revised 6 October 2026 after the pilot audit: the earlier blanket "1 content-only mark" rule would have counted A1 (d), C4 (b) and D3 (a) as violations although each sets up the analysis that follows. They are within the revised rule; see section 18.)*
6. **Not IA:** no part asks the student to design a whole investigation.
7. **SL content only, in every part:** any law, definition or term a student needs for a mark must be in the SL guide. A term outside it may not be needed for a mark, even in a mark scheme (A2-B02 (d) asked about the elastic limit and the limit of proportionality, which the guide's A.2 doesn't include; it was replaced on 8 October 2026). **[IB]** content + **[Design]**

---

## 4. Data contexts

The guide expects students to work with hands-on experiments, databases, simulations and modelling, to use sensors,
image and video analysis, spreadsheets and computer modelling, and to extract data from databases. **[IB]** (Tool 2, Inquiry 1)
The 2025 papers include a database context with log–log analysis and a modelled-curve design context. **[Legacy: 2025 evidence]**
So **not every dataset is a laboratory experiment**. **[Design]**

| Context type | Example | Data origin | Status |
|---|---|---|---|
| Hands-on experiment | current balance, spring launcher | primary, generated from a model with measurement scatter | supported |
| Sensor or data-logger experiment | light sensor, motion sensor, force sensor | primary; finer resolution, more points, sensor-specific noise | supported, including dense sensor traces (section 14; no sensor-specific noise type yet) |
| Image or video analysis | multiflash photograph, an instrument scale, heights read from video frames | primary, read from a figure | supported: instrument scales with read-back (section 15); video data given as a table |
| Field investigation | temperature of a pond over a day, sound level against distance outdoors | primary; uncontrolled variables matter | supported in principle |
| Database or secondary data | catalogue of stars, published material constants | secondary, real values with provenance | supported: provenance, source column definitions and a stored copy of the source (section 10) |
| Astronomical observation | brightness of a variable star, a binary star's spectral lines | secondary, or **simulated observations, clearly labelled as simulated** | supported, with the label checked (T9; C5-B01) |
| Simulation or computational output | modelled field profiles for three set-ups | model output, no measurement scatter | **roadmap** |
| Model vs experimental data | data plotted against a theoretical curve or an "observed = model" line | both | supported: model curves and reference lines (section 14), observed published values (section 10) |
| Theory or model testing | "does this relationship hold, and over what range?" | any | partly supported |
| Analogue model | foam decay compared with radioactive decay | primary, empirical model | **roadmap** |

[Impl] The `context` field allows `experimental`, `observational` and `unfamiliar`; the `source` field (`primary`,
`secondary`, `observational`, `model`) says where the data come from.

**Simulated observations** (data generated from a model to look like real observations, such as a binary star's spectral
lines) are allowed **only when the question says clearly that the data are simulated**. **[Design]** (teacher, 8 October 2026)

Bank mix **[Design]**: mostly primary laboratory data (as in the real papers), with **about one question in five**
using secondary, model, image or observational data once the generator supports them. Exact share: teacher decision.

---

## 5. Skill taxonomy

Each skill has an ID used in a dataset's `skills` list **[Impl]** (the current free-form tags will be mapped to these IDs).
Source column: **IB** = named in the 2025 guide; **L** = assessed in legacy Section A (count of 17 sessions where useful);
**25** = seen in 2025 Paper 1B. "Gen" = current generator support: ✓ yes, ◐ partly, ✗ no.

### 5.1 Data handling (DH)
| ID | Skill | Source | Gen |
|---|---|---|---|
| DH1 | Read values from tables, including headings with units and ± | IB, L, 25 | ✓ |
| DH2 | Calculate a quantity from data with a given relationship | IB, L, 25 | ✓ |
| DH3 | Mean of repeated readings (x̄ notation) | IB, L, 25 | ✓ |
| DH4 | Range, and half-range as the uncertainty of a mean | IB (mean and range), 25 | ✓ |
| DH5 | Ratios; percentage change and percentage difference | IB | ◐ |
| DH6 | Absolute, fractional and percentage uncertainty | IB, L, 25 | ✓ |
| DH7 | Propagation for +, −, ×, ÷ and powers (worst-case sums) | IB, L 16/17, 25 | ✓ (not student-checked as a step) |
| DH8 | Significant figures and decimal places of a value and its uncertainty | IB, L 13/17, all 2025 | ◐ (validator-checked `asks.valuePm`, self-marked) |
| DH9 | Units: derived and SI base units of a result, gradient or constant | IB, L 16/17, 25 | ◐ (validator-checked `asks.unit`, self-marked) |
| DH10 | Complete a table of processed values | IB, L, 25 | ✓ |
| DH11 | Order-of-magnitude estimates; when an effect can be neglected | IB, L | ◐ |

### 5.2 Graphing (GR)
| ID | Skill | Source | Gen |
|---|---|---|---|
| GR1 | Interpret a graph or chart (read values, describe features) | IB, L, 25 | ✓ |
| GR2 | Plot a point (raw or processed) | IB, L, 25 | ◐ (point can be omitted; self-marked) |
| GR3 | Draw uncertainty bars | IB, L, 25 | ◐ (drawn by generator, y bars only, not by student; section 14) |
| GR4 | Line of best fit (through all error bars) | IB, L, 25 | ✓ (examiner graph, self-marked) |
| GR5 | Curve of best fit | IB, L | ◐ (exponential only) |
| GR6 | Gradient, with unit | IB, L, 25 | ✓ |
| GR7 | Intercept and its physical meaning | IB, L, 25 | ✓ |
| GR8 | Maximum and minimum gradient lines | IB, L, 25 | ◐ (computed; not a student task) |
| GR9 | Uncertainty in gradient and in intercept | IB, L, 25 | ◐ (gradient only, given as a %) |
| GR10 | Area under a graph | IB | ✓ (area results with the accepted-range policy, section 14) |
| GR11 | Changes in gradient; tangent to a curve | IB, L (1) | ✗ |
| GR12 | Interpolation | IB, L, 25 | ✓ |
| GR13 | Extrapolation and its limits | IB, L, 25 | ◐ (no "model limit" check) |
| GR14 | Linearisation: choosing what to plot; meaning of transformed gradient and intercept | IB ("only where appropriate"), L 14/17, 25 | ✓ |
| GR15 | Logarithmic representations: log columns, log–log and semi-log analysis, log scales | IB (all students), L (HL), 25 | ◐ (log columns on linear axes; no log scales) |
| GR16 | Sketch a graph with labelled but unscaled axes | IB, L | ✗ |

### 5.3 Experimental reasoning (EX)
| ID | Skill | Source | Gen |
|---|---|---|---|
| EX1 | Identify independent, dependent and control variables | IB, L, 25 | ✓ |
| EX2 | Justify why a variable is controlled, or how | IB, L | ✓ |
| EX3 | Apparatus and instrument choice, set-up, meter placement | IB (measuring variables), L, 25 | ◐ |
| EX4 | Measurement technique (parallax, zero error, timing many cycles, measuring across many fringes) | IB, L, 25 | ◐ |
| EX5 | Reading an instrument scale or an image | IB (Tool 2), L, 25 | ✓ (instrument scales with read-back, section 15) |
| EX6 | Justify a step in the method | IB, L, 25 | ✓ |
| EX7 | Range and number of measurements | IB | ✓ (text) |
| EX8 | Purpose of repeated measurements | IB, L, 25 | ✓ |
| EX9 | Controlling variables (calibration, insulation, friction, background) | IB | ✓ |

### 5.4 Error and uncertainty (EU)
| ID | Skill | Source | Gen |
|---|---|---|---|
| EU1 | Identify random errors and how to reduce them | IB, L | ✓ |
| EU2 | Identify systematic errors (including zero offset, calibration, heat loss) | IB, L, 25 | ✓ (systematic.mjs; unused by pilots) |
| EU3 | Direction and effect of a systematic error on the result, gradient or intercept | IB, L 9/17, 25 | ✓ (unused by pilots) |
| EU4 | Significance of uncertainties in raw and processed data | IB, L | ✓ |
| EU5 | Accuracy (comparison with an accepted value using uncertainty) | IB, L, 25 | ✓ |
| EU6 | Precision | IB, L | ✓ |
| EU7 | Reliability | IB, L | ✓ (text) |
| EU8 | Validity | IB | ✓ (text) |
| EU9 | Anomalous data: identify; justify inclusion or removal (no mathematical processing) | IB, pilot | ✓ |
| EU10 | Counting statistics (√N) | pilot (E3); SL content E.3 | ✓ |

### 5.5 Interpretation (IN)
| ID | Skill | Source | Gen |
|---|---|---|---|
| IN1 | Describe patterns and trends | IB, L, 25 | ✓ |
| IN2 | Identify relationships: direct, inverse, power, exponential | IB, L, 25 | ◐ (linear and exponential fits) |
| IN3 | Proportionality from a graph (straight line through origin within error bars) | IB, L 7/17 | ✓ |
| IN4 | Proportionality or non-proportionality from table ratios | L, 25 | ✓ (constant-value and constant-ratio claims) |
| IN5 | Recognise a non-linear relationship from error bars | L, 25 | ✓ (not-linear claim) |
| IN6 | Compare data with a model or theory | IB, L, 25 | ✓ |
| IN7 | Predict from a model or graph | IB, L, 25 | ✓ |
| IN8 | Evidence for or against a hypothesis | IB, L, 25 | ✓ |
| IN9 | Compare with the accepted scientific context or reference data | IB, L, 25 | ✓ |

### 5.6 Evaluation (EV)
| ID | Skill | Source | Gen |
|---|---|---|---|
| EV1 | Limitations of the method or data | IB, L, 25 | ✓ (text) |
| EV2 | Assumptions and when a model stops holding | IB, L | ◐ (no model-limit data) |
| EV3 | Methodological weaknesses and their impact on conclusions | IB, L, 25 | ✓ (text) |
| EV4 | Realistic, specific improvements | IB, L, 25 | ✓ (text) |
| EV5 | Impact of uncertainty on the conclusion | IB, L, 25 | ✓ |
| EV6 | Quality of evidence (range, number of points, scatter) | IB | ✓ (text) |
| EV7 | Choosing between set-ups from data or model output | L, 25 | ✗ |

### 5.7 Out of scope for Paper 1B **[Design]**
- Standard deviation, chi-squared, correlation coefficients and R² as student tasks: not in the 2025 Tools, never assessed in any paper reviewed. (A *qualitative* positive/negative correlation is fine: Tool 3 names it.) **[IB]** + **[Legacy]**
- Uncertainty propagation through trigonometric, logarithmic or exponential functions: the 2025 guide lists only +, −, ×, ÷ and powers. **[IB]**
- Formulating research questions, designing a full method, safety and ethics: IA. **[IB]** (AO4) + **[Design]**

---

## 6. Question structure

### 6.1 Design pattern **[Design]** (from [Legacy] sequences S1–S6 and the 2025 papers)

```
context / data  →  interpretation  →  quantitative processing  →  relationship / model  →  evaluation / prediction
```

This is a **pattern, not a template**. A question may start anywhere sensible, skip stages, or repeat one, as long as it
passes the tests in section 3.2.

### 6.2 Recognised sequences **[Legacy]**, endorsed as **[Design]**

| Code | Sequence | Typical marks |
|---|---|---|
| S1 Test a relationship | is it linear? → choose a transform → plot a point / error bar → gradient with unit → constant → compare with accepted value | 8–12 |
| S2 Single result with uncertainty | readings ± → value → propagate → value ± uncertainty to correct s.f. → systematic error or improvement | 5–8 |
| S3 Method critique tied to data | control variable → why a step → main error source → effect of systematic error → improvement | 4–7 |
| S4 Model-given graph | relationship given → rearrange to a straight line → gradient and intercept → constants → limits of the model | 7–10 |
| S5 Measurement first | read an instrument or image → its uncertainty → derived quantity → compare with reference data | 5–8 |
| S6 Design decision | modelled alternatives → choose and justify → use the result | 4–7 |

### 6.3 Rules for structure **[Design]**
1. Demand rises within a question: early parts 1 mark (read, state, identify); middle parts 2–3 marks (calculate, determine); final parts 1–2 marks (evaluate, suggest, discuss).
2. Use **stated intermediates** ("the gradient is about …", "the percentage uncertainty in the gradient is …") so a slip in one part does not block the rest, without revealing an answer still to be asked (section 13).
3. Each part is answerable in the time its marks imply.
4. **Acceptable variation:** a question may be purely graphical, purely tabular, purely evaluative of a described method with data, or a sequence of two linked datasets; the order of stages may change; a question may have no calculation if it still requires analysis of the data.

---

## 7. Multiple datasets

**[IB]** says "data-based questions" (plural). **[Legacy: 2025 evidence]**: every 2025 Paper 1B held has 2 or 3 questions.

**[Design]** A 20-mark practice set may be any of:
- **2–3 separate questions** of 5–12 marks each (the default, matching the real papers);
- **one substantial question** of up to 12 marks plus one or two short questions;
- **linked datasets** inside one question (for example a calibration dataset then a measurement dataset), where scientifically justified.

**[Design]** A single 20-mark dataset is not the default and needs teacher approval. Each question (dataset) stands alone
in the bank and can be practised on its own; papers are assembled from questions.

Paper assembly rules **[Design]**:
- total exactly 20 marks;
- topics from at least two themes;
- at least one graph-based question and at least one uncertainty-calculation question;
- coverage across the paper of DH8/DH9 (units and significant figures), a GR skill, an EU skill and an EV skill;
- AO3 about half the marks;
- no two questions using the same apparatus.

[Impl] Paper assembly is on the roadmap (section 19). Until then, students practise single questions.

---

## 8. Difficulty

**[Design]** Each part is assigned one level; each question's `difficulty` (1–3) reflects its highest substantial demand.

| Level | Demand | Examples |
|---|---|---|
| L1 Extraction | read a value, state a unit or variable | read a table entry; name a control variable |
| L2 Simple processing | one-step calculation | mean; % uncertainty of one reading |
| L3 Interpretation | describe or explain what data show | is it linear? does it pass through the origin? |
| L4 Multi-step analysis | chain of processing | gradient → constant → uncertainty, correctly rounded |
| L5 Model evaluation | judge a model or method against data | where the model fails; effect of a systematic error |
| L6 Unfamiliar application | apply skills to an unfamiliar context or data type | database log–log analysis; analogue model |

- A question should span several levels; most parts are L1–L4. **[Design]**
- Difficulty 1 questions: mostly L1–L3. Difficulty 2: up to L4–L5. Difficulty 3: includes L5–L6. **[Design]**
- **Do not make questions hard for the sake of it.** Difficulty comes from reasoning about data, not from obscure physics, heavy algebra or trick wording. **[Design]**
- The bank should contain all three difficulties (currently all pilots are 2). **[Design]**

---

## 9. Originality **[Design]** (and copyright rules in `CLAUDE.md`)

Legacy IB material (papers, mark schemes, guides, textbooks) is used **only** to identify transferable skills, command
terms and assessment structures.

Do **not** reproduce, in whole or in part:
- wording of questions, stems or mark schemes;
- numbers or datasets;
- graphs or diagrams;
- answer choices;
- distinctive contexts (an unusual set-up specific to one IB question);
- question sequences (the order and type of parts of a particular IB question);
- lightly modified versions of IB questions (changed numbers, same structure).

Standard school practicals (pendulum, internal resistance, specific heat capacity, standing waves) recur across many IB
papers and may be used, but each must have a **new set-up detail, new numbers and a new sequence of parts**. Before a
dataset is reviewed, its author records which IB questions use a similar context and how this one differs (teacher
review item). Every generated question must be genuinely original.

Note: B5-B01 (internal resistance) uses a context that appears in four legacy sessions; its numbers and sequence differ,
and B5's resemblance to a Nov 2025 Paper 2 value (r ≈ 0.8 Ω) is already recorded in the handoff.

---

## 10. Physics model

Every numerical dataset is generated from an **explicit physical model** wherever practical. **[Design]** Each dataset's
`physics` block records **[Impl]**:

| Element | Requirement |
|---|---|
| Governing relationship | built only from vetted laws in `laws.mjs` (SI units, reference values, limiting cases, dimension-checked) |
| Scenario and principles | what happens and which syllabus principles apply |
| Assumptions | every idealisation stated (and checked against the question text by the teacher) |
| Derivation | steps from the principles to the relationship used |
| Parameters | value, unit, plausible range for a real set-up, note |
| Theoretical values | noise-free model values, inside a declared expected magnitude |
| Measurement model | instrument, how the reading is made, physical cause of scatter |
| Uncertainty model | constant, half-range of repeats, √N, or declared propagation |
| Systematic effects | where used: type, cause, justification (zero offset, calibration, drift, heat loss) |
| Deterministic generation | a fixed seed; building twice gives identical output |
| Validation | section 11; parameter recovery from noise-free data proves the analysis inverts the model |

Rules **[Design]**:
- No formula typed directly into a dataset; a missing law is added to `laws.mjs` with reference values and limiting cases first.
- **Empirical models** (an analogue system, an observed trend with no syllabus law) are allowed only with a stated physical basis, a documented functional form, an independent audit and the teacher's approval; they are marked as empirical in the audit report. Laws beyond the SL syllabus are used only to generate data: students are always given the relationship a part needs.
- **Secondary data** (database values) are not generated from a model and must not have invented scatter added. They need provenance (source, address, date, values taken, transformations), **the source's own column heading and its meaning** for every published column, and **a stored copy of the values as printed**, kept outside the repository in the reference cache, with its checksum; every value must match the copy. **[Design]** (Phase 12, T10)
- Published values are normally checked against the model they test (within a stated tolerance). Values the question **compares** with a model rather than expecting to follow it (observed planetary temperatures against a no-atmosphere model) are declared **observed**, with a reason; they still need their source checked.
- **Model or simulation output** shown as "simulation data" has no measurement noise and must say so. *(Roadmap.)* **Simulated observations** carry realistic scatter and must be labelled as simulated (section 4).

---

## 11. Validation

All of the following are mandatory before a dataset can be AUTO-VALIDATED. **[Design]**; current implementation **[Impl]** in brackets.

| Check | Meaning | Implemented by |
|---|---|---|
| Dimensional consistency | every law, model step and result has the right dimensions | `laws.mjs` tests, `validate.mjs` (unit-dims, physics-units) |
| Numerical consistency | derived columns match their inputs; results match the data | `validate.mjs` (derived, fit, answer) |
| Units | every unit known; table headings show symbol / unit ± uncertainty; °C and angle rules | `validate.mjs`, `lib.mjs` |
| Significant figures | table values have the column's decimal places; uncertainties ≤ 2 s.f. and match the value's decimal places | `validate.mjs` (table-dp, uncertainty) |
| Uncertainty consistency | stated rule followed; derived uncertainties recomputed independently by differentiation; neglected terms small | `validate.mjs` (propagation), `uncertainty.mjs` |
| Model agreement | measured values within 5 SD of the model (unless the anomaly); noise-free values in range | `validate.mjs` (table-value, physics-magnitude) |
| Graph/data consistency | SVG read back: points, error bars, axes, fit lines match the table | `validate.mjs` (graph-*) |
| Question/data consistency | every number in text traced to data, model or stated constants; claims checked against data | `validate.mjs` (text-number, claim) |
| Answer/data consistency | typed answers linked to results; ranges contain the value; listed mistakes rejected; mark scheme states the value | `validate.mjs` (answer-*) |
| Parameter recovery | results marked `estimates` recover the model parameter from noise-free data (0.5 %) | `validate.mjs` (physics-inversion) |
| Absence of unintended bias | published data scatter fairly about the independent physics, given declared noise and systematic effects | `independent.mjs` |
| Intended anomaly behaviour | exactly one clear anomaly (≥ 4× normal scatter, no other point above 2.5×) when claimed; none otherwise | `validate.mjs` (claim-anomaly) |
| Independent audit | physics re-derived from first principles without the generator's laws or maths; dimensions, limiting cases, magnitudes, published answers | `independent.mjs` |
| Determinism and freeze | identical output twice; reviewed datasets unchanged (fingerprint) | `build.mjs`, `fingerprint.mjs` |
| Diagrams | alt text, theme colours, vectors, circuits, standing-wave loops | `validate.mjs` (diagram, vector, circuit) |
| Realistic data | measured data not cleaner than their declared measurement (section 12) | `safeguards.mjs` (regular-data) |
| Graph reads | every value a part reads from a graph is on that graph's axes; points to plot fit on the axes | `validate.mjs` (graph-read) |
| Giveaways | no answer, unit, relationship or conclusion appears before the part that asks for it (section 13) | `validate.mjs` (giveaway) |
| Error bars | y error bars only; bars that can't be seen are declared and stated instead; unused uncertainties aren't shown (section 14) | `validate.mjs` (graph-errorbar…) |
| Instrument scales | each mark read back from the drawing matches the data within half a division; divisions readable on a phone (section 15) | `validate.mjs` (scale-read) |
| Published sources | every published value matches the stored copy of its source | `validate.mjs` (provenance, source-extract) |

**Passing validation is never approval.** What automation cannot check (whether the chosen model matches the wording,
pedagogy, originality, clarity) is the reviewers' job. **[Design]**

New checks required by this specification are listed in section 19.

---

## 12. Experimental realism **[Design]**

| Aspect | Requirement |
|---|---|
| Resolution | values recorded to what the stated instrument can show (balance 0.01 g, ruler 1 mm, meter last digit) |
| Uncertainty | realistic for the instrument and method; never smaller than half the resolution; never changed to improve a graph |
| Scatter | from a stated physical cause (reaction time, flicker, shot-to-shot variation, counting statistics); never arbitrary noise |
| Anomalies | only where intended, with a plausible cause the question can ask about; at most one per dataset unless the question is about anomalies |
| Systematic effects | used where they teach something (zero offset showing as an intercept, heat loss biasing a result); always with a cause and justification |
| Meaningful ranges | independent variable spans enough of its range to show the relationship; parameters within real school or published ranges |
| Number of measurements | typically 5–8 values of the independent variable; repeats (3–5) where the method would repeat; fewer only when the question is about having too few |
| Data quality | not perfectly clean: points scatter about the line within their error bars; an "ideal" dataset is used only when the question needs model data, and is labelled as model or simulation output |
| Too-regular data | measured data are reported (AMBER) when at least 80 % of successive steps are identical, the scatter about the model is under 0.35 of what the declared noise and rounding predict, the ratio to the independent variable is identical to 3 s.f. in at least 80 % of rows, or every value ends in the same digit. A physically intended relationship is never rejected. If an instrument genuinely reads that way, the author states the reason and a person agrees (the dataset stays AMBER) |
| Uncertainty shown | an uncertainty is shown to students only if a part uses it; otherwise it stays internal (used for validation and accepted ranges) |
| Plausibility check | expected magnitudes declared and checked; teacher confirms the set-up is realistic |

---

## 13. Question-writing rules **[Design]** (command terms **[IB]** usage)

1. **Command terms**: use IB command terms with their IB meaning: State, Identify, Outline, Describe, Calculate, Determine, Estimate, Show that, Suggest, Explain, Discuss, Deduce, Compare, Sketch, Draw, Plot, Predict. "Show that" always gives the value to be reached.
2. **One clear task per sub-question.** Two-value tasks are split or explicitly asked for together (for example "value and absolute uncertainty").
3. **Mark allocation**: one mark per creditable step or point; 1–4 marks per part; marks shown on every part; each question 5–12 marks.
4. **No unnecessary cognitive load**: short stems, symbols defined once, units stated, no irrelevant data unless the task is to select data.
5. **No giveaways**: a part must not state or imply an answer that an earlier or later part asks for. Stated intermediates (section 6.3) are allowed only for values whose working is not itself assessed in the same question, or are given *after* the part that asks for them. **Checked** [Impl: T4]: no result's value may appear in the stem, figure text, earlier questions or earlier mark schemes before the part whose mark scheme establishes it; a part's declared answer (a relationship such as $T^2$, a unit, or the conclusion of a "whether" question) may not appear earlier. A "whether" question must declare its conclusion. A table whose columns hand students most of a later part's working is also a giveaway (C4-B01's Δ(1/L) column was removed for this reason).
6. **No unexplained constants**: every constant is in the data booklet, stated in the question with its source, or in the data.
7. **Traceability**: every number in stems, mark schemes, captions and alt text comes from the dataset, the model or a stated constant **[Impl: traced helpers, whitelist 0–12 and 100]**.
8. **Units**: SI by default; non-SI units stated (and converted where needed); negative powers in MathJax.
9. **Mark schemes**: IB style, own words, one point per mark, ECF and alternatives noted, accepted ranges justified by the data (max/min lines or reading tolerance).
10. **Typed answers**: single-number answers only, unrounded value stored, accepted range from the data; not for "show that", explain, or two-value parts.
11. **Self-marked parts**: drawing, sketching and plotting tasks show the examiner's figure in the mark scheme.
12. **Accessibility**: tables readable at 375 px; figures have full alt text; a blank cell has a screen-reader label.
13. **Graph reads**: every value a part expects students to read from a graph (an intercept, a point, a prediction) is declared and must lie on that graph's axes; wording that implies reading from a graph without a declaration is reported. Do not solve an off-axis value by stretching every axis: choose axes that suit the question.
14. **Error-bar wording**: no question or mark scheme refers to error bars that the graph doesn't draw; refer to the stated uncertainty instead (section 14).

---

## 14. Graph requirements

Rules **[Design]**:
- Graphs are generated from the actual dataset, every time.
- **Never** draw a graph by hand and invent data to match it.
- **Never** show a trend inconsistent with the numerical data (the validator reads the SVG back).
- **Never** alter uncertainty bars for appearance; fix visibility in the drawing only (markers r = 3.2, bars drawn on top).
- **Y error bars only** are drawn. An x uncertainty may still count in the steepest and shallowest lines when no bars are drawn. (Two pilots approved earlier keep drawn x bars.)
- **Error bars must be visible when drawn.** A bar shorter than the marker plus 1.5 units is hidden, so students can't use it. When uncertainty matters to the question, first choose axes and a graph size that make the bars visible (zoom to the data, a taller plot), as for B3-B01 and B5-B01.
- If the bars still can't be seen but the uncertainty matters, the graph declares them **too small to show**: no bars are drawn and the caption states the uncertainty ("The uncertainty in extension (±1 mm) is too small to show as error bars.").
- If **no part uses** the plotted quantity's uncertainty, the graph shows **no error bars and says nothing about them**, the table doesn't show that uncertainty, and the examiner's graph has no steepest and shallowest lines. The uncertainty stays internal for validation (C1-B01, C4-B01).
- **Area under a graph**: the accepted range must include the value ± 5 % and the count-the-squares estimate on the students' graph (whole small squares plus half the part squares), and must be no wider than ± 20 % of the value. **[Design]** (teacher, 8 October 2026)
- A shaded area, a model curve or a line of best fit appears only on the examiner's graph; a reference line (such as observed = model) may appear on both, but never on top of the line of best fit.
- **No duplicate tables**: a table is shown when it serves a purpose (calculation, transformation, averaging, uncertainty, precision a graph can't give). When a graph or image shows everything students need, there may be no student table; the complete data remain internal for validation.
- Students' graphs carry no fit lines; the examiner's graph (mark scheme) shows best fit and, where used, max/min lines.
- Axes labelled `quantity / unit`, evenly spaced ticks, sensible scales; graph text readable on phones.

| Graph type | Status [Impl] |
|---|---|
| Scatter with error bars (y only drawn) | supported |
| Points only, no fit (`fit: 'none'`) | supported |
| Error bars too small to show, stated in the caption; or none when unused | supported |
| Sensor trace (a line through every reading, no markers) | supported |
| Linear best fit; max/min gradient lines | supported |
| Exponential best-fit curve | supported |
| Omitted point for students to plot | supported (self-marked) |
| Origin included or not (`zero`) | supported |
| Log–log and semi-log (log columns plotted on linear axes) | supported |
| Logarithmic axis scales | useful during scaling |
| Power-law and other non-linear best-fit curves | useful during scaling |
| Tangent at a point (examiner graph) | useful during scaling |
| Multiple series on one graph (two set-ups) | future |
| Model curve over data (examiner's graph); reference line such as observed = model | supported |
| Area under a graph, with the area shaded on the examiner's graph | supported |
| Taller plot for one graph (drawing only) | supported |
| Axis-break symbol | future |
| Bar charts, histograms | future (only if a context needs them) |

---

## 15. Diagram requirements

Rules **[Design]**:
- Diagrams communicate physics (set-up, directions, geometry, circuit, wave pattern), never decoration.
- Reusable SVG components; physically correct and checked where possible (vectors, circuits, standing waves).
- Theme colours only (dark mode), short labels, full alt text, readable at 375 px; "not to scale" stated where relevant.
- Diagrams are drawings: excluded from the fingerprint, but a diagram change that alters physics content needs review.

| Diagram type | Status [Impl] |
|---|---|
| Arrows and vectors (direction-checked), labels | current |
| Current balance | current |
| Circuits from a netlist (meter placement checked) | current |
| Projectile launcher with exact path | current |
| Vibrating string with exact standing-wave envelope | current |
| Instrument scale to read (straight scale with marks: a spectroscope, a ruler, a meter drawn straight); smallest division at least 6 units wide; marks read back within half a division; the reading uncertainty at least half a division | supported |
| Protractor, caliper with zero error, round analogue dial | future |
| Multiflash or video-frame images; trace on a grid | useful during scaling |
| Ray diagrams, wavefronts, field lines | future |
| Thermal set-ups (calorimeter, heater, insulation) | future |
| Multi-loop circuits | future |
| Multi-panel model output (design choice) | future |

---

## 16. Review pipeline **[Design]** ([Impl]: `registry.mjs`, `review.mjs`, `batch.mjs`, `reviews.json`, `frozen/`, `fingerprint.mjs`)

Adopted 6 October 2026 at the teacher's request: **the teacher does not review every dataset.** Scalable quality
control comes from the automated checks; teacher approval stays meaningful because it is always a recorded human
decision, and the record always says whether the teacher inspected each dataset individually.

### 16.1 Quality pipeline (every dataset)

```
1 automated validation → 2 independent physics audit → 3 assessment-quality checks
→ 4 diversity and originality checks → 5 risk classification (GREEN / AMBER / RED)
→ physics review → teacher review of RED-fixed / AMBER / sample → batch acceptance → APPROVED
```

| Stage | Status [Impl] |
|---|---|
| 1 Validation (section 11) | ✓ `validate.mjs` |
| 2 Independent physics audit | ✓ `independent.mjs` |
| 3 Assessment quality | ✓ AO tags and report, verdict margins, unit and value ± uncertainty parts, marks per question, prediction not at a measured row, graph reads, giveaways, error-bar visibility, too-regular data. To build: data-dependence and command-term checks |
| 4 Diversity and originality | ✓ batch diversity: the same apparatus, **context family** or main object twice in a batch; a family already used by 2 other datasets or an object by 3 in the bank; one archetype over 35 %. Every dataset declares its context family and objects and needs an `originality` note. To build: comparison with a local index of IB contexts (kept outside the repository) |
| 5 Risk classification | ✓ `batch.mjs` |

### 16.2 Risk classes (automatic) **[Design]**

| Class | Meaning | Triggers [Impl: `classify` in `batch.mjs`] |
|---|---|---|
| **RED** | must be fixed; cannot be accepted or waived | a validation or independent-audit error; the dataset changed since review; an author flag marked serious (e.g. `originality-serious`); an unresolved HIGH issue |
| **AMBER** | passes, but human judgement is appropriate | first example of a MEDIUM- or HIGH-risk archetype (risk in `docs/PAPER1B_ARCHETYPE_MATRIX.md`); a HIGH-risk archetype with fewer than two individually inspected examples in different context families (rule C1); a missing, unknown or incomplete context family; data the author accepted as regular; first use of a judgement-heavy feature (systematic effects, secondary/model/observational data, empirical models, validity ranges, log graphs, tangents, areas, instrument images) that no individually reviewed APPROVED dataset has used; an uncertainty-sensitive conclusion (a verdict less than twice the minimum margin from its range edge); any validator warning; an author's review flag; no archetype or no originality note |
| **GREEN** | all automated checks pass; established archetype and features; no unusual assessment risk | everything else. The first example of a LOW-risk archetype is GREEN but is preferred for the sample |

An archetype or feature is **established** once an APPROVED, unchanged dataset that the teacher **inspected
individually** uses it. A **HIGH-risk** archetype needs **two** such datasets in **different context families** (rule C1,
adopted 8 October 2026). Batch-approved datasets that were not inspected never establish anything.

### 16.3 What the teacher reviews **[Design]**

1. Every AMBER dataset that requires judgement: reviewed individually (`review.mjs set … TEACHER-REVIEWED`), **or**
   explicitly waived by the teacher in the batch decision with a reason. RED datasets are fixed, never waived. Only
   MEDIUM-level reasons can be waived: the first or second example of a HIGH-risk archetype is always reviewed
   individually (rule C6, adopted 8 October 2026; `accept-batch` refuses such a waiver).
2. The first representative example of a genuinely new MEDIUM/HIGH-risk archetype (this is AMBER automatically).
   Once one example has been individually reviewed and approved, later examples follow the normal process.
3. A random sample of GREEN datasets: about **15 %** (target 10–20 %), **at least 1** per batch when there are GREEN
   datasets. `review.mjs batch <id>` suggests the sample (first examples of LOW-risk archetypes first, then a
   repeatable random order from the batch name, so it isn't hand-picked); the teacher may choose others.
4. **First development batch:** the mechanical rules would send most of Batch 1 to the teacher, because most of its
   archetypes are new. For Batch 1 the teacher reviews the **most informative and highest-risk** datasets
   individually and waives the other AMBER datasets explicitly, with reasons, in the batch decision. The
   recommendation will be given with the batch plan.

### 16.4 Statuses

```
individual route:  DRAFT → AUTO-VALIDATED → PHYSICS-REVIEWED → TEACHER-REVIEWED → APPROVED (basis: individual)
batch route:       DRAFT → AUTO-VALIDATED → PHYSICS-REVIEWED → BATCH-ACCEPTED → APPROVED (basis: batch, inspected: false)
sampled in batch:  … → PHYSICS-REVIEWED → TEACHER-REVIEWED → APPROVED (basis: batch, inspected: true)
```

| Status | Meaning | Who |
|---|---|---|
| DRAFT | being written, or failing validation | author |
| AUTO-VALIDATED | passes every automatic check; never stored, never a review | build |
| PHYSICS-REVIEWED | the physics has been checked against the `--audit` report and the independent audit | Claude or a person |
| TEACHER-REVIEWED | **the teacher inspected this dataset individually** (wording, pedagogy, originality) | **teacher only** |
| BATCH-ACCEPTED | a history entry, not a stored status: this dataset was in a batch the teacher accepted; it passed validation and the independent audit, was GREEN (or AMBER waived by the teacher with a reason) and **was not individually inspected** | teacher's batch decision |
| APPROVED | approved for students; the only status that enters production. The record says `basis: individual` or `basis: batch`, and `inspected: true/false` | teacher only (individually or by batch decision) |

### 16.5 Batch acceptance **[Design]** ([Impl]: `review.mjs accept-batch`, `acceptBatch` in `batch.mjs`)

A batch (all datasets with the same `batch` field) may be accepted when **all** of these hold, and the tool refuses
otherwise:
- no RED dataset;
- every AMBER dataset individually TEACHER-REVIEWED, or waived by the teacher with a reason;
- the required GREEN sample has been individually TEACHER-REVIEWED and passed;
- every dataset at least PHYSICS-REVIEWED, passing validation and the independent audit, and unchanged;
- no diversity warning (including repeated context families and objects), unless the teacher waives it with a reason;
- the teacher confirms that **no systemic generator or validator problem** was found (`--systemic-ok`); if the sample reveals one, the batch goes back, and the problem is fixed and the whole batch rebuilt and rechecked;
- the decision is made by a person (not Claude or a script); Claude may type it only on the teacher's explicit instruction, with `--recorded-by`.

The decision is recorded once, in `reviews.json` under `batches.<id>`: who, when, note, every dataset with its risk
class, reasons and whether it was inspected, the sample, any waivers, and the systemic confirmation. Then each
dataset is promoted to APPROVED with its own audit trail: an uninspected dataset gets a `BATCH-ACCEPTED` entry
(`inspected: false`) and an `APPROVED` entry with `basis: batch`, `inspected: false`, its risk class and fingerprint;
a dataset the teacher inspected keeps its TEACHER-REVIEWED entry and gets `APPROVED` with `inspected: true`.
**Batch acceptance never records TEACHER-REVIEWED** and never represents an uninspected dataset as individually
reviewed. `review.mjs status` shows "(batch …; not individually inspected)" for such approvals.

### 16.6 Rules that do not change

1. **Only APPROVED datasets enter production** (`questions/1b.json`, `questions/1b/`). Others go only to the local, uncommitted preview.
2. Reviews go in order; no skipping. A dataset can be reviewed only while it passes every check.
3. **AI and scripts must not bypass review stages or create teacher decisions.** TEACHER-REVIEWED, APPROVED and batch acceptance must name a person; Claude records them only on the teacher's explicit instruction in chat, with `--recorded-by`.
4. **Any change to a reviewed or approved dataset** (wording, data, physics, a shared law, rounding, answers, mark scheme) changes its fingerprint, fails the checker, and requires `review.mjs reset` and a fresh review; for a batch-approved dataset, the fresh review follows this section again. Claude must stop and tell the teacher; it must not reset without agreement.
5. Each review entry records reviewer, date, fingerprint and note.
6. The five pilots were each approved individually by the teacher (older records have no `basis`; they count as `individual`). They remain valid and establish their archetypes and features.

---

## 17. Production rules **[Design]**

- Production (`main`, and `questions/1b.json` on it) remains protected.
- All Paper 1B development happens on the current development branch (`paper1b-batch2`; `paper-1b` is historical).
- Do not modify `main`. Do not merge a development branch into `main` or deploy without the teacher's explicit instruction at that time.
- Do not push unless the teacher asks (the project's end-of-session routine applies only when the teacher says so for this branch).
- `questions/1b.json` holds only APPROVED, unchanged datasets, written only by `node tools/1b/build.mjs`, never by hand.
- Current state (8 October 2026): on `paper1b-batch2`, 20 datasets are APPROVED: 5 pilots, 8 Batch 1 (A2-B01, A2-B02, B3-B01, C1-B01 and C4-B01 changed in Phase 12 and re-approved individually) and 7 Batch 2 (accepted on 8 October 2026, all inspected; C2-B01 withdrawn). `main` still serves the 13 datasets of 6 October until a merge the teacher authorises.
- Scale in controlled batches (section 19), never all at once.

---

## 18. Current pilot coverage

All five: difficulty 2, context `experimental`, primary lab data, one question each, batch `pilot`. Marks: A1 11, B5 9,
C4 10, D3 10, E3 8 (48 total). Any two make a plausible 20-mark paper except that no paper-assembly rules are applied yet.
Status: B5, C4, D3, E3 APPROVED; **A1 AUTO-VALIDATED** (reset after the (g) fix below; needs fresh review).

**Pilot audit fixes (6 October 2026).** A1 (g) compared a stated launch speed of 2.50 m s⁻¹ with a range of u whose
upper end (2.48) came from the steepest line, a margin of 0.7 % that students' own lines could reverse. The stated
value is now 2.60 m s⁻¹ (4.8 % clear), judged by a `verdict` claim against the max/min-line range, and the mark
scheme credits a conclusion consistent with the candidate's own lines. Data, physics and parts (a)–(f) are unchanged.

**AO tags (proposed by Claude for teacher review; not fingerprinted).** A1 1/8/2, B5 0/5/4, C4 1/8/1, D3 1/7/2,
E3 1/4/3 (AO1/AO2/AO3 marks): the pilot batch is **25 % AO3**, below the 40–60 % target, which `ao.mjs` flags.
New datasets should raise the bank's AO3 share; the pilots are not required to change.

**Data dependence (section 3.2 rule 5).** A1 (d) and C4 (b) (2-mark "show that" derivations) and D3 (a) (force
direction from the diagram, 2 marks) are supporting set-up for the analysis that follows, so they are within the
rule. Recommendation for a later review, not a requirement: replacing one of them with a "state the unit" or
"value ± uncertainty" part would raise data dependence and AO3.

| Pilot | Demonstrates | Does not demonstrate |
|---|---|---|
| **A1-B01** launcher (A.1) | EX1 control variable; DH3/DH4 mean and half-range from repeats; DH10 hidden cell; GR14 linearisation (R² against h); GR6 gradient; IN9 compare with a manufacturer's claim; x-error bars | units (DH9); rounding (DH8); systematic error; part (d) is a derivation from first principles (Paper 2 flavour, 2 marks) |
| **B5-B01** internal resistance (B.5) | EU9 anomaly with cause; GR7 intercept (emf); GR6 gradient (−r); DH6 % uncertainty; EV3/EX6 reason for a step (heating) | max/min lines by the student; uncertainty in the intercept; units; originality: context common in legacy papers |
| **C4-B01** standing waves (C.4) | EX1; GR14 linearisation (f against 1/L); given-equation use; DH6 % uncertainty in 1/L; IN7 prediction (third harmonic); standing-wave diagram check | units; rounding; evaluation (EV); part (b) is a derivation (Paper 2 flavour, 2 marks) |
| **D3-B01** current balance (D.3) | GR6 gradient; DH2 constant from gradient; IN3 proportionality through origin; DH7 combining % uncertainties; vector diagram check | units; rounding; student-drawn max/min lines; part (a) is content recall of force direction (1–2 marks) |
| **E3-B01** half-life (E.3) | background correction; DH10 complete a table; GR5 exponential curve; GR12 half-life from a curve; EU10 √N and growing % uncertainty; EV4 improvement | plotting the omitted point (no task); constant-ratio test; units |

**Represented across the pilots:** DH2, DH3, DH4, DH6, DH7 (once), DH10, GR5, GR6, GR7, GR12, GR14, EX1, EX6, EU9, EU10, IN3, IN7, IN9, EV4.

**Missing across the pilots:**
- DH8 value ± uncertainty with correct significant figures; DH9 units (the most frequently assessed legacy item).
- GR2/GR3 plotting and error-bar tasks; GR8/GR9 student max/min lines and intercept uncertainty; GR11, GR13 limits, GR15 logs, GR16 sketches.
- EU2/EU3 systematic errors (generator support exists, unused); EU5–EU8 vocabulary in context.
- IN4 table-ratio proportionality; IN5 non-linearity.
- EX3–EX5 apparatus, technique, instrument reading; EV2 assumptions and model limits; EV7 design choice.
- Sequences S2, S5, S6; any non-laboratory context; difficulty 1 and 3.

**Overrepresented:** the linear graph → gradient → parameter route (4 of 5); typed numeric answers; derivation or
content parts (about 6 of 48 marks).

**Pilot revisions** are not made by this specification. Proposed revisions (for example replacing derivation parts
with a units or rounding part) would change approved datasets, reset their review and need teacher approval.

---

## 19. Generator roadmap

### 19.1 Required before scaling
Done (6 October 2026): **AO tags on every part and the AO report** (`ao.mjs`; target 40–60 % AO3 per batch of 40+
marks); **`verdict` claims** with a 4 % margin and a max/min-line range (`basis: 'lines'`), with "disagrees"
judgements no longer allowed as `agrees` claims; **"state the unit" parts** (`asks.unit`, validator-checked, self-marked)
and **"value ± uncertainty" parts** (`asks.valuePm`, rounding checked from the published data, self-marked).
Typed (auto-marked) versions of the last two would need site changes in `js/numeric.js` and are not yet built.

1. **Skill taxonomy in code**: map `skills` to the IDs in section 5; report coverage across the bank. [Impl]
2. **Unit-answer part type** (DH9): validator support done; typed answer checked by dimensions still to do (optional).
3. **Value ± uncertainty part type** (DH8): validator support done; typed answer still to do (optional).
4. **Intercept uncertainty and student max/min lines** (GR8/GR9): `basis: 'lines'` ranges and verdicts done; an intercept-uncertainty result used by a dataset and its examiner graph still to do.
5. ~~**Non-linearity and model-validity claims**~~ (IN5, GR13, EV2): done (Batch 1: `notLinear`, `validRange`).
6. ~~**Proportionality-ratio result**~~ (IN4): done (Phase 12: `constantValue`, `constantRatio`; also `integerMultiples`, `compare`).
7. ~~**Log columns and log–log / semi-log analysis**~~ (GR15) on linear axes: done (Batch 1).
8. ~~**Instrument-scale diagrams with read-back**~~ (EX5): straight scales done (Phase 12); protractor, caliper and round dials still to do.
9. **Paper assembly** (section 7): 20-mark sets from 2–3 questions with the coverage rules.
10. **Use systematic effects in at least one new dataset** (EU2/EU3) to prove the path end to end (no new code needed).
11. **Originality record** per dataset (section 9) in the review notes.

### 19.2 Useful during scaling
- ~~`source` field and secondary-data mode with provenance~~: done, with stored source copies (Phase 12).
- ~~Empirical-model mode with independent audit~~: done (Batch 1).
- Plot-a-point and draw-an-error-bar parts with examiner figures; sketch parts.
- Logarithmic axis scales; power-law curve fits; tangent support with justified ranges.
- Multiflash / grid-trace image diagrams.
- Sensor-specific noise models.
- Command-term check. (~~Detecting giveaways~~: done, Phase 12.)
- Accepted-range policy and seed-acceptance rule (from the handoff's deferred list).

### 19.3 Future enhancements
- Multi-series graphs; axis breaks; bar charts. (~~Model curve over data; area tasks~~: done, Phase 12.)
- Multi-panel model output for design-choice questions (EV7).
- Further diagram components (rays, field lines, wavefronts, thermal set-ups, multi-loop circuits).
- Printable or assembled "paper" view; splitting `validate.mjs` by area; validator independence from generator code.
- Input-level scatter propagated through the physics; x-uncertainty significance check.

### 19.4 Scaling plan **[Design]**
Batches of about 8–10 datasets (first batch: `docs/PAPER1B_ARCHETYPE_MATRIX.md` section 7), each accepted under
section 16.5 before the next is generated, aiming for balanced coverage of topics, skills, contexts, difficulties
and AO (40–60 % AO3 per batch).

---

## 20. Final design principles (for every new dataset)

1. **Data first.** Most marks must need the data shown; if a part works without the data, it belongs in another paper.
2. **One coherent investigation per question**, 5–12 marks; papers are 20 marks from 2–3 questions.
3. **SL content only**, one bank for SL and HL.
4. **Explicit physics.** Every number comes from vetted laws with stated assumptions, parameters and measurement models.
5. **Realistic measurement.** Instrument resolution, physically caused scatter, sensible ranges; no clean textbook data unless labelled as model data.
6. **Uncertainty is honest.** Never changed for appearance; propagated by IB worst-case rules; quoted to consistent significant figures.
7. **Demand rises within a question**, from extracting to evaluating; difficulty comes from reasoning, not obscurity.
8. **Evaluate specifically.** Name the error, its direction and its effect on the result; judge agreement with uncertainty ranges.
9. **Error bars decide** linearity and proportionality.
10. **Give relationships; test them.** Derivations and recall are Paper 2.
11. **Vary contexts and skills** deliberately across the bank, including non-laboratory data, units and significant-figure tasks, and difficulty 1 and 3.
12. **Original, always.** Skills and structures from IB material; never its wording, numbers, data, figures, contexts or sequences.
13. **Validated and independently audited** before any review; validation is never approval.
14. **Only the teacher approves**, individually or by an explicit batch decision that records what was inspected; reviewed content never changes silently.
15. **Small batches on `paper-1b`**; nothing reaches `main` without the teacher.

---

## 21. Rules every future dataset inherits (version 3)

Demonstrated by the pilots, Batch 1 and Batch 2. Each rule is enforced by code, so a new dataset inherits it without anyone
remembering it. `tools/1b/safeguard-index.mjs` lists the rules with their error codes and tests, and `node tools/1b/test.mjs`
fails if any rule loses its proof: every code must be caught by a deliberately broken dataset, and every named test must exist.
**A new rule is added to the index with a broken dataset or a test, or the test suite fails.** **[Design]** (teacher, 8 October 2026)

| Area | Rule | Enforced by [Impl] |
|---|---|---|
| Deterministic datasets | One definition plus one seed always gives the same question (built twice, compared). Generated data change with the seed; published data never depend on it. A published dataset's id and seed never change. | `build.mjs` (determinism), per-dataset tests |
| Explicit physics | Every model is built from vetted laws in `laws.mjs` (reference values, limiting cases, dimensional tests) with checked units; assumptions, measurement and the cause of every scatter are stated; parameters plausible; noise-free data recover the parameters. Constants a law needs are inputs, never hidden inside it. | `validate.mjs` (physics-*), law tests |
| Independent audit | Each dataset's physics is re-derived from first principles in `independent.mjs`, with its own units, fits and reading of the published question. For data without a table it reads the drawings itself (trace vertices, plotted points, scale marks). Published data must scatter fairly about it; parameters, typed answers and intended conclusions are recalculated. | `independent.mjs` |
| Uncertainty | Realistic for the instrument and method: never below half the resolution, nor half a scale division for a scale read by eye. At most 2 s.f., the same decimal places as the values. Propagated by IB worst-case sums, checked by differentiating the column's own formula. A value ± uncertainty is rounded to the uncertainty's place; 2 s.f. when rounding to 1 s.f. would change the uncertainty a lot (Skills page rule). **Halves round up, as students round** (binary 1.575 must print 1.58, not 1.57). | `validate.mjs` (uncertainty, propagation, table-dp, asks-pm), `lib.mjs` (`roundHalfUp`) |
| Y error bars | Only y error bars are drawn. Bars shorter than the marker are not drawn: the graph declares them too small and the caption states the uncertainty; when no part uses the uncertainty, nothing about it is shown. No question or mark scheme mentions bars that aren't drawn. **Every drawn bar must be visible, not only the longest** (Phase 14). | `validate.mjs` (graph-errorbar*, graph-x-errorbars), `safeguards.mjs` (`VISIBLE_BAR`) |
| Graph and table selection | A table only when a part needs its values (calculation, ratio, precision a graph can't give). Data shown only as a graph or instrument image declare `tableless`, and every column is readable from a declared figure. Row names (planets, years) are row headers. **A point left off a graph comes with a "Plot" part** (Phase 14). | `validate.mjs` (table-header, graph-omit-plot) |
| Observational data | Observational data declare whether they are simulated; simulated observations say "simulated" in the question. | `validate.mjs` (observational, T9) |
| Published data | Published values appear exactly as the source gives them (rounded only to the column's resolution). They either follow a model within a stated tolerance, with a reason, or are declared `observed` with a reason (values the question compares with a model). No invented scatter. | `validate.mjs` (catalogue, physics-meta) |
| Provenance | Every published column names the source's own column heading and its meaning. Values match a stored copy of the source, kept outside the repository with its checksum, after declared `scale` and `offset` conversions (°C to K). No copy, or a copy not on this computer: a warning, never silence. | `validate.mjs` (provenance, source-extract) |
| Graph validation | Every graph is read back from its SVG: axis labels, evenly spaced ticks, every point and trace vertex, error-bar lengths, fit, model and reference lines, shaded areas, instrument-scale marks. Answers and lines appear only on the examiner's graph. Every value a part reads lies on the axes, with a tolerance of at least half a small square. | `validate.mjs` (graph-*, scale-read) |
| Context diversity | Every dataset declares a context family and objects. A repeated family or object in a batch, or one already common in the bank, is a diversity warning that blocks batch acceptance unless the teacher waives it. | `contexts.mjs`, `batch.mjs` |
| Data regularity | Measured data may not be cleaner or more regular than the declared measurement (equal steps, too little scatter, exact ratios, repeated final digits). An accepted exception needs a reason and keeps the dataset AMBER. | `safeguards.mjs`, `validate.mjs` (regular-data) |
| Mark-scheme leakage | No answer value, unit, relationship or conclusion is visible before the part that asks for it (stem, captions, alt text, earlier parts and mark schemes). Every number is traceable to data, a result or a sourced constant. Typed answers come from results and are accepted by the site's own marker. | `validate.mjs` (giveaway, text-number, answer-*) |
| Student-facing vs internal data | Students see only what a part needs. Uncertainties no part uses stay internal: no ± in the table, no bars, no wording, but they still drive validation. Tableless data are validated on the complete internal table, which is never published. Datasets that aren't approved appear only in the local preview. | `generate.mjs`, `validate.mjs`, `build.mjs` |
| Claims and verdicts | Every conclusion a part asks for (linear, through the origin, constant ratio, whole-number multiples, validity range, outlier, comparison, verdict) is checked against the data, with a margin students' own lines can't reverse. | `validate.mjs` (claim, claim-verdict, claim-anomaly) |
| Review and approval states | DRAFT → AUTO-VALIDATED → PHYSICS-REVIEWED → TEACHER-REVIEWED → APPROVED, in order. TEACHER-REVIEWED and APPROVED name a person; Claude records them only on the teacher's instruction, with `--recorded-by`. Only APPROVED, unchanged datasets are published. Any change to a reviewed dataset, including from shared code such as rounding, breaks the freeze and needs a reset and fresh review. Batch acceptance never records TEACHER-REVIEWED. | `registry.mjs` (`reviewProblem`), `fingerprint.mjs`, `batch.mjs` |

**Exceptions** (approved before a rule existed; the teacher chose to fix them later, 8 October 2026): x error bars in A1-B01
and C4-B01; some hidden bars in A1-B01 and E3-B01; points left off the graph without a Plot part in D1-B01 and E3-B01; the
D3-B01 table duplicates its graph. Listed in `safeguards.mjs`; a new dataset can't be added to these lists without the
teacher's agreement.

**Not yet automated** (judgement or roadmap): numbers inside mark-scheme prose that claim something about the data (A3-B01's
"0.57 lies within every range" was caught by reading); command terms; originality against IB material; sketch parts;
students' own steepest and shallowest lines; tangents; simulation output with several series; paper assembly. **Reading every
generated question in the preview, at 375 px and in dark mode, stays mandatory**: in Batch 2 it found several problems the checks
missed.

---

## Decisions requiring teacher approval

These must not be decided automatically by the generator or by Claude:

**Decided on 8 October 2026** (Phase 14): Batch 2 accepted (7 datasets, all inspected); C2-B01 withdrawn as too complicated;
evaluation parts kept simple for students (B2-B01 (e), E4-B01 (e) changed); the shared rounding rounds halves up (D2-B01 reset
and re-approved); exceptions for older pilots kept until later (section 21); the bank-review findings carried to Batch 3.

**Decided on 8 October 2026** (Phases 11–13): rules C1 and C6 adopted, C2 not for now, C5 unchanged; the area accepted-range
policy (section 14); simulated observations allowed when labelled (section 4); the bounce, force-pulse and line-source
models and the NASA, NIST and IAEA PRIS sources for Batch 2 (`docs/PAPER1B_BATCH2_PLAN.md`); the Batch 2 list.

**Review model (adopted 6 October 2026, section 16).** The teacher reviews AMBER datasets (or waives them with a
reason), the first example of each new MEDIUM/HIGH-risk archetype, and a sample of about 15 % of GREEN datasets
(at least 1 per batch), then decides on each batch. The teacher's decisions are:

1. Recording TEACHER-REVIEWED for a dataset (only after inspecting it) or APPROVED individually.
2. **Accepting or rejecting a batch**, confirming that no systemic generator or validator problem was found.
3. **Waiving review of an AMBER dataset**, or a diversity warning, with a reason recorded in the batch decision.
4. Choosing the GREEN sample (the tool suggests one) and, for the first batch, which AMBER datasets to inspect.
5. Changing the risk rules, the archetype risk levels, or the sample fraction (`batch.mjs`).

Other decisions:

1. Recording TEACHER-REVIEWED or APPROVED for any dataset, or accepting a batch (never Claude or a script on its own).
2. Resetting a reviewed dataset after a `frozen-changed` report.
3. Revising any approved pilot (for example replacing derivation parts).
4. Merging `paper-1b` into `main`, deploying, or pushing.
5. Adopting or changing this specification, including the skill taxonomy and section 7 paper-assembly rules.
6. The share of non-laboratory contexts in the bank (section 4) and the batch size for scaling (section 19.4).
7. Allowing a single 20-mark dataset or linked datasets in one question.
8. Using real secondary data from a named database (accuracy, licence, provenance).
9. Introducing empirical (non-law) models or new context types.
10. Whether a context is too close to an IB question (originality judgement).
11. Adding a law to `laws.mjs` that extends beyond the SL syllabus or uses a non-standard model.
12. Accepted-range widths for answers where the policy is unsettled.
13. Any proposal to include statistics (SD, chi-squared, correlation coefficients) or other skills outside section 5.
14. Topic coverage priorities for the next batch.

---

## Appendix A. Summary of the legacy Paper 3 analysis

- 17 legacy Section A papers (15 marks, 2–3 questions) were analysed with their mark schemes; 2013–2015 Paper 3s were checked and found to be options only (out of scope).
- Most frequent legacy items: unit of a gradient or constant (16/17), uncertainty propagation (16/17), linearisation (14/17), value ± uncertainty to consistent s.f. (13/17), systematic-error effects (9/17).
- Classification: about 30 items **A** (directly transferable), 9 **B** (after modification: instrument and image reading, apparatus set-up, design choice from model output, logs, tangents, analogue models, database data, estimation, short "show that"), 3 **C** (Paper 2 or IA: method design, safety and ethics, content-only parts), 4 **D** (exclude: statistics, propagation through trig/log functions, option content, the old format).
- The 2025 Paper 1B papers confirm 2–3 questions per paper and add database, model-output, image and instrument-reading contexts.
- The 2016 Physics guide had no prescribed practicals.
