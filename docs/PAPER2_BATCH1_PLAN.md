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
  situation, topics, similar wording; not copied; new numbers) and record the file name in the question's
  `originality` note, so you can compare them.

## Build order

1. The tooling (`tools/p2/`): question file format, physics functions with tests, independent check, syllabus list,
   not-assessed list, originality check, validator, build, review records; then the question bank changes.
2. The 10 questions, each built and audited.
3. You review all 10 (preview on this computer), we fix what you find, you accept the batch, and we merge into `main`.
