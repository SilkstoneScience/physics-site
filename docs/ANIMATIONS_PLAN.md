# Animations: plan and decisions

Started 15 November 2026, after the teacher liked a demo of charges moving in a magnetic field.

## What they are
Short, polished animations that play by themselves (no interaction apart from Play/Pause, Replay and
Full screen), for showing on the board or linking from lesson slides. A dark "screen" with glowing
lines, smooth camera moves and one caption at a time. Each one loops.

## Teacher's decisions (15 November 2026)
- **Where:** each animation has its own page in `animations/` (easy to link and to show full screen).
  The hub `animations/index.html` lists them all and is in the Resources menu. Topic pages get a small
  box (`aside.sim.anim`) linking to the animation at the section it belongs to.
- **Order:** all of them, theme by theme (A to E). The teacher checks each theme's batch in the preview
  before the next batch starts.
- **Powers of ten zoom:** openly licensed space photos (NASA public domain, ESA/Webb/Hubble CC BY) for the
  space end, credited under the animation and on `about.html`; our own drawings for the small end.
- **Curved spacetime:** not in the 2025 guide, so it appears twice: a D.1 "potential well" animation
  (clearly labelled as a model of gravitational *potential*, not of spacetime: a ToK point) and a Think
  deeper big question about curved spacetime.

## How they are built
- Plain JavaScript on a `<canvas>`; no libraries. Shared player: `js/anim/player.js` (canvas size,
  timeline, controls, captions, colours, vector and 3D-projection helpers, glow drawing). One scene file
  per animation in `js/anim/<name>.js`, registered with `Anim.register('<name>', { duration, poster, resize, frame })`.
- **Physics from equations, never by eye:** motion is calculated (for example the magnetic force rotates the
  velocity exactly; kinematics from the suvat equations), and every number in a caption is recalculated.
