# Paper 1B project status (authoritative handoff)

Last updated **8 October 2026**. This is the document to read first when resuming the Paper 1B project on any
computer. It supersedes `docs/PAPER1B_HANDOFF.md` (kept for history). It is in `docs/`, which `_config.yml` keeps off
the published website.

Related documents (all in this repository):
- `docs/PAPER1B_SPECIFICATION.md`: the authoritative design rules (what a Paper 1B question must be, validation, review model).
- `docs/PAPER1B_ARCHETYPE_MATRIX.md`: the 26 question archetypes, their risk levels and the original Batch 1 plan.
- `docs/PAPER1B_BATCH1_RETROSPECTIVE.md`: what Batch 1 showed, the tooling fixes needed, and the Batch 2 recommendation.
- `tools/1b/README.md`: how to write a dataset file, and what the validator checks.

---

## 1. Current project state

**Purpose.** An original, data-based IB DP Physics **Paper 1B** practice bank (common to SL and HL, SL content only).
Every question is generated from an explicit, audited physics model; nothing reaches students without an explicit
teacher decision.

### Current production

| Item | State (8 October 2026) |
|---|---|
| Production | **`main` is production.** GitHub Pages publishes `main` |
| `main` | `4ca0f74` "Merge contact form on the About page" (7 October 2026), **pushed** (local = GitHub). Batch 1 reached `main` in `a9f8c58`; the 26 later commits are general website work (EE page, Resources, guiding questions, photos, copyright notice, contact form) and don't touch Paper 1B (`questions/1b.json` and `tools/1b/` are unchanged since `a9f8c58`) |
| Batch 1 | **Live.** Merged into `main` and pushed |
| Approved and published Paper 1B datasets | **On `main`: 13** (5 pilots + 8 Batch 1). **On `paper1b-batch2`: 13.** A2-B01, A2-B02, B3-B01 and C1-B01 were reset in Phase 12 (presentation changes, Batch 1 reopened by the teacher) and re-approved individually by the teacher on 8 October 2026 (B3-B01 redesigned) |
| Tests / checker | Phase 12 (8 October 2026, on `paper1b-batch2`): **558 of 558** Paper 1B tests pass; build: 13 APPROVED; site checker: no errors, no warnings |

### Development branches

| Branch | Commit | Role |
|---|---|---|
| `main` | `4ca0f74` | Production. Never develop on it directly |
| `paper-1b` | `a3fa896` (local = GitHub) | **Historical** Batch 1 development branch. Its work is fully contained in `main`. Keep it; don't develop on it any more |
| `paper1b-batch2` | contains `main` at `4ca0f74` | **Current** branch for Batch 2 development, on GitHub. Created from `main` at `a9f8c58` on 6 October 2026; production `main` (`4ca0f74`) merged in on 8 October 2026 |

### Batch 2 status

- **Batch 2 has NOT been generated.**
- No Batch 2 datasets exist, none is approved, and none is in production.
- Batch 2 development begins from the current production `main` (`4ca0f74`), on `paper1b-batch2`.
- **Plan:** `docs/PAPER1B_BATCH2_PLAN.md` (Phase 11, 8 datasets).
- **Tooling (Phase 12):** the four MUST FIX checks (T1–T4) and the capabilities the plan needs (T5–T8, T10) are built and tested; T9 is deferred with C5-B01, which is flagged for a teacher decision. Details: **`docs/PAPER1B_PHASE12_TOOLING.md`**.
- **Not ready to generate** until the teacher's decisions in that document (section 6) are made.

For a short, step-by-step resume guide, see **`docs/PAPER1B_CONTINUATION.md`**.

---

## 2. Production bank (all APPROVED)

> As approved on 6 October 2026 and live on `main`. On `paper1b-batch2`, A2-B01, A2-B02, B3-B01 and C1-B01 changed in
> Phase 12 and were re-approved by the teacher on 8 October 2026 (`docs/PAPER1B_PHASE12_TOOLING.md`, section 3a).

Risk classes did not exist when the pilots were approved, so they have none. "Inspected" means the teacher personally
inspected that dataset.

