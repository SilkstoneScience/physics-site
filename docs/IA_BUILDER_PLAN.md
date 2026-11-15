# IA builder for students (plan)

Status: **plan checked by the teacher, 15 November 2026** (decisions in section 10). Building in stages (section 9).

The page is `experimental/ia-builder.html` (permanent file name). Students build their IA report section by section, following the prompts, and download it as a Word document (.docx) at the end. Everything stays in the student's own browser: no server, no accounts, no AI. **The tool guides; it never writes content for the student.**

## 1. Sources and how conflicts are settled

- `experimental/ia.html` (the IA page, already written to the teacher's guidance), the **Student IA Workbook** (reference cache `ia/2026 - Student IA Workbook.txt`), the teacher's IA guidance in `CLAUDE.md`, the four teacher checklists (Research Design, Data Analysis, Error Analysis, Evaluation) and the guide's IA section (word count, page-one details).
- Where they differ, the **teacher's guidance in CLAUDE.md wins, then the workbook**. Three differences are settled this way, so the builder follows the IA page:
  - **Hypothesis:** the workbook says only an expectation is needed; the teacher's rule is a hypothesis when testing a relationship between two variables, and an expected value (with its source) when determining a constant.
  - **Single-reading uncertainty:** the workbook says one least count; the site uses ± half a division (analogue), ± the smallest division (digital), and one full division when two analogue readings are needed.
  - **Amount of data:** the workbook says six or seven values; the teacher's guideline is 5 values × 5 trials, adjusted where justified.
- No sentence starters anywhere (teacher's decision), so the workbook's "sentence frames" and the IA page's sentence starters are **not** used. Prompts are questions only.

## 2. The sections

In this order (the teacher's list). Each section has: a short **"What's expected"** paragraph, **guiding questions**, the **editing area**, and a **checklist** at the end. Every section has a link to the matching part of the IA page ("More on the IA page").

The section ids below are permanent (saved work and checklist ticks are stored against them).

| # | id | Heading in the Word file | What the student builds |
|---|----|--------------------------|-------------------------|
| 1 | `rq` | (title at the top) + **Research question** | Title (one line) and research question (text) |
| 2 | `background` | **Background** | Text with equations and images |
| 3 | `hypothesis` | **Hypothesis** or **Expected value** | Text with equations (the heading follows a choice, see below) |
| 4 | `variables` | **Variables** | Variables table, plus optional paragraphs |
| 5 | `method` | **Method** | Diagram (image), then numbered steps |
| 6 | `considerations` | **Methodological considerations** | Text, with optional sub-headings |
| 7 | `rawdata` | **Raw data** | A "story": introduction, data tables, explanations |
| 8 | `processing` | **Data processing** | A "story" of steps (table, graph or calculation) |
| 9 | `graphs` | **Graphs** | A "story" of graphs with gradient analysis |
| 10 | `conclusion` | **Conclusion** | Text with equations |
| 11 | `evaluation` | **Evaluation** | Evaluation table, plus a paragraph |
| 12 | `references` | **References** | A list of references |

Students can write the sections in any order (the sidebar jumps to any of them). The Word file always uses the order above, except for the research question, which the student places (teacher's decision): a choice in section 1, **"Where should your research question go in the report?"**:
- **Its own section, before the background** (the default);
- **Its own section, after the background**;
- **Inside my background, with no heading of its own**: it is added as the last paragraph of the background, starting with a bold "Research question:".

The research question is always written in section 1, so its guidance and checklist stay in one place.

### What's expected, guiding questions and checklists (DRAFT for the teacher to check)

The checklist items have permanent ids too (e.g. `rq.1`), so ticks survive later wording changes.

#### 1. Research question and title

**What's expected:** A precise research question (or aim) that names one independent variable with its range and values, one dependent variable with its unit, the system and its key conditions, and the measurement method. A reader who saw nothing else should know what you varied, what you measured, and how. Then a short descriptive title for the top of page one. Don't put your name anywhere in the report: use only your IB candidate code.

**Guiding questions:**
- What is the one quantity you will change, and which values will you use?
- What is the one quantity you will measure, and in what unit?
- What is the system (the apparatus or object), and which key conditions stay fixed?
- How will you measure the dependent variable?
- Are you testing a relationship, or determining the value of a constant?
- Could someone predict the shape of your graph from your question alone?

**Checklist:**
- `rq.1` One independent variable, with its range and values.
- `rq.2` One dependent variable, with its unit.
- `rq.3` The system and the measurement method are clear from the question alone.
- `rq.4` It is quantitative: the answer will be a number or a relationship, not just "it increases".
- `rq.5` The title is descriptive (it names the variables or the quantity being determined).
- `rq.6` No names anywhere: only candidate codes.

#### 2. Background

**What's expected:** The specific physics your question sits inside, in your own words: about half a page to a page. **Weave the theory and your experiment together**, rather than writing a general physics essay: you might give a short overview of your experiment, then explain how the theory predicts what will happen in it as you change your independent variable (added at the teacher's request, 15 November 2026). Give the equation or relationship you expect, say what each symbol means and how you will use it, state the assumptions the theory makes and whether they hold in your set-up, say where the theory stops being valid, and estimate roughly what size of answer to expect. Don't derive equations from the data booklet, and leave out history, biographies and why you became interested.

**Guiding questions:**
- What happens in your experiment, in a sentence or two? Would a short overview help the reader follow the theory?
- How does the theory predict what will happen in your set-up when you change the independent variable?
- Which equation or relationship links your two variables?
- What does each symbol mean, and which ones are constant in your experiment?
- How will you rearrange the equation so that a graph gives you what you want?
- What does the theory assume (small angle, negligible air resistance, laminar flow…)? Do those assumptions hold in your set-up, over your whole range?
- Where does the theory stop working?
- Roughly what value or gradient do you expect, and where does that estimate come from?
- Have you referenced every idea, method, value or image you took from a source (course-level physics needs no reference)?

**Checklist:**
- `bg.7` The theory is linked to my experiment: it explains what the theory predicts will happen in my set-up.
- `bg.1` The equation or relationship is stated, with every symbol explained.
- `bg.2` It is explained in my own words, not a string of paraphrased, cited sentences.
- `bg.3` The assumptions are stated, with whether they hold in my set-up.
- `bg.4` I've said roughly what size of answer to expect.
- `bg.5` No derivations of data-booklet equations, no history, no personal engagement.
- `bg.6` Every source I used is referenced.

#### 3. Hypothesis or expected value

A choice at the top: **"My investigation tests a relationship between two variables"** (heading "Hypothesis") or **"My investigation determines the value of a constant"** (heading "Expected value"). The prompts and checklist change with it.

**What's expected (relationship):** Explain what will happen to the dependent variable as you change the independent variable, and why, using the physics from your background. Mention any control variables that matter, and why. End with a clear "if… then…" statement, and be specific: directly proportional, inversely proportional, proportional to a square root…? If you already know the equation, say so: you are confirming it.

**What's expected (constant):** State the value you expect, with its unit and its source, so that you can compare your result with it in your conclusion. If the value depends on local conditions (such as *g* where you live), use the right local value.

**Guiding questions (relationship):**
- As the independent variable increases, what happens to the dependent variable? Why, in physics terms?
- What exact relationship does the theory predict (linear, proportional, inverse, power, exponential)?
- What will you plot to get a straight line, and what will the gradient and intercept be?
- Which control variables could change the result if they weren't kept fixed?

**Guiding questions (constant):**
- What value do you expect, in what unit?
- Where does that value come from, and does it apply to your conditions (temperature, location, material)?
- What will you plot, and how will the constant come from the gradient or intercept?

**Checklist (relationship):**
- `hy.1` It explains why, using the physics, not just what.
- `hy.2` The relationship is named precisely (not just "increases").
- `hy.3` It ends with a clear "if… then…" statement.
- `hy.4` It says what graph I expect.

**Checklist (constant):**
- `hy.5` The expected value has a unit and a source.
- `hy.6` The value fits my conditions (location, temperature, material).
- `hy.7` It says how the value will come from my graph.

#### 4. Variables

**What's expected:** Your independent, dependent and control variables, set out in two short tables so that nothing is forgotten, with the reasons in paragraphs underneath. For the independent and dependent variables give the quantity, symbol and unit, the instrument and its precision, the range, interval and number of values, the number of repeats, and how you changed or measured it. If you calculate the independent variable from other measurements, explain the calculation. For each control variable give its value where you know it (for example "(1.57 ± 0.01) kg, measured with a classroom balance") and how you kept it fixed. Then, underneath, **explain why**: why this range, interval and number of repeats, whether your instruments are precise enough for the change you expect, and why each control variable would affect your result. The reasons are where the marks are.

**How it is laid out** (decided with the teacher, 15 November 2026, after looking at moderated examples: Exemplar A, 6/6 for Research Design, used separate small tables; IB sample 2 used a control-variables table with short cells; IB sample 7, 6/6, used paragraphs). Short values go in the tables and the reasons go in paragraphs, so the tables stay tidy on an A4 page:

- **Table: independent and dependent variables**, written down the page (one column for the IV and one for the DV, so it fits a portrait page at normal size). Rows: Quantity, symbol and unit · Instrument · Precision / uncertainty · Range (the expected range, for the DV) · Interval and number of values · Repeats · How it is changed / measured.
- **Table: control variables**, one row each. Columns: Control variable (symbol, unit) · Value (with uncertainty) · Instrument (if measured) · How it is kept constant.
- **"Why these choices?" paragraphs** underneath, with a prompt for each: the range, the interval and number of values, the repeats, the precision, and each control variable (a prompt appears for every control in the table). Extra paragraphs can be added for a variable that needs a longer explanation.
- On screen the student fills in the same fields as a form, so there's no cramped table while typing.

**Guiding questions:**
- How exactly will you change the independent variable, and how will you know its value?
- Why does your range start and stop where it does?
- Why this interval between values, and this number of repeats (did a pilot run tell you anything)?
- How much will the dependent variable change across your range, compared with the uncertainty of one reading? Is your instrument precise enough?
- Is any variable calculated rather than measured directly? How?
- For each control variable: why would it change your result, and how will you keep it fixed? Can you measure its value?
- Is your uncertainty realistic for how the reading is really taken (reaction time, a blurred edge in a video), not just the instrument's resolution?

**Checklist:**
- `va.1` Exactly one independent and one dependent variable.
- `va.2` Each has its instrument, precision and unit.
- `va.3` Uncertainties follow the conventions (± half a division analogue, ± the smallest division digital, one division for two analogue readings) and are realistic.
- `va.7` The range, interval, number of values and repeats are in the table, and each is justified underneath.
- `va.8` The precision needed is compared with the precision available.
- `va.4` Each control variable says why it matters and how it was kept fixed.
- `va.5` Control values are given where I know them.
- `va.6` Any calculated variable has its calculation explained.

#### 5. Method

**What's expected:** A labelled diagram of the set-up (upload a picture; a clear sketch usually communicates better than a photograph), then the method as a series of clear, numbered steps with specific quantities, so that someone else could repeat it. Focus on how you changed the independent variable, measured the dependent variable and kept the controls fixed. You don't need a long equipment list: the key instruments are in your variables section and the diagram shows the rest. Leave out trivial steps such as plugging in a sensor.

**Guiding questions:**
- Could someone who has never seen your experiment repeat it from these steps alone?
- Does each step give specific quantities (masses, distances, times, settings)?
- Where in the steps do you change the independent variable, and how?
- How exactly is each measurement taken (from which point, at what moment, how many times)?
- Is every important piece of apparatus labelled on the diagram?

**Checklist:**
- `me.1` A labelled diagram of the set-up, with a numbered caption.
- `me.2` Clear numbered steps, with specific quantities.
- `me.3` It says how each measurement was taken, including repeats.
- `me.4` No long equipment list and no trivial connection steps.
- `me.5` Someone else could repeat it.

#### 6. Methodological considerations

**What's expected:** The other decisions behind your method, **explained**, not just listed: why you chose this way of measuring each variable rather than another, and your data-processing choices (what you will calculate and plot, and why). Then short, specific safety, ethical and environmental points. (Range, interval, repeats and precision are explained in your variables section.) Sub-headings can help.

**Guiding questions:**
- Why did you choose this way of measuring, rather than another?
- What will you calculate and plot, and why does that answer your question?
- What are the real hazards in your experiment, and how did you reduce them?
- Are there any ethical or environmental issues (waste, disposal, energy, living things)?

**Checklist:**
- `mc.3` The choice of measuring method is explained.
- `mc.4` The data-processing choices are explained (what I will plot, and why).
- `mc.5` Safety points are specific to my experiment, with how I reduced each risk.
- `mc.6` Ethical and environmental issues are considered (or I've said there are none, briefly).

#### 7. Raw data

**What's expected:** Introduce your raw data before you show it: say what each table shows and how the values were obtained. Paste each table from your spreadsheet. Every column heading has the quantity, its symbol, its unit and its uncertainty ("Length *L* / m, ±0.001"); every value in a column has the same number of decimal places, matching its uncertainty. Add any qualitative observations: they cost almost no words and feed your evaluation.

**Guiding questions:**
- What does this table show, and how were the values obtained?
- Does every heading have the quantity, symbol, unit and uncertainty?
- Do the decimal places in each column match that column's uncertainty?
- Is the independent variable in ascending order?
- Is any reading a possible outlier? Can you identify a cause, or could you measure it again?
- What did you notice during the experiment that the numbers don't show?

**Checklist:**
- `rd.1` Each table is introduced and has a numbered, descriptive caption.
- `rd.2` Every heading: quantity, symbol, unit and uncertainty.
- `rd.3` Consistent decimal places in each column, matching the uncertainty.
- `rd.4` Uncertainties are realistic, with a reason where judgement was needed.
- `rd.5` Qualitative observations are recorded.
- `rd.6` Any rejected point has an identified cause (at most one point).

#### 8. Data processing

**What's expected:** Your analysis should read as a **story** someone can follow from your raw data to your final value. For each step, introduce it (what you are doing, how and why: how it gets you closer to answering your question), show it (a table, a graph or a calculation), then explain it. Simple steps (a mean, half the range) need no example calculation: just say what you did. More complex steps, such as linearizing (calculating *T*² or ln *η*) and especially uncertainty calculations, need one short example with your own data. One example of each, not forty.

**Guiding questions:**
- What is the route from your raw data to your final answer? What is the next step on that route?
- Why is this step needed?
- Which uncertainty rule applies here (adding, multiplying, powers)?
- Does this step need an example calculation, or only a sentence?
- Are the significant figures and decimal places right after this step?
- Could a reader follow this step without asking you anything?

**Checklist:**
- `dp.1` Every step is introduced (what, how and why) and then explained.
- `dp.2` One example calculation for each complex step (linearizing, uncertainty), using my data.
- `dp.3` Uncertainties are propagated through every step.
- `dp.4` Uncertainties to 1 or 2 significant figures, matching the decimal places of the value.
- `dp.5` Every table is numbered and referred to in the text.
- `dp.6` No R², Pearson's *r* or standard deviation.

#### 9. Graphs

**What's expected:** The graph (or graphs) that answer your research question, usually a linearized graph chosen by the theory. Upload each graph as a picture. Introduce it, then explain it: the best-fit line, the steepest and shallowest lines, and the gradient and intercept with their uncertainties and units, and what they mean physically.

**Guiding questions:**
- What did you plot, and why does the theory say it should be a straight line (or a particular curve)?
- Is the independent variable on the *x*-axis, and does each axis have its quantity, symbol and unit?
- How did you choose the size of the uncertainty bars?
- Do the steepest and shallowest lines use all the bars, not just the first and last points?
- What are the gradient and intercept, with uncertainties and units? What does each mean physically?
- Is the intercept where the theory expects it? If not, why not?

**Checklist:**
- `gr.1` Each graph has a numbered, descriptive caption and is referred to in the text.
- `gr.2` Axes labelled with quantity, symbol and unit; IV on the *x*-axis.
- `gr.3` Uncertainty bars, and a best-fit line (not dot-to-dot, not forced through the origin).
- `gr.4` Steepest and shallowest lines using all the bars.
- `gr.5` Gradient and intercept with uncertainties and units, and their physical meaning.
- `gr.6` The fit is justified by theory.

#### 10. Conclusion

**What's expected:** Two jobs. First, **answer your research question** quantitatively: your value with its uncertainty, or the relationship named correctly, what the gradient and intercept mean physically, and how the uncertainties affect your confidence in the answer. Second, **compare with the accepted science**: an accepted value (with a source), an accepted relationship, manufacturer's data, or a plausible range, and whether it lies inside your uncertainty range. If it doesn't, explain the difference. A "no relationship" result is fine if that is what you found.

**Guiding questions:**
- What is your answer to the research question, with its uncertainty?
- What kind of relationship did you find? (A straight line with a negative gradient is not an inverse proportion.)
- What do the gradient and intercept mean physically?
- How confident are you in the answer, given its uncertainty?
- What do you compare your result with, and where does that come from?
- Does the accepted value lie inside your range? If not, how far outside, and what could explain it?

**Checklist:**
- `co.1` A quantitative answer, with its uncertainty and unit.
- `co.2` The relationship is named correctly.
- `co.3` The gradient and intercept are interpreted physically.
- `co.4` It says how the uncertainty affects my confidence.
- `co.5` A comparison with an accepted value, relationship or plausible range, with a source.
- `co.6` Any disagreement is explained, not ignored.
- `co.7` No repeating the method and no statistics.

#### 11. Evaluation

**What's expected:** Two or three **specific** weaknesses or limitations of what you actually did, each taken all the way along the chain: what the weakness was, how it affected your data and analysis, how it affected your conclusion and how much, and a realistic improvement that targets it, saying what would change. Put the rows in order of impact and say which weakness mattered most and why. Don't list strengths or extensions: they aren't assessed here.

**Table columns:** Weakness or limitation · Effect on the data and analysis · Effect on the conclusion, and how large · Realistic improvement, and what would change (four columns, following the workbook's chain: teacher's decision). Rows can be moved up and down to rank them. A paragraph box underneath: "Which weakness mattered most, and why?"

**Guiding questions:**
- What was hard to judge or control? Where did you have to estimate?
- Did the theory's assumptions really hold across your whole range?
- Is there a non-zero intercept, a shift from the expected value, or scatter that grows at one end? What could cause it?
- Does this weakness make your results scatter (random) or shift them all one way (systematic)? In which direction?
- How large was its effect compared with your other uncertainties?
- Would your improvement work in a school lab? What exactly would change in your results?

**Checklist:**
- `ev.1` Each weakness is specific to my method (not "human error").
- `ev.2` Each goes through all four steps of the chain.
- `ev.3` The effects are quantified where possible, and linked to my data or graph.
- `ev.4` The weaknesses are ranked, and I've said which mattered most.
- `ev.5` Each improvement targets its weakness, is realistic and says what would change.
- `ev.6` No strengths, no extensions, no generic improvements ("repeat more", "better equipment").

#### 12. References

**What's expected:** Every source you took an idea, method, image, equation, expected value or previous IA from, and only those. Use one consistent style. For websites, include the URL and the date you accessed it. If you used an AI tool, record the tool, the prompt and the date, and mark the AI-generated part in your report (it won't earn marks). Course-level physics, such as Newton's laws, needs no reference.

**Guiding questions:**
- Is every source here one you actually used and cited in the text?
- Does each website have its URL and access date?
- Did you take the idea or method from a previous IA or video? Then it must be here.
- Did you use any AI tool? If so, is it recorded with the prompt and the date?

**Checklist:**
- `re.1` Every source I used is listed, and every listed source is cited in the text.
- `re.2` One consistent style.
- `re.3` Websites have the URL and the access date.
- `re.4` Any AI use is recorded with the tool, the prompt and the date.

### A final check (not a section)

Above the export button, a short "Before you download" list (not exported): no name anywhere, candidate code filled in, word count under 3,000 (about 2,200 is typical of strong reports), every table and figure numbered and referred to. Plus a link to the IA page's "Before you hand it in" section.

## 3. What each kind of content does

- **Text boxes:** basic formatting only, from a small toolbar: **bold**, *italic*, subscript, superscript, bullet list, numbered list, and two heading levels (for sub-headings inside a section). Pasting from Word or Google Docs keeps only those formats and strips everything else (fonts, colours, sizes). Keyboard shortcuts Ctrl+B, Ctrl+I.
- **Equations:** an "Insert equation" button opens a click-to-build visual editor (MathLive, see section 7). Two kinds: an equation on its own line, or a small one inside a sentence. Click an equation to edit it again. Exported as real, editable Word equations.
- **Images:** upload PNG or JPG (graphs, diagrams, photos of the set-up). Large pictures are shrunk to at most 1600 px wide before saving (enough for a full-width A4 picture). Each gets a caption box, numbered automatically: **Figure 1**, **Figure 2**… in report order. The numbers update if images are moved, added or deleted.
- **Data tables:** "Paste from spreadsheet" (copy cells in Excel, Sheets or Numbers, then paste): the first row becomes the headings (editable, with italic, sub/superscript so "*T*² / s²" is possible). Each column has a **decimal places** setting ("as pasted", 0, 1, 2, 3, 4…), applied on screen and in Word; cells that aren't numbers are left alone. Cells can be edited, rows and columns added or deleted. Each table gets a numbered caption: **Table 1**, **Table 2**… (numbered separately from figures, as the IB convention expects).
- **Story sections** (raw data, data processing, graphs): a list of steps. Each step has an **introduction** box, then the item (a data table, an image, or a calculation made of equations and text), then an **explanation** box, shown by default with a "Hide this box" link when it isn't needed (a hidden box isn't exported; "Show the explanation box" brings it back, with its text kept). Steps can be moved up and down or deleted.
- **Method steps:** a numbered list, one box per step, movable, with the diagram above.
- **Variables and evaluation tables:** typed straight into a table on screen; rows added, moved and deleted. On a phone, each row shows as a card (one field per line) so the table fits.
- **Citations** (teacher's decision): a **Cite** button in the text toolbar picks a reference from the references list (or adds a new one) and inserts a numbered citation, [1], at the cursor. Numbers follow the order of first citation in the report and update automatically when citations or references are added, moved or deleted; the references list in the Word file is numbered the same way. Citations aren't counted in the word count. A reference that is never cited is flagged in the references section; deleting a cited reference asks first.

## 4. Word count

A live count in the top bar, with a per-section count in the sidebar. No warning near the limit (teacher's decision).

Following the guide, the count **leaves out**: charts and diagrams (images), data tables, equations and calculations, citations and references, the references list, and headers (section headings, sub-headings and the title). So it counts the words in the text boxes, method steps and explanation boxes, minus any equations and citations inside them. **Figure and table captions are left out** (teacher's decision), and so are the variables tables (as the IA page says). The evaluation table is written prose rather than a data table, so it is counted (to be confirmed with the teacher; one setting in the code).

The Word file shows the count at the top of page one ("Word count: 2,184"), worked out the same way at the moment of export.

## 5. The Word file

- Built with the existing no-library writer in `js/labs/report.js`, extended **without changing what the lab pages get**: the current block types (`h1`, `h2`, `p`, `qa`, `table`, `image`) keep working exactly as now, and new ones are added: formatted text runs (bold, italic, sub/superscript), bullet and numbered lists (`word/numbering.xml`), Word equations (inline and on their own line), JPEG as well as PNG pictures, captions, page numbers in the footer, and an option for wide margins. A quick test file for the lab pages' existing output is checked before and after.
- **Equations:** `js/omml.js` already turns LaTeX into Office equations (via MathJax's MathML), but it writes PowerPoint's flavour. It gets a Word option (the same maths, with Word's run properties), leaving the PowerPoint output untouched (`tools/check-slides.mjs` still passes).
- **Page one starts with** (no cover page): the title, "Candidate code: …", "Group members: …" (only if filled in) and "Word count: …". Then the sections in order, each with its heading.
- A4, Calibri 11 pt (Word's default look), headings bold, tables with thin borders, page numbers at the bottom of every page (the workbook's format check asks for them).
- **Wide margins (optional):** a tick box "Wide right margin for my teacher's comments". Normal margins are 2 cm; the wide version has a 6 cm right margin.
- Not exported: checklists, guidance, hidden explanation boxes, empty sections (an empty section is left out, with a note in the "Before you download" list).
- File name: the IA's own name and the date, e.g. `IA - practice pendulum - 2026-11-15.docx`.
- **Tested by opening the file in Word** (Word on this computer) after each export stage.

## 6. Saving

- **Auto-save** in the browser as the student types (half a second after they stop). The text, tables and settings are small; images are big, so **everything is stored in IndexedDB** (the browser's database, which can hold far more than localStorage), with images as separate records. If the browser blocks storage (some private windows), the page says so clearly and suggests "Save progress" often.
- **More than one IA:** a "My IAs" menu to create, rename, switch, duplicate and delete IAs (e.g. "Practice: pendulum" and "Real IA"). Delete asks first.
- **"Save progress"** downloads one file holding the whole IA, images included. **"Open saved file"** loads one (as a new IA, or replacing the current one if it's the same IA: the page asks which).
- **Reminder:** once the IA has some work in it, if the last "Save progress" download (or, if there has never been one, the day the IA was started) was more than 7 days ago, a gentle notice under the top bar: "You last saved a copy of this IA on 5 November 2026. Your work is kept only in this browser…". With a "Save progress" button and "Remind me later" (hides it for a day).
- **Opening a file:** if this browser already has the same IA, the page says which is newer and asks: replace the one in this browser, keep both (the file opens as a copy), or cancel. Pictures always get new ids in this browser.
- **Safety:** everything read from a file is rebuilt field by field and cleaned to the allowed formats; unknown parts are dropped, and pictures are kept only if they really open as PNG or JPEG. (Tested with a file containing scripts, event handlers, an iframe, odd ids and a fake picture: nothing ran.)
- **Nothing lost on closing:** every change is also copied at once to localStorage (which saves instantly, even while the page closes); on opening, the newer of that copy and the database's is used.
- The page explains plainly: work is saved **only in this browser on this device**; to move to another computer, use Save progress and Open saved file; clearing browser data deletes it.

### Save-file format

One JSON file (plain text that the page reads back), file name like `IA builder - Real IA - 2026-11-15.json` (the Word file is `IA - Real IA - 2026-11-15.docx`):

```json
{
  "format": "ib-physics-ia-builder",
  "version": 1,
  "savedAt": "2026-11-15T10:30:00Z",
  "ia": {
    "id": "ia-8f3k2",
    "name": "Real IA",
    "created": "2026-11-01T09:00:00Z",
    "updated": "2026-11-15T10:29:00Z",
    "settings": { "wideMargins": false, "kind": "relationship" },
    "front": { "title": "…", "candidateCode": "…", "groupCodes": "" },
    "sections": {
      "background": { "blocks": [ { "type": "text", "html": "<p>…</p>" }, { "type": "equation", "latex": "T = 2\\pi\\sqrt{\\dfrac{L}{g}}" } ] },
      "rawdata": { "steps": [ { "intro": "<p>…</p>", "item": { "type": "table", "head": ["…"], "rows": [["…"]], "dp": [null, 3], "caption": "…" }, "explain": "<p>…</p>", "explainHidden": false } ] },
      "variables": { "rows": [ { "name": "…", "type": "IV", "unit": "…", "instrument": "…", "precision": "…", "value": "…", "how": "…" } ], "notes": [ … ] },
      "evaluation": { "rows": [ … ], "most": "<p>…</p>" },
      "references": { "items": [ { "id": "r1", "html": "…" } ] }
    },
    "checklists": { "rq.1": true, "rq.2": false },
    "hidden": { "checklists": false },
    "lastDownload": "2026-11-15T10:30:00Z"
  },
  "images": { "img-1": { "type": "image/jpeg", "w": 1200, "h": 800, "data": "base64…" } }
}
```

Text is stored as cleaned HTML using only the allowed tags (`p`, `b`, `i`, `sub`, `sup`, `ul`, `ol`, `li`, `h3`, `h4`, plus equation and citation markers). Everything read from a file or pasted is cleaned against that list, so a file can't inject anything into the page. `version` lets later versions read older files.

Later (once the graphing tool exists): "Import from the graph maker" in a graph step, reading its save file.

## 7. The equation editor library (approved by the teacher, 15 November 2026)

- **MathLive**, version **0.111.4** (released 31 October 2026), by Arno Gourdol and contributors. Licence: **MIT** (free to use, including on a public site; the licence notice stays inside the file).
- Loaded from `https://cdn.jsdelivr.net/npm/mathlive@0.111.4/mathlive.min.js` (the same CDN as MathJax), **only on the IA builder page**.
- Size: the script is 848 KB (about 230 KB to download, as it's compressed on the way), plus its maths fonts (20 small files, 260 KB in all), loaded the first time an equation is shown, then cached by the browser.
- It gives a visual editor with a click-to-build on-screen keyboard (fractions, roots, powers, Greek letters, ±, ×…), works with mouse, touch and keyboard, and produces LaTeX, which `js/omml.js` turns into Word equations.
- Not needed: its sound files (switched off), its "compute engine" (not loaded).
- The page's own MathJax (already on every page) is still used for the rest of the page and for the Word conversion.

## 8. Layout

- **Laptop (main target):** a top bar with the IA's name ("My IAs" menu), the live word count, and buttons: Save progress · Open saved file · Download Word file. Below it, a **sidebar** on the left listing the 12 sections (with each section's word count and a small tick when its checklist is complete), and the **current section** in the main column: heading, "What's expected" (open), guiding questions (open, can be folded), the editing area, then the checklist (with "Hide checklist", remembered per IA).
- Only one section shows at a time, with "← Previous section" and "Next section →" at the bottom.
- **Tablet:** the same, with the sidebar narrower; the toolbar buttons are large enough to tap.
- **Phone (375 px):** the sidebar becomes a "Sections" dropdown at the top; tables show as cards. Usable for checking and small edits, but the page says a laptop is best for writing.
- **Dark mode:** follows the site's colours; the Word file is always normal black on white.
- Site header, menu and footer as on every page; the "Back to previous page" button comes automatically.
- No XYZ identity orange; HL orange is not used (the IA is the same for SL and HL).

## 9. Building it, in stages

Each stage is shown to the teacher in the preview (also at 375 px and in dark mode) before the next.

1. **The page and its frame:** sections with guidance and checklists, text boxes with formatting, sidebar, word count, auto-save, "My IAs".
2. **Tables, images and stories:** variables table, data tables with paste and decimal places, images with numbered captions, method steps, the story sections, evaluation table, references.
3. **Equations:** MathLive (after the teacher's OK), equations in text boxes and calculations.
4. **The Word file:** extend `report.js` and `omml.js`, export, open in Word to check; check the lab pages' reports still work.
5. **Save progress, open saved file, the reminder.**
6. **Links and tidy-up:** IA page and the Experimental menu (next to the graphing and diagram tools if they're already on main), `node tools/check.mjs --sitemap`, `node tools/check.mjs`, `PROGRESS.md`, `CLAUDE.md`.

## 10. The teacher's decisions (15 November 2026)

1. **Section prompts and checklists:** approved as drafted (nothing to add or remove at this stage), apart from the variables changes below.
2. **Page one:** boxes for the title, candidate code and group members' codes, with the reminder "codes only, never names". Approved.
3. **Variables:** reasons go in paragraphs underneath the table, not in a column. The teacher wants the **range, interval, repeats and precision in the variables table** so students don't forget them, without making it unsightly: so two tidy tables with short values, and the reasons below (section 2, Variables). Range, interval, repeats and precision therefore moved from Methodological considerations to Variables.
4. **Evaluation table:** four columns (the workbook's chain).
5. **Word count:** figure and table captions are left out. (Evaluation table: counted unless the teacher says otherwise; see section 4.)
6. **Research question placement:** the student chooses: its own section before or after the background, or inside the background with no heading of its own (section 2).
7. **Citations:** a Cite button with numbered citations (section 3).
8. **MathLive 0.111.4:** approved, on the IA builder page only.
