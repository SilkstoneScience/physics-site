# Experimental diagram maker: plan

Draft for the teacher's review (15 November 2026). Questions answered; the equipment list is waiting for the
teacher's check. Nothing is built yet.
This file is not published (`docs/` is excluded in `_config.yml`).

## 1. The idea in one paragraph
Students build a labelled diagram of their experimental set-up for the IA by dragging equipment from a bank onto a
blank page, joining it with string, wires, tubing, light rays and arrows, and adding labels (with an optional
precision line such as "±0.01 g"). They download the finished diagram as a high-quality PNG to paste into their
report. Nothing leaves the student's browser: work is auto-saved there, and a "Save progress" file lets them carry
it to another computer.

**Page:** `experimental/diagram-maker.html` (permanent file name). Linked from the IA page (the "labelled diagram"
advice in the method section) and from the Experimental menu, next to the graphing tool and IA builder if those are
on main by then.

## 2. Agreed with the teacher
- Clean, flat line drawings seen from the side, like a textbook schematic, all drawn by us as SVG. No AI images, nothing
  copied from textbooks or suppliers, no brand logos (generic look-alikes; Vernier-style items may come later).
- Works in dark mode on screen; the PNG is always exported on a white background with black lines.
- About 80 items in groups, with a search box; built so new items are easy to add in batches.
- The data booklet's 15 circuit symbols, and a wire tool that snaps to component ends.
- Connecting lines: string, wires, tubing, light rays, arrows (motion and forces).
- Labels with a leader line, an optional smaller specification line, and an option for numbered labels with a key
  under the diagram.
- Editing: move, rotate, resize, flip, copy, delete, undo/redo, snap to grid, bring to front / send to back.
- Always starts from a blank page (no starter diagrams).
- Output: PNG, "Save progress" file, "Open saved file", and auto-save in the browser.
- Laptop first, usable on tablets (touch dragging must work).

## 3. Equipment list (for the teacher to check)
82 pieces of apparatus plus 18 circuit symbols. Items marked **(stretch)** change length without distorting
(for example a metre rule keeps its tick marks the right size, and a stretched spring keeps its number of coils and
spreads them out, as a real spring does; the number of coils is an option).
Items marked **(options)** have a choice in the side panel. Items marked ● are in the **first batch** (17 items,
drawn 15 November 2026), chosen to test every kind of drawing: tall, long, round, glass with water, stretchy, and
circuit symbols. New batches are checked on `tools/diagram-items-preview.html` (not published): every item as a bank
picture, at full size with its variants, and in a sample set-up on screen and as the PNG will look.

### 3.1 Stands, clamps and bosses (8)
1. ● Retort stand (base and rod) **(stretch: rod height)**
2. ● Boss (clamp holder)
3. ● Clamp (jaws, with an arm)
4. G-clamp
5. Tripod
6. Gauze (on tripod)
7. Lab jack (scissor lift) **(stretch: height)**
8. ● Bench surface (hatched line, also usable as a floor, wall or ceiling) **(stretch)**

### 3.2 Measuring instruments (8)
9. ● Metre rule (with mm ticks) **(stretch)**
10. Vernier calipers
11. Micrometer screw gauge
12. Protractor
13. Digital stopwatch
14. ● Top-pan balance (digital display)
15. Newtonmeter (spring balance) **(options: 0–10 N or 0–100 N scale)**
16. Pointer / fiducial marker (a pin on a stand, for counting oscillations)

### 3.3 Mechanics (12)
17. ● Slotted-mass hanger with slotted masses **(options: number of slotted masses, 0–5)**
18. Hooked mass
19. ● Helical spring **(stretch: coils spread out; options: number of coils)**
20. ● Bench pulley (pulley on a bench clamp)
21. Trolley (dynamics cart)
22. Runway / track **(stretch)**
23. Wedge (to raise one end of a runway)
24. Wooden block (friction block, with a hook)
25. Ball (sphere) **(options: solid or ball bearing)**
26. ● Pendulum bob
27. Pivot (knife edge)
28. Interrupt card (flag, for light gates)

### 3.4 Thermal physics and gases (11)
29. Bunsen burner
30. Electric hot plate
31. Immersion heater (with leads)
32. Metal block with two holes (heater and thermometer)
33. ● Liquid-in-glass thermometer
34. Polystyrene cup with lid
35. Insulation / lagging (hatched wrap) **(stretch)**
36. Ice (cubes)
37. Gas syringe **(options: plunger position)**
38. Pressure gauge (dial)
39. Viscosity tube (tall tube of liquid with bands, for a falling ball) **(stretch)**