| ID | Topic | Archetypes | Diff. | Marks | Risk | Approval basis | Teacher inspected |
|---|---|---|---|---|---|---|---|
| A1-B01 | A.1 horizontal spring launcher | N2, M1, V3 | 2 | 11 | (pilot) | individual (re-approved after the part (g) fix) | yes |
| B5-B01 | B.5 internal resistance, anomaly | L2, E3, L1 | 2 | 9 | (pilot) | individual | yes |
| C4-B01 | C.4 standing waves, f against 1/L | N1, G3 | 2 | 10 | (pilot) | individual | yes |
| D3-B01 | D.3 current balance | L1, L3, V3 | 2 | 10 | (pilot) | individual | yes |
| E3-B01 | E.3 half-life with background | N5, M4 | 2 | 8 | (pilot) | individual | yes |
| A1-B02 | A.1 light gates, outlying trial | M1, E3 | 1 | 8 | GREEN | batch-1 | **no** |
| A2-B01 | A.2 spring, hanger left out (zero error) | E1, L2 | 2 | 10 | AMBER (waived) | batch-1 | **no** |
| A2-B02 | A.2 copper wire beyond the limit of proportionality | V2, L1 | 3 | 9 | AMBER | batch-1 | yes |
| B1-B01 | B.1 aluminium block, value ± uncertainty | M2 | 1 | 9 | GREEN (the sample) | batch-1 | yes |
| B1-B02 | B.1 water heating with heat loss | E2, V3 | 3 | 10 | AMBER | batch-1 | yes |
| B3-B01 | B.3 absolute zero by extrapolation, prediction | L2, G3, V3 | 2 | 10 | AMBER (waived) | batch-1 | **no** |
| C1-B01 | C.1 mass–spring: curve → T² graph | N3, L2 | 2 | 9 | AMBER | batch-1 | yes |
| D1-B01 | D.1 Jupiter's moons, NASA data, log–log | D1, N4 | 3 | 12 | AMBER | batch-1 | yes |

Totals: 13 datasets, 125 marks; AO1 4, AO2 67, AO3 54 (43 % AO3); difficulty 1 / 2 / 3 = 2 / 8 / 3.

(The older hand-written Paper 1B question B3-001 in `questions/b.json` is separate from this system.)

---

## 3. Batch 1

| ID | Archetypes | Diff. | Marks | Risk | Route |
|---|---|---|---|---|---|
| A1-B02 | M1, E3 | 1 | 8 | GREEN | batch-accepted, not inspected |
| A2-B01 | E1, L2 | 2 | 10 | AMBER | batch-accepted with a teacher **waiver**, not inspected |
| A2-B02 | V2, L1 | 3 | 9 | AMBER | teacher-inspected |
| B1-B01 | M2 | 1 | 9 | GREEN | teacher-inspected (the GREEN sample) |
| B1-B02 | E2, V3 | 3 | 10 | AMBER | teacher-inspected |
| B3-B01 | L2, G3, V3 | 2 | 10 | AMBER | batch-accepted with a teacher **waiver**, not inspected |
| C1-B01 | N3, L2 | 2 | 9 | AMBER | teacher-inspected |
| D1-B01 | D1, N4 | 3 | 12 | AMBER | teacher-inspected |

- **Individually inspected (5):** D1-B01, A2-B02, B1-B02, C1-B01, B1-B01. Each was recorded TEACHER-REVIEWED by Mr Silkstone (teacher), recorded by Claude from the teacher's message, with the note "The teacher personally inspected this dataset in the local preview and found it acceptable as written."
- **Accepted through the batch process without inspection (3):** A1-B02 (GREEN), A2-B01 and B3-B01 (AMBER, waived).
- **Waiver reasons (as recorded):**
  - **A2-B01:** "Not individually inspected. AMBER only because it is the first zero-error dataset; the offset is checked automatically (no line through the error bars passes through the origin; k and the hanger mass are recovered from the published data by the independent audit). Accepted on the strength of those checks."
  - **B3-B01:** "Not individually inspected. AMBER only because the 'consistent with -273 C' verdict is 4.5 % from the edge of the line range; it passes the 4 % minimum margin and the mark scheme credits a conclusion consistent with the candidate's own lines. Archetypes L2, G3 and V3 are established by individually reviewed pilots."
