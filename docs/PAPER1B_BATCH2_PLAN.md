# Paper 1B Batch 2 plan

8 October 2026. Branch `paper1b-batch2`. **Planning document only: nothing here is generated, approved or published.**
In `docs/`, which `_config.yml` keeps off the website. Section and archetype IDs refer to
`docs/PAPER1B_SPECIFICATION.md` and `docs/PAPER1B_ARCHETYPE_MATRIX.md`; tooling items refer to
`docs/PAPER1B_BATCH1_RETROSPECTIVE.md` section 7.

**Verdict at the end: NOT READY — TOOLING CHANGES REQUIRED.** The four MUST FIX checks from the retrospective are
not yet in the code (checked 8 October 2026), and this plan needs five further capabilities (section 4).

> **Phase 12 update (8 October 2026):** T1–T8 and T10 are now built and tested; T9 is deferred, and C5-B01 is flagged for a
> teacher decision. The capability assessment of each dataset is in `docs/PAPER1B_PHASE12_TOOLING.md` (section 2). The
> dataset list below is unchanged.

---

## 1. The production bank today (13 datasets, 125 marks)

Measured from `questions/1b.json`, the dataset files, `node tools/1b/ao.mjs` and `node tools/1b/review.mjs status`.

| ID | Topic | Archetypes | Diff. | Marks | Part marks | Typed marks | Graph | Data | Apparatus |
|---|---|---|---|---|---|---|---|---|---|
| A1-B01 | A.1 | N2 M1 V3 | 2 | 11 | 1 1 1 2 2 2 2 | 4 parts | linear | lab | spring launcher |
| A1-B02 | A.1 | M1 E3 | 1 | 8 | 2 1 1 1 2 1 | 3 parts | none | lab | light gate, trolley |
| A2-B01 | A.2 | E1 L2 | 2 | 10 | 2 2 2 2 2 | 2 parts | linear | lab | spring and hanger |
| A2-B02 | A.2 | V2 L1 | 3 | 9 | 2 2 2 2 1 | 1 part | linear with departure | lab | loaded copper wire |
| B1-B01 | B.1 | M2 | 1 | 9 | 1 1 2 2 2 1 | 3 parts | none | lab | heater in a block |
| B1-B02 | B.1 | E2 V3 | 3 | 10 | 2 2 2 1 1 2 | 2 parts | none | lab | immersion heater |
| B3-B01 | B.3 | L2 G3 V3 | 2 | 10 | 2 3 2 1 2 | 2 parts | linear, extrapolated | lab | flask and gauge |
| B5-B01 | B.5 | L2 E3 L1 | 2 | 9 | 2 2 2 1 2 | 3 parts | linear | lab | cell and meters |
| C1-B01 | C.1 | N3 L2 | 2 | 9 | 2 2 1 2 2 | 1 part | curve, then linear | lab | mass on a spring |
| C4-B01 | C.4 | N1 G3 | 2 | 10 | 1 2 2 2 1 2 | 4 parts | linear (1/L) | lab | vibrating string |
| D1-B01 | D.1 | D1 N4 | 3 | 12 | 2 2 2 2 3 1 | 2 parts | log–log (linear) | database | Jupiter's moons |
| D3-B01 | D.3 | L1 L3 V3 | 2 | 10 | 2 2 2 2 2 | 3 parts | linear | lab | current balance |
| E3-B01 | E.3 | N5 M4 | 2 | 8 | 1 2 2 2 1 | 2 parts | exponential | lab | Geiger counter |

**Established for the risk rules** (individually inspected and approved): M1, M2, L1, L2, L3, N1, N2, N3, N4, N5, G3,
V2, V3, E2, E3, D1, M4; features `systematic:heat-loss`, `source:secondary`, `claim:notLinear`, `claim:validRange`,
the log graph and empirical models. **Not established:** E1 (A2-B01 was waived) and `systematic:zero-offset`, and
everything never used: M3, L4, G1, G2, V1, E4, D2, D3, `systematic:calibration`, `source:observational`,
`source:model`, `graph:area`, `graph:tangent`, `diagram:instrument`.

---

## 2. Gaps that matter most

