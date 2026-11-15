# Circuit builder: plan and decisions

Status: **plan approved by the teacher (15 November 2026). Stages 1–3 built (the engine, its tests and the Free Build editor); stage 3 is waiting for the teacher's check in the preview. The page is `noindex` and not linked from anywhere until stage 6.**

A circuit diagram editor with two modes, **Free Build** and **Challenge Mode**, that simulates DC circuits accurately: series and parallel networks, internal resistance, meters and variable resistors.

## 1. Decisions (teacher, 15 November 2026)

| Question | Decision |
|---|---|
| Where it lives | `experimental/circuit-builder.html` (file name agreed; permanent once published). Where it is linked from is decided later; the teacher leans towards the Theme B section of the Practicals page. |
| PhET | The B.5 page's PhET box stays; the builder sits alongside it. |
| Components in version 1 | Cell, battery, resistor, variable resistor, potentiometer, switch, lamp (ohmic, or non-ohmic filament), thermistor, LDR, ammeter, voltmeter. |
| Must handle | Series, parallel, mixed and multi-branch networks; ideal cells and batteries; internal resistance; open switches and open circuits; short-circuit detection; current, p.d. and power; ammeter and voltmeter behaviour. |
| Wires | Wires join only at terminals and junction dots. Crossing wires never connect. |
| Mistakes | Let students build anything and show what really happens; never block a circuit. |
| Devices | Designed for laptops and tablets. Phones get a working page with a "works best on a tablet or laptop" note. |
| Challenge types | (a) build to a target, (b) measure it (e.g. a hidden cell's internal resistance), (d) predict then build. About 10 in the first batch. |
| Challenge marking | By electrical behaviour and by connections (netlist), never by layout. |
| Challenge extras | Hints yes; no scores or timer. Each batch gets an independent review, then the teacher's check in the preview (as for Think deeper). |
| Meters | Digital, like a real multimeter: the student chooses a **range**, which sets the resolution (table in section 5). A reading above the range, or an infinite current, shows **OL**. No random noise in Free Build. |
| Ideal or real meters | Ideal by default; a setting gives a meter a resistance. |
| Display | Lamp brightness always shown; current arrows (conventional current), current on each wire and colouring by potential are tick-box options. |
| Show the working | Yes, step by step wherever series and parallel rules are enough. |
| Free Build extras | Component toolbox; drag and drop; grid workspace; rotation; terminals; wire drawing; selection and editing; deletion and reset; circuit validation; live simulation; undo/redo; saving in the browser; share links; board mode. SVG export later. Guided lab-report investigation later. |
| Architecture | The editor talks only to the physics engine and never calculates anything electrical itself. Reliable connections come before visual decoration. |
| Lamp, thermistor and LDR curves | Fitted models (section 5), shown to the teacher as graphs and **approved on 15 November 2026**. |
| Interface tests | Run through the real interface in the preview from stage 3. **Playwright** (a browser-automation tool, run only on GitHub) is added after stage 3, once the editor's design has settled. |
| Technology | Plain JavaScript, no libraries, no build step, nothing outside the site. |

## 2. Files

```
experimental/circuit-builder.html      the page (Free Build; Challenge Mode added in stage 5) done (noindex)
experimental/circuits/challenges.json  challenge data (permanent ids, e.g. CK-B5-01)       stage 5
css/circuits.css                       editor styles                                        done
js/circuits/components.js   component catalogue: terminals, settings, ranges, meter display   done
js/circuits/netlist.js      works out the connections from the drawing                        done
js/circuits/engine.js       the physics                                                       done
js/circuits/steps.js        "show the working" for series–parallel circuits                    done
js/circuits/model.js        drawing operations (add, move, rotate, connect, delete), undo       done
js/circuits/render.js       draws the drawing and the engine's results as SVG                  done
js/circuits/editor.js       toolbox, drag and drop, wires, selection, keyboard, touch          done
js/circuits/challenges.js   Challenge Mode                                                     stage 5
js/circuits/app.js          page start-up (example circuit); saving, share links, board mode   start-up done; rest stage 4
tools/circuits/test.mjs     automatic tests (run by tools/check.mjs)                           done
tools/circuits/ui-test.html tests through the real interface (not published)                   done (46 checks)
```

The physics files work in the browser and in Node (like `js/numeric.js`), so the checker tests the exact code students run. In the browser they hang off `window.Circuits` (`Circuits.components`, `.netlist`, `.engine`, `.steps`); load them in that order.

## 3. The drawing (data model)

Two separate descriptions of every circuit: the **drawing** (positions, rotations, wire routes) is used only by the screen; the **netlist** (which terminals are joined) is used only by the engine. The engine never sees a position.

```json
{
  "v": 1,
  "components": [
    { "id": "c1", "type": "cell", "label": "C1", "x": 4, "y": 2, "rot": 0, "params": { "emf": 6.0, "r": 0.5 } },
    { "id": "a1", "type": "ammeter", "x": 8, "y": 2, "rot": 0, "params": { "ideal": true, "range": "2A" } }
  ],
  "junctions": [ { "id": "j1", "x": 8, "y": 6 } ],
  "wires": [
    { "id": "w1", "from": { "c": "c1", "t": 1 }, "to": { "j": "j1" }, "via": [[8, 2]] },
    { "id": "w2", "from": { "c": "a1", "t": 0 }, "to": { "free": [12, 9] } }
  ]
}
```

- Positions are grid squares. Two-terminal components are 4 squares long, centred on a grid point, so rotating by 90° keeps every terminal on a grid point.
- A wire end is a **reference** (`{c, t}` a component terminal, `{j}` a junction, `{free: [x, y]}` a loose end), never a coordinate, so moving parts can't change what is joined.
- Ending a wire on another wire creates a junction and splits that wire.
- Terminal order (polarity): cell and battery `[−, +]`; meters `[+ (red), − (COM)]`, so a reading is positive when current enters the red terminal, or when the red terminal is at the higher potential; potentiometer `[end A, end B, slider]`.
- `"v": 1` is the format version, for saved circuits and share links.

## 4. Connectivity (`netlist.js`)

1. Collect the joining points: component terminals, junctions and loose wire ends, in a fixed order (components sorted by id, terminals in order, then junctions, then loose ends).
2. Join the two ends of every wire (union-find). Each group of joined points is a **net** (a node of the circuit).
3. Number the nets by their first point in that fixed order. The same connections therefore always give the same netlist, whatever the positions, rotations, wire routes, wire count or array order.

The netlist also keeps the wires themselves (between points), so the engine can give each wire's current, and lists loose ends, unconnected terminals and broken references.

## 5. The physics engine (`engine.js`)

**Each component becomes one or more simple elements:**

| Component | Element |
|---|---|
| Cell, battery | ideal (r = 0): a fixed p.d. ε; otherwise ε with r (current I = (ε − V)/r) |
| Resistor, variable resistor, ohmic lamp, thermistor, LDR, real meter | a resistance (a resistance of exactly 0 counts as zero-resistance) |
| Potentiometer | two resistances, pos × R (end A to slider) and (1 − pos) × R (slider to end B) |
| Closed switch | joined like a wire |
| Open switch, ideal voltmeter | no connection (an ideal voltmeter reads the p.d. between its terminals) |
| Ideal ammeter | zero resistance (its current is found in step 4) |
| Filament lamp | non-ohmic resistance (below) |

**Steps of a solution:**
1. **Group the zero-resistance parts.** Wires and closed switches join nets into wire groups. Ideal ammeters, 0 Ω parts and ideal cells then join wire groups into **clusters**, keeping track of the potential differences inside each cluster (a weighted union-find: an ideal cell fixes its + terminal ε above its − terminal).
2. **Checks before any arithmetic.** An ideal cell whose terminals are already joined at a different p.d. is a contradiction: shorted by a wire or ideal ammeter (infinite current), or in parallel with an ideal cell of different emf (infinite current between them). Its current is ±∞, every zero-resistance part carrying that current shows ±∞ (meters show OL), and the cell's terminal p.d. is what the rest of the circuit gives it (0 for a short, as for a real cell whose internal resistance tends to 0). Two ideal cells in parallel with the same emf share the current evenly (reported).
3. **Nodal analysis** on the clusters: one unknown potential per cluster, and "current in = current out" at each, solved by Gaussian elimination with partial pivoting. Each separate island of the circuit gets its own 0 V reference: the − terminal of its first cell, if it has one. An ideal voltmeter between two separate islands reads 0. The filament lamp makes the equations non-linear: Newton's method with a line search, starting from the lamp's cold resistance, with source stepping (raising the emf from zero in steps) as a backup. An answer that hasn't converged is never shown.
4. **Currents in zero-resistance parts.** Inside each cluster, ideal ammeters, 0 Ω parts and ideal cells carry whatever current "in = out" requires; then inside each wire group, wires and closed switches do the same. Where these form a loop of their own (so ideal parts alone can't decide the split), the current is shared as if every one had the same tiny resistance. Ammeters are a level above wires: an ammeter bypassed by a wire reads zero.
5. **Results:** for every component its p.d. V (terminal 0 minus terminal 1), current I (through it from terminal 0 to terminal 1) and power P = VI (positive = energy transferred to the component). Cells also give emf, terminal p.d., εI, I²r and output power; potentiometers give each section; meters give their reading and display; lamps give brightness (P ÷ rated power). Every net and wire gets its potential, and every wire its current.
6. **Self-checks:** energy (total power from the cells equals the total used, to 1 part in 10⁹ of the power flowing) and convergence; a failure is reported as an engine error.

**Diagnostics** (shown in plain words by the editor): no cell; open circuit (no current from a cell); voltmeter in series (only a voltmeter completes the loop); short circuit (ideal: error; with internal resistance: warning, giving I = ε/r); ideal cells in parallel (different emfs: error; same emf: note); a component short-circuited (bypassed) by a wire; an ammeter bypassed by a wire; a voltmeter across a wire; a voltmeter joining two separate circuits; a lamp above 1.5 × its rated power; loose wire ends; unconnected terminals; and engine failures.

**Models (to be shown to the teacher before the editor uses them):**
- **Filament lamp:** tungsten resistance R ∝ T^1.2, and the power radiated ∝ T⁴ − T₀⁴ (T₀ = 293 K), with T = 2500 K at the rated p.d. This gives a smooth I–V curve, a finite cold resistance (about 1/13 of the hot one) and exactly the rated power at the rated p.d. Steady state only (no warm-up).
- **Thermistor (NTC):** R = R₂₅ exp(B(1/T − 1/298.15 K)), with R₂₅ = 10 kΩ and B = 3950 K (a common type); 0–100 °C.
- **LDR:** R = 15 kΩ × (E / 10 lux)^−0.7 in parallel with a dark resistance of 1 MΩ: about 1 MΩ in the dark, 15 kΩ at 10 lux, 600 Ω at 1000 lux, 120 Ω at 10 000 lux.

**Meter ranges** (a typical multimeter, which shows at most 1999 counts; the 10 A range is limited to 10 A by its fuse):

| Ammeter range | Resolution | Voltmeter range | Resolution |
|---|---|---|---|
| 200 mA | 0.1 mA | 200 mV | 0.1 mV |
| 2 A | 0.001 A | 2 V | 0.001 V |
| 10 A | 0.01 A (OL above 10.00 A) | 20 V | 0.01 V |
| | | 200 V | 0.1 V |

**Show the working (`steps.js`):** for a circuit with one cell or battery, zero-resistance parts are merged, ideal voltmeters left out, and dangling or bypassed parts set aside (no current). Then series chains and parallel groups are combined until one resistance is left, and the current and p.d. are worked back down to every component. Circuits needing more than series and parallel rules (e.g. a bridge), or with several cells, get readings only. The tests check its values against the engine every time.

## 6. Editor (stage 3)

One direction only: student action → change to the drawing (an undoable command) → netlist → engine → render. SVG workspace on a grid with data-booklet symbols matching the B.5 page; pointer events (mouse, pen and touch) for dragging, since HTML drag-and-drop doesn't work on tablets; touch targets of at least 44 px; snap highlighting; zoom and pan; rotation (R key, button, double-tap); wire drawing from terminals with bends or automatic L-shaped routes; dragging wire ends and segments; an inspector panel for settings (sliders for variable parts, meter ranges and ideal/real); delete, clear (asks first), undo/redo; a status panel listing the engine's diagnostics; live re-solving (at most once per frame while a slider moves); display tick boxes; saving (every storage call wrapped, so private browsing still works), share links (circuit in the page address) and board mode; keyboard shortcuts and a text summary of the circuit for screen readers.

**As built (stage 3):**
- Drag on a terminal draws a wire; tap a terminal for tap-by-tap drawing (tap the grid for bends, the same point twice for a loose end, Esc cancels). Dragging from the middle of a wire branches from it (a junction is made). Drag on empty space pans; Shift-drag selects a box; Ctrl + wheel or two fingers zoom.
- **What you see is what you get** (teacher's requirement after finding drawings that looked joined but weren't, 15 November 2026). After every change, and in the preview while dragging, `model.settle` makes the drawing mean what a reader would see: things at the same grid point are joined; a wire end or junction on the middle of a wire makes a T (junction and dot); a component lying along a wire's route is put into it; **crossing wires are not joined** (IB convention). `model.touches` lists any join that is shown but not made, and the random-edit tests check it is always empty. Connections are still stored as explicit references, so the netlist never reads positions.
- **Wire routing keeps clear of components:** automatic corners and straight runs avoid other components' terminals and bodies (an L either way, a Z, or a small U-shaped detour), so a wire never touches a component by accident. Junctions and wire ends are not avoided, because a wire end put on a wire is meant to make a T. Bends a student places are kept. The circuit check still warns if a wire unavoidably runs across a component, or if two wires lie on top of each other.
- **Putting a component into a wire** (teacher's request, 15 November 2026): while a new component, or one with nothing attached, is held over a straight piece of wire at least 4 squares long, the wire lights up and the component turns to lie along it; letting go cuts the wire and puts the component in series (`model.findInsertion`, `ops.insertIntoWire`). Components already wired in are never inserted by moving them.
- **Taking a component out without deleting it** (teacher's request): *Take out (leave a gap)* leaves the wires with loose ends; *Take out and join the wires* (two-terminal components with wires at both ends) puts a wire in its place. Either way the component is moved aside to a clear spot (`ops.takeOut`).
- **Rotation both ways** (teacher's request): ⟳ / R clockwise, ⟲ / Shift+R anticlockwise; double-tap turns clockwise. A double-tap only counts when nothing else happened between the two taps.
- Current arrows and values are placed where they touch no component, label, meter display or other value (on the longest segment with room); the circuit check warns when a component lies on a wire it isn't connected to.
- Wires leave and reach terminals along the way the terminal faces, so they never double back over their own component.
- Every drawing loaded from outside (the example, and later saved circuits and share links) is completed and checked first (`model.normalise`).
- To preview from a worktree when the preview servers are all in use, the main folder's server also serves `/.claude/worktrees/<name>/…`.

## 7. Challenge Mode (stage 5)

Challenges live in `experimental/circuits/challenges.json` with permanent ids (`CK-B5-01`), fields as in the approved plan: `type` (target / measure / predict), `level`, `sections`, `title`, `brief`, `start` drawing with `locked` parts, a limited `toolbox`, `checks` (values from the engine within a tolerance; connection checks such as "a voltmeter across L1" or "an ammeter in series with R1" from the netlist), `hints`, a `model` answer and an `explanation`. "Measure it" hides a cell's emf and r; "predict then build" locks the switch until predictions are typed (marked by `js/numeric.js`). Progress is ticked per id in the browser. Every model answer must pass its checks and a deliberately wrong answer must fail (checked by `tools/check.mjs`).

## 8. Testing

`tools/circuits/test.mjs` (run by `node tools/check.mjs`, and on GitHub after every push; also `node tools/circuits/test.mjs` on its own):
- **Hand-calculated circuits** for every item on the teacher's list (series, parallel, mixed, multiple branches, ideal cells and batteries, internal resistance, open switches and circuits, short circuits, current and p.d., power, meter behaviour), plus potentiometers, variable resistors, thermistor, LDR and lamp models.
- **Layout independence:** each circuit redrawn many random ways (positions, rotations, wire routes, extra wires, junctions, array order) gives an identical netlist and identical readings; renaming every id gives the same readings; moving one wire end to a different terminal does change the netlist.
- **Physics checks on random circuits:** current in = current out at every net and point, energy balance, and agreement with an independent loop-current solver written separately from the engine.
- **Show the working:** agrees with the engine on random series–parallel networks; refuses bridges.
- **Meter display:** resolutions, signs and OL limits.
- **From stage 3:** editor commands and undo; tests through the real interface (`tools/circuits/ui-test.html`, in the preview); Playwright on GitHub after stage 3; visual checks at laptop and tablet widths, 375 px and dark mode.

## 9. Website integration (stage 6)

`<head>` copied from `experimental/virtual-resistivity.html`; title like `IB Physics circuit builder: … · Mr Silkstone's Physics`; `node tools/check.mjs --sitemap`; a Theme B card with the green Simulation tag (place to be decided); links from B.5's sections `symbols`, `combos`, `divider`, `emf` and `internal`; the B.5 equations in the Σ panel; `PROGRESS.md` and `CLAUDE.md` entries.

## 10. Stages

1. Save this plan. **Done.**
2. Engine and netlist with full Node tests. **Done** (report to the teacher).
3. Free Build editor with interface tests; teacher checks in the preview. **Built; waiting for the teacher's check.**
4. Show the working, share links, board mode, saving.
5. Challenge Mode and about 10 challenges; independent review; teacher's check. Playwright on GitHub.
6. Website links, then commit and push after the teacher has seen what's going up.

## 11. Risks and how they are handled

| Risk | Handling |
|---|---|
| Ideal parts make the equations unsolvable | Zero-resistance parts merged before solving; contradictions found first (section 5, step 2) |
| Accuracy with very different resistances | Partial pivoting; tested from 0.01 Ω to 10 MΩ |
| Lamp equations don't converge | Newton with line search, source stepping backup, never show an unconverged answer |
| Current split in loops of ideal parts is undecided | Shared as if by equal tiny resistances; reported |
| Touch problems on tablets | Pointer events only, workspace blocks page scrolling, large targets, snap highlighting |
| Wires left attached to deleted parts; undo breaking the drawing | References, loose ends allowed; drawing checked after every command in tests |
| Challenge marking wrong | Behaviour and netlist only; right and wrong answers tested for every challenge |
| Interface tests not on GitHub until Playwright | Run in the preview before each commit |
| Share links too long | Compact format; a "too large to share" message |
| Keyboard and screen-reader use | Shortcuts plus a text summary of the circuit |
| Hidden values visible in the page code | Acceptable for practice; noted in teacher notes |
| Browser storage unavailable | Every save wrapped in try/catch |
| Other sessions in the same folder | Almost all files new; shared files changed last, in small edits |