- **Batch acceptance record** (`tools/1b/reviews.json`, `batches.batch-1`): decision ACCEPTED by **Mr Silkstone (teacher)**, 6 October 2026; note "Batch 1: D1-B01, A2-B02, B1-B02, C1-B01 and B1-B01 inspected individually in the preview (B1-B01 is the GREEN sample); A2-B01 and B3-B01 waived with reasons; A1-B02 GREEN, accepted without individual inspection"; sample B1-B01; teacher confirmed no systemic problem.
- **Validation:** all 8 pass, with 0 errors and 0 warnings.
- **Independent physics audit:** all 8 pass, including parameter recovery, recalculated answers and intended conclusions (heat-loss direction, outlier, offset visible, model failure beyond the limit, Kepler exponent 1.500 ± 0.01).
- **Assessment quality:** AO tags valid on every part; Batch 1 is 55 % AO3; verdict margins, number tracing, unit and value ± uncertainty parts, and prediction-at-an-unmeasured-value all pass.
- **Diversity and originality:**
  - Each dataset has an originality note naming the closest IB item: B1-B01 is like May 2024 TZ1 Paper 3 Q2; B1-B02 overlaps it in idea; D1-B01 has the structure of Nov 2025 TZ3 Paper 1B (stars).
  - The tool flagged no diversity warning, **but** the batch repeats contexts: two springs (A2-B01, C1-B01) plus a loaded wire (A2-B02), and two electrical-heating experiments (B1-B01, B1-B02).
  - Originality was checked by hand against the papers read; there is no automated originality check yet.
- **D1-B01 data provenance:** NASA NSSDCA Jovian Satellite Fact Sheet (D. R. Williams, updated 6 December 2023), retrieved 6 October 2026, with semi-major axes cross-checked against NASA JPL satellite mean elements. JPL's period column is not the sidereal period for the inner moons, so the fact-sheet periods are used. Full details are in the dataset's `provenance` field.

---

## 4. Review architecture

```
AUTO-VALIDATED → PHYSICS-REVIEWED → TEACHER-REVIEWED ──────────────→ APPROVED (basis: individual, inspected: true)
                                  ↘ (in an accepted batch)
                                    TEACHER-REVIEWED (sampled) ─────→ APPROVED (basis: batch, inspected: true)
                                    BATCH-ACCEPTED (not inspected) ─→ APPROVED (basis: batch, inspected: false)
APPROVED and unchanged → PRODUCTION (questions/1b.json)
```

| Status | Meaning |
|---|---|
| DRAFT | Being written, or failing validation. |
| AUTO-VALIDATED | Passes every automatic check (validation and independent audit). Never stored and never a review. |
| PHYSICS-REVIEWED | The physics has been checked against the `--audit` report and the independent audit (Claude or a person). Not an approval. |
| TEACHER-REVIEWED | **The teacher personally inspected this dataset.** Only an individual review records it; batch acceptance never does. |
| BATCH-ACCEPTED | A history entry, not a stored status: the dataset was in a batch the teacher accepted, passed all checks, was GREEN (or AMBER waived by the teacher with a reason), and **was not individually inspected**. |
| APPROVED | Approved for students; the only status that reaches production. Its record states `basis: individual` or `basis: batch`, and `inspected: true` or `false`. |

**Risk classes** (worked out automatically by `tools/1b/batch.mjs`):
- **RED:** a validation or audit error, changed since review, or a serious author flag (e.g. originality). Must be fixed; can't be waived or accepted.
- **AMBER:** passes, but human judgement is appropriate. Triggers:
  - the first example of a MEDIUM- or HIGH-risk archetype;
  - the first use of a judgement-heavy feature (systematic effects, secondary/observational/model data, empirical models, validity ranges, log graphs, tangents, areas, instrument images);
  - a verdict less than 8 % from its range edge;
  - any validator warning or author review flag;
  - a missing archetype or originality note.
- **GREEN:** everything else. The first example of a LOW-risk archetype is GREEN but preferred for the sample.
- **Established:** an archetype or feature is established once an APPROVED, unchanged dataset the teacher **inspected** uses it. Batch-approved, uninspected datasets never establish anything.

