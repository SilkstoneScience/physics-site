# Graph maker: plan

Started 15 November 2026. Page: `experimental/graph-maker.html` (permanent file name).

Students type, paste or upload their own IA data, process it, and make a graph good enough to paste into
their IA report. **Everything stays in the student's browser**: no server, no accounts, no tracking.

This file records the features, the layout and the save-file format, so that the IA builder (being built
in another session) can import a graph-maker file later.

---

## 1. What the teacher agreed

| Feature | Agreed behaviour |
|---|---|
| Data entry | Type into a table, paste from Excel or Google Sheets, or upload a CSV. Column headings in IB style: "length L / m". |
| Uncertainties | One value per column, absolute ("0.001") or percentage ("2%"), which can be overridden row by row. |
| Repeated trials | A column can hold several trials. The mean and its uncertainty (half the range) are calculated **only when the student presses the button**, never automatically. |
| Transformations | The student types a formula using the column symbols (`1/T^2`, `ln(V)`) to make a new column, and types its heading and unit themselves (a warning only if they're missing). Nothing is linearised automatically. |
| Error propagation | The student types the uncertainty formula for the new column, the same way. Optional "Check with the max–min method" button, and a worked example for one row that the student can adapt for the report. Error bars are never recalculated unless the student has said how. |
| Fits | Linear, quadratic, power ($y = ax^n$), exponential. No sine, and no proportional (through-the-origin) fit (teacher's decision, 15 November 2026: the IA page says not to force a line through the origin). Equation, gradient and intercept with sensible significant figures. |
| Gradient and intercept uncertainty | The student drags the steepest and shallowest lines on the graph by eye (straight-line fits only); the tool reads their gradients and intercepts. Optional gentle feedback when a drawn line misses error bars. |
| Anomalous points | Tap a point to leave it out of the fit; it stays on the graph as a hollow point. |
| Data sets | 1 by default, up to 5 on one graph. Each set differs in colour **and** marker **and** line style, so the graph still works printed in greyscale. |
| Labels | Editable title and axis labels with units; gridlines on or off. |
| Output | PNG about 2400 px wide; the data table as a Word .docx (using the no-library writer in `js/labs/report.js`, without breaking the lab pages); a "Save progress" file and an "Open saved file" button; automatic saving in the browser. |
| Devices | Laptop first, still usable on tablets and phones. |

Rules from the site that the tool follows:

- **Skills page and IA page conventions.** Single readings: ± half a division (analogue), ± the smallest division (digital). Repeated readings: half the range, but never less than the reading uncertainty (IA page, section 8: the tool uses the larger of the two and says so). Uncertainties to 1 s.f. by default, 2 s.f. as a per-column choice (Skills page, section 6); the value is rounded to the same decimal place as its uncertainty. Gradient uncertainty $\Delta m = \dfrac{m_{\max} - m_{\min}}{2}$, quoted with the best-fit gradient (Skills page, section 12).
- **No statistics** (IA page, section 9): no R², no Pearson's r, no standard deviation anywhere in the tool.
- **Outliers** (IA page, section 8): leaving out more than one point in a set shows a gentle reminder ("Never reject more than one point; give a cause you can identify").
- **Every point gets error bars** (Skills page): no shortcuts that draw bars on some points only.
- The tool never chooses the physics: it doesn't suggest what to plot or which fit to use.

---

## 2. How it works, step by step (the student's view)

The page is one long tool in four numbered parts. On a laptop (1100 px and wider) the graph sits on the
right and stays in view while the student works on the table on the left. On tablets and phones the parts
are stacked.

### Part 1: Your data
- A table with one row per reading. Start: two empty columns, five empty rows.
- **Column heading**, one text box in IB style: `length L / m`. The tool reads it as quantity "length",
  symbol *L* (the last word before " / ") and unit "m". `^2` and `^-1` are shown as ² and ⁻¹. If the
  heading has no " / unit" part, a gentle note says how to write it ("no unit" is a tick box, e.g. for a
  count or a logarithm).
- **Symbol for formulas**: filled in from the heading (*L*); the student can change it (needed when the
  heading's symbol isn't a plain name, e.g. `T2` for $T^2$). Letters, digits, `_` and Greek letters.
- **Column uncertainty**: under each heading, "± 0.001" or "± 2%". Any cell can override it (a small
  "±" button on the cell opens its own uncertainty).
- **Repeated trials**: a column can be turned into a trials column with 2–10 sub-columns
  ("Trial 1 … Trial 5"). Then the button **"Calculate the mean and uncertainty"** adds (or updates) a
  "mean" column: mean value, uncertainty = larger of half the range and the reading uncertainty. If the
  trial readings change afterwards, the mean column is marked **out of date** (amber) until the button is
  pressed again. Nothing recalculates by itself.
- **Paste**: pasting into any cell fills the table from that cell (tab-separated text from Excel or
  Sheets). If the first pasted line looks like headings (not numbers), it fills the headings.
- **Upload a CSV**: headings in the first row. Commas or semicolons; decimal commas are converted.
- **Add a row, add a column, delete** buttons; **Undo** for the last delete.
- Gentle checks (never blocking): values in a column with different numbers of decimal places, or more
  decimal places than the uncertainty supports (IA page, section 8).

### Part 2: Process your data (optional)
- **New calculated column**: the student types
  1. the heading, e.g. `period squared T^2 / s^2` (warning if the unit is missing),
  2. the symbol for formulas, e.g. `T2`,
  3. the **formula**, e.g. `(t/10)^2`, using column symbols,
  4. the **uncertainty formula**, e.g. `2*(Δt/t)*T2`. `Δt` means the uncertainty in *t* (typed with a Δ
     button, or as `dt`). The new column's own value can be used by its symbol. A plain value
     ("0.02" or "3%") also works. Left empty: no error bars on that column, and a note says so.
- Formulas understand: `+ − * / ^`, brackets, numbers like `9.8` or `3e-4`, `pi`, `sqrt`, `ln`, `log`
  (base 10), `exp`, `abs`, `sin`, `cos`, `tan` and their inverses, in **degrees** unless the formula's
  "radians" box is ticked (section 7).
  Implicit multiplication is allowed (`4pi^2L`). The formula is never run as code: the tool has its own
  small reader for it, so nothing typed can harm the page.
- **"Check with the max–min method"**: for every row, the tool works out the formula with every
  combination of the inputs at their largest and smallest values, and takes half the difference (the
  Skills page's method for any function). It shows both answers side by side and, where they differ by
  more than about a third, a gentle note: "Your formula gives 0.031, the max–min method 0.012: check the
  formula." Small differences are normal and are explained.
- **Worked example for one row** (the student picks the row): the formula with that row's numbers
  substituted, the result, the uncertainty formula with the numbers substituted, its result, and the final
  rounded value, e.g. $T^2 = (1.62 \pm 0.03)\ \text{s}^2$. Shown with proper maths, plus a "Copy" button
  that gives plain text for Word. The IA page asks for exactly one example of each processing step.

### Part 3: Your graph
- **Axes**: choose the x and y columns (any raw, mean or calculated column). Error bars come from that
  column's uncertainties. Axis labels start as the column headings and can be edited.
- **Title** (editable), **gridlines** on/off, **start the axes at zero** on/off.
- **Data sets**: "Add a data set" (up to 5). Every set has the same columns but its own rows and its own
  name ("mass 100 g"). A set selector above the table chooses which set is being edited. Styles:

  | Set | Colour | Marker | Fit line |
  |---|---|---|---|
  | 1 | blue | ● circle | solid |
  | 2 | orange | ■ square | dashed |
  | 3 | green | ▲ triangle | dotted |
  | 4 | purple | ◆ diamond | dash-dot |
  | 5 | dark red | ▼ triangle down | long dash |

  A legend appears when there is more than one set, or when steepest and shallowest lines are shown.
- **Fit** (per graph, the same for every set): none, linear, quadratic, power, exponential
  (no proportional fit: section 7). The fit equation for each set is shown under the graph, e.g.
  $y = 4.04x + 0.012$, with the symbols and units from the axes ("$T^2 = 4.04\,L + 0.012$"). Gradient and
  intercept get units. Significant figures: 3 s.f. until the uncertainties are known; once the steepest
  and shallowest lines are drawn, the gradient and intercept are rounded to match their uncertainties.
  Fits are ordinary (unweighted) least squares; power and exponential fits use non-linear least squares,
  started from a log-graph estimate. Curved fits show their constants to 3 s.f. with no uncertainty (the
  max–min method is for straight lines only).
- **Leave a point out**: tap or click a point (or untick it in the table's "use" column). It becomes a
  hollow marker of the same shape and is ignored by the fit and by the line feedback.
- **Steepest and shallowest lines** (linear fit only): "Draw steepest line" and "Draw
  shallowest line" buttons for the chosen set, then press and drag across the graph; drag either end to
  adjust (the same interaction as `js/plot.js`, with keyboard support). The tool shows each line's
  gradient and intercept, then
  $m = m_{\text{best}} \pm \dfrac{m_{\max} - m_{\min}}{2}$ and the same for the intercept.
- **Gentle feedback** (a "Check my lines" button, optional): which error bars a line misses (those points
  are ringed on the screen only), whether the "steepest" line is really steeper than the best fit, and,
  when it passes through every bar, whether a steeper (or shallower) line would still fit. It never draws
  the lines for the student.

### Part 4: Save and download
- **Download graph (PNG)**: 2400 × 1600 px, always on a white background with dark ink (also in dark
  mode), fonts scaled so the graph is readable at A4 width. Includes title, labels, legend and the drawn
  lines if shown; the on-screen-only rings are left out.
- **Download data table (Word)**: one formatted table per data set: IB-style headings with units, the
  uncertainty in the heading when it's the same for every row (“±0.001”), otherwise a Δ column; values
  rounded to their uncertainty; trials and mean columns grouped. Tick boxes add the graph, the fit results
  and the worked example (section 7).
- **Save progress (file)**: downloads `<title>.graph.json` (format in section 4). **Open saved file**
  loads one back.
- **Automatic saving**: the whole state is saved in this browser after every change (localStorage). The
  page says plainly that it is saved only on this device and that the file is the way to move it to
  another computer. **Start a new graph** clears it, after offering to save a file first.

---

## 3. How it's built (for maintenance)

- Plain HTML, CSS and JavaScript, no library, no build step (site rules).
- `experimental/graph-maker.html`: the page (head copied from another page in `experimental/`).
- `js/graph-maker-core.js`: the maths, with no page code, so it can be tested in Node and reused by the
  IA builder: formula reader, uncertainty parsing, means and half ranges, max–min method, fits, rounding to
  significant figures, axis ticks, line-through-error-bar test. Exposes `window.GraphCore` (and
  `module.exports` for Node).
- `js/graph-maker.js`: the page: table, processing, graph drawing (canvas), dragging, exports, saving.
  Exposes `GraphMaker.render(state, canvas, options)` so another page can draw a saved graph.
- `css/graph-maker.css`: the tool's own styles (like `css/escape.css`). Dark mode through the site's
  colour variables.
- `js/labs/report.js`: extended **without changing existing behaviour**: a table cell may also be a list
  of runs (`[{ t: 'L', i: true }, { t: ' / m' }]`) for an italic symbol, and a table may have a caption.
  Plain-string cells work exactly as before, so the lab pages are unaffected (checked by downloading a lab
  report before and after).
- `js/labs/graph.js` and `js/plot.js` are **not changed**; their ideas are reused (least squares, the
  error-box test from `extremes()`, the drag-to-draw interaction and the feedback wording from
  `checkLine()`).
- Tests: `tools/check-graph-maker.mjs` tests the core maths (formula reader, propagation, max–min, fits
  against known data, rounding); `tools/check.mjs` runs it like its other tests.
- Graph drawing is one function that draws at any size: the screen canvas (sharp on high-resolution
  screens) and the 2400 px PNG come from the same code, so they always match.

---

## 4. Save-file format (for the IA builder)

A UTF-8 JSON file, `<title>.graph.json`. The IA builder can import it by reading the `state` (and redraw
the graph with `GraphMaker.render`, or simply use the ready-made `summary`).

```json
{
  "format": "dp-physics-graph-maker",
  "version": 1,
  "saved": "2026-11-15T10:30:00.000Z",
  "state": {
    "title": "Period squared against length",
    "columns": [
      { "id": "c1", "heading": "length L / m", "sym": "L", "noUnit": false, "kind": "raw",
        "unc": "0.001", "uncSf": 1 },
      { "id": "c2", "heading": "time for 10 swings t / s", "sym": "t", "kind": "trials", "trials": 3,
        "unc": "0.01", "uncSf": 1 },
      { "id": "c3", "heading": "mean time for 10 swings t / s", "sym": "tm", "kind": "mean", "of": "c2",
        "uncSf": 1 },
      { "id": "c4", "heading": "period squared T^2 / s^2", "sym": "T2", "kind": "formula",
        "formula": "(tm/10)^2", "uncFormula": "2*(Δtm/tm)*T2", "radians": false, "uncSf": 1 }
    ],
    "sets": [
      { "id": "s1", "name": "Set 1",
        "rows": [
          { "id": "r1", "use": true,
            "cells": { "c1": "0.400", "c2": ["12.71", "12.66", "12.74"] },
            "unc":   { "c1": "0.002" },
            "mean":  { "c3": { "v": 12.703333, "u": 0.04, "from": ["12.71", "12.66", "12.74"] } } }
        ] }
    ],
    "graph": {
      "x": "c1", "y": "c4",
      "xLabel": "", "yLabel": "",
      "grid": true, "zero": true,
      "fit": "linear",
      "lines": { "s1": { "steep": [[0.35, 1.38], [0.85, 3.45]], "shallow": [[0.35, 1.47], [0.85, 3.33]] } },
      "showLines": true
    }
  },
  "summary": {
    "title": "Period squared against length", "x": "length L / m", "y": "period squared T^2 / s^2",
    "tables": [ { "set": "Set 1",
                  "head": ["length L / m ±0.002", "time for 10 swings t / s ±0.01 (trial 1)", "…", "period squared T² / s²", "Δ(T²) / s²"],
                  "rows": [["0.200", "8.86", "…", "0.82", "0.04"]] } ],
    "fits": [ { "set": "Set 1", "type": "linear", "params": { "m": 3.99, "c": 0.02 }, "excluded": 0,
                "gradient": { "value": 3.99, "unc": 0.23, "unit": "s² m⁻¹", "text": "(4.0 ± 0.2) s² m⁻¹" },
                "intercept": { "value": 0.02, "unc": 0.087, "unit": "s²", "text": "(0.02 ± 0.09) s²" } } ],
    "equations": ["T² = 4.0 L + 0.02", "gradient = (4.0 ± 0.2) s² m⁻¹ (5.9%), y-intercept = (0.02 ± 0.09) s²"],
    "workedExamples": [ { "column": "c4", "heading": "period squared T^2 / s^2",
                          "text": "T² = 1.276² = 1.628 s²\nΔ(T²) = 2 × (ΔT / T) × T² = … = 0.055 s²\nSo T² = (1.63 ± 0.05) s²" } ]
  }
}
```

Notes on the format:
- Cells are kept **as the student typed them** (strings), so trailing zeros ("0.400") survive. Numbers
  are read from them when needed.
- `unc` on a column or a cell: `"0.001"` (absolute, in the column's unit) or `"2%"`. A cell's `unc`
  overrides the column's.
- A `mean` column's values are stored, with the trial values they came from (`from`), because they are
  only recalculated when the student presses the button; if the trials no longer match `from`, the value
  is "out of date".
- `formula` columns are recalculated from the formula whenever the page loads (the student has said how).
- `lines`: the drawn steepest and shallowest lines as two end points each, in graph units.
- `gradient.unc` and `intercept.unc` are `null` until the student has drawn both the steepest and shallowest lines;
  `text` then gives the value to 3 s.f. with its unit. Curved fits have `params` only (a, b, c / a, n / a, b).
- `state.ui` holds page settings (the data set being edited, the Word download's tick boxes).
- `summary` is written at every save so another tool can show the results without any of this code.
  It is ignored when the file is opened again (the state is the source).
- `version` goes up only if the format changes in a way older files can't be read; the page will convert
  older versions.
- Automatic saving uses the same `state`, in localStorage under the key `graphMaker.v1`.

---

## 5. Build stages (shown to the teacher in the preview after each one)

1. **Data table**: headings, symbols, uncertainties, typing, pasting, CSV upload, automatic saving; the
   core maths with its tests.
2. **The graph**: axes, error bars, data sets with their styles, title, labels, gridlines, fits and their
   equations, leaving points out.
3. **Processing**: repeated trials and the mean button, calculated columns with uncertainty formulas, the
   max–min check and the worked example.
4. **Steepest and shallowest lines**: drawing, reading off gradients and intercepts, gentle feedback.
5. **Output**: PNG, Word table, save and open files; tablets and phones; dark mode.
6. **Linking it in**: IA page, Experimental menu and hub page, `PROGRESS.md`, `CLAUDE.md`, sitemap and
   search index, the checker.

Each stage is checked at 375 px wide and in dark mode before it's shown.

---

## 6. Questions for the teacher

1. Proportional fit: the IA page's checklist says "Not forced through the origin: that would hide a
   systematic error". Keep it with a reminder?
2. Trigonometry in formulas: degrees or radians?
3. Data sets: same columns with separate rows, or completely separate tables?
4. What goes in the Word download?

(Answers are recorded in section 7.)

## 7. Decisions

Teacher's answers, 15 November 2026:

1. **No proportional fit.** Only the ordinary fits (linear, quadratic, power, exponential), keeping the IA
   page's advice ("not forced through the origin") simple.
2. **Trigonometry in degrees**, with a "radians" tick box on each formula.
3. **Data sets share their columns** (headings, symbols, uncertainties and formulas) but each has its own
   rows and name.
4. **Word download**: the data tables by default; tick boxes add the graph, the fit results and the
   worked example.