### 3.5 Glassware and containers (5) *(ninth group, agreed)*
40. ● Beaker **(options: empty or with water; water level)**
41. Conical flask **(options: empty or with water)**
42. Round-bottom flask with bung and tube
43. Measuring cylinder (with scale) **(options: water level)**
44. Boiling tube **(options: empty or with water)**

### 3.6 Waves and optics (16)
45. Ray box (with slit) (seen from above)
46. ● Laser (pen-type, on a stand)
47. Lamp (light source on a stand)
48. Convex lens (in a holder)
49. Concave lens (in a holder)
50. Plane mirror (in a holder)
51. Rectangular glass block (seen from above)
52. Semicircular glass block (seen from above)
53. Triangular prism (seen from above)
54. Slit slide **(options: single slit, double slit, diffraction grating)**
55. Screen (on a stand)
56. Signal generator
57. Loudspeaker
58. Vibration generator (mechanical oscillator, for a string)
59. Tuning fork
60. Resonance tube (tube in a cylinder of water) **(stretch)**

### 3.7 Electricity and magnetism: apparatus (6)
61. Power supply unit (box with terminals and dials)
62. Digital multimeter (with probes)
63. Coil / solenoid **(stretch: turns added)**
64. Bar magnet (N and S)
65. U-shaped (horseshoe) magnet
66. Plotting compass

### 3.8 Electricity: circuit symbols (18)
The 15 symbols in the data booklet (page 5; the 2028 booklet has the same set), drawn in the booklet's style:

67. ● Cell
68. Battery
69. ● Switch **(options: open or closed)**
70. Voltmeter
71. ● Ammeter
72. ● Resistor
73. Variable resistor
74. Light-dependent resistor (LDR)
75. Thermistor
76. Potentiometer
77. Lamp
78. Light-emitting diode (LED)
79. Heating element
80. Motor
81. Earth (ground)

Three common symbols that are **not** in the booklet (agreed), shown with a small "not in data booklet" note:

82. Diode
83. d.c. power supply
84. a.c. power supply

Junction dots are added automatically wherever three or more wires meet.

### 3.9 Nuclear physics (6)
85. Geiger–Müller tube (with lead)
86. Counter / scaler (digital display)
87. Sealed source in a holder
88. Tongs
89. Absorber sheet **(options: paper, aluminium, lead)**
90. Lead block (shielding)

### 3.10 Sensors and dataloggers (10)
Generic look-alikes, no brand names or logos.

91. Datalogger / interface box
92. Laptop
93. Smartphone (for video or a sensor app) **(options: on a tripod)**
94. Light gate
95. Motion sensor (ultrasonic)
96. Force sensor
97. Gas pressure sensor
98. Temperature probe
99. Light sensor
100. Sound sensor (microphone)

### 3.11 Later batches (not drawn yet)
Set square, tape measure, picket fence, paper cone, stirrer, funnel, crocodile clip, optical bench, concave mirror,
polarising filters, video camera, current and voltage probes, rotary motion sensor, magnetic field sensor, ripple
tank, current balance, protactinium generator, Vernier-style versions of the sensors, and a small "Basic shapes"
group (rectangle, circle, triangle) for anything the bank doesn't have.

## 4. Connecting lines
*Built 15 November 2026 (stage 4).* A row of line tools sits under the toolbar, with a one-line hint for the chosen
tool; while a tool is chosen every attachment point shows as a small orange circle. A double-click (or double-tap),
Enter or the "Finish line" button ends a line; a wire or tubing ends by itself on a terminal or nozzle, and an arrow
after two clicks. A point close to level with (or straight above) the last one is made exactly level (or upright).
Two-point wires keep a square corner when a component moves. Line widths stay in proportion to the equipment's at
every zoom (and in the PNG).

Drawn by choosing a line tool, then clicking (or tapping) the start, any bends, and the end. Each end snaps to the
nearest **attachment point** (a hook, a terminal, a tube nozzle) when it's close, and stays attached when the
equipment is moved. Every line can be edited afterwards (drag its points, add or remove a bend).

| Line | Looks like | Snaps to | Notes |
|---|---|---|---|
| String | thin black line | hooks, the pulley rim, the bob | can pass over a pulley |
| Wire | black line, medium | component ends, terminals | right-angle bends by default (circuit style); "curved lead" option for wires between real apparatus |
| Tubing | thick double line with rounded bends | nozzles (syringe, flask, gauge) | |
| Light ray | thin line with an arrowhead halfway along | the ray box, laser, lens, mirror | red on screen and in the PNG (agreed) |
| Motion arrow | thin arrow with an open head, optional label (e.g. *v*) | anything | for directions of motion |
| Force arrow | thick arrow with a filled head, optional label (e.g. *W*) | the centre or edge of an object | for forces |

