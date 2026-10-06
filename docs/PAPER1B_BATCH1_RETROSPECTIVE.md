# Paper 1B Batch 1 retrospective

6 October 2026. Branch `paper-1b` (uncommitted work on top of `253dce0`). Analysis only: nothing in this file changes a
dataset, a status or a rule. Figures were measured from the built questions, `tools/1b/reviews.json` and the tools,
not copied from the plans. Section and archetype IDs refer to `docs/PAPER1B_SPECIFICATION.md` and
`docs/PAPER1B_ARCHETYPE_MATRIX.md`.

---

## 1. Batch 1 outcome

| Measure | Result |
|---|---|
| Production datasets | **13** (5 pilots + 8 Batch 1), all APPROVED; preview empty |
| Total marks | **125** (pilots 48, Batch 1 77) |
| Batch 1 risk distribution (at acceptance) | GREEN 2 (A1-B02, B1-B01), AMBER 6, RED 0 |
| Individually teacher-reviewed (Batch 1) | 5: D1-B01, A2-B02, B1-B02, C1-B01, B1-B01 (the GREEN sample) |
| Batch-approved without individual inspection | 3: A1-B02 (GREEN), A2-B01 and B3-B01 (AMBER, waived) |
| Waivers | 2 (A2-B01, B3-B01), each with a written teacher reason in the batch record |
| Automated validation | 13 of 13 pass; 0 errors, 0 warnings in the final build |
| Independent physics audit | 13 of 13 pass, including the new conclusion checks (heat-loss direction, outlier, offset, model failure, Kepler exponent) |
| Assessment-quality checks | AO tags valid on all 72 parts; Batch 1 AO3 = 55 % (target 40–60 %); verdict margins, traced numbers, unit and rounding parts, prediction-not-measured all pass |
| Tests | **460 of 460** Paper 1B tests pass (264 at the start of this work) |
| Site checker | **No errors** (42 pages, 13 generated Paper 1B datasets) |

What the numbers do not show: the final build is clean partly because problems found while writing Batch 1 were fixed
before review (section 3). The pass rate measures the finished datasets, not first drafts.

---

## 2. Archetype performance

Rule used here: one accepted dataset does not by itself establish an archetype. ESTABLISHED needs at least one
**individually inspected** example **and** automated checks that cover the archetype's main risk. PROMISING means it
worked once but either was not inspected or rests on checks that are still partly manual.

| Archetype (dataset) | Verdict | Evidence |
|---|---|---|
| **M2** value ± uncertainty (B1-B01) | **ESTABLISHED** | Inspected and accepted as written. `asks.valuePm` checks the rounding from the published data (900 ± 50); the audit confirms ΔT is the dominant uncertainty. LOW risk. |
| **M1 + E3** outlying trial (A1-B02) | **PROMISING** | Not inspected (GREEN). The `outlier` claim and the audit both check that the trial is more than 3× the others' spread from their mean; the cause and direction are checked. The wording has had no human reading. |
| **E1** zero error (A2-B01) | **PROMISING** | Waived, not inspected. The physics is fully checked (offset visible, k and hanger mass recovered, F/x too small). But the 1 mm readings step by exactly 20 mm in five of six rows; nothing checks how "clean" data look (section 7). |
| **L2** extrapolation (B3-B01) | **PROMISING** | L2 itself is established by the B5 pilot. The extended-axis variant was waived, not inspected. Automation caught that the original digital-sensor version made the "consistent with −273 °C" verdict fragile (section 3). |
| **G3** prediction at an unmeasured value (B3-B01 (e)) | **PROMISING** | The new `predictAt` check works and has a regression test. The only real instance was not inspected; the pilot example (C4) is at a measured row and is still flagged. |
| **N3** non-linear → transformation (C1-B01) | **ESTABLISHED** | Inspected. `notLinear` is checked against the error bars; the T² graph is shown only in part (d), so the stem doesn't give the answer away. Caveat: the part-figure display is new site code, checked in the browser once. |
| **E2** systematic heat loss (B1-B02) | **ESTABLISHED (one example)** | Inspected. The audit independently confirms the direction (both values too high, the whole-run value most) and that 4180 lies outside one range and inside the other. Uses an empirical loss law not given to students. A second context is needed before E2 is treated as low risk. |
| **D1** database data (D1-B01) | **PROMISING** | Inspected and accepted. But the key risk was caught by hand, not by tooling: JPL's "P" column is not the sidereal period for the inner moons. The fact-sheet values had to be chosen manually; provenance is recorded but not machine-verified. |
| **N4** log–log (D1-B01) | **ESTABLISHED** | Inspected. Log columns, the exponent check (1.500 ± 0.01) and Jupiter's mass are recovered independently. No uncertainty is propagated through logs, as the guide requires. |
| **V2** limit of proportionality / validity range (A2-B02) | **PROMISING** | Inspected and accepted; `validRange` is checked against the error bars, and the audit confirms every point beyond the limit is clear of the steepest line. One example of a HIGH-risk archetype with an empirical yield model: not yet enough to trust without inspection. Part (d) correctly separates the limit of proportionality from the elastic limit. |
| **V3** evidence vs a claim (B3, B1-B02) | **ESTABLISHED** | Pilots plus B1-B02 (inspected); the `verdict` margin rule is working. |