| Dimension | Now | Gap that matters | What Batch 2 does |
|---|---|---|---|
| Topics | 10 of 19 SL topics | A.3, B.2, C.2, C.3, C.5, D.2, E.1, E.4, E.5 never used. Themes C, D and E are thin (2, 2, 1 datasets) | 7 of the 9 missing topics: A.3, B.2, C.2, C.5, D.2, E.1, E.4. C.3 and E.5 are left for Batch 3 (section 6) |
| Archetypes | 18 of 26 | Never used: M3, L4, G1, G2, V1, E4, D2, D3. One example each of the HIGH-risk V2, E2 and D1 | First M3, G1, V1 and D2. Second examples of V2, E2 and D1 in new contexts. L4, G2, D3 and E4 as a main archetype stay deferred |
| Data sources | 12 lab, 1 database | No image, video, sensor-logger or observational data. Every lab dataset is a bench practical | Only D2-B01 is a bench practical. Video frames, an image to read, a force plate, phone sensors, simulated astronomical observations, published planetary data and published reactor data |
| Graph types | 8 of 10 graphs are straight lines when analysed | No area, no periodic data, no curve kept as a curve, no model line drawn against data, no dense sensor trace | 1 graph uses a straight line, and only as a reference line (y = x). The others: geometric decay, a dense force–time trace (area), a periodic time series, a curve that levels off, and no graph (image, table) |
| Relationships | Proportional and linear-with-offset dominate | No ratio or quantisation tests; inverse and exponential once each | Constant ratio (geometric decay), E = hc/λ, impulse as an area, T⁴ energy balance, sinusoidal radial velocity, integer multiples of e, a mass–energy chain, an inverse square that holds only at distance |
| Difficulty | 2 / 8 / 3 (15 / 62 / 23 %) | Too few Difficulty 1 | 2 / 3 / 3. Bank becomes 4 / 11 / 6 (19 / 52 / 29 %) |
| AO | 43 % AO3 overall (pilots 25 %) | Fine overall; keep each batch inside 40–60 % | About 38 of 76 marks AO3 (50 %), estimated per dataset in section 3 |
| Uncertainty | 11 of 13 datasets | No reading uncertainty from an image or scale, no area-estimate uncertainty, no power-of-3 propagation | Scale-reading uncertainty (E1-B01), area-estimate range (A2-B03), r³ dominating (D2-B01), growing relative uncertainty of small readings (A3-B01) |
| Evaluation | Strong on verdicts and systematic direction | No whole-model comparison against data (V1); E2 only for heat loss | V1 (B2-B01); E2 by meter calibration (D2-B01); data-quality judgements (Mercury's mean temperature, reactor refuelling years, video frame rate) |
| Prediction | 2 datasets, one weak | Few predictions at unmeasured values | A3-B01 (a later bounce), C5-B01 (a later date in the cycle), C2-B01 (a distance not measured) |
| Model/data | 11 of 13 compare a model or claim | Always "agrees or not"; never "where and why the model fails" for a new model, and no model curve against data | V1 with a reference line (B2-B01); V2 with an exact and an approximate law (C2-B01); A2-B03 checks two methods against each other |
| Sequences | Mostly S1 and S4 | S5 (measurement first) and S6 never used; S2 once | S5 twice (A3-B01, E1-B01); S2 twice (D2-B01, E4-B01) |
| Part marks | 21 one-mark, 49 two-mark, 2 three-mark parts (68 % worth 2) | Too uniform; no 3–4 mark analysis parts | Planned: 20 one-mark, 19 two-mark, 6 three-mark parts (42 % worth 2) |
| Command terms | Determine + Calculate are 40 % of parts; never Plot, Sketch, Evaluate | | Plot ×3, Sketch, Evaluate, Compare and Deduce planned |
| Typed answers | 57 of 125 marks (46 %) | Too much auto-marked arithmetic | About 10 of 76 marks (13 %), in 5 of 8 datasets |
| Diagrams | Batch 1: 0 of 8 | No set-up diagrams in new datasets | A set-up diagram or image in at least 5 of 8 (A3, E1, A2-B03, D2, C2), up to 7 with the optional ones |

### Repetition from Batch 1 that Batch 2 avoids

| Avoid | How |
|---|---|
| Gradient → constant | Not the main route of any dataset. No dataset asks for a gradient |
| Straight-line graphs | No dataset is analysed with a straight line of best fit. B2-B01 draws y = x only as the model line |
| Difficulty 2 | 3 of 8 (38 %) instead of 62 % |
| Typed numeric answers | At most one typed part per dataset, about 13 % of marks |
| Laboratory-only contexts | 7 of 8 are outside a school bench practical: sports video, a force plate, a street lamp, published planetary data, simulated observations of a binary star, published reactor data |
| Springs | None. The context-family check (section 4, T1) will enforce it |
| Specific heat and electrical heating | None. B.2 uses radiation and energy balance, not a heater |

---

## 3. Proposed datasets (8, about 76 marks)

Batch ID `batch-2`. IDs follow the existing pattern (topic code, `-B`, number). Contexts were checked against the cached
2025 papers and legacy Paper 3 papers by keyword (section 5); each needs a full originality note when written.
**SL/HL scope** was checked against the 2025 guide. Doppler for sound (moving source or observer) is **HL only**, so
the C.5 dataset uses light.

Risk class: what `batch.mjs` would give under the **current** rules; "(C1)" marks where proposal C1 (two inspections
before a HIGH archetype can be GREEN) would make it AMBER.

### 3.1 A3-B01 Bouncing tennis ball from video frames (A.3)

| Field | Plan |
|---|---|
| Archetype | **L3** (constant-ratio test from a table) + **G3** (prediction at an unmeasured bounce); E3-style judgement as a component |
| Purpose | Difficulty 1 with real AO3 depth: test whether each bounce keeps the same fraction of energy, and see that later ratios are less certain because the heights are small |
| Difficulty | **1** |
| Marks | 9: (a) energy changes during one bounce [1] · (b) complete the ratio column hₙ₊₁/hₙ [2] · (c) **Plot** the omitted point [1] · (d) **Deduce**, using the uncertainties, whether the fraction retained is constant [3] · (e) **Predict** the height of a later bounce [1] · (f) a limitation of reading peak heights from 30 frames per second video [1] |
| Data type | Primary, **video analysis**: peak heights read from frames against a scale on a wall, ±1 cm (realistic for video, not 1 mm) |
| Graph | Peak height against bounce number: discrete points that fall geometrically; no fit for students; examiner shows the model curve |
| Relationship | Geometric decay hₙ = h₀rⁿ (constant ratio r ≈ 0.55) |
| AO emphasis | AO1 1, AO2 4, AO3 4 |
| SL/HL | SL (A.3 energy conservation and dissipation) |
| Generator | Empirical law `bounce-height-ratio` (`model:empirical`, with a stated basis: a constant coefficient of restitution); reading scatter from frame timing and parallax; uncertainty ±1 cm on every height |
| Validator | **New `constantRatio` claim** (T5): the ratios agree within their propagated uncertainties; the predicted bounce is not a measured row (`predictAt`); the uncertainty of the last ratio is the largest; regularity check (T2) |
| Independent audit | Recompute every ratio and its worst-case uncertainty from first principles; confirm the energy fraction retained is r (mgh); check that the predicted height follows from the mean ratio |
| Assessment risk | LOW–MEDIUM: (d) needs a clear mark scheme for "constant within uncertainty" |
| Originality risk | LOW: no bounce context in the cached 2025 or legacy papers. Avoid a basketball, which the Skills page already uses as its example |
| Review risk | **GREEN** (L3 and G3 established; empirical models established). Preferred as the GREEN sample (new context) |

### 3.2 E1-B01 Street-lamp spectrum through a handheld spectroscope (E.1)

| Field | Plan |
|---|---|
| Archetype | **M3** (read an image or scale, first example) + V3 (identify the gas from the evidence) |
| Purpose | First instrument or image reading: students read three bright lines on the spectroscope's wavelength scale, convert them to photon energies and match them to a given energy-level diagram; all three share one upper level |
| Difficulty | **1** |
| Marks | 8: (a) read the three wavelengths from the image [2] · (b) state the reading uncertainty [1] · (c) photon energy of one line in eV [2, typed] · (d) **Deduce** which transitions give the lines, using the level diagram [2] · (e) whether two lines 2 nm apart could be told apart on this scale [1] |
| Data type | Primary, **image of an instrument scale** (generated SVG of the scale with lines), plus a level diagram from published atomic data (NIST, with provenance) |
| Graph | None. An image and a level diagram |
| Relationship | E = hc/λ (inverse), and differences between levels |
| AO emphasis | AO1 1, AO2 4, AO3 3 |
| SL/HL | SL (E.1: spectra and E = hf). No Bohr formula (HL) |
| Generator | **Spectroscope-scale component** (T8) with positions computed from the line wavelengths; levels as a `catalogue` table with provenance; photon-energy law |
| Validator | **Image read-back** (T8): each drawn line position, read back from the SVG, gives the tabled wavelength within half a division; lines readable at 375 px; level differences match the published wavelengths |
| Independent audit | From the published levels alone: each wavelength from hc/ΔE; a single shared upper level; the reading uncertainty is at least half a scale division |
| Assessment risk | MEDIUM: reading must be unambiguous on a phone; the mark scheme must accept readings within a stated tolerance |
| Originality risk | LOW–MEDIUM: spectra appear in legacy Paper 3s (2018, 2019, 2024) and a 2025 Paper 1A item, but none with a spectroscope image and a level diagram in this sequence |
| Review risk | **AMBER** (first M3; first `diagram:instrument`). Must be inspected (reading at phone size is a visual judgement) |

### 3.3 A2-B03 Vertical jump on a force plate (A.2)

| Field | Plan |
|---|---|
| Archetype | **G1** (area under a graph, first example) + V3 (two methods compared) |
| Purpose | The first area task: impulse from a dense force–time trace, then take-off speed, compared with the speed from the flight time |
| Difficulty | **2** |
| Marks | 10: (a) why the reading at the start equals the jumper's weight [1] · (b) the jumper's mass from the graph [1] · (c) **Estimate** the impulse of the net upward force from the area [3] · (d) take-off speed [2, typed] · (e) **Compare** with the speed from the flight time [2] · (f) one reason the two methods differ [1] |
| Data type | Primary, **sensor (force plate logging at 200 Hz)**: a dense trace without per-point error bars, plus a flight time |
| Graph | Force against time: a dense curve with a dip and a peak. Students estimate the area above the weight line; the examiner graph shades it |
| Relationship | J = ∫F dt = Δp; v = g t_flight / 2 |
| AO emphasis | AO1 1, AO2 5, AO3 4 |
| SL/HL | SL (A.2: impulse, J = FΔt, change of momentum) |
| Generator | Empirical force-pulse law (`model:empirical`, documented shape with stated parameters); dense-trace graph type (T7); area result with an accepted range |
| Validator | **Area result** (T7): the accepted range covers sensible square-counting and trapezium estimates on the printed grid; the weight line is readable on the axes (T3); take-off speeds from the two methods differ by a stated, explained amount |
| Independent audit | Integrate the published trace numerically by a different rule; impulse/m equals the take-off speed; flight-time speed from kinematics; the direction of the difference matches the stated cause (landing with bent knees lengthens the flight time) |
| Assessment risk | MEDIUM: area estimates vary; accepted-range policy adopted by the teacher (8 October 2026): covers ±5 % and the count-the-squares estimate, no wider than ±20 % |
| Originality risk | LOW: the 2023 Paper 3 force sensor measured a ball's peak force against pressure; no jump or area task |
| Review risk | **AMBER** (first G1; first `graph:area`). Must be inspected |

### 3.4 B2-B01 Energy balance of the inner planets and the Moon (B.2)

| Field | Plan |
|---|---|
| Archetype | **V1** (model against data, first example) + D1 (secondary data, second example) |
| Purpose | Compare the energy-balance (no-atmosphere) temperature with observed mean surface temperatures: Venus and Earth are far too warm (greenhouse effect), and the airless bodies show what the model omits (day–night extremes) |
| Difficulty | **2** |
| Marks | 9: (a) equilibrium temperature of Mars from the given relationship [2, typed] · (b) **Plot** Mars on the observed-against-model graph [1] · (c) identify the body furthest from the model and explain why [2] · (d) the size of Earth's greenhouse warming from the graph [1] · (e) **Evaluate** whether Mercury's and the Moon's mean temperatures are a fair test of the model [3] |
| Data type | **Secondary, published** (NASA planetary fact sheets: distance, Bond albedo, mean surface temperature), with provenance and source column definitions |
| Graph | Observed temperature against model temperature, with the line "observed = model" drawn as a reference. Not a gradient task |
| Relationship | T = [(1 − α)S/(4σ)]^¼ with S ∝ 1/d² (fourth root, inverse square) |
| AO emphasis | AO2 4, AO3 5 |
| SL/HL | SL (B.2: albedo, solar constant, S/4, energy balance; the guidance explicitly asks for equilibrium temperature estimates) |
| Generator | Catalogue columns (existing); energy-balance law with reference values (Earth ≈ 255 K); **reference-line overlay** on the students' graph (T6) |
| Validator | Catalogue values match the stored source extract (T10); each model temperature recomputed; a `verdict`-style claim that Venus and Earth lie above the line by more than their uncertainty; the axes contain every value a mark scheme reads (T3) |
| Independent audit | Recompute S at each distance from the solar constant and the inverse square; check the model temperatures and the sign and size of each body's departure |
| Assessment risk | MEDIUM: (e) is open-ended; the mark scheme needs several valid answers |
| Originality risk | LOW: the 2025 Paper 2 Venus question is about orbits, not energy balance |
| Review risk | **AMBER** (first V1). Second D1 example: GREEN under current rules, AMBER (C1) |

### 3.5 C5-B01 Radial velocity of a spectroscopic binary (C.5), simplified

**Simplified on the teacher's decision (8 October 2026).** The first plan's two riskiest parts are gone: "explain why the
mean wavelength is shifted" (the whole system's motion) and "sketch the companion's curve". The system has no overall
motion in the model, so the mean wavelength is the laboratory wavelength.

| Field | Plan |
|---|---|
| Archetype | **D2** (observational data, first example) + G3 (prediction later in the cycle) |
| Purpose | Use a spectral line's wavelength, observed over several weeks, to find a star's orbital period and orbital speed, judge how precisely the speed is known, and evaluate the observing method |
| Difficulty | **2** |
| Marks | 9: (a) the period from the graph [2] · (b) the star's orbital speed from the largest shift, using Δλ/λ ≈ v/c [3, typed 1 value] · (c) the percentage uncertainty in the speed, from the stated uncertainty in each wavelength [2] · (d) **Predict** the wavelength on a later date [1] · (e) **Suggest** how the observations could be changed to find the period more precisely (observe over more cycles; fill the gaps) [1] |
| Data type | **Observational**: simulated observations from a circular-orbit model with spectrograph scatter, uneven observation dates (weather, daylight), clearly labelled in the stem as simulated (approved by the teacher, 8 October 2026) |
| Graph | Wavelength against time: a periodic pattern of points with scatter and visible y error bars. Students get no fit; the examiner's graph shows the model curve |
| Relationship | Δλ/λ ≈ v/c with a sinusoidal line-of-sight velocity (no systemic velocity) |
| AO emphasis | AO2 7, AO3 2 ((c) 1, (e) 1) |
| SL/HL | SL (C.5: Δλ/λ ≈ v/c and spectral-line shifts of stars). No sound Doppler (HL) |
| Generator | Circular-orbit radial-velocity law (new, with reference values and limiting cases); uneven dates (set values: supported); `source: 'observational'` declared; model curve on the examiner's graph (T6, exists). No Sketch part |
| Validator | Period and amplitude recovered from noise-free data; the predicted date is not an observation (`predictAt`); the readings on the graph are inside the axes (T3); the shift is clearly larger than the scatter; the stem says the data are simulated (small T9 check, built with this dataset) |
| Independent audit | Fit a sinusoid by a different method; recover the period and speed; check v ≪ c, so the approximation holds |
| Assessment risk | MEDIUM: reading a period from unevenly spaced points needs a clear graph and a generous accepted range |
| Originality risk | MEDIUM: legacy astrophysics option papers (2016, 2017, 2019, 2024) use spectroscopic binaries. The simplified sequence (period, speed, its uncertainty, prediction, method) must still be checked against them |
| Review risk | **AMBER** (first D2; first `source:observational`). Must be inspected |

### 3.6 D2-B01 Charges on oil drops, with a miscalibrated voltmeter (D.2)

| Field | Plan |
|---|---|
| Archetype | **L3** (integer-ratio test) + **E2** (calibration systematic, second E2 example) + V3 |
| Purpose | Test whether charge comes in whole-number multiples of one value, then reason about a meter that reads 3 % high: the charges are scaled, quantisation still shows, but the value of e is wrong in a known direction |
| Difficulty | **3** |
| Marks | 10: (a) the balance condition gives q = mgd/V [1, supporting set-up] · (b) complete q for two drops [2] · (c) percentage uncertainty in q, given that r is the largest source (r³) [2] · (d) **Deduce** whether the data support quantisation, and the best value of e [3] · (e) the effect of the meter reading high on e and on the quantisation conclusion [2] |
| Data type | Primary, generated from the model (a school Millikan apparatus), radii from a stated measurement with uncertainty |
| Graph | None, or a strip plot of q values. Table-based |
| Relationship | q = mgd/V with m = (4/3)πr³ρ; q = ne |
| AO emphasis | AO2 4, AO3 6 |
| SL/HL | SL (D.2: Millikan's experiment, E = V/d, F = qE) |
| Generator | `systematic: calibration` on V (existing type, first use); Millikan balance law; sphere mass; radius scatter |
| Validator | **New `integerMultiples` claim** (T5): every q/e_best is within its uncertainty of an integer, and no smaller common factor fits; the calibration direction claim (e too small); propagation of r³ checked |
| Independent audit | Recompute q from the raw readings; find the common factor by a different search; confirm the 3 % scaling and its direction |
| Assessment risk | MEDIUM: "no smaller common factor" must be judged fairly from few drops |
| Originality risk | LOW–MEDIUM: the 2025 Paper 2 and Paper 1A droplet items concern terminal velocity in water and recall, not quantisation data |
| Review risk | **AMBER** (first `systematic:calibration`). E2 itself is established (B1-B02) |

### 3.7 E4-B01 A nuclear power station's operating record (E.4)

| Field | Plan |
|---|---|
| Archetype | **D1** (secondary data outside astronomy, as the retrospective recommends) + M2 + DH11 estimate |
| Purpose | From published annual electricity output, find the load factor and estimate the mass of U-235 fissioned each year; use the data to spot refuelling years |
| Difficulty | **2** |
| Marks | 9: (a) energy released per fission from given masses (Δmc²) [2] · (b) load factor in one year [1, typed] · (c) **Estimate** the mass of U-235 fissioned in a year [3] · (d) identify a refuelling year from the data and justify it [1] · (e) **Discuss** whether "about a tonne per gigawatt-year" is supported [2] |
| Data type | **Secondary, published** (IAEA PRIS or the operator's annual figures for one named reactor), with provenance |
| Graph | None (table of six years) |
| Relationship | E = Δmc²; energy chain: electrical output, then efficiency, then thermal energy, then number of fissions, then mass (proportional) |
| AO emphasis | AO1 1, AO2 5, AO3 3 |
| SL/HL | SL (E.4: energy released in fission, calculations required) |
| Generator | Catalogue table (existing); mass–energy law; stated efficiency and masses with sources |
| Validator | Catalogue values match the stored source extract (T10); every derived number traced; the estimate's accepted range spans the stated efficiency range |
| Independent audit | Recompute Δm from the given masses; the fission count and mass by an independent route; the refuelling year has the lowest load factor by a clear margin |
| Assessment risk | MEDIUM: estimation with stated assumptions; the mark scheme must accept 1 or 2 s.f. |
| Originality risk | LOW: 2025 fission items are Paper 1A multiple choice; no operating-data context |
| Review risk | GREEN under current rules (D1 and `source:secondary` established); **AMBER (C1)**. Recommend inspecting it anyway: real data from a new source |

### 3.8 C2-B01 Light from a long LED tube, measured with a phone light sensor (C.2)

| Field | Plan |
|---|---|
| Archetype | **V2** (model validity range, second example) + L3 (the product I·d² as a test) + G3 |
| Purpose | The point-source inverse square law fails close to a long tube and holds far away: students find where it holds using error bars and explain why |
| Difficulty | **3** |
| Marks | 10: (a) why the reading with the tube off is subtracted [1] · (b) complete the I·d² column [2] · (c) **Plot** the omitted point [1] · (d) **Identify**, using the error bars, the distance beyond which I·d² is constant [2] · (e) **Explain** why the point-source model fails close to the tube [2] · (f) **Predict** the intensity at a distance not measured [1] · (g) state the shortest distance at which the model could safely be used [1] |
| Data type | Primary, **phone sensor** at home or in a corridor (lux), with a background reading |
| Graph | I·d² against d: rises and then levels off. No straight-line fit; the examiner graph shows the exact curve and the point-source level |
| Relationship | Exact finite line source (irradiance from a uniform line of length L) and its far limit I = P/(4πd²) |
| AO emphasis | AO2 3, AO3 7 |
| SL/HL | SL (C.2 linking question: inverse-square intensity of EM waves; b = L/4πd² is in B.1). Relationship given in the question |
| Generator | Law with an **exact and an approximate form** (as the matrix requires for V2), reference values and limiting cases; background offset; sensor resolution and flicker scatter |
| Validator | `validRange` claim checked against the error bars (existing); prediction not at a measured row; plateau level within uncertainty of P/(4π) model; readable from the graph (T3) |
| Independent audit | Integrate the line source numerically; confirm the far limit; check that the change from "rising" to "constant" is clear of the error bars by the margin the claim uses |
| Assessment risk | MEDIUM: where the plateau begins is a judgement; (d) needs a range |
| Originality risk | MEDIUM: May 2018 Paper 3 TZ2 used a point source, a cover and a light sensor (inverse square with an offset). Different source, different question (validity range, not an offset) |
| Review risk | GREEN under current rules (V2 and `claim:validRange` established); **AMBER (C1)**. Recommend inspecting it: the second HIGH-risk V2, in a new physical model |

### 3.9 Batch summary

| ID | Topic | Main archetype | Diff. | Marks | Data | Graph | AO3 (est.) | Risk (current / with C1) |
|---|---|---|---|---|---|---|---|---|
| A3-B01 | A.3 | L3 | 1 | 9 | video frames | geometric decay | 4 | GREEN (sample) / GREEN |
| E1-B01 | E.1 | M3 | 1 | 8 | image of a scale | none | 3 | AMBER / AMBER |
| A2-B03 | A.2 | G1 | 2 | 10 | force-plate sensor | dense trace, area | 4 | AMBER / AMBER |
| B2-B01 | B.2 | V1 | 2 | 9 | published planetary data | data against model line | 5 | AMBER / AMBER |
| C5-B01 | C.5 | D2 | 2 | 9 | simulated observations | periodic | 2 | AMBER / AMBER |
| D2-B01 | D.2 | L3 + E2 | 3 | 10 | lab (model) | none / strip | 6 | AMBER / AMBER |
| E4-B01 | E.4 | D1 | 2 | 9 | published reactor data | none | 3 | GREEN / AMBER |
| C2-B01 | C.2 | V2 | 3 | 10 | phone sensor | curve levelling off | 7 | GREEN / AMBER |
| **Total** | 8 topics | 8 different main archetypes | 2/4/2 | **74** | | | **34 (46 %)** | **3 GREEN, 5 AMBER, 0 RED** (with C1: 1 GREEN, 7 AMBER) |

- **Diversity:** no apparatus or context family repeated; L3 is a main archetype in 2 of 8 (25 %, under the 35 % limit).
- **Part marks:** 20 one-mark, 18 two-mark, 6 three-mark parts (44 parts; 41 % worth 2 marks, against 68 % in the bank). Typed parts in 5 of 8 datasets, about 10 marks.
- **Bank after Batch 2:** 21 datasets, about 201 marks, 17 of 19 SL topics, 22 of 26 archetypes (missing L4, G2, E4, D3),
  difficulty 19 / 57 / 24 %, non-lab or non-primary data in 8 of 21.
- **Proposed review:** inspect E1-B01, A2-B03, C5-B01 (first examples, visual or HIGH risk) and B2-B01 (first V1);
  inspect C2-B01 and E4-B01 (second HIGH-risk examples, real data); D2-B01 could be waived only if the calibration
  claim is fully automated (a MEDIUM-level reason under C6); A3-B01 as the GREEN sample. About 6–7 of 8 inspected:
  more than Batch 1 because 4 archetypes are new.

---

## 4. Tooling and presentation changes required before generation

### Blocking (must be done, with tests, before any Batch 2 dataset is written)

| # | Change | Why (evidence) | Used by |
|---|---|---|---|
| T1 | **Context-family diversity check** (retrospective MUST FIX 1, proposal C3): a declared `contextFamily`; a repeat within a batch is a diversity warning | Batch 1's springs and heaters went unflagged | all |
| T2 | **Too-regular data check** (MUST FIX 2, C4): warn when ≥ 80 % of successive differences in a measured column are equal | Two tidy tables caught only by reading | all with tables |
| T3 | **Readable-from-the-graph check** (MUST FIX 3): any value a mark scheme reads from a graph lies inside the plotted axes | The C1-B01 crossing | A2-B03, B2-B01, C5-B01, C2-B01 |
| T4 | **Giveaway check across earlier mark schemes** (MUST FIX 4) | The C1-B01 ordering | all |
| T5 | **Ratio claims** (IN4, spec 19.1 item 6): `constantRatio` (ratios equal within propagated uncertainty) and `integerMultiples` (values are whole multiples of a common factor, and no smaller factor fits) | Needed for L3 as a main route | A3-B01, D2-B01, C2-B01 |
| T6 | **Curves without a fitted line**: student graphs with points only (no linear or exponential fit required); examiner graphs with a **model curve from a law**; a **reference line** (y = x) allowed on student graphs | 3 of 8 graphs are periodic, levelling-off or geometric; one compares with a model line | A3-B01, B2-B01, C5-B01, C2-B01 |
| T7 | **Area-under-a-graph support** (G1): dense trace plotted as a line without per-point error bars; an `area` result with an accepted range from bounding estimates; examiner shading; `graph:area` feature | No area task exists | A2-B03 |
| T8 | **Instrument-scale image component with read-back** (EX5, spec 19.1 item 8): spectroscope scale with lines; validator reads the positions back from the SVG; readable at 375 px | Required before M3; reading at phone size is the main risk | E1-B01 |
| T9 | **`source: 'observational'` mode**: uneven sampling, a stated observational scatter, realism checks adapted, and a required "simulated observations" label | First D2 | C5-B01 |
| T10 | **Secondary-data verification aid** (retrospective SHOULD FIX 8, raised to blocking here): source column names and definitions in `provenance`; check that each catalogue value matches a stored copy of the source extract (in the reference cache, outside the repository) | The D1-B01 period-column error was caught by hand; Batch 2 adds two new real sources | B2-B01, E4-B01, E1-B01 (levels) |

### Strongly recommended before generation

| # | Change | Used by |
|---|---|---|
| T11 | **Sketch part type** (GR16): self-marked, with a generated examiner sketch. If not built, C5-B01 (e) becomes a Describe part | C5-B01 |
| T12 | **Command-term check and part-mark variety report** (SHOULD FIX 7 and 12), so the variety in section 3.9 is measured, not assumed | all |
| T13 | **Axis-name ambiguity lint** (SHOULD FIX 11) | graph datasets |
| T14 | **Diagram components**: force plate and jumper, spectroscope, Millikan plates with a drop, phone sensor and tube, planet–Sun geometry (optional), binary orbit sketch (optional) | 7 of 8 |
| T15 | **Dataset-specific physics-review records** (SHOULD FIX 9) | review |

### New laws (part of writing each dataset; each needs reference values and limiting cases)

`bounce-height-ratio` (empirical), `photon-energy`, a force-plate pulse (empirical) and `impulse`, `energy-balance-temperature`,
`radial-velocity-doppler` (circular orbit), `millikan-balance` and sphere mass, `mass-energy` and the power-station
energy chain, `line-source-irradiance` (exact) with its point-source limit. The exact line-source law, both empirical
laws and the use of simulated observations need the teacher's approval (spec "Decisions", items 9 and 11).

---

## 5. Originality evidence (keyword scan of the cached papers, 8 October 2026)

| Context | Closest cached IB item | Judgement |
|---|---|---|
| Bouncing ball from video | none found | low |
| Spectroscope reading of a lamp | legacy Paper 3 2018/2019/2024 (spectra); May 2025 Paper 1A | low–medium |
| Force plate, impulse by area | May 2023 Paper 3 TZ2 (force sensor, ball's peak force) | low |
| Planetary energy balance | May 2025 Paper 2 TZ1 (Venus orbit only) | low |
| Spectroscopic binary | legacy astrophysics option papers | medium: sequence must differ |
| Millikan quantisation | Nov 2025 Paper 2 TZ1 (droplet terminal velocity) | low–medium |
| Reactor operating data | May/Nov 2025 Paper 1A (fission multiple choice) | low |
| Light sensor and inverse square | May 2018 Paper 3 TZ2 (point source with a cover) | medium: different source and question |
| **Rejected** double-slit image (C.3) | **May 2025 Paper 1B TZ3** (measuring s across fringes, uncertainty) | **too close**: dropped |
| **Rejected** pendulum period against amplitude (C.1 V2) | **May 2017 Paper 3 TZ1** (T/T₀ against amplitude, 1 % criterion) | **too close**: dropped |
| **Rejected** Doppler of a passing car (C.5) | none, but sound Doppler is **HL only** | out of SL scope |

A keyword scan is not an originality check; each dataset still needs its written `originality` note and the
teacher's judgement (spec section 9).

---

## 6. Deferred to Batch 3

- **C.3** (a new idea needed; the obvious double-slit route is too close to May 2025 Paper 1B) and **E.5** (stellar
  radii and the HR diagram need a reversed temperature axis and log luminosity).
- Archetypes **L4** (students' own max/min lines), **G2** (tangents), **D3** (simulation and design choice; needs
  multi-series figures) and **E4** as a whole question (needs "range too narrow" style claims).

---

## 7. Teacher decisions needed before generation

1. The retrospective's MUST FIX tooling (T1–T4) and proposals **C1–C6** (C1 changes 3 risk classes in section 3.9).
2. This dataset list, or changes to it (topics, contexts, difficulty mix).
3. Real published data from **NASA planetary fact sheets** (B2-B01), **IAEA PRIS / operator figures** (E4-B01) and
   **NIST atomic levels** (E1-B01): accuracy, licence and provenance.
4. ~~**Simulated observational data** for C5-B01, labelled as simulated~~: approved by the teacher on 8 October 2026.
5. ~~**Empirical laws** (bounce ratio, force-plate pulse) and the **exact line-source law**~~: all three approved by the teacher on
   8 October 2026 (used only to generate data; students are given the relationships they use).
6. ~~The accepted-range policy for **area estimates** (A2-B03)~~: adopted 8 October 2026 (±5 % minimum, count-the-squares estimate included, ±20 % maximum).
7. Whether the C2-B01 topic tag (C.2, with b = L/4πd² from B.1) is right, or it should be tagged B.1.

---

## READINESS

**NOT READY — TOOLING CHANGES REQUIRED**

None of the retrospective's four MUST FIX checks (T1–T4) is in the code yet. The plan also depends on ratio claims
(T5), curves without fits and model lines (T6), area support (T7), the instrument-image component with read-back (T8),
an observational-data mode (T9) and secondary-data verification (T10). After those are built and tested, and the
teacher has made the decisions in section 7, Batch 2 can be generated from this plan.
