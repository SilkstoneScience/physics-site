# Practicals: plan for hands-on labs

Drafted 13 November 2026 for the teacher to review. Nothing below is built yet except where it says **live**.

## 1. Where we are now

The Practicals page (`experimental/practicals.html`) has 10 cards:

| Card | Type | State |
|---|---|---|
| Centripetal acceleration with a pendulum (A.2) | Hands-on, **Vernier** | live |
| Newton's second law (A.2) | Hands-on, **Vernier** | Coming soon (handout ready in physics-source) |
| Static and dynamic friction (A.2) | Hands-on, **Vernier** | Coming soon (handout ready) |
| Single-slit diffraction (C.3) | Hands-on, **Vernier** | Coming soon (handout ready) |
| Momentum in collisions and explosions (A.2) | Simulation | live |
| Resistivity of a wire (B.5) | Simulation | live |
| Finding *g* with a simple pendulum (C.1) | Simulation | live |
| Half-life of protactinium-234m (E.3) | Simulation | live |
| Speed of seismic waves (C.2) | Database | live |
| Kepler's third law from NASA data (D.1) | Database | live |

**Vernier tag (done in this branch):** a new `<span class="tag vernier-tag">Vernier</span>` (outlined, neutral colour, so it doesn't clash with blue links, green Simulation/Database or orange HL) is on the four labs that use Vernier sensors and on the centripetal page's lead. The simulations only *imitate* light gates, so they don't get it. **Rule from now on:** any lab that needs a Vernier sensor or Logger Pro gets the tag; labs with ordinary equipment get no equipment tag.

## 2. What the guide asks for

- There are **no prescribed practicals** in the 2025 guide. Practical work is 20 hours (SL) / 40 hours (HL), plus the CSP (10 h) and the IA (10 h).
- What students must *experience* is set by the **Tools** and the **Inquiry process**:
  - **Tool 1 (experimental techniques):** safety, and measuring mass, time, length, volume, temperature, force, current, potential difference, angle, and sound and light intensity.
  - **Tool 2 (technology):** sensors, databases, models and simulations, image and video analysis, spreadsheets, graphs, computer modelling.
  - **Inquiry 1–3:** designing, collecting and processing data, concluding and evaluating.
- So the aim is: **every Tool 1 quantity and every Tool 2 skill met at least once, at least one hands-on lab for every SL subtopic where one is realistic, and HL labs for the HL topics** (marked HL like the notes).

## 3. Strategy (recommended)

1. **Finish what's started first** (done 13 November 2026, waiting for the teacher's check). The three Vernier handouts in `physics-source/experimental-programme/practicals` (Newton's second law, friction, single-slit) become full pages, built like `centripetal.html`.
2. **One template for every hands-on lab**, copied from `centripetal.html`: aim, skills practised, equipment, safety, method (Logger Pro 3 steps for Vernier labs), readings tables with live graphs, answer boxes saved in the browser, and "Download my lab report" (.docx). Two additions:
   - A short **"Tools and inquiry" box** listing which Tool 1/Tool 2 skills the lab practises (this also fixes the "Tools 1–2" gap in `PROGRESS.md`).
   - For Vernier labs, an optional one-line **"No sensors?" alternative** (e.g. stopwatch and metre rule) so the page still helps students elsewhere.
3. **Hands-on first, simulations and databases only where hands-on isn't possible** with the school's equipment (no radioactive sources, e/m tube, oscilloscope or Cavendish balance; see section 5).
4. **Build in batches by theme** (A, then B, …), each batch independently reviewed for physics and safety, then checked by the teacher in the preview, as for the other projects.
5. **Sources:** the teacher's own handouts and the Vernier lab books are the starting point; the Cambridge "Unit X Practical n" sheets, the SIC labs and the "More Experiments" PDFs are publisher material, so **ideas only**, with all wording, numbers and diagrams our own (same rule as the centripetal page).
6. **Practicals page:** keep the theme sections; once a theme has more than about six cards, add filter buttons (All · Hands-on · Vernier · Simulation · Database). Ask the teacher before adding them.

## 4. Proposed labs

Priority: **1** = build first (core SL coverage), **2** = next, **3** = later or optional. "Vernier" = gets the tag. "Common" = ordinary lab equipment.

### Theme A

| Lab | Topic | Type | Key equipment | Idea source | Pri |
|---|---|---|---|---|---|
| Newton's second law (modified Atwood's machine) | A.2 | Vernier | Dynamics Track, cart, Force Sensor, Motion Encoder | Teacher's handout | 1 |
| Static and dynamic friction | A.2 | Vernier | Force Sensor, Motion Detector, wooden block | Teacher's handout | 1 |
| Free-fall *g* with a picket fence | A.1 | Vernier | Photogate, picket fence | Vernier *Physics with Computers*; Cambridge A P1 (ideas) | 1 |
| Motion graphs: match the graph | A.1 | Vernier | Motion Detector | Vernier *A2 Investigating Motion* | 2 |
| Video analysis of a thrown ball | A.1 | Vernier (Logger Pro video) | Phone camera, metre rule | Teacher's Logger Pro video lesson; *ProjectileVideo Analysis* | 2 |
| Predicting a projectile's landing point | A.1 | Vernier | Ramp, Photogate (launch speed), carbon paper | Vernier 06; teacher's *Projectile Motion Lab* | 2 |
| Hooke's law and the spring constant | A.2 | Common (or Force Sensor) | Spring, masses, metre rule | general | 2 |
| Impulse: force–time graph of a collision | A.2 | Vernier | Force Sensor bumper, Motion Encoder, cart | Vernier 10A | 2 |
| Terminal speed of falling paper cones | A.2 | Vernier | Motion Detector, paper cake cases | Vernier (drag) | 2 |
| Finding an unknown mass with balanced forces | A.2 | Common | Pulleys, string, masses, protractor | Cambridge A P2 (ideas); SIC Ex.41 | 3 |
| Real collisions on a track (compare with the simulation) | A.2 | Vernier | Two carts, Motion Encoders/Detectors | Vernier 11A | 3 |
| Energy transfers in a spring-launched cart | A.3 | Vernier | Motion Detector, Force Sensor, track | Vernier 07/09 | 2 |
| Efficiency of an electric motor lifting a load | A.3 | Vernier | Small motor, Voltage and Current Probes, masses | general | 2 |
| Moment of inertia from torque and angular acceleration (HL) | A.4 | Vernier | Rotary Motion Sensor, pulley, hanging mass | Vernier 13, GDX moment of inertia | 2 |
| Conservation of angular momentum (HL) | A.4 | Vernier | Rotary Motion Sensor, rotating disc and ring | Vernier 14 | 3 |
| Torques in equilibrium (HL) | A.4 | Common | Metre rule, pivot, masses | SIC Ex.42 (ideas) | 3 |