No archetype needs to be retired. None is classified NEEDS REFINEMENT on its own merits; the weaknesses found are in
shared tooling (section 7), which affects several archetypes at once.

---

## 2b. Review-process metrics

Counts for Batch 1, plus the pilot phase where noted. "Issue" means something that had to change in a dataset, a rule
or the tooling.

| Measure | Count | Detail |
|---|---|---|
| Datasets the teacher inspected | **5** of 8 (Batch 1); 10 of 13 in the whole bank | D1-B01, A2-B02, B1-B02, C1-B01, B1-B01; all 5 pilots earlier |
| Accepted without individual inspection | **3** | A1-B02 (GREEN), A2-B01, B3-B01 (AMBER, waived) |
| AMBER at acceptance | **6** | A2-B01, A2-B02, B1-B02, B3-B01, C1-B01, D1-B01 |
| GREEN at acceptance | **2** | A1-B02, B1-B01 |
| RED at acceptance | 0 | — |
| Waivers | **2** | A2-B01, B3-B01 |
| Issues found by teacher review | **0** | All 5 inspected datasets accepted as written |
| Issues found by automation | **4** | B3-B01 verdict too close to its range edge (digital sensor), fixed; A2-B01 points almost exactly on a line (first seed), fixed; an untraced "50 N" in A2-B02, fixed; LaTeX control characters, caught by a check added during Batch 1 |
| Issues missed by automation (found by Claude reading the output before review) | **7** | Too-regular B3-B01 data; "x axis" ambiguity (A2-B01); an unreadable negative crossing (C1-B01); a unit giveaway across parts (C1-B01); false precision "849" (D1-B01); the wrong source column for periods (D1-B01, JPL); repeated spring and heater contexts across the batch |
| Missed by automation in the pilot phase (for comparison) | 1 HIGH | A1-B01 (g): claimed value too close to the max/min range; caught by the pilot audit, now automated by the `verdict` margin rule |
| False positives (automation flagged something that was not a dataset problem) | **3** | Validator bug: a zero tolerance for absolute zero (0 K) in parameter recovery. Test assumptions: "changing the seed changes the data" is wrong for published data; two classification tests depended on live review records. All fixed; no dataset changed |
| AMBER possibly unnecessary | 2 | A2-B01 (first E1, fully automated), B3-B01 (4.5 % margin, above the 4 % minimum): both waived. Not false positives, but candidates for recalibration (section 4, C2) |

**Reading these numbers.** Every problem in Batch 1 was found before the teacher saw the datasets: 4 by automation
and 7 by reading the generated output. Seven issues found by reading, against four by automation, says the automated
checks still miss a class of problems: presentation, ambiguity and context choice. The answer is to automate those
checks (section 7), not to read more datasets by hand. Of the 7, five are automatable (regularity, readable graph
values, cross-part giveaways, axis-name ambiguity, context families); two need curated knowledge (source-column
definitions, false precision) and are partly automatable.

---

## 3. Teacher-review findings

### 3.1 What the teacher found

The teacher inspected 5 datasets in the preview and found **all 5 acceptable as written**: no corrections and no
rejections. This is good news, but it limits what can be learned:
- With 0 issues in 5, the **precision of AMBER cannot be measured**: AMBER sent the right datasets, but we cannot yet
  tell which AMBER triggers matter.
