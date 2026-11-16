# Universe Engine: plan, decisions and state

Started 16 November 2026 on the branch `worktree-universe-engine`. Phase 1 only: one polished system (the showcase seed plus "New system"). Not linked from the site yet; the page is `noindex`.

## What it is

`universe/index.html`: a procedurally generated star system that students fly through, for D.1 gravitational fields, A.2 circular motion and A.3 energy. Every number shown is calculated live in SI units from the data booklet's constants.

## Files

| File | What it holds |
|---|---|
| `universe/index.html`, `universe/css/universe.css` | The page and its overlay panels |
| `universe/js/physics.js` | Constants, Kepler's equation, orbits ↔ position and velocity, full-gravity integrators, test mass, star model. No Three.js: Node tests it |
| `universe/js/generator.js` | Seeded generator (version 1), plausibility rules, `validate`, `hashSystem`. No Three.js |
| `universe/js/sim.js` | The simulation state: Orbits and Full gravity modes, pushes, mass changes, collisions, test mass. No Three.js |
| `universe/js/shaders.js`, `scene.js`, `viz.js`, `camera.js` | Everything drawn (Three.js 0.187.0, WebGL2) |
| `universe/js/ui.js`, `main.js` | Panels, equations, start-up, frame loop, test hooks (`window.UE`) |
| `tools/universe/test.mjs` | Node tests (`--stability` for the slow one, `--find` to look for seeds) |
| `tools/universe/browser-test.js` | Browser tests, run from the console (see the top of the file) |
| `tools/universe/dev-server.mjs` | Preview server that can also save test pictures outside the site |

Size of the page's own files: about 243 KB uncompressed (limit agreed: 400 KB). Three.js and MathJax come from jsDelivr, pinned (`three@0.187.0`, `mathjax@4.1.3`).

## Teacher's decisions (16 November 2026)

1. **Moons in Full gravity** keep exact ellipses around their moving planet; the star and planets all pull on each other.
2. **Test mass**: straight up only, from a non-rotating, airless body, counting only that body's gravity.
3. **HL tags** follow the site's D.1 page: orbital speed has no tag; potential energy, potential, equipotentials, the potential well, total energy and escape speed are tagged HL.
4. **Names** are invented from the seed (same seed, same names), with a block list.
5. Desktop and laptop only: touch-only devices and windows under 900 px get a message and a link back, and Three.js is never loaded there.

## How the physics is done

