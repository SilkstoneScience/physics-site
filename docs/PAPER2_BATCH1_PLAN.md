# Paper 2 Batch 1 plan

Draft, 14 October 2026, branch `paper2-batch1`. **For the teacher to agree before questions are written.**
Rules: `docs/PAPER2_SPECIFICATION.md`.

Agreed with the teacher (14 October 2026): a mix of about 10 questions; linking questions in their own section;
legacy Paper 2s 2016–2024 extracted for analysis and the originality check; work on this branch until the batch is
accepted.

## Why these topics

Paper 2 questions on the site now: A.1 has **none**, C.2 has **one**, every other subtopic has two or three.
So Batch 1 starts with A.1 and C.2, adds three HL-only topics (where HL students most need practice), and makes four
linking questions that between them touch all five themes.

## The 10 questions

| ID | Type | Level | Subtopics | Context (all new, not from an IB paper) | Marks |
|---|---|---|---|---|---|
| A1-P01 | short | SL | A.1 | A rescue drone releases a supply package while flying horizontally over sloping ground; the package lands below its launch height; then the qualitative effect of air resistance | 8 |
| C2-P01 | short | SL | C.2 | Earthquake P and S waves reaching a seismometer: wave types, the time gap to find distance, a displacement–distance graph to read λ and amplitude | 8 |
| B5-P01 | short | SL | B.5 | A thermistor frost alarm (thermistor in series with a fixed resistor; the term "potential divider" isn't in the 2025 guide, so it won't be needed): resistance from a graph, current, power, and why the output changes as it gets colder | 8 |
| D1-P01 | short | HL | D.1 (+A.3) | Moving a satellite to a higher circular orbit: orbital speed and period, gravitational potential energy, total energy, the energy the engines must supply | 9 |
| B4-P01 | short | HL | B.4 (+B.3) | A monatomic gas taken round a three-stage cycle on a p–V diagram: work from areas, first law in each stage, efficiency, entropy change in one stage | 10 |
| E2-P01 | short | HL | E.2 | Photoelectric-effect results for one metal as a stopping-voltage against frequency graph: threshold frequency, work function, Planck constant from the gradient, what changes with intensity | 9 |
| LQ-S01 | linking | SL | A.2, B.3, B.2, C.2, A.1 | A high-altitude weather balloon: buoyancy and the resultant force at launch; the gas expanding as it rises (gas laws); radiation balance of the balloon in sunlight; its radio transmitter (wavelength, signal travel time); falling back with a parachute (terminal speed, qualitative) | 20 |
| LQ-S02 | linking | SL | E.3, B.1, B.5, D.1 | A radioisotope power source on a deep-space probe: decay and half-life, power output falling with time; heating and specific heat capacity of the casing; the electrical output and the probe's circuit; the gravitational field strength at the outer planet it orbits | 20 |
| LQ-H01 | linking | HL | D.3, E.3 (HL), B.1, A.5 | A cyclotron that makes a short-lived medical isotope: circular path of protons in the magnetic field, the time per orbit; the isotope's decay constant and the activity delivered after transport to the hospital; cooling the target; whether time dilation matters at the protons' speed (about 0.15c: a short calculation showing it is small) | 20 |
| LQ-H02 | linking | HL | A.4, A.3, D.4, B.1 | A flywheel energy store in a tram: moment of inertia, rotational kinetic energy, angular deceleration under friction torque; power and efficiency; the generator coil (Faraday's and Lenz's laws); heating of the bearings | 20 |

Totals: 132 marks; SL 64, HL 68; 6 short, 4 linking (2 SL, 2 HL).

## Sources of ideas

- Each question is written from the guide and the teacher's lesson decks, with the style modelled on the 2025 and
  legacy papers (style only).
- While writing, I will look in the matching **Daily Questions** folders for a similar situation (allowed: same
  situation and topics, with our own wording that is not too close to the original, and new numbers) and record the file name in the question's
  `originality` note, so you can compare them.