- With no GREEN dataset inspected apart from the sample (B1-B01, acceptable), **we have no evidence on whether GREEN
  is too permissive**. A1-B02 was approved on the automated checks alone.

### 3.2 AMBER was appropriate

- **D1-B01, A2-B02, B1-B02** (HIGH-risk firsts): these depended on choices automation cannot judge: which published
  period to use, whether an empirical yield or loss model is fair, whether the precision-versus-accuracy discussion is
  pitched right. Human inspection was the right control even though no change was needed.
- **C1-B01**: the first use of a part-level figure, which needed a browser check; AMBER (first N3) sent it to review.

### 3.3 AMBER may have been unnecessary

- **A2-B01** (AMBER only for "first E1"): the offset physics is fully automated, and the teacher waived it. The trigger
  is reasonable for the first example, but MEDIUM-risk firsts whose main risk is fully automated could be GREEN with
  sample priority (proposal C2, section 4).
- **B3-B01** (AMBER only for a verdict 4.5 % from the range edge, above the 4 % minimum): waived. One case is too few
  to justify loosening the threshold.

### 3.4 Issues human inspection caught that automation did not

No issue was caught by the teacher. The following were caught **by Claude's own reading of the generated questions
before teacher review**, and none would have been caught by the automated checks as they stood:

| Dataset | Issue | Fixed how | Automatable? |
|---|---|---|---|
| B3-B01 | Round bath temperatures plus 0.5 kPa gauge steps gave pressures rising by exactly 5.0 kPa every row: data that look invented | Irregular bath temperatures (physics unchanged) | Yes: regularity check (M2, section 7) |
| A2-B01 | Mark scheme said "meets the $x$ axis", where $x$ is the extension on the vertical axis: ambiguous | Reworded to "the extension axis (at F = 0)" | Partly: lint for "x axis"/"y axis" when x or y is a plotted symbol |
| C1-B01 | Mark scheme read a crossing at m = −0.026 kg, but the graph's m axis starts at 0, so it can't be read | Reworded to go via intercept ÷ gradient | Yes: "readable from the graph" check (M3) |
| C1-B01 | The (c) mark scheme stated the gradient's unit before the later "state the unit" part (a giveaway) | Parts reordered | Partly: extend the giveaway check to earlier mark schemes |
| D1-B01 | "T by about 849": false precision | Rounded to 2 s.f. | Hard; style |
| D1-B01 | JPL's period column for inner moons is not the sidereal period | Switched to the NASA fact sheet | No: needs a person, or a curated source list |
| A2-B01 | Readings step by exactly 20 mm (five of six rows): tidy-looking | Not changed (resolution-limited and realistic); flagged | Yes: same regularity check |
| several | LaTeX commands lost their backslash in template strings (`\text` became a tab) | Fixed; **now automated** (`text-control` check) | Done |

### 3.5 Issues automation caught before human review

- **B3-B01**: the `verdict` margin rule rejected the original digital-sensor version, where −273 °C was too close to
  the edge of the extrapolated range for students' own lines. Fixed by switching to the more realistic Bourdon gauge.
- **A2-B01**: the realism check flagged a first draft whose points lay almost exactly on a line.
- **A2-B02**: a "50 N" typed into a question was rejected by number tracing and became a stated constant.
- **Validator bug found by Batch 1**: parameter recovery used a relative tolerance in kelvin, which is zero for
  absolute zero (0 K). Fixed (the tolerance now uses the value in its own unit), with a regression test.
- **Test bug found by Batch 1**: two classification tests depended on live review records and broke once archetypes
  became established. Fixed to use fixed inputs.

---

## 4. Risk-classification calibration

Evidence is thin (5 inspections, 0 issues), so only changes supported by observed events are proposed. **None is
implemented.**