**Teacher sampling and waivers:**
- The teacher inspects every AMBER dataset, or waives it with a written reason recorded in the batch decision.
- The teacher also inspects about 15 % of GREEN datasets (at least 1 per batch); `review.mjs batch` suggests the sample.
- A waiver is recorded as a teacher decision, never as TEACHER-REVIEWED.

**Batch acceptance** (`review.mjs accept-batch`) is refused unless all of these hold:
- no RED datasets;
- every AMBER dataset inspected or waived;
- the GREEN sample inspected;
- every dataset PHYSICS-REVIEWED and unchanged;
- no unwaived diversity warning;
- the teacher confirms no systemic problem (`--systemic-ok`);
- the decision is made by a person (Claude or a script is refused).

When it succeeds, each dataset is promoted to APPROVED with its own audit trail.

**What can reach production:** only datasets that are APPROVED **and** unchanged since approval (their fingerprint
matches). Any edit to a reviewed dataset fails the checker (`frozen-changed`) and needs `review.mjs reset` and a fresh
review. Nothing else is written to `questions/1b.json`.

---

## 5. Current tooling (all in `tools/1b/` unless stated; run from the `physics-site` folder)

| Tool | What it does | Command |
|---|---|---|
| Datasets | One file per question in `tools/1b/datasets/<ID>.mjs`: physics model, measurements, results, claims, parts with AO tags | (edit files; see `tools/1b/README.md`) |
| Vetted laws (`laws.mjs`) | 23 physics laws with SI units, reference values and limiting cases; models are built only from these | tested by `test.mjs` |
| Generator (`generate.mjs`, `graph.mjs`, `diagrams.mjs`, `lib.mjs`) | Model → seeded data (or published catalogue data) → derived columns → fits → results → table, graphs (incl. raw-data graph, part figures, extended axes), diagrams, question and mark scheme | via `build.mjs` |
| Validator (`validate.mjs`) | Reads the published table and SVGs back and checks data, units, uncertainties, fits, claims (linear, through origin, agrees, verdict, notLinear, outlier, validRange, anomaly, trend), answers, number tracing, control characters, predictions, AO tags, unit and value ± uncertainty parts, catalogue data | via `build.mjs` |
| Independent physics audit (`independent.mjs`) | Each dataset's physics re-derived from first principles with its own units and fits; checks dimensions, limits, magnitudes, model agreement, unbiased data, parameter recovery, answers and intended conclusions | via `build.mjs` |
| Uncertainty system (`uncertainty.mjs`, `systematic.mjs`) | Declared worst-case propagation (checked by numerical differentiation); deterministic systematic effects | via `build.mjs` |
| Fingerprints (`fingerprint.mjs`, `frozen/`) | Hash and snapshot of every reviewed dataset's assessment content; changes are reported field by field | via `build.mjs` / `check.mjs` |
| Review tool (`review.mjs`, `reviews.json`, `registry.mjs`) | Statuses, reviews, resets, batch plans and batch acceptance | `node tools/1b/review.mjs status` · `set <ID> <STATUS> --by "<name>" [--note …] [--recorded-by …]` · `reset <ID> --by … --note …` · `batch <batch>` · `accept-batch <batch> --by "<teacher>" --note … --systemic-ok [--waive <ID> "<reason>"]` |
| Batch tool (`batch.mjs`) | Risk classes, the established archetype and feature sets, sample size and suggestion, diversity warnings, and the acceptance logic | via `review.mjs batch` / `accept-batch` |
| Build (`build.mjs`) | Builds every dataset twice (determinism), validates, audits, works out statuses, writes `questions/1b.json` (APPROVED only) and the local preview | `node tools/1b/build.mjs` (add `--report` for results, `--audit` for the physics) |
| AO analysis (`ao.mjs`) | AO marks by part, dataset, batch and bank; warns outside 40–60 % AO3 for 40+ marks | `node tools/1b/ao.mjs --parts` · `--batch batch-1` |
| Tests (`test.mjs`) | 543 tests (Phase 12): units, fits, laws, uncertainty, systematic effects, traceability, freeze, review gate, AO tags, batch logic, every dataset | `node tools/1b/test.mjs` |
| Broken-dataset fixtures (`fixtures/broken.mjs`) | Deliberately broken datasets that must each be caught with a named error code | run by `test.mjs` |
| Site checker (`tools/check.mjs`) | Whole-site checks, and runs the Paper 1B tests and build check; GitHub runs it on every push | `node tools/check.mjs` |
| Preview (`preview.bat`, `tools/preview.ps1`) | Local web server on port 8000; non-approved datasets appear only here, marked "Preview only: STATUS" | double-click `preview.bat`, or `powershell -ExecutionPolicy Bypass -File tools/preview.ps1`, then open http://localhost:8000 |