- **Orbits mode** (default): each planet follows its exact two-body ellipse around a fixed star (Kepler's equation by Newton–Raphson), with μ = GM, the star's mass only, as in the IB course. Moons do the same around their planet.
- **Full gravity**: star and planets as point masses, Yoshida 4th-order symplectic steps, fixed step = shortest "periapsis period" ÷ 300, at most 400 steps per frame (the clock slows rather than the step growing). No softening: bodies that touch merge (momentum conserved), including bodies that pass through each other within one step. The live "energy drift" is (E − E₀)/|E₀|, reset whenever the student changes something or bodies merge.
- **Changing things** (a mass, a push) switches to Full gravity from the present state and re-centres on the centre of mass. A planet's mass is capped at 1 % of the star's, because the panel's equations treat the star as fixed. Moons carry on from where they are on a new ellipse.
- **Test mass**: velocity Verlet in one dimension with a step of 0.001 √(r³/GM).
- **Generator**: `sfc32` seeded from a hash of the seed text; every generated number is rounded to 7 significant figures so that browsers that differ in the last binary digit of `pow` or `sin` still agree.

## Every approximation, in plain language

1. In Orbits mode the planets do not pull on each other, and each planet's own mass is left out of its period (T² = 4π²r³/GM).
2. In Full gravity the moons still follow fixed ellipses around their planet, and the star does not pull on moons directly.
3. Bodies are point masses for gravity; a collision is a perfectly inelastic merge. The merged body keeps the larger one's radius.
4. Asteroids and belt dust are decoration: fixed ellipses around the star, pulled by nothing else and pulling on nothing.
5. Stars: L ∝ M⁴; R ∝ M^0.8 below one solar mass and M^0.57 above; temperature from L = σAT⁴; colour from a black body at that temperature. Changing the star's mass in the Change tab changes only its mass.
6. Planet radii come from mass with one rule per type (rock: R ∝ M^0.27; ice worlds: a density of 1500–2600 kg m⁻³; giants: fitted to Solar System values). Moons are spaced inside 0.33 of the Hill radius and outside 1.2 of the fluid Roche limit; rings lie inside 0.95 of the Roche limit for ice; neighbouring planets are at least 9 mutual Hill radii apart.
7. Solar and Earth reference values (not in the booklet) are standard values to 3 significant figures. 1 AU = 1.50 × 10¹¹ m, the booklet's value.
8. **Sizes**: a far-away body is drawn at a minimum apparent size, so it is enlarged by a factor that the label at the bottom left always states; close up it is at true size. Asteroids are drawn 2500 times too large. "True scale" removes all of this. Distances are always to scale, and the physics never uses the drawn sizes.
9. **Brightness**: all planets are lit at the same exposure, so outer planets look brighter than they would. Shadows have a soft edge of fixed width, not one worked out from the star's size. Atmosphere haloes are drawn thicker than real ones.
10. The field map, equipotentials and potential well are drawn in the plane through the star; planets tilted slightly out of that plane are treated as if in it. The well shows only the star's potential.
11. Time is slowed automatically while the camera is close to a moon, so that the moon does not jump round its orbit between frames. The time bar says "slowed here".
12. Velocity and force arrows: length is proportional to size on the screen, with a 7-pixel minimum, and arrows of planets crowded against the star are hidden until the student zooms in.

## Tests and gates (state on 16 November 2026)

- `node tools/universe/test.mjs`: 265 tests pass (determinism for seeds 1–200 and a snapshot; Kepler period to 1e-9; Earth–Sun; 1000 orbits in full gravity; escape at 0.99 and 1.01 of escape speed; mode switching, pushes, mass changes and the test mass in the page's own stepper).
- `--stability`: 99 of 100 generated systems kept every planet's semi-major axis within 10 % for 10,000 simulated years (leapfrog, 60 steps per shortest orbit; 269 s to run). The one failure was a small planet's orbit shifting 12 % in 42 years.
- Browser tests: 56 pass at 1280×720 on Normal; 58 on Low with reduced motion and a seed from the link; the narrow-window message was checked at 800×700.
- `node tools/check.mjs`: no errors. One new warning: the 2028 register is out of date (see "Integration").
- Independent physics review: no errors in the untouched system. Confirmed problems after a student's change (moons jumping when a planet's mass changed; a planet allowed to reach 20 % of the star's mass, where the panel's fixed-star equations were up to 20 % out; wording on escape paths; a launch-tab total of 0 J before launch; planets passing through each other; a graph note that read like a verification) were all fixed, and tests added. Left as they are: an "ice world" can be generated a little inside the frost line; an icy moon can have a rocky density; a merged body keeps its old radius.
- Performance: see the report given to the teacher. Only the processor time per frame could be measured reliably (the preview pane was in the background, where the browser does not pace frames); nothing was measured on integrated graphics.

## Known limitations

- Not tested on Intel UHD or Iris Xe graphics, on a Mac, or in Firefox or Safari. Only Chromium on a desktop NVIDIA card.
- The automatic choice of quality uses the graphics chip's name plus one timed frame; it has only been exercised on one machine.
- Moons cannot be pushed or have their mass changed. A planet that escapes is flagged but stays in the system.
- Labels that would overlap are dropped rather than moved, so in a wide view some planets have no name until the student zooms in or opens the Bodies list.
- MathJax is loaded with the page (about 1 MB from the CDN) although equations appear only when asked for.

## Integration (not done; each needs the teacher's yes)

- A home-page card and/or a menu entry (`js/site.js`, `index.html`), and a link from D.1 and the Practicals or Review games page.
- Remove `noindex`, then `node tools/check.mjs --sitemap`.
- `PROGRESS.md`, and a short section in `CLAUDE.md` describing these files.
- `docs/2028_REGISTER.md`: the page has one "New for 2028" tag (deducing Kepler's third law, in `universe/js/ui.js`), so run `node tools/list-2028.mjs --write`.
- About page: nothing to credit (no images; Three.js is MIT-licensed and loaded from the CDN), unless the teacher wants it mentioned.
- GitHub: decide whether `tools/universe/test.mjs` should run in `.github/workflows/check.yml`.

## Phase 2 (only after the teacher approves Phase 1)

More systems and travel between stars; a "real Solar System" preset from public-domain NASA data.