| # | Current rule | Observed evidence | Proposed rule | Expected benefit | Possible downside |
|---|---|---|---|---|---|
| C1 | An archetype is established after **one** individually inspected approval, whatever its risk | V2, D1 and E2 each have one example; their correctness depended on manual choices (empirical models, source definitions) that a second context might not repeat | HIGH-risk archetypes need **two** individually inspected examples in different contexts before later examples can be GREEN | Keeps the riskiest patterns under human eyes until they have proved reliable | One more inspection per HIGH archetype |
| C2 | The first example of any MEDIUM- or HIGH-risk archetype is AMBER | A2-B01 (first E1, MEDIUM) has its main risk fully automated and was waived | A MEDIUM-risk first is AMBER **unless** every risk listed for that archetype in the matrix has an automated check; then GREEN with sample priority | Fewer waivers for well-automated archetypes | Depends on keeping the matrix's "main risk covered" list accurate |
| C3 | Diversity compares exact `apparatus` strings only | Springs appear in A2-B01 and C1-B01 (plus a loaded wire in A2-B02); two electrical specific-heat experiments (B1-B01, B1-B02). None was flagged | Add a declared `contextFamily` (e.g. `spring`, `electrical-heating`); a repeated family in a batch is a diversity **warning** (needs fixing or a teacher waiver) | Makes context repetition visible | Families need maintaining; borderline cases need judgement |
| C4 | Realism warning only when r² > 0.999999 | B3 (first version) and A2-B01 had suspiciously regular steps that the r² test missed | Also warn (AMBER) when at least 80 % of successive differences in a measured column are identical | Catches "too clean" tables before a teacher sees them | False alarms for genuinely resolution-limited data; the author can justify these in a note |
| C5 | Uncertainty-sensitive verdict: less than 2 × the minimum margin (8 %) is AMBER | B1-B02 (6.6–6.8 %) inspected, fine; B3-B01 (4.5 %) waived | **No change**: too little evidence either way | — | — |
| C6 | Waivers are allowed for any AMBER reason | Both waivers were for MEDIUM-level reasons; the teacher inspected every HIGH-risk first | Waivers allowed only for MEDIUM-level AMBER reasons; the first example of a HIGH-risk archetype can't be waived | Formalises what the teacher actually did | Slightly less flexibility |

---

## 5. Diversity (5 pilots + Batch 1)

Measured over 13 datasets, 125 marks, 72 parts.

| Dimension | Distribution | Comment |
|---|---|---|
| Themes | A 4, B 4, C 2, D 2, E 1 | A and B dominate; E has only the E3 pilot |
| Topics | A.1 2, A.2 2, B.1 2, B.3, B.5, C.1, C.4, D.1, D.3, E.3 | No D.2, C.2, C.3, C.5, E.1, E.4, E.5, A.3, B.2 yet |
| Data source | primary 12, secondary 1 | Simulation, observational field data and image-based data still absent |
| Graph type | linear 5, none 3, curve then transformed 1, log–log 1, linear with departure 1, extrapolated linear 1, exponential 1 | "Linear" still most common (all pilots except E3); no area or tangent tasks |
| Relationship | proportional 2 (D3, A2-B02 below its limit), linear with offset 3 (B5, A2-B01, B3-B01), formula only, no graph 3 (A1-B02, B1-B01, B1-B02), power law 3 (A1, C1-B01, D1-B01), inverse 1 (C4), exponential 1 (E3) | Inverse and exponential have one example each |
| Main archetype (first listed) | N-family 4 (A1, C4, E3, C1-B01), L-family 3 (D3, B5, B3-B01), M 2, E 2, V 1, D 1 | L1 gradient → constant is the main route only in the D3 pilot |
| Gradient → constant parts | Pilots 4 (A1 (f), B5 (c), C4 (d), D3 (c)); Batch 1 3 (A2-B01 (b), C1-B01 (d), A2-B02 (b): 6 of 77 marks) | No longer dominant; gradients also appear as exponents (D1-B01) and in predictions (B3-B01) |
| Uncertainty tasks | 11 of 13 datasets | Strong |
| Systematic-error tasks | 3 (A2-B01, B1-B02, B5 pilot partially) | Adequate for now |
| Model-validity tasks | 2 (A2-B02, C1-B01 (e)) | Thin |
| Prediction tasks | 2 (B3-B01, C4 pilot at a measured row) | Thin |
| Non-linearity / linearisation | 5 (A1, C4, E3, C1-B01, D1-B01) | Good |
| Command terms (72 parts, first term in each part) | Determine 18, Calculate 11, Explain 9, Suggest 7, "Use …" 6, Identify 5, State 5, Show that 3, Discuss 3, Deduce, Draw, Predict, Comment, Outline 1 each | Determine + Calculate = 40 % of parts; Evaluate, Compare, Sketch and Plot not yet used. "Use the graph to …" parts usually go on to a real command term, which this rough count doesn't separate |
| AO (marks) | AO1 4, AO2 67, AO3 54 → **43 % AO3** overall | Pilots 25 %, Batch 1 55 %: the bank is now inside the target overall |
| Difficulty | 1: 2, 2: 8, 3: 3 (15 / 62 / 23 %) | Target ~25 / 50 / 25: more Difficulty 1 needed |
| Typed numeric marks | 57 of 125 (46 %); pilots 58 %, Batch 1 38 % | Improving |
| Diagrams | pilots 4 of 5; **Batch 1 0 of 8** | Batch 1 relies on text descriptions |