There are **no npm dependencies** (no `package.json`): Node.js alone runs everything.

---

## 6. How to resume on another computer

Assumes the repository is cloned, Node.js is installed (`winget install OpenJS.NodeJS.LTS` on Windows), and the
`physics-site` folder is open in a terminal.

1. **Get the latest work and the right branch** (full commands in `docs/PAPER1B_CONTINUATION.md`):
   ```
   git fetch
   git checkout paper1b-batch2
   git pull
   ```
   Check the branch with `git branch --show-current` (it must say `paper1b-batch2`). `paper1b-batch2` is on GitHub;
   only if it is ever missing, create it from production: `git checkout -b paper1b-batch2 origin/main`. If production
   `main` has moved on since the branch last merged it, merge `main` into `paper1b-batch2` before starting new work.
2. **Per-computer setup:** create `CLAUDE.local.md` (not in git) recording where `physics-source` and the reference cache are on that computer (see `CLAUDE.md`).
3. **Dependencies:** none to install.
4. **Run the tests:** `node tools/1b/test.mjs` (expect "All 558 Paper 1B tests passed", or more if tests were added).
5. **Build the Paper 1B files:** `node tools/1b/build.mjs`. It should end with "Production (questions/1b.json): 13 APPROVED dataset(s)" and rebuild the local preview, which isn't stored in git.
6. **Run the site checker:** `node tools/check.mjs` (expect "No errors").
7. **Start the preview:** double-click `preview.bat` (or the PowerShell command above), then open http://localhost:8000.
8. **Inspect one question:** http://localhost:8000/questions.html?paper=1B&q=D1-B01 (change the ID). Non-approved datasets show "Preview only: STATUS" and appear only on localhost.
9. **Review status:** `node tools/1b/review.mjs status`; batch plans with `node tools/1b/review.mjs batch <batch>`; physics details with `node tools/1b/build.mjs --audit`.
10. **Generate a future batch:**
    - write new dataset files with `batch: 'batch-2'` (plus `archetypes`, `apparatus`, `originality`, and AO tags on every part), following `tools/1b/README.md` and the specification;
    - add an independent audit entry for each in `independent.mjs`;
    - run the build until there are no errors;
    - record PHYSICS-REVIEWED;
    - run `review.mjs batch batch-2`;
    - the teacher inspects the AMBER and sample datasets, then decides on `accept-batch`.
11. **Avoid modifying `main`:**
    - work only on `paper1b-batch2` (not on `main`, and no longer on the historical `paper-1b`);
    - check `git branch --show-current` before committing;
    - never run `git checkout main` followed by edits or commits;
    - merging into `main` is a separate, explicit teacher decision.

---

## 7. Batch 2 roadmap

**Batch 2 has NOT been generated.** No Batch 2 dataset list is recorded yet; choosing it is the first task of the
Batch 2 work.

- **Archetype matrix:** `docs/PAPER1B_ARCHETYPE_MATRIX.md` (26 archetypes with risks, contexts and generator needs).
- **Planned process:** the same as Batch 1 (section 6, item 10), under specification section 16, about 8 datasets and 70–80 marks.
- **Recommended priorities** (from the retrospective, section 9):
  - second examples of the HIGH-risk archetypes (V2, D1, E2) in new contexts;
  - instrument or image reading (M3), table-ratio proportionality (L3), method evaluation (E4), observational data (D2);
  - themes C, D and E;
  - more Difficulty 1.
  - Avoid springs, loaded wires and electrical heaters for now.