- Colours on the dark stage: velocity blue, force/acceleration orange (as in the notes' diagrams),
  positive charge pink-red, negative charge cyan, fields violet, light gold.
- Starts playing when it scrolls into view and stops when it leaves (saves battery). With "reduce motion"
  set on the device, it shows a still frame (`poster`) and waits for Play.
- Every page has a written description of the whole animation (for screen readers, and for students
  who prefer to read), and links back to the topic section.
- Testing: `?t=12` on the page's address freezes the animation at scene time 12 s, for checking single frames.
- **Pacing** (teacher, 15 November 2026: "stay on the scene a little longer"): each step stays on screen long enough to read
  (captions at most about 17 characters a second; "Predict:" captions about 6 s longer).
  **No pauses** (teacher, 17 November 2026: "extend the animation instead of creating a pause, so that it plays at the same
  speed, but there is no pause"): no scene uses the player's `pauses` (the player still supports them, but they freeze the
  picture). Reading time is scene time at the normal speed: things that move anyway carry on; a process with no natural speed
  (a graph drawing itself, a quasi-static change, a path being traced) may take longer; where a caption describes an exact
  moment, a faint marker or label stays pinned at that moment while the motion continues (or the event happens again).
  Every animation, Rutherford included (17 November 2026), keeps its motion on the real clock, so it always plays at the same speed.
- **Music** (teacher's request, 15 November 2026): gentle background music generated live by `js/anim/music.js` with the
  browser's Web Audio API (a soft pad, a low drone, wind and reverb), so there
  are no audio files to license. Each scene sets its own mood with `music: { chords, bar, pad, cutoff, drone, … }`.
  **On by default** (teacher, 16 November 2026), with a **different score for each animation** (the score options are
  listed at the top of music.js: pad sound, drone, bells, arpeggio, space wind, shimmer, clock tick, heartbeat pulse,
  tremolo). Browsers only allow sound after a click or tap, so until then a "♪ Tap the animation to hear the music" note
  shows, and the first tap on the picture starts the music without pausing. The ♪ Music button turns it off (remembered
  on that device); the music fades out on Pause, when the animation scrolls out of view or the tab is hidden.
  Each score's `volume` is set so that all scores have about the same loudness (RMS about 0.055 in `AnimMusic.test`).
  **Low and atmospheric only** (teacher, 16 November 2026: "too much pinging … I just want a low atmospheric type of music"):
  scores use only the pad, the low drone, space wind, a soft shimmer and slow swells (tremolo). No bells, plucked arpeggios,
  clock ticks or heartbeat pulses (music.js can still make them, but no score may use them), and pad cutoffs stay at
  900 Hz or below. Each score stays different through its key and chords, pad sound, drone, wind, shimmer and swell.
  **A little more upbeat, still lowkey** (teacher, 17 November 2026: "it's a little sleepy"): every score now has a soft
  groove under the pad (`groove`, default 1: a warm low bass line, a muted kick on the main beats and a very quiet
  brushed off-beat, nothing high or pitched like a bell), chords that change every 8 beats (80–92 beats a minute, about
  5–6 s, set from each score's `bar`) and quicker fades. The first chord of each piece has no groove, so it starts gently.
  `groove: 0` brings back the old sound. `tools/music-test.html` (not published) plays any score before and after, at the
  same loudness, with a slider for the groove level. Volumes were rebalanced to RMS about 0.055 again.
  **A score can follow the animation** (teacher, 17 November 2026, for superposition and music: "can the music change to
  represent what's being displayed? … the importance is pleasant audio"): the player tells the music the scene time every
  frame, and a score may have `sections` (from a scene time on, different chords, groove, cutoff or a soft sustained `tone`
  with chosen `harmonics` and an optional `beat` that can slide to 0) and `events` (a brief 'swell' or 'dip' at a moment).
  Changes land at the next chord, so they suggest the picture rather than match it exactly. First used in
  `superpose.js`: calm pulses, a swell where crest meets crest and a hush where crest meets trough, a soft A beating 3 times
  a second that slows to nothing as the string is tuned, then the A gaining the harmonics drawn on screen and, for timbre,
  the other instrument's mix. `AnimMusic.test(opts, seconds, from)` renders a score as if the animation started at `from`,
  and `trace` gives its loudness over time; `tools/music-test.html` has a "Start at" box for such scores.
- **Click or tap the picture to pause or play** (teacher, 16 November 2026).
- **Speed and seeking** (teacher, 16 November 2026; built the same day in the shared player, so every animation has them):
  a speed button (1× → 1.5× → 2×, not remembered between visits) where the `pauses` holds speed up with everything
  else and the music is unchanged (it runs on its own clock); the progress bar is a draggable scrubber (an
  `input.anim-scrub` over it; dragging pauses, letting go carries on if it was playing); ← / → anywhere on the page
  step 5 s back or forward while the animation is on screen (not while typing in a box). No chapter markers and no
  previous/next-caption buttons (teacher's decision). This works because every scene draws each frame from the
  scene time alone. On phones (under 600 px) the buttons sit in a row **below** the picture, so `s.top` is now 0
  everywhere (scenes no longer need to leave room for the buttons at the top).
  `AnimMusic.test(opts, seconds)` renders a piece offline and reports its peak and RMS level (checked: no clipping).
- The stage is 16:9, and 4:5 on phones (under 600 px), so scenes lay themselves out for both.
- File names in `animations/` are permanent once published (they may be linked from slides).

## Points raised with the teacher (16–17 November 2026)
- **C.1 animation (done, 17 November 2026):** the reference circle is no longer labelled HL, because the guide's SL linking
  question asks how circular motion can be used to visualize SHM. The HL tag appears from the second circle caption, where
  the HL maths ($x = x_0\cos\omega t$ and after) starts; the page, the hub card and the C.1 box say the same.
- **Already decided in the accuracy audit, so left as they are:** the E.1 caption's "about 100 000 times wider" for the gold atom
  (`docs/ACCURACY_AUDIT.md` D26: the usual order-of-magnitude pair, 10⁻¹⁵ m and 10⁻¹⁰ m; for gold alone it is about 20 000, and
  the Rutherford animation says "tens of thousands of times") and the untagged Chandrasekhar and Oppenheimer–Volkoff limits in
  the E.5 evolution lists (D33).

## The list
Theme A (batch 1)
- [x] Powers of ten zoom: `powers-of-ten.html` (Skills: orders of magnitude)
- [x] A.1 Motion graphs drawn live: `motion-graphs.html`
- [x] A.5 Space–time diagrams (HL): `spacetime.html`
- [x] A.2 What exactly is friction? `friction.html` (teacher's request, 16 November 2026)
- [x] A.2 Collisions, explosions and rockets: `momentum.html` (the rocket equation shown as "beyond the IB syllabus")
- [x] A.3 A bungee jump (conservation of energy): `energy.html`
- [x] A.4 Why the sin θ in torque? (HL): `torque.html` (teacher's request, 16 November 2026, after students found the N × b step of the ladder problem confusing): a spanner seen two ways (perpendicular component; perpendicular distance to the line of action, with the force sliding along that line), then the ladder against a frictionless wall (5.0 m, 350 N, 60°), ending at μ = 0.29.
- [x] A.4 The rolling race (HL): `rolling-race.html`. Another A.4 idea for later: a diver or skater changing their moment of inertia.

Theme B (agreed 16 November 2026)
- [x] B.1 Heating ice to steam (particles, heating curve to scale, internal energy): `heating-curve.html`
- [x] B.3 Where gas pressure comes from (2D simulation; pressure measured from the momentum at the walls): `gas-pressure.html`
- [x] B.5 Inside a wire (free electrons, drift, resistance, why the lamp lights at once): `inside-a-wire.html`
- [x] B.4 The first law and heat engines (HL): `heat-engine.html` (teacher's request, 16 November 2026: "an entropy and
  thermodynamics animation", built as two linked animations; the notes' sign convention Q = ΔU + W; the four processes drawn
  exactly with Q, ΔU and W to scale; a Carnot cycle between 500 K and 300 K, η = 0.40)
- [x] B.4 Entropy and the second law (HL): `entropy.html` (a gas spreading; microstates 1, 4, 6, 4, 1; S = k_B ln Ω; ΔS = Q/T for
  heat flowing hot to cold; the second law; a freezer as a local decrease)
- [x] B.2 The greenhouse effect: `greenhouse.html` (teacher's request, 16 November 2026; the notes' energy-balance model
  (1 − α)S/4 = eσT⁴: 255 K without greenhouse gases, 288 K with e = 0.61; resonance in a CO₂ molecule; no pauses)

Requested 16 November 2026 (the teacher also asked for ideas only on superposition and music, "What is…?", big conceptual,
"What would happen if…?" and "How does… work?" animations; nothing built from those yet):
- [x] A.2 A rocket launch: `rocket-launch.html` (simplified single stage, 50 t with 30 t of fuel; thrust from F = vΔm/Δt;
  free-body diagram to scale; drag model labelled beyond the syllabus; coasts to about 98 km; no pauses)
- [x] D.2 Millikan's oil-drop experiment: `millikan.html` (qE = mg with 294 V across 6.0 mm, q = 4e; simulated dot plot of 40 drops)
- [x] What is a chemical reaction? `chemical-reaction.html` (hub section "What is…?"; bonds as potential-energy wells, the
  bookkeeping for hydrogen burning, Δm/m ≈ 1.5 × 10⁻¹⁰; partly beyond the syllabus, labelled)

From the idea lists (teacher: "make the next ones", 16 November 2026; the four first picks; no pauses in any of them):
- [x] C.3 Superposition and music: `superposition.html` (pulses, beats 440/444 Hz, harmonics and timbre; "Hear it" buttons on the
  page from `js/anim/superpose-sounds.js`, separate from the background music)
- [x] E.2 Wave–particle duality (HL): `double-slit.html` (light, single photons, then 600 eV electrons one at a time; λ = h/p;
  fringes s = λD/d; one slit closed)
- [x] What if you jumped into a tunnel through the Earth? `tunnel-through-earth.html` (hub section "What would happen if…?";
  uniform Earth, SHM, T ≈ 84 min; a surface-skimming satellite in step; the shell result labelled beyond the syllabus)
- [x] How do the Northern Lights work? `northern-lights.html` (hub section "How does… work?"; dipole field, helix r = mv/qB,
  oxygen 557.7 and 630.0 nm, N₂⁺ 427.8 nm)

Ten more (teacher chose them from a plan of options, 17 November 2026: "Build these 10"; no pauses; each pair independently reviewed):
- [x] What is temperature? `temperature.html` (a seeded 2D gas; Eₖ = (3/2)k_B T, 6.21 × 10⁻²¹ J at 300 K; a thermometer reaching
  thermal equilibrium at 600 K; a spark (about 0.7 J) against a bath (1.26 × 10⁷ J); absolute zero). Linked from B.1 `#temperature`.
- [x] What is voltage? `voltage.html` (6.0 V cell, 8.0 Ω lamp and 4.0 Ω resistor, 0.50 A, 4.0 V and 2.0 V; J per C; a graph of
  potential round the circuit, labelled a graph; energy carried by the field labelled beyond the syllabus). Linked from B.5 `#pd`.
- [x] What is gravity, really? `what-is-gravity.html` (partner of the big question BQ-18; beyond the course after D.1: falling alike,
  free fall as no force, meridians meeting at the pole, slower clocks lower down (exaggerated), GPS 38.5 μs a day). Linked from D.1 `#weightless`.
- [x] What is a black hole? `black-hole.html` (escape speed (HL) as the Sun is squeezed: 618 km/s, then c at 2.95 km; the Earth
  would have a radius of 8.9 mm; formation; light bending exaggerated; M87 128 au). Linked from D.1 `#escape` (HL).
- [x] What if the Sun vanished? `sun-vanished.html` (29.8 km/s orbit; nothing changes for 500 s (1 au = 1.50 × 10¹¹ m), then the
  tangent; outer planets later, Neptune after about 4 h 11 min; speed of gravity and GW170817 labelled beyond the syllabus). Linked from A.2 `#circular`.
- [x] What if the Earth stopped spinning? `earth-stops.html` (465 m/s at the equator, 465 cos φ elsewhere; a crate slowed by friction,
  air left out and said so; a day lasts a year; ω²R = 0.034 m s⁻²). Linked from A.2 `#first`.
- [x] What if you jumped on other planets? `jump-planets.html` (3.0 m/s on the Moon, Mars, the Earth and Jupiter: 2.78, 1.21, 0.46
  and 0.18 m; (HL) the asteroid Bennu, escape speed 0.20 m/s). Linked from D.1 `#strength`.
- [x] How does GPS work? `gps.html` (20 200 km, 67 ms; three distance circles, why a fourth satellite; 1 μs = 300 m; (HL) time
  dilation −7.2 μs a day and, beyond the course, +45.7 from height). Linked from C.2 `#em`.
- [x] How does a microwave oven work? `microwave.html` (2.45 GHz, λ = 12.2 cm; standing waves, hot spots 6.1 cm apart; c from
  melted chocolate; not a resonance of water; the door mesh). Linked from C.4 `#nodes`.
- [x] How does a rainbow work? `rainbow.html` (rays traced with Snell's law; partial, not total, internal reflection; 42.4° red,
  40.6° violet; secondary bow 50.4°–53.5°, colours reversed; dispersion labelled beyond the syllabus). Linked from C.3 `#refraction`.
- Still on the idea lists (not built): What is light / a field / sound / colour; powers of ten for time; where your atoms came
  from; why everything falls at the same rate; entropy and the arrow of time; E = mc² and the Sun; what if a neutron star / light
  at 30 km/h; how does an optical fibre / motor or loudspeaker / fridge / phone accelerometer work.

Theme C (built 16 November 2026; waiting for the teacher's check)
- [x] C.1 Simple harmonic motion: `shm.html` (glider between two springs, m = 0.50 kg, k = 4.9 N m⁻¹, T = 2.0 s; live x–t, v–t, a–t
  graphs; energy bars without numbers at SL; the reference circle and the energy values labelled HL, as on `themes/c1.html`
  section 6. The guide's SL linking question "How can circular motion be used to visualize SHM?" means the teacher may prefer
  the circle without the HL label: ask.)
- [x] C.2 Transverse and longitudinal waves: `waves.html` (λ = 1.6 m, T = 2.0 s, v = 0.80 m s⁻¹ for both waves; the
  displacement–distance graph made from the particles' displacements turned through 90°; one period timed against one wavelength)
- [x] C.3 Wavefronts and rays: `wavefronts.html` (ripple tank; the water surface is computed from complex wave amplitudes on a
  grid, Huygens sums for the gaps; f = 8.0 Hz, 0.24 → 0.16 m s⁻¹, 50° → 31°; gaps 15 cm and 2.0 cm; sources 4λ apart, P at 2λ, Q at 1.5λ)
- [x] C.4 Standing waves: `standing-waves.html` (string 0.80 m, 192 m s⁻¹, 120/240/360 Hz; pipes 0.68 m with 340 m s⁻¹:
  open 250 and 500 Hz, closed 125, 375 and 625 Hz; the page's harmonic-names sentence is tagged New for 2028)
- [x] C.5 The Doppler effect: `doppler.html` (500 Hz, 340 m s⁻¹, source or observer at 85 m s⁻¹: 667, 400 and 625 Hz, the
  HL equations labelled; each wavefront centred where the source was when it was sent out; Hα 656.3 → 669.4 nm at 2% of c;
  the picture is frozen, and says so, while a wavelength is measured)

Theme D (batch 4)
- [x] D.3 Charges in a magnetic field: `charge-in-b-field.html` (built first, as the demo)
- [x] D.1 Gravitational field lines: `gravitational-fields.html` (the Earth's field to 3R, the near-uniform field at the surface,
  the Earth–Moon field traced from the exact combined field with the cancelling point at 0.90d; (HL) equipotentials at equal steps of V)
- [x] D.1 The gravitational potential well (HL): `potential-well.html` (V_g = −GM/r spun into a surface, labelled on screen and on
  the page as a graph of potential, a model, not a picture of space; a 500 kg satellite at 2R, a transfer to 4R and escape, with
  the orbit calculated from Newton's law and drawn at the depth V(r); the page says course calculations use circular orbits only)
- [x] D.2 Electric field lines and equipotentials: `electric-fields.html` (lines traced from the exact field; plates modelled as
  charged strips solved to be equipotentials, so the edge effects are real; (HL) equipotentials)
- [x] D.3 Charges in electric and crossed fields: `crossed-fields.html` (an electron between plates; a velocity selector with exact
  cycloid paths; neon-20 and neon-22 sorted by charge-to-mass ratio, "the idea of a mass spectrometer", as in the notes)
- [x] D.4 Induction (HL): `induction.html` (a two-pole model of the magnet gives the flux linkage, and ε = −N ΔΦ/Δt is its gradient;
  Lenz's law; a falling magnet; an ac generator)
  (Theme D built 16 November 2026; waiting for the teacher's check.)

Theme E (built 16 November 2026; waiting for the teacher's check)
- [x] E.1 Rutherford scattering: `rutherford.html` (no pauses: teacher, 16 November 2026, "shouldn't have any pauses", so it is
  re-timed to keep moving while each caption is read, and since 17 November 2026 every alpha particle moves on the real clock, at a constant speed; the apparatus and what was seen; exact Coulomb paths past one gold nucleus,
  tan(θ/2) = d/2b; (HL) 5.0 MeV head-on: d = 4.5 × 10⁻¹⁴ m, R = 7.0 × 10⁻¹⁵ m, about 33 MeV to reach the surface)
- [x] E.1 Energy levels and spectra: `energy-levels.html` (hydrogen levels to scale; Balmer lines from hc/ΔE, drawn at the
  measured wavelengths; absorption by gas with some atoms in n = 2; the Bohr formula only on the HL end-card row)
- [x] E.5 The HR diagram: `hr-diagram.html` (real stars at approximate real positions; radii from L = 4πR²σT⁴; approximate paths,
  labelled as such, of a Sun-like star and a 25 M☉ star; the Chandrasekhar and Oppenheimer–Volkoff limits tagged New for 2028)
- [x] E.5 The life of a star: `star-life.html` (teacher's request, 17 November 2026; the teacher chose the three stars: the
  Sun, 15 M☉ and 25 M☉, ending as a white dwarf, a neutron star and a black hole). Sizes to scale behind a live scale bar
  (zooming out as each star swells and in to its remnant) except the nebula, the enlarged onion-layer core and the black hole;
  model values rounded and recalculated in the scene's comment; starlight bent round the black hole with the point-lens
  formula (exaggerated, no numbers); the mass limits only on the page and the end card, tagged for 2028.
- [x] E.2 The photoelectric effect (HL): `photoelectric.html` (teacher: "work on topic E", 16 November 2026; sodium, Φ = 2.28 eV;
  red, violet and 300 nm ultraviolet; the stopping voltage; the Eₘₐₓ–f graph)
- [x] E.3 Random decay and half-life: `half-life.html` (1000 nuclei of a made-up nuclide, T½ = 10 s, seeded so the run repeats;
  a sample of 20; count rate and background; (HL) the decay law)
- [x] E.4 Fission and the chain reaction: `chain-reaction.html` (the notes' Ba-141 + Kr-92 + 3n split; a seeded chain; critical
  mass; a schematic reactor with moderator and control rods)

Think deeper: a big question on curved spacetime, with an animation.
