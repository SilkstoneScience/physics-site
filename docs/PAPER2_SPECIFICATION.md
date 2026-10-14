# Paper 2 question bank: design specification

Draft version 0, 14 October 2026, branch `paper2-batch1`. **Not yet agreed by the teacher.** This file is in `docs/`,
which `_config.yml` keeps off the published website. It follows the Paper 1B system (`docs/PAPER1B_SPECIFICATION.md`)
wherever that fits. Changes to this specification need the teacher's agreement.

Tags, as in the Paper 1B specification: **[IB]** stated in the 2025 guide; **[Legacy]** evidence from past papers;
**[Design]** our decision (changeable with the teacher's agreement); **[Impl]** how the tooling does it.

**Evidence base.** The 2025 guide (assessment outline and syllabus content); the ten 2025 Paper 2s and mark schemes
(May TZ1–3, Nov TZ1 and TZ3, SL and HL); 90 legacy Paper 2 files, 2016–2024, SL and HL, with mark schemes (text in the
reference cache, `past-papers-legacy-p2/`, extracted 14 October 2026); the 2016 guide; the Daily Questions folder
(non-IB questions). Everything IB is reference material only: nothing here reproduces its wording.

---

## 1. Purpose

Original, exam-style **Paper 2** practice questions for the question bank, produced by a checked process:
every number calculated by a script and checked independently, every part checked against the 2025 syllabus,
the wording checked for originality, and nothing published without the teacher's decision. **[Design]**

The ~48 hand-written Paper 2 questions already on the site stay as they are; they are not part of this system. **[Design]**

---

## 2. What the papers look like

### 2.1 The guide **[IB]**

| | SL | HL |
|---|---|---|
| Paper 2 | 1 h 30 min, 50 marks, 44 % | 2 h 30 min, 90 marks, 44 % |
| Content | SL material only | SL and AHL material |
| Format | Short-answer and extended-response questions | the same |

AO1, AO2 and AO3 are tested; a calculator and a clean data booklet are allowed. Exam content may link to the
nature of science, but definitions within a NOS aspect are not assessed.

### 2.2 The 2025 papers **[Legacy: 2025 evidence]**

| | SL (5 papers) | HL (5 papers) |
|---|---|---|
| Short questions | 4–5 per paper, **4–11 marks** each | 6–8 per paper, **4–14 marks** each |
| 20-mark questions | **1**, always the last question | **2**, always the last two |
| Shared with the other level | the SL 20-mark question is always one of the HL ones; most short questions are shared too | |

Each 20-mark question is **one context** (the Sun, a floating cork and an iceberg, a boat rolled on airbags, a copper
rod, a space station) followed by 4–6 lettered parts, each drawing on a **different subtopic**, usually from **three or
more themes**. "Show that … about X" parts let students carry on if they get stuck. Parts are 1–4 marks.

### 2.3 Part sizes and command terms

| | 1 mark | 2 marks | 3 marks | 4 marks |
|---|---|---|---|---|
| Legacy SL (22 papers) | 30 % | 52 % | 16 % | 2 % |
| 2025 SL and HL (10 papers) | 29 % | 54 % | 15 % | 1 % |

Command terms (share of parts, 2025 papers; legacy is almost the same): Calculate 17 %, Show that 15 %, Outline 13 %,
State 13 %, Explain 11 %, Determine 10 %, then Estimate, Draw, Describe, Identify, Discuss, Suggest, Deduce, Predict,
Sketch, Derive (each under 5 %). **[Legacy]**

Legacy papers (2016–2024) had 5–8 short questions and no 20-mark questions, but their style, mark density and mark
schemes are still a good model for the short questions, as long as the content is still on the syllabus (section 4). **[Legacy]**

---

## 3. The two question types **[Design]**

### 3.1 Short question
- One subtopic (a second, closely linked subtopic is allowed), one context, **5–11 marks**.
- Parts of 1–3 marks (4 marks at most once, for an extended explanation with four separate points).
- At least one explanation part (Outline / Explain / Describe / Discuss / Suggest) and at least one calculation.
- `level: "SL"` uses SL content only; `level: "HL"` has at least one AHL part (all HL parts tagged).

### 3.2 Linking question (20 marks)
- One context running through the whole question; **4–6 lettered parts**, each mainly from a different subtopic,
  covering **at least three themes** (A–E).
- Exactly **20 marks**; parts of 1–4 marks; at least one "Show that" whose stated value is used later.
- About 40–50 % calculation marks, the rest explanation, drawing and evaluation, as in the 2025 papers.
- SL linking questions: SL content only. HL linking questions: at least one part (4+ marks) of AHL content.
- Shown in the question bank **only in their own section**, "Linking questions (20 marks)", not under each topic
  (teacher's decision, 14 October 2026). Each one lists the subtopics it covers as tags.

---

## 4. Syllabus rules

- Every part names the **subtopic and understanding** it tests, using an ID from `tools/p2/syllabus.mjs`: a list of
  the 2025 understandings and guidance limits, written as **short labels in our own words** (never the guide's text),
  each marked SL or AHL. **[Design]** The validator rejects an unknown ID, AHL content in an SL question, and an HL
  question with no AHL part. **[Impl]**
- Every term a student needs for a mark must be in the 2025 guide at the question's level. **[IB]** + **[Design]**
- **No longer assessed** (in legacy papers, not in the 2025 guide, or excluded by its guidance). The validator searches
  question and mark-scheme text for these and fails unless the teacher has waived that question: **[Design]**

| Area | Not assessed now |
|---|---|
| Particles | quarks, leptons, baryons, mesons, the standard model, Feynman diagrams, exchange particles |
| Electricity | alternating current, rms values, transformers, rectification, capacitors, drift speed, Kirchhoff's laws by name, inductance and RL circuits |
| Waves | polarisation and Malus's law, thin-film interference, the Rayleigh criterion and resolution, end corrections, pressure nodes in pipes, the words "fundamental" and "overtone" (the guide uses harmonic numbers), oblique-incidence interference |
| Quantum and nuclear | the uncertainty principle, tunnelling, Schrödinger's model, pair production, deriving the Compton formula |
| Energy | how particular power stations work (wind turbines, solar cells, hydro, fossil-fuel stations). Still assessed in A.3: efficiency, Sankey diagrams and the energy density of fuels |
| Astrophysics | Hubble's law, cosmology, dark matter, Cepheid variables |
| Mechanics | calculating centres of mass, banked curves (quantitative), the equation of a trajectory |
| Gases | processes other than constant V, T, p, adiabatic (HL), and the ideal gas law; non-monatomic gases in quantitative problems (HL) |

  The list is built from the guide (searched 14 October 2026) and is checked again whenever a question is written.
- Exam conventions from the site: $g = 9.8\ \text{m s}^{-2}$; data-booklet symbols and constants; relative velocity
  only as in A.1. **[Design]**

---

## 5. Originality **[Design]**

| Source | Allowed use | Check |
|---|---|---|
| IB papers (2016–2025) and mark schemes | Style, mark density, command terms only. No context, sequence of parts, data or wording reused | Automatic: no run of **8 or more words** shared with any cached IB paper or mark scheme (common phrases like "the diagram shows" are excluded); no question uses the same context *and* the same quantity sequence as an IB question (checked by the reviewer) |
| Daily Questions (non-IB, image files) | A similar situation, the same topics and similar wording are fine; **no direct copying**; new numbers | The question records the file it was inspired by and what was changed; the reviewer compares the two |
| Textbooks, other copyrighted reference | Physics accuracy only | Not used for questions |

Every question file has an `originality` note: its inspiration (if any) and why it is not a copy.

---

## 6. Numbers and answers **[Design]**

- Every given value is defined once, in the question file's `given` block, with its unit. The question text, the
  mark scheme and the typed-answer fields **insert** values from `given` and from calculated results. No answer
  is typed by hand, so changing a given value can never leave a wrong answer behind. **[Impl]**
- Calculations use the data booklet's equations and constants only (in `tools/p2/physics.mjs`, each with a
  hand-worked reference value and unit check, like `tools/1b/laws.mjs`). **[Impl]**
- **Independent check:** every numerical answer is worked out a second time in `tools/p2/independent.mjs`, written
  separately from first principles without the question's own calculation. Build fails if they differ by more than 0.5 %. **[Impl]**
- "Show that … about X": the calculated value must round to X, and later parts must work from X (with the
  unrounded alternative accepted in the mark scheme). **[Impl]**
- Values in the stem have sensible significant figures (2–3); final answers in the mark scheme are given to the
  same number plus the unrounded value; `numeric` fields store the unrounded answer and an accept range. **[Impl]**
- Values must be physically plausible (each `given` has a plausible range, checked by the build). **[Impl]**

---

## 7. Mark schemes **[Design]**

- IB style, our own words: one marking point per mark, each ending in ✓; alternatives with "OR"; "allow ECF from
  (b)" where a later part depends on an earlier one; "accept" ranges for calculations; "do not accept" for common wrong answers.
- The number of marking points equals the marks (or, for explanations, at least the marks, with "any *n* from").
- Explanation marks need separate physics points, not one idea said twice.
- Each part has a short `examinerNote` for the reviewer (not shown to students) giving the intended reasoning.

---

## 8. Automatic checks (build fails on any) **[Impl]**

1. Format: fields, labels, marks, `numeric` fields, MathJax (backslashes, units in MathJax), HTML.
2. Structure: question type limits (section 3), part sizes, command terms from the IB list, one command term per part.
3. Syllabus: IDs exist; level rules; the not-assessed list (section 4).
4. Numbers: every inserted value defined; every answer equal to the independent check; "show that" rounding; plausible ranges.
5. Originality: the 8-word overlap check against all cached IB Paper 2 texts.
6. Diagrams: file exists, has `<title>` and alt text, font sizes on each `<text>`.
7. Built twice, identical output.

`node tools/p2/build.mjs --audit` prints each question's physics, syllabus IDs, inspiration and independent-check
results for the reviewer.

---

## 9. Review and publishing **[Design]**, as for Paper 1B

- Statuses: **DRAFT → AUTO-VALIDATED → PHYSICS-REVIEWED → TEACHER-REVIEWED → APPROVED**, recorded in
  `tools/p2/reviews.json` with a fingerprint of the question (wording, values, answers, mark scheme). If an approved
  question changes, `node tools/check.mjs` fails until it is reviewed again.
- **Only APPROVED questions are published** (`questions/p2.json`). The rest go to `questions/p2-preview.json`
  (never committed), which the question bank shows only on `localhost`, marked "Preview only".
- Batches: the teacher inspects every AMBER question (or waives it with a reason) and a sample of the GREEN ones,
  then accepts the batch. AMBER: every linking question, every HL question, any question inspired by a Daily
  Question, any 3–4 mark explanation part, any new physics function. **Batch 1: the teacher inspects all 10**, because it
  tests the process itself.
- Never record TEACHER-REVIEWED or APPROVED without the teacher's explicit decision.

---

## 10. Site changes needed **[Design]**

- `js/questions.js` loads `questions/p2.json` (and the preview file on localhost), like `1b.json`.
- A new **"Linking questions (20 marks)"** choice in the Paper filter; linking questions appear only there.
- Question IDs (never changed once published): short questions `A1-P01`, `C2-P01` …; linking questions `LQ-S01`
  (SL) and `LQ-H01` (HL) ….
- `tools/check.mjs` runs the Paper 2 build and tests, like Paper 1B.