- **Known gaps in the bank:**
  - topics: 10 of 19 SL topics covered; missing A.3, B.2, C.2, C.3, C.5, D.2, E.1, E.4, E.5;
  - archetypes: 18 of 26 used; unused M3, L4, G1, G2, V1, E4, D2, D3;
  - data: image or instrument data, simulation output, observational field data;
  - graphs: area under a graph, tangents;
  - question shape: diagrams in new datasets; part marks too uniform (68 % of parts are worth 2 marks); no Plot or Sketch tasks.
- **Generator capabilities available now:**
  - linear and exponential fits, max/min lines, intercept and extrapolation (with extended axes);
  - raw-data graphs and part figures;
  - catalogue (database) data with provenance;
  - log columns;
  - claims: not linear, outlier, validity range and verdict;
  - predictions at unmeasured values;
  - unit and value ± uncertainty parts;
  - AO tags;
  - systematic effects and empirical laws;
  - scientific notation in mark schemes.
- **Capabilities added before Batch 2 (Phase 12, `docs/PAPER1B_PHASE12_TOOLING.md`):** context families (T1), too-regular data (T2), graph reads inside the axes (T3), giveaways (T4), ratio and whole-multiple claims (T5), points-only graphs with model curves and reference lines (T6), area under a graph, sensor traces and data without a student table (T7), instrument-scale read-back (T8), published values against a stored source copy and observed published values (T10), error bars that can't be seen and y error bars only (P1). Deferred: observational-data mode (T9).
- **Should add:** diagram components for common set-ups, a command-term check, secondary-data verification aids, specific physics-review records, a local originality index, an axis-name ambiguity lint, and a part-mark and command-term variety report (retrospective section 7, items 5–13).
- **Intended review strategy:** inspect every HIGH-risk first and second example; waive only MEDIUM-level AMBER reasons, with written reasons; a GREEN sample of about 15 % (at least 1), preferably in a new context. The retrospective's rule-change proposals C1–C6 need the teacher's decision first.

---

**Batch 1 review-process evidence** (retrospective section 2b):
- 5 datasets inspected, 3 accepted without inspection; 6 AMBER, 2 GREEN, 2 waivers.
- Issues found: **0 by the teacher**, 4 by automation, 7 by reading the generated output before review.
- 3 false positives (a validator tolerance bug and two test-design faults), all fixed.
- Conclusion: the remaining risk is presentation, ambiguity and context choice. The plan is to **automate those checks rather than increase manual review**.

---

## 8. Safety rules

- **`main` is production.** GitHub Pages publishes `main`. Never edit, commit to or push `main` without the teacher's explicit instruction at that time.
- **Never generate directly on `main`.** Batch 2 development happens on `paper1b-batch2`; `paper-1b` is historical.
- **Never generate directly into production.** New datasets go to the local preview only; `questions/1b.json` is written only by `build.mjs` and contains only APPROVED, unchanged datasets.
- **Never populate production from development without approval.** A development branch reaches `main` only after its datasets are APPROVED (individually or by batch acceptance) and the full QA pipeline passes, on the teacher's instruction.
- **Use batch acceptance for qualifying uninspected datasets:** GREEN datasets (and AMBER datasets the teacher waives with a written reason) are approved only through `review.mjs accept-batch`, which records `inspected: false`.
- **Run the complete QA pipeline before production:** tests, build (validation and independent physics audit), `review.mjs batch <batch>`, `ao.mjs --batch <batch>`, the site checker, then teacher sampling and batch acceptance.
- **Never approve automatically.** APPROVED, TEACHER-REVIEWED and batch acceptance always name a person; Claude records them only on the teacher's explicit instruction, with `--recorded-by`.
- **Never label a dataset TEACHER-REVIEWED unless the teacher actually inspected it.** Uninspected datasets are approved only through batch acceptance, with `inspected: false`.
- **Never merge without validation:** `node tools/1b/test.mjs`, `node tools/1b/build.mjs` and `node tools/check.mjs` must all pass first.
- **Never push unverified changes.** Run the same three commands before every push.
- **Never silently change a reviewed dataset.** If the checker reports `frozen-changed`, stop and tell the teacher.

---

## 9. Known limitations