**The repeated contexts are a real concern.** Batch 1 contains two springs (A2-B01 hanger offset, C1-B01 oscillation)
and a loaded wire (A2-B02): three of eight datasets about elastic objects. It also has two electrical-heating
specific-heat experiments (B1-B01, B1-B02). Each pair tests different skills, and the teacher accepted them, but a
student working through the bank would meet "spring" and "heater" contexts noticeably often. The diversity tool did not
flag either pair (proposal C3).

**Still missing:** image or instrument-reading data (M3), simulation output (D3), observational field data (D2), area
under a graph (G1), tangents (G2), table-ratio proportionality as a main task (L3), method evaluation as a whole
question (E4), Difficulty 1 beyond two datasets, and themes C, D and E generally.

---

## 5b. Evaluation by dimension (5 pilots + 8 Batch 1)

| # | Dimension | Finding | Verdict |
|---|---|---|---|
| 1 | Physics coverage | Kinematics, forces/elasticity, thermal physics, gas laws, circuits, oscillations, standing waves, gravitation (orbits), magnetic force, radioactivity | Good breadth for 13 datasets |
| 2 | Topic coverage | **10 of 19 SL topics.** Missing: A.3, B.2, C.2, C.3, C.5, D.2, E.1, E.4, E.5. Themes A 4, B 4, C 2, D 2, E 1 | Gap: themes C, D, E |
| 3 | Archetype coverage | **18 of 26** archetypes used. Not used: M3, L4, G1, G2, V1, E4, D2, D3; L3 and G3 only as parts | Gap: instrument/image, area, tangent, method evaluation, observational, simulation |
| 4 | Graph diversity | linear 5, none 3, curve then transformed 1, log–log 1, linear with departure 1, extrapolated 1, exponential 1 | Improved; still linear-heavy; no area/tangent |
| 5 | Relationship diversity | proportional 2, linear with offset 3, formula only 3, power 3, inverse 1, exponential 1 | Good spread; one example each of inverse and exponential |
| 6 | Experimental vs database | 12 experimental, 1 database (D1-B01); no simulation, observational field or image data | Gap |
| 7 | Uncertainty tasks | 11 of 13 datasets; propagation with rounding (B1-B01), repeats (A1-B01, A1-B02), √N (E3), max/min range (A1, B3), intercept range (B3) | Strong |
| 8 | Evaluation tasks | Systematic direction (A2-B01, B1-B02), method (B5, E3, A2-B02 (e)), precision versus accuracy (B1-B02), claim verdicts (A1, B3, B1-B02) | Good; no whole-question method evaluation (E4) |
| 9 | Prediction tasks | B3-B01 (unmeasured 100 °C); C4 (at a measured row, weak) | Thin |
| 10 | Model/data comparison | 11 of 13 datasets carry a model or claim comparison (agrees, verdict, through origin, valid range, not linear); A1-B02 and B1-B01 have none, by design | Strong |
| 11 | Difficulty | 1: 2, 2: 8, 3: 3 (15 / 62 / 23 %) | Needs more Difficulty 1 |
| 12 | AO | AO1 4, AO2 67, AO3 54: 43 % AO3 overall (pilots 25 %, Batch 1 55 %) | On target overall |
| 13 | Marks | Datasets 8–12 marks (mean 9.6, 5–7 parts). Part marks: 21 one-mark, **49 two-mark**, 2 three-mark | Too uniform: 68 % of parts are worth 2 marks; real papers mix 1, 2 and 3 more |
| 14 | Contexts | Springs/elastic objects 4 (A1-B01 launcher spring, A2-B01, C1-B01, A2-B02); electrical heating 2; others single | Spring family overrepresented |
| 15 | Originality risk | Recorded closest IB items: B5 (internal resistance, in 4 legacy sessions), B1-B01 (like May 2024 TZ1 P3 Q2), B1-B02 (same idea area), D1-B01 (structure like Nov 2025 TZ3 P1B), C4 (rig like May 2023 TZ1). None copies wording, numbers or sequence; checked by hand only | Acceptable; automate the check |
| 16 | Paper 1B authenticity | Like the 2025 papers: short practical contexts, linked parts, uncertainty and evaluation, IB-style mark schemes. Unlike them: no instrument-reading or apparatus-diagram parts in Batch 1, no data-from-image tasks, uniform 2-mark parts, more typed numeric answers (46 % of marks), no "Plot"/"Sketch" tasks | Mostly authentic; diagrams and part-mark variety are the main gaps |