A.5 (HL, relativity): no hands-on lab; the notes' thought experiments and Think deeper items cover it.

### Theme B

| Lab | Topic | Type | Key equipment | Idea source | Pri |
|---|---|---|---|---|---|
| Specific heat capacity of a metal block | B.1 | Vernier | Immersion heater, block, Temperature Probe, Voltage and Current Probes | Cambridge B P1; *SHC by electrical method* (ideas) | 1 |
| Specific latent heat of fusion of ice | B.1 | Vernier | Temperature Probe, heater or method of mixtures | Cambridge B P2; *SLH of fusion of ice* (ideas) | 2 |
| Albedo of different surfaces | B.2 | Vernier | Light Sensor, lamp, white/black/sand/soil samples | new | 2 |
| A greenhouse model in a bottle (and why it's hard to do well) | B.2 | Vernier | Two Temperature Probes, bottles, lamp, CO₂ | *climatemodel* PDFs (ideas) | 3 |
| Boyle's law | B.3 | Vernier | Gas Pressure Sensor, syringe | Vernier *Behavior of a Gas*; Cambridge B P3 | 1 |
| Pressure and temperature: finding absolute zero | B.3 | Vernier | Gas Pressure Sensor, Temperature Probe, flask, water baths | Vernier *Behavior of a Gas* | 1 |
| I–V characteristics: resistor, filament lamp, diode | B.5 | Vernier | Voltage and Current Probes, components | *Current variation with pd* (ideas) | 1 |
| EMF and internal resistance of a cell | B.5 | Vernier (or multimeters) | Cell, variable resistor, probes | teacher's *DBQ internal resistance*; Cambridge B P8 | 1 |
| Resistivity of a wire (real version of the simulation) | B.5 | Common | Constantan wire, micrometer, meters | Cambridge B P6; SIC Ex.51 | 3 |

B.4 (HL, thermodynamics): Vernier's *Heat Engines* lab needs a heat-engine apparatus the school doesn't list; leave to the notes and simulations unless one is bought.

### Theme C

| Lab | Topic | Type | Key equipment | Idea source | Pri |
|---|---|---|---|---|---|
| Single-slit diffraction: measuring a slit width (**HL**: single-slit is HL-only content in the guide, so the page and card need the HL tag) | C.3 | Vernier | Optics Expansion Kit, Diffraction Apparatus, track | Teacher's handout | 1 |
| Mass–spring oscillator: finding *k* from the period | C.1 | Common | Spring, masses, stopwatch, fiducial mark | Cambridge C P4 (ideas) | 1 |
| SHM graphs: displacement, velocity and acceleration | C.1 | Vernier | Motion Detector, spring, mass | Vernier 15/16 | 2 |
| Speed of sound from an echo in a tube | C.2 | Vernier | Microphone, tube (or drinking straws) | teacher's *Speed of Sound in Drinking Straw* | 1 |
| Snell's law, refractive index and critical angle | C.3 | Common | Ray box, semicircular block, protractor | teacher's *To Verify Snell*; Cambridge C P2 | 1 |
| Double-slit: the wavelength of a laser | C.3 | Common | Laser, double slits, screen, metre rule | Cambridge C P5 (ideas) | 1 |
| Ripple tank stations: reflection, refraction, diffraction, interference | C.3 | Common | Ripple tank | SIC Ex.04–07 (ideas) | 3 |
| Standing waves on a string: frequency, tension and wave speed | C.4 | Common | Signal generator, vibration generator, pulley, masses | *Frequency–length stretched string* (ideas) | 1 |
| Speed of sound from resonance in a tube | C.4 | Common (or Microphone) | Resonance tube, tuning forks | Cambridge C P1; Vernier *Standing Waves in a Column of Air* | 2 |
| Resonance and damping of a driven spring | C.4 | Vernier | Vibration generator, signal generator, spring, Motion Detector, card damper | Cambridge C P7 (ideas) | 2 |
| Doppler effect with a moving buzzer (HL) | C.5 | Vernier | Microphone, Motion Detector, buzzer on a cart | Vernier 05 | 3 |

### Theme D

| Lab | Topic | Type | Key equipment | Idea source | Pri |
|---|---|---|---|---|---|
| Force on a current-carrying wire (magnet on a balance) | D.3 | Common | Top-pan balance, magnets, wire, supply, ammeter | general | 1 |
| Magnetic field of a long straight wire | D.3 | Vernier | Magnetic Field Sensor, high-current supply | general; **New for 2028** ($B = \mu_0 I/2\pi r$) | 2 |
| Magnetic field inside a solenoid | D.2 | Vernier | Magnetic Field Sensor, Slinky or coil | Vernier (ideas); qualitative only, no equation on the booklet | 3 |
| Mapping equipotentials in a tray of water | D.2 | Vernier | Voltage Probe, shallow tray, electrodes, low-voltage supply | Vernier 08 (ideas, water instead of conductive paper) | 3 |
| A magnet falling through a coil (HL) | D.4 | Vernier | Voltage Probe, coil, magnet | Vernier 11 | 2 |
| Induced emf and the speed of a generator (HL) | D.4 | Vernier | Coil, magnets, Voltage Probe, Rotary Motion Sensor | Vernier 12 | 3 |

D.1 already has the Kepler database lab; a Cavendish experiment isn't possible without a torsion balance. The *Rectifier* handout is no longer on the syllabus, so it's left out.

### Theme E

| Lab | Topic | Type | Key equipment | Idea source | Pri |
|---|---|---|---|---|---|
| Line spectra: wavelengths of hydrogen and helium lines | E.1 | Common | Spectrum tubes, diffraction grating, metre rule | general | 1 |
| Planck's constant from LEDs (HL) | E.2 | Vernier | Voltage and Current Probes, 4–5 coloured LEDs | Vernier 22 | 2 |
| Dice decay: modelling half-life | E.3 | Common | 100 dice, tray | Cambridge E P1 (ideas) | 3 |
| Binding energy per nucleon from nuclear data | E.3 | Database | Atomic Mass Evaluation data (open) | new | 3 |
| An HR diagram from a star catalogue | E.5 | Database | Open star catalogue (e.g. Hipparcos/Gaia, checked for licence) | teacher's *Stellar database* idea | 2 |

E.3 radioactivity: no sealed sources, so the Pa-234m simulation stays the main half-life lab. Photoelectric effect (E.2 HL) and e/m (D.3): simulations if wanted later.

## 4a. Progress

- **Theme B priority 1 handouts drafted (14 November 2026), waiting for the teacher's review:** specific heat capacity (B.1), Boyle's law and absolute zero (B.3), I–V characteristics and EMF and internal resistance (B.5), as Word files in `physics-source/experimental-programme/adapted-for-review` ("… - DP Lab (draft).docx"), in the layout of the teacher's DP Lab handouts. Ideas from the Vernier lab books, the Cambridge practical sheets and older school sheets; all wording, questions and numbers new. Independent physics review done and fixed. Diagrams are described in boxes, to be drawn as SVG for the web pages. The builder (`build.js`, needs the `docx` npm package) and each handout's text are kept outside the repository in `reference-cache/handout-builder`.
- **A.1 free fall (picket fence and photogate) drafted (14 November 2026), waiting for the teacher's review:** `A.1 Free Fall - DP Lab (draft).docx` in the same folder, independently reviewed and fixed. To check against the school's Logger Pro: the menu path Experiment ▸ Set Up Timers… and how many velocity points Logger Pro gives per drop.
- Next: the teacher's comments, then the web pages. Then the next batch of priority 1 labs (Theme C).

## 5. Equipment (teacher's answers, 13 November 2026)

- **Has:** the main Vernier kit (LabQuest/Logger Pro 3, Motion Detector and Encoder, Dual-Range Force Sensor, Photogates, Dynamics Track and carts, Temperature Probe, Gas Pressure Sensor, Voltage and Current Probes, Optics Expansion Kit and Diffraction Apparatus), plus the Magnetic Field Sensor, Rotary Motion Sensor and Microphone; signal and vibration generators, a resonance tube or sonometer, ray boxes and blocks, a ripple tank, spectrum tubes and gratings, immersion heaters and metal blocks.
- **Doesn't have:** Vernier Radiation Monitor, sealed radioactive sources, Pa-234m generator, oscilloscope, Planck's constant kit, e/m tube and Helmholtz coils, Cavendish balance.
- **Confirmed 14 November 2026:** coloured LEDs (Planck's constant) and a power supply for the wire labs. Before writing those pages, check the LEDs' wavelengths (from their data sheets or a spectrometer) and the supply's maximum current: the magnetic field of a wire needs several amps to give a field the sensor can read well; the force on a wire works with 2–3 A.
- **Confirmed 14 November 2026 (Theme B handouts):** calorimetry blocks of aluminium, steel and brass with a 12 V immersion heater (the teacher has run this lab before), multimeters and voltmeters, 6 V filament lamps, 125 mL flasks for the Gas Pressure Sensor. The Boyle's law handout uses Vernier's figure for the dead volume (about 0.8 mL). Low-value power resistors for the EMF lab (3.3 Ω, at least 1 W) also confirmed.
- **Still to confirm before building those labs:** a small buzzer (Doppler), U-shaped magnets, a small electric motor, a CO₂ source.

## 6. Tools coverage check

With the priority 1 labs built, every Tool 1 quantity is measured at least once: mass (most labs), time (free fall, mass–spring), length (all), volume (Boyle's law), temperature (specific heat capacity, absolute zero), force (Newton's second law, friction), current and pd (I–V, internal resistance), angle (Snell's law), sound intensity (speed of sound echo), light intensity (single-slit). Tool 2: sensors (Vernier labs), databases (Kepler, seismic), simulations (four virtual labs), video analysis (priority 2: thrown ball), spreadsheets and graphs (all, plus the graphing tool).

## 7. Questions for the teacher

1. Is the order right (finish the three handouts, then the priority 1 labs theme by theme)?
2. Should each lab page get **teacher notes** on a hidden page (technician list, set-up tips, typical results), like the mystery teacher notes?
3. Filter buttons on the Practicals page once it grows: yes or no?
4. Include the "No sensors?" alternative line on Vernier labs?
