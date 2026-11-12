# Mission log: stage 1 outline (for the teacher's check)

Draft, 9 November 2026. No code yet. `docs/` is not published.

## The agreed shape
- **Story:** the student commands the crewed ship *Kittiwake* and its lander *Petrel*, sent in 2071 to sample Europa's hidden ocean. Nobody dies in any ending.
- **Level:** SL throughout, plus 3 optional decisions tagged HL.
- **Size:** 12 decisions on any route, in 4 chapters, about 55–75 minutes. Progress is saved in the browser, so it can be played over two sittings.
- **Branches:** 2 real forks (4 routes through the story), a detour at 6 of the 12 decisions, and 4 endings.
- **Writing:** 14 decisions (forks add 2), 8 detours, 3 HL side-tasks, 2 fork briefings, 4 captain's logs and 4 endings. That is 35 pieces.

## Branch map
```
CH 1 LEAVING HOME        CH 2 JUPITER'S REALM      CH 3 EUROPA
1* -- 2 -- 3* -- LOG     4 -- 5(H) -- 6* -- LOG    FORK 1: 7A* plains  \
                                                           7B* chaos   / -- 8 -- 9 -- LOG

CH 4 THE OCEAN AND HOME
FORK 2: 10A* melt probe  \
        10B* plume        / -- 11(H) -- 12*(H) -- LOG -- ENDING

*   a wrong answer leads to a detour scene, then rejoins
(H) has an optional HL side-task
```

## The decisions
g on Europa is 1.32 m s⁻², calculated with $g = GM/r^2$. All numbers below were calculated by script.

| # | Topic | The situation | Calculation | The order to give | Gauge |
|---|---|---|---|---|---|
| 1* | A.2 | Departure burn: 2.4×10⁵ kg ship expels 8 kg s⁻¹ at 30 km s⁻¹; needs +900 m s⁻¹ (mass change only 3%, so ignored) | F = 2.4×10⁵ N, burn = **900 s** | Set the burn time | Fuel |
| 2 | B.1 | Solar panels or reactor at 5.2 AU? (need 30 kW, 20% efficient, 600 m² array) | b = 50 W m⁻²; area needed ≈ **3000 m²** | Rely on the reactor | Power |
| 3* | E.4 | Reactor at 150 kW thermal, 200 MeV per fission; the rate starts climbing | **4.7×10¹⁵ fissions s⁻¹** | Insert the control rods | Power |
| 4 | C.2 | Fault at 6.3 AU; the fix must start within 90 minutes | One way **52.5 min**, round trip 105 min | Act without waiting for Earth | Fuel |
| 5 (H) | D.1 | Parking orbit at twice Europa's radius; lander supplies need a window within 12 days | Kepler: **10.0 days** (3 radii would be 18.4) | Choose the 2-radius orbit | Shielding |
| 6* | D.3 | Proton storm, 2.0×10⁷ m s⁻¹; shield gap 0.50 m | r = **0.42 m** at 0.50 T (0.70 m at 0.30 T) | Run the coils at 0.50 T | Shielding |
| 7A* | A.1, A.2 | **Plains:** 8000 kg lander, 45 m s⁻¹ descent; engine limit 40 kN | Start braking at 300 m: **37.5 kN** (200 m needs 51 kN) | Brake from 300 m | Fuel |
| 7B* | A.1 | **Chaos terrain:** rover must jump an 18 m crevasse, landing 5.0 m lower | Minimum **6.5 m s⁻¹** | Drive at 7 m s⁻¹ (not 5) | Fuel |
| 8 | C.2 | Seismic echo in ice, 3800 m s⁻¹: 3.2 s at one site, 0.16 s at another | **6080 m** and **304 m** | Work at the thin site | Power |
| 9 | B.5 | Two 12 Ω heaters, 48 V cell, r = 0.5 Ω; need at least 300 W | Parallel **327 W**, series 92 W | Wire them in parallel | Power |
| 10A* | B.1 | **Melt probe:** 9000 kg of ice, warmed 123 K then melted; 50 kW; 36 h limit | 5.3×10⁹ J, **29 h** | Commit to the melt | Power |
| 10B* | A.1 | **Plume:** grains leave at 120 m s⁻¹; hover to catch them at the top | **5.5 km**, 91 s | Hover at 5.5 km | Fuel |
| 11 (H) | E.3 | Salty sample activated by Jupiter's radiation (sodium-24, half-life 15 h): 1640 counts min⁻¹, background 40; safe at 100 above background | 4 half-lives = **60 h** | Wait 60 h inside the 72 h window | Shielding |
| 12* (H) | A.2 | Docking: 6000 kg lander, 1.8×10⁵ kg ship, 2.0 s contact, latch limit 1.5 kN | At 0.60 m s⁻¹: **1.74 kN**; at 0.50 m s⁻¹: 1.45 kN | Slow to 0.50 m s⁻¹ | Fuel |