---

## 6. Assessment-quality limitations (not solved by automation)

These still need human judgement, and the automated checks should not be read as covering them:

- **Ambiguity of wording.** Number tracing, units and claims don't detect a phrase a student could read two ways (the "x axis" case was caught only by reading).
- **Whether the intended interpretation is obvious.** The validator proves the data support the conclusion, not that a student would notice what is being asked.
- **Natural rather than engineered.** Several Batch 1 questions were deliberately built around a feature (a hidden hanger, a reference wire). Whether this feels like a real investigation is a judgement.
- **Realism of contexts and data.** Physics is audited, but plausibility to a teacher (tidy data, a 50 g hanger, a 0.4 W K⁻¹ loss coefficient) is only partly checked.
- **Pedagogical level.** Whether a Difficulty 3 part is fair for SL students sitting a common paper (for example the precision-versus-accuracy discussion in B1-B02) is not checked.
- **Mark allocation fairness.** Marks per part are within range and AO-tagged, but whether 2 marks is right for a given explanation is judgement.
- **Command-term quality.** Terms are present, but whether "Determine" or "Calculate" is the right IB term for each task isn't checked, and six parts open with "Use …" before the command term, which a person has to judge.
- **Alternative valid answers.** Mark schemes list main alternatives, but a student's different valid method (for example a different point on the moon graph) relies on ECF wording.
- **Diagrams.** Batch 1 has none; their absence is a quality gap that no check reports.
- **Originality.** Recorded as author notes against IB papers read in this session; there is no automated comparison yet.

---

## 7. Generator and validator lessons

### MUST FIX BEFORE BATCH 2
1. **Context-family diversity check** (C3): Batch 1's repeated springs and heaters went unflagged; with less teacher reading per dataset, this must be caught by the tool.
2. **"Too regular" data check** (C4): two cases of suspiciously tidy tables were caught only by reading.
3. **Readable-from-the-graph check**: any value a mark scheme expects students to read from a graph (an intercept, a crossing, a point) must lie inside the plotted axes; the C1-B01 crossing was caught only by reading.
4. **Giveaway check across parts**: extend the `asks.unit` giveaway check to mark schemes of *earlier* parts (the C1-B01 ordering problem).

### SHOULD FIX BEFORE BATCH 2
5. **Diagram components for common set-ups** (calorimeter or heater block, light gate, spring and ruler, sealed flask): Batch 1 has no diagrams.
6. **HIGH-risk establishment rule** (C1) and **waiver limits** (C6), if the teacher agrees.
7. **Command-term check**: identify each part's IB command term (not just its first word), warn when none is present, and report command-term variety per batch.
8. **Secondary-data verification aid**: record the exact source column names and definitions (sidereal versus anomalistic period) in `provenance`, and add a check that each catalogue value matches a stored copy of the source extract (kept outside the repository, as for other reference material).
9. **Physics-review record content**: PHYSICS-REVIEWED was recorded for 8 datasets in one loop with the same note; the record should state the audit checks that ran and their results for that dataset, so the entry is specific evidence and not a formality.
10. **Local originality index**: context keywords and key numbers from legacy and 2025 papers, kept in the reference cache, checked automatically.
11. **Axis-name ambiguity lint**: warn when text says "x axis" or "y axis" and x or y is also a plotted quantity's symbol (A2-B01 case).
12. **Part-mark and command-term variety report**: report the share of 1-, 2- and 3-mark parts and of Plot/Sketch/Draw tasks per batch (Batch 1: 68 % of parts are 2 marks), so variety is designed in.
13. **Tests must not depend on live review records** (done during Batch 1 for the classification tests; keep it as a rule for new tests).