## Build order

1. The tooling (`tools/p2/`): question file format, physics functions with tests, independent check, syllabus list,
   not-assessed list, originality check, validator, build, review records; then the question bank changes.
2. The 10 questions, each built and audited.
3. You review all 10 (preview on this computer), we fix what you find, you accept the batch, and we merge into `main`.

## As written (15 October 2026)

All 10 questions are written in `tools/p2/questions/`, pass every automatic check (syllabus, typed numbers,
dimension check, independent check, originality against 110 IB Paper 2 files, mark-scheme rules) and are
**AUTO-VALIDATED**: visible only in the local preview, not on the live site. 137 marks: SL 65, HL 72.

| ID | Level | Marks | Subtopics | Differences from the plan |
|---|---|---|---|---|
| A1-P01 | SL | 8 | A.1 | The drone *descends* at 20° (a launch below the horizontal, as the guide requires); time from a quadratic. Inspired by Daily Question A.1 Q46 (transcript in the reference cache) |
| C2-P01 | SL | 7 | C.2 | As planned, with a displacement–time graph (period) instead of displacement–distance; adds "distance moved by a particle in one period" |
| B5-P01 | SL | 10 | B.5 | As planned; values given in the text instead of a resistance–temperature graph; part (a) asks whether the fixed resistor is ohmic |
| D1-P01 | HL | 11 | D.1, A.3 | As planned, plus the period and a "why is the kinetic energy smaller" part |
| B4-P01 | HL | 11 | B.4 | The third stage is adiabatic (PV^(5/3) = constant): work from the first law with Q = 0. Deliberately unlike the May 2025 TZ3 cycle |
| E2-P01 | HL | 10 | E.2 | The graph is drawn from an experimental h = 6.4 × 10⁻³⁴ J s, so h must come from the gradient; typing the data-booklet value gets specific feedback |
| LQ-S01 | SL | 20 | A.2, B.3, C.2, A.1, A.3, B.1 | The B.2 radiation part was replaced by (a)(iii), which links buoyancy and the gas laws |
| LQ-S02 | SL | 20 | E.3, B.1, B.5, D.1, A.3, A.2, E.1 | The "show that" is the thermal power (used by three later parts); adds the decay equation and why objects float in orbit |
| LQ-H01 | HL | 20 | D.3, A.5, E.3, B.1 (+A.2, A.3, B.5) | As planned; the relativity part asks whether ½mv² was reasonable (γ = 1.019) |
| LQ-H02 | HL | 20 | A.4, A.3, D.4, B.1 | As planned; the generator part uses the average emf over a quarter turn (Faraday's law), plus qualitative Lenz's law |

Things the checks caught while writing (and were fixed): six phrases that matched past papers (e.g. "Calculate, in eV,
the work function of the metal", in three papers), several numbers typed into mark schemes, a "show that" value
printed unrounded (252 for 250), an accept range that would have auto-marked the copied data-booklet value of h.
Tool changes made on the way: IB-style powers of ten, accept ranges rounded outwards to 3 s.f., µ units, the rev
unit, wrong-answer values allowed in mark schemes, ECF clauses ignored by the originality check (with tests).

## Teacher review (next step)

1. Start the preview (double-click `preview.bat`), open the question bank and choose Paper → "Paper 2 (structured)"
   or "Paper 2 linking (20 marks)". The new questions are marked "Preview only: AUTO-VALIDATED".
2. For the physics behind each question (given values, every result, syllabus IDs, examiner notes, inspiration),
   run `node tools/p2/build.mjs --audit`.
3. Tell Claude what to change. When you're happy with a question, say so: Claude records PHYSICS-REVIEWED and
   TEACHER-REVIEWED in your name (with `--recorded-by`) only on your explicit instruction.
4. When all 10 are TEACHER-REVIEWED: `node tools/p2/review.mjs accept-batch batch-1 --by "<you>" --note "…"`,
   rebuild, check, and merge `paper2-batch1` into `main`.