### The forks (no wrong answer; each costs a gauge)
- **Fork 1, landing site:** smooth plains (long rover trek, −10 power) or chaos terrain (near the thin ice, but hovering to find a spot, −10 fuel).
- **Fork 2, reaching the ocean:** melt probe (real ocean water, −15 power) or catching plume grains (no drilling, −15 fuel).

### The detours
| At | What goes wrong | Recovery calculation | Topic | Answer |
|---|---|---|---|---|
| 1 | Overshoot by 100 m s⁻¹ | Reverse with 6.0×10⁴ N thrusters | A.2, A.1 | 400 s |
| 3 | Reactor overheats | Coolant flow for 150 kW, c = 1500, ΔT = 50 K | B.1 | 2.0 kg s⁻¹ |
| 6 | Storm hits; electrons at 3.0×10⁷ m s⁻¹ | Their radius, and why they curve the other way | D.3 | 0.34 mm |
| 7A | 3.0 m s⁻¹ hard landing, stops in 0.40 s | Force on the legs, including weight | A.2 | 71 kN |
| 7B | Rover stuck; 900 kg to winch up at 0.30 m s⁻¹ | Power needed | A.3 | 360 W |
| 10A | Probe losing heat through insulation (k = 0.050, 1.5 m², 2.0 cm, 130 K) | Rate of conduction | B.1 | 490 W |
| 10B | Grains (1.6×10⁻¹⁵ C) drift past; collector plates 6000 V, 3.0 cm apart | Force on a grain | D.2 | 3.2×10⁻¹⁰ N |
| 12 | Hard dock | Recalculate the common velocity and a safe second approach | A.2 | 0.019 m s⁻¹ (first dock) |

### HL side-tasks (optional, tagged HL; no effect on SL students' endings)
- **At 5:** orbital speed at 2 radii: 9.7 km s⁻¹, checked against 2πr/T.
- **At 11:** decay constant 1.28×10⁻⁵ s⁻¹; activity after a non-integer 40 h: 252 counts min⁻¹.
- **At 12:** escape speed from Europa: 2.03 km s⁻¹. Can the ascent stage do it?

## How a decision plays
1. Read the log entry and the data. 2. Type the number (marked by `js/numeric.js`, with one free retry and feedback on common mistakes). 3. Give the order.
A wrong number after the retry, or an order that doesn't follow from it, triggers the consequence and shows the correct working. A hint is available but costs 2 gauge points.

**Captain's log (4, one per chapter):** write a two-sentence justification, compare it with a model, and tick up to 2 checklist points (8 in all). It's self-marked, as in the mysteries.

## Gauges and endings
Fuel, Power and Shielding start at 100 (total 300). A plain wrong answer costs 10; a detour decision costs 15 and gives 5 back if the detour is solved. No gauge can fall below 10, so nobody is ever stranded.

| Ending | Needs (total of the 3 gauges) | What happens |
|---|---|---|
| **The deep signal** (rare) | 250+, at most 1 wrong, and 6+ of 8 log ticks | Possible chemical signs of life, carefully unconfirmed: "we need more evidence" (NoS) |
| **Mission accomplished** | 215+ | Ocean samples home, crew safe |
| **Limping home** | 165+ | Crew safe, samples lost or damaged |
| **Mission aborted** | below 165 | Everyone survives; a debrief shows what to revise |

A simulation of 20,000 games per ability level gave these results:

| Student gets right | The deep signal | Accomplished | Limping home | Aborted |
|---|---|---|---|---|
| 95% | 88% | 12% | 0% | 0% |
| 85% | 45% | 55% | 1% | 0% |
| 70% | 0% | 82% | 18% | 0% |
| 55% | 0% | 37% | 61% | 2% |
| 40% | 0% | 6% | 75% | 19% |

Every ending ends with a topic list of what to revise, linked to the notes.

## Honest about the science (short "fact or fiction" note at the end)
- **Real:** Europa's mass, radius, orbit and likely ocean; chaos terrain; intense radiation near Jupiter; sodium-24's half-life.
- **Invented or simplified:** the crewed ship and its drive; ice as thin as 304 m (estimates are kilometres or more); plumes (evidence is tentative and debated); the shield's uniform field; any sign of life.
- Europa's orbital period here is 3.55 days (Kepler confirms it). The site's `experimental/data/jupiter-moons.csv` lists 3.525 from a NASA sheet. I haven't changed that file.

## Coverage and later stages
- **SL topics used:** A.1, A.2, A.3, B.1, B.5, C.2, D.1, D.2, D.3, E.3, E.4. Each was checked in the guide. The HL parts use D.1 and E.3 HL content.
- **Build (stages 2–4):** `mission.html?mission=europa`, `js/mission.js`, `missions/europa.json`, styles and number marking reused from the mysteries, our own SVGs (no AI images), new checker rules, a new card on `games.html`. No new libraries.
- **Stage 2:** the game page and Chapter 1 (decisions 1–3, one detour, one log) for you to play. **Stage 3:** the rest. **Stage 4:** independent review of the physics and branches, phone and dark-mode tests, teacher notes, publishing.

## Progress (12 November 2026)
- **Chapter 4 and the endings** are written: fork 2 (melt probe → 10A, plume → 10B, with detours), decision 11 (E.3, HL extra on the decay constant), decision 12 (A.2 docking, HL extra on escape speed), log 4, and a hidden `finale` scene that picks the first ending whose conditions are met (`minTotal`, `maxWrong`, `minLog`). Thresholds as planned: 250 + at most 1 wrong + 6 log points; 215; 165; otherwise aborted (re-simulated with the final costs). Each ending shows a final report, what to revise and the mission's "Fact or fiction?" note. Decision 11 uses 1800 counts per minute with a background of 200 (so forgetting the background gives a clearly different answer), and the sample is activated by the lander's neutron instrument rather than by Jupiter's radiation.
- A `range` on a numeric answer turns off the "correctly rounded to 2+ s.f." rule, so every range must include the 2 s.f. rounding of the answer (decision 12's had to be widened to include 1700).
- **Chapter 3** (fork 1, decision 7A or 7B with their detours, decisions 8 and 9) is written too. Forks are a `fork` scene: 2–4 options, each with a gauge cost and its own `next`. Europa's g is given as 1.3 N kg⁻¹ (1.32 from the booklet's G with M = 4.80×10²² kg, r = 1.56×10⁶ m). The thin ice is flagged as invented in decision 8's explanation ("Fact or fiction?").
- **Chapter 1** (decisions 1–3) and **Chapter 2** (decisions 4–6) are written, each with an independent physics review, and tested at 375 px and in dark mode.
- Decision 5's time limit: the ship goes once round Jupiter while the lander is on Europa, so one orbit must take at most 12 days (the lander's supplies).
- Decision 6: 2 MeV protons would be stopped by the wall itself; the shield is there so that they don't hit it (damage and X-rays), not because they'd pass through.
- **HL extras:** a decision can have an optional `hl` task (its own answer box, a free hint, no effect on the gauges; saved for the endings). The first is at decision 5 (orbital speed).
- A chapter's end report (`pause`) now has a button to the next chapter when one is written.
- The four questions below are still open; until the teacher answers, the draft's choices stand (hints cost 2 points).

## Decisions for you
1. Do the story, the ship names and the 2071 setting suit you?
2. Any decision to swap, for example one you'd rather have in a topic that's missing (C.1, C.3–C.5, B.3 and E.5 aren't used)?
3. Are you happy with "The deep signal" hinting at possible life, as long as it stays unconfirmed?
4. Should hints cost gauge points (as drafted) or be free?