- **Originality:** checked by hand against the IB papers read so far; each dataset has an originality note, but there is no automated comparison with IB material, and no record of every past paper's contexts.
- **Diagrams:** none of the eight Batch 1 datasets has a set-up diagram (4 of the 5 pilots do); apparatus is described in text.
- **Overrepresented contexts:**
  - springs and elastic objects: A2-B01, C1-B01, A2-B02, plus the A1-B01 spring launcher;
  - electrical heating for specific heat: B1-B01, B1-B02;
  - themes A and B: 8 of 13 datasets.
- **Assessment quality not checked automatically:** ambiguity of wording, whether the intended interpretation is obvious, whether a question feels natural rather than engineered, realism as a teacher sees it, pedagogical level for SL students, fairness of mark allocation, command-term appropriateness, alternative valid student methods.
- **Validator blind spots found in Batch 1:** context families, too-regular data, values outside the graph axes and giveaways are now checked (Phase 12). Still not checked: command terms.
- **Secondary data:** values are now checked against a stored copy of the source (T10), but the copy itself is made by a person, and choosing the right source quantity (e.g. sidereal versus anomalistic period) still needs one.
- **Re-approved on 8 October 2026:** A2-B02 (part (d) replaced: the elastic limit is not SL) and C4-B01 (no error bars, no unused uncertainties, Δ(1/L) column removed). All 13 datasets are approved on `paper1b-batch2`.
- **Empirical models:** B1-B02 (Newton's law of cooling) and A2-B02 (yield beyond the limit) use laws beyond the syllabus. They are not shown to students but were judged by the teacher, not proven.
- **Physics-review records:** PHYSICS-REVIEWED for Batch 1 used one standard note for all 8 datasets; the note should become dataset-specific.
- **Evidence for the risk rules is thin:** 5 inspections, 0 issues found by the teacher, and only 1 GREEN dataset inspected.
- **Question shape:** part marks are uniform (49 of 72 parts are worth 2 marks) and no part asks students to Plot or Sketch, unlike real Paper 1B.
- **Site change:** part-level figures (`js/questions.js`) were checked in the browser once (C1-B01).

---

# NEXT ACTION

**Done on 6 October 2026:** Batch 1 verified, committed (`a3fa896`), merged into `main` (`a9f8c58`) and pushed;
`paper-1b` pushed (`a3fa896`); `paper1b-batch2` created from `main`.

**Done on 8 October 2026:** restored on the second computer. The teacher confirmed `4ca0f74` as the production commit;
`main` was merged into `paper1b-batch2`; tests (460/460), build (13 APPROVED) and site checker (no errors) verified.

**Done on 8 October 2026 (Phases 11–12):** Batch 2 planned (`docs/PAPER1B_BATCH2_PLAN.md`); tooling T1–T8, T10 and P1 built and
tested (543 tests); Batch 1 presentation audited, with A2-B01, A2-B02, B3-B01 and C1-B01 reset for re-approval; B5-B01's
unreadable emf axis fixed (drawing only). See `docs/PAPER1B_PHASE12_TOOLING.md`.

When you return, in this order (detailed commands in `docs/PAPER1B_CONTINUATION.md`):

1. **Check out `paper1b-batch2`** and verify it: tests pass, the build reports 13 APPROVED datasets, the checker reports no errors, and `git log -1 main` shows the production commit.
2. **Read** this file, `docs/PAPER1B_PHASE12_TOOLING.md` and `docs/PAPER1B_BATCH2_PLAN.md`.
3. **Teacher decisions** (`docs/PAPER1B_PHASE12_TOOLING.md`, section 6): C5-B01; the area-range policy, empirical laws and external sources; proposals C1–C6; C4-B01.
4. **Phase 13:** make the agreed Phase 12 rules permanent in the specification (section 7 of that document).
5. **Plan check:** confirm the final Batch 2 list.
6. **Generate Batch 2** on `paper1b-batch2` (`batch: 'batch-2'`).
7. **Run automated QA and the independent physics audit:** build, tests, `review.mjs batch batch-2`, `ao.mjs --batch batch-2`, site checker.
8. **Teacher sampling:** inspect the AMBER datasets (or waive with reasons) and the GREEN sample in the preview.
9. **Accept Batch 2** (`review.mjs accept-batch batch-2 …`, the teacher's decision).
10. **Merge into `main` and push** only after the full verification passes again, and only on the teacher's instruction.
