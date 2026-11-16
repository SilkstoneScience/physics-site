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
- **Pacing** (teacher, 15 November 2026: "stay on the scene a little longer"): a scene can list `pauses: [[sceneTime, seconds], …]`
  where the picture holds still (just before a caption fades) so it can be read; powers of ten holds 3.4 s on each object.
- **Music** (teacher's request, 15 November 2026): gentle background music generated live by `js/anim/music.js` with the
  browser's Web Audio API (a soft pad, a low drone, bell-like sparkles or plucked arpeggios, echo and reverb), so there
  are no audio files to license. Each scene sets its own mood with `music: { chords, bar, cutoff, sparkle, arp }`.
  **On by default** (teacher, 16 November 2026), with a **different score for each animation** (the score options are
  listed at the top of music.js: pad sound, drone, bells, arpeggio, space wind, shimmer, clock tick, heartbeat pulse,
  tremolo). Browsers only allow sound after a click or tap, so until then a "♪ Tap the animation to hear the music" note
  shows, and the first tap on the picture starts the music without pausing. The ♪ Music button turns it off (remembered
  on that device); the music fades out on Pause, when the animation scrolls out of view or the tab is hidden.
  Each score's `volume` is set so that all scores have about the same loudness (RMS about 0.055 in `AnimMusic.test`).
- **Click or tap the picture to pause or play** (teacher, 16 November 2026).
  `AnimMusic.test(opts, seconds)` renders a piece offline and reports its peak and RMS level (checked: no clipping).
- The stage is 16:9, and 4:5 on phones (under 600 px), so scenes lay themselves out for both.
- File names in `animations/` are permanent once published (they may be linked from slides).

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

Theme B (batch 2, to be agreed): e.g. B.1 particles in solids, liquids and gases; B.3 molecules hitting a
wall make pressure; B.5 electron drift in a wire.

Theme C (batch 3): C.1 SHM and the reference circle; C.2 transverse and longitudinal waves; C.3 wavefronts
and rays (refraction, diffraction, two-source interference); C.4 standing waves on strings and in pipes;
C.5 Doppler wavefronts.

Theme D (batch 4)
- [x] D.3 Charges in a magnetic field: `charge-in-b-field.html` (built first, as the demo)
- D.1 Field lines and equipotentials; D.1 potential well (model of potential); D.2 electric field lines and
  equipotentials; D.3 velocity selector and mass spectrometer; D.4 magnet through a coil.

Theme E (batch 5): E.1 Rutherford scattering; E.1 energy levels and spectra; E.5 a star's path on the
HR diagram.

Think deeper: a big question on curved spacetime, with an animation.