## 5. Labels
*Built 15 November 2026 (stage 5).* A label starts with the name of the equipment it points at (without the
bracketed part, e.g. "Laser"), and the settings open with the words selected, ready to type over. Its words stay
upright when a group is turned. Only the words select a label, so clicks on its leader line reach the equipment
underneath. Deleting the equipment keeps the label, with its leader ending where it was.

- **Label tool:** click an object to start a leader line there, then click where the text goes. Type the label (for
  example "Top-pan balance"); an optional second line underneath, in smaller grey text, gives the specification
  (for example "±0.01 g"). Drag either end afterwards; the leader end stays attached to its object.
- **Numbered labels** (a switch for the whole diagram): each label becomes a number in a small circle at the end of
  its leader line, and a **key** appears under the diagram ("1 Top-pan balance (±0.01 g)"). The numbers follow the
  order in which labels were added and can be re-ordered in the key.
- Labels use the site's sans-serif font; the PNG uses the same font.

## 6. Layout of the page
**Laptop (960 px and wider)**
- Top toolbar: Undo, Redo, Copy, Delete, Rotate, Flip, Bring to front, Send to back, Grid on/off, Snap on/off, Zoom.
- Left panel: the **equipment bank**: a search box (it also matches other names, e.g. "clamp stand" finds the retort
  stand), then the groups as collapsible lists of small pictures with names. Drag an item onto the page, or click it
  to drop it in the middle.
- Line and label tools: a row of buttons above the bank (String, Wire, Tubing, Light ray, Motion arrow, Force arrow, Label).
- Centre: the page (white in light mode, the dark surface colour in dark mode), with a faint grid.
- Right panel: settings for the selected object (size, angle, flip, its options, label text, spec line).
- Bottom bar: **Download PNG**, **Save progress**, **Open saved file**, **New diagram** (asks before clearing).
- A short "How to use" box above the tool, and a note that everything is saved only in this browser.

**Tablet (768–960 px):** the bank and the settings panel fold into buttons that open them as drawers, so the page
gets the full width. Drag with a finger; two fingers pinch to zoom and pan.

**Phone (375 px):** the page fits the width and every button still works, but drawing a whole set-up on a phone is
fiddly, so a note suggests a laptop or tablet.

**Editing details:** selected objects show a box with corner handles (resize, keeping proportions; stretch items get
edge handles too), a round handle above it (rotate; snaps to 15°, hold Shift for any angle), and a small toolbar.
Arrow keys nudge (Shift for bigger steps); Delete; Ctrl+Z / Ctrl+Y; Ctrl+C / Ctrl+V; Ctrl+D duplicates.
Click on empty page and drag to select several objects; Shift-click adds to a selection. Snap to grid is on by default
(grid of 10 units).

## 7. How it's built (in simple terms)
Plain HTML, CSS and JavaScript like the rest of the site: **no new libraries** and no build step.

| File | What it holds |
|---|---|
| `experimental/diagram-maker.html` | the page |
| `js/diagram-maker.js` | the editor: dragging, selecting, lines, labels, undo, saving, PNG export |
| `js/diagram-items.js` | the **equipment bank**: one entry per item (see below) |
| `css/diagram-maker.css` | the editor's own styles |

**One entry per item.** Each piece of equipment is one short block in `js/diagram-items.js`, so a new batch means
adding blocks to that file and nothing else:

```js
{
  id: 'retort-stand',            // permanent: saved diagrams refer to it, so never rename it
  name: 'Retort stand',
  group: 'stands',
  keywords: ['clamp stand', 'stand', 'rod'],
  w: 120, h: 320,                // natural size on the page
  stretch: 'h',                  // can be made taller without squashing the base
  anchors: { top: [60, 0] },     // attachment points for strings, wires and tubes
  draw: (w, h, opt) => `<rect class="o f" .../> <line class="o" .../>`
}
```

- **Drawing classes** keep the style consistent and make dark mode and the white PNG automatic: `o` outline
  (2-unit black line), `f` solid fill (page colour), `k` solid black, `g` glass (faint tint), `w` water (pale blue),
  `t` text. Line widths stay the same when an item is resized.
- Items are drawn roughly to a **common scale** (1 unit ≈ 2 mm), so a beaker looks right next to a retort stand.
  Very small things (micrometer, light gate) are drawn a little larger so they stay readable.
- **Circuit symbols** have a standard length and two terminals at their ends, so wires snap to them.
- **PNG export:** the drawing is copied without the grid and the selection handles, recoloured black on white,
  cropped to the drawing (plus the key, if numbered labels are on) with a small margin, and drawn at 3× size
  (about 3000 px wide for a typical diagram: sharp in a printed report).