### CAN WAIT
11. Typed (auto-marked) answers for "state the unit" and "value ± uncertainty".
12. Area and tangent graph tasks, log scales on axes, multi-series graphs (they enable new archetypes, but Batch 2 can proceed without them if it avoids those archetypes).
13. Use of `systematic.mjs` for offsets and losses, instead of modelling them in the physics laws (both approaches are audited; this is consistency only).
14. Accepted-range policy (still per dataset).
15. Graph text size on phones (from the pilot audit).
16. False-precision lint (a 3-significant-figure ratio such as "849" in an estimate); low value, hard to make reliable.

---

## 8. Production safety

| Check | Result |
|---|---|
| `main` unchanged | Yes: `main` and `origin/main` are both `55295b2` |
| Batch 1 in production | Yes, on `paper-1b` only: `questions/1b.json` lists 13 datasets, including all 8 Batch 1; the live site serves `main`, which doesn't have them |
| Only APPROVED datasets published | Yes: all 13 published datasets are APPROVED; the preview is empty |
| `inspected: false` audit trail | Yes: A1-B02, A2-B01 and B3-B01 have BATCH-ACCEPTED (inspected false) then APPROVED (basis batch, inspected false); none has TEACHER-REVIEWED |
| Fingerprints intact | Yes: every Batch 1 fingerprint matches the value generated before review; the pilots' fingerprints are unchanged; the checker reports no freeze changes; 13 snapshots in `tools/1b/frozen/` |
| No silent alteration at acceptance | Yes: acceptance changed only `reviews.json` and the snapshots; the build after acceptance produced the same question content |
| Committed / pushed | Nothing committed or pushed |

---

## 9. Recommendation for Batch 2 (not generated)

- **Size:** 8 datasets, about 70–80 marks (the same scale, so results are comparable).
- **Prioritise:**
  - **second examples of HIGH-risk archetypes** in new contexts: V2 (for example an elastic band or a filament lamp), D1 (a database outside astronomy), E2 (a different systematic loss);
  - **missing archetypes**: M3 instrument or image reading (needs diagrams), L3 table-ratio proportionality, E4 method evaluation, D2 observational data;
  - **themes C, D, E** (for example C.2/C.3 waves, D.2 fields, E.1/E.5);
  - **more Difficulty 1** (at least 2 more).
- **Avoid for now:** springs, loaded wires and electrical heaters; L1 gradient → constant as a main route; G1/G2 until area and tangent support exists; D3 simulation until multi-series figures exist.
- **New features worth adding first:** the four MUST FIX items, then diagram components (item 5) and the command-term check (item 7).
- **Expected risk distribution:** about 3–4 GREEN, 4–5 AMBER, 0 RED. Fewer firsts than Batch 1, but the second examples of HIGH archetypes would stay AMBER under proposal C1.
- **Question shape:** at least one diagram per dataset where a set-up exists; more 1- and 3-mark parts; at least one Plot or Sketch task; at least two of the missing topics A.3, B.2, C.2, C.3, C.5, D.2, E.1, E.4, E.5.
- **Teacher review:** inspect every HIGH-risk first and second example; waive only MEDIUM-level AMBER reasons with written reasons; a GREEN sample of about 15 % (at least 1), choosing a GREEN dataset in a **new context** for the sample.

---

## 10. Final recommendation

### READY AFTER TOOLING FIXES

The pipeline worked as designed. Every dataset passed validation and an independent audit; the teacher inspected the
five riskiest or most novel datasets and found all acceptable; the batch decision and its `inspected: false` audit
trail are recorded correctly; production safety held.

But the evidence also shows that, before teacher review, the most useful quality improvements came from **reading the
generated questions**, not from the automated checks: repeated contexts, too-regular data, an unreadable graph
crossing, an ambiguous axis name and a giveaway between parts. Those are exactly the problems that will reach students
if teacher inspection becomes a smaller share of each batch. The four MUST FIX checks turn those findings into automated
safeguards. With them in place, Batch 2 can follow the recommendation in section 9.