- **Checks:** `tools/check.mjs` gets a small check for `js/diagram-items.js` (unique ids, every item in a known group,
  a name and a picture, attachment points inside the item, no `id` or `<defs>` in the drawings).

## 8. Save-file format
"Save progress" downloads `my-diagram.json` (a plain text file). "Open saved file" reads it back. The same data is
auto-saved in the browser (`localStorage`, key `diagram-maker-v1`) after every change, and restored when the page
opens again. Format:

```json
{
  "format": "ib-physics-diagram",
  "version": 1,
  "saved": "2026-11-15T10:30:00Z",
  "page": { "w": 1200, "h": 800, "grid": 10, "snap": true, "numbered": false },
  "objects": [
    { "id": "o1", "type": "item", "item": "retort-stand",
      "x": 200, "y": 150, "w": 120, "h": 320, "rot": 0, "flip": false, "opt": {} },
    { "id": "o2", "type": "item", "item": "beaker",
      "x": 420, "y": 330, "w": 110, "h": 140, "rot": 0, "flip": false, "opt": { "water": 0.6 } },
    { "id": "o3", "type": "line", "kind": "string",
      "points": [[260, 160], [260, 300]],
      "att": [{ "obj": "o1", "anchor": "top" }, null] },
    { "id": "o5", "type": "line", "kind": "force", "text": "W",
      "points": [[450, 400], [450, 470]], "att": [null, null] },
    { "id": "o4", "type": "label", "text": "Beaker of water", "spec": "250 ml",
      "x": 600, "y": 300, "to": { "obj": "o2", "u": 0.5, "v": 0.8 }, "tp": null, "n": 1 }
  ]
}
```

- `objects` are listed back to front (the last one is drawn on top), which is how "bring to front" and "send to
  back" work.
- A line's `kind` is `string`, `wire`, `tube`, `ray`, `motion` or `force`. `att` has one entry per point: the
  attachment point it is fixed to (the item's id and the anchor's name), or `null`. Attached points move with
  their item. Optional: `curved` (a smooth curve, for string, wire and tubing) and `text` (an arrow's label).
- A label's `x`, `y` is where its leader meets the words (or the centre of its number). `to` fixes the leader's other
  end to a piece of equipment (`u`, `v`: fractions across and down it, so it follows when the item moves, turns or is
  resized) or to a line (`i`: which piece, `t`: how far along it); without `to`, the end is the free point `tp`.
  `n` sets the order in the key; `leader: false` hides the leader. `page.numbered` switches numbered labels on.
- `item` is the permanent item id from the equipment bank. If a file names an item the bank doesn't have (for
  example a newer file opened on an older page), it shows as a grey box with the id, rather than failing.
- `version` lets later versions of the page read older files.
- Opening a file checks the format first and never runs anything from it.

## 9. Stages (each shown in the preview, at 375 px and in dark mode)
1. **Plan** (this file): teacher checks the equipment list and answers the questions below.
2. **First batch of 15 items** (marked ● above) on a test page, at full size, as bank thumbnails, and in dark mode.
   Teacher checks the style before the rest are drawn.
3. **Editor basics:** bank with search, drag and drop (mouse and touch), select, move, resize, rotate, flip, delete,
   copy, undo/redo, grid and snap, front/back.
4. **Lines:** string, wire (snapping to terminals, right-angle bends, junction dots), tubing, light rays, arrows.
5. **Labels:** leader lines, spec line, numbered labels and key.
6. **Saving:** PNG export, Save progress, Open saved file, auto-save.
7. **The rest of the equipment**, in batches by group, each shown in the preview.
8. **Finishing:** remove the temporary `noindex` line from the page's head (it keeps the unfinished page out of the
   sitemap and site search while it's being built), "How to use" text, links from the IA page and the Experimental menu, the checker,
   `node tools/check.mjs --sitemap`, PROGRESS.md, CLAUDE.md, then merge and push after the teacher's yes.

## 10. Teacher's answers (15 November 2026)
1. **Glassware group:** yes, a ninth group "Glassware and containers" (section 3.5).
2. **Colour:** black and white, except water (pale blue) and light rays (red). No colour choice for students.
3. **Optics from above:** the ray box, rectangular and semicircular glass blocks and the prism are drawn from above,
   with "(seen from above)" in their names; lenses, mirror, screen, laser and lamp on stands stay side views.
4. **Symbols not in the booklet:** yes: diode, d.c. supply and a.c. supply, each with a "not in data booklet" note.
5. **Tablets:** a mix (iPads, Android and Windows touch screens), so touch is built with pointer events, which all
   three support, and tested with touch emulation in the preview.

Still open (my suggestion, unless the teacher says otherwise): "Diagram maker" in the menu, and the page title
"IB Physics diagram maker: draw your experimental set-up · Mr Silkstone's Physics".
