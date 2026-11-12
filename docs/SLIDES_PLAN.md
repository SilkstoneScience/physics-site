# Lesson slide generator for teachers (plan)

Status: **step 1 done, and step 2 done for Themes A to D (A.1–D.4; November 2026), each checked by the teacher.** The page is `teachers/slides.html`, linked from the "For teachers" landing page (`teachers/index.html`), which the home page's card opens. Next: step 2 for Theme E. How it was built: section 8.

## 1. What it does

A teacher picks a subtopic (A.1 … E.5), then ticks **individual curriculum points** within it (e.g. only "projectiles" and "fluid resistance" in A.1), chooses the slide types they want, and downloads a **PowerPoint (.pptx)** deck. Everything happens in the browser; nothing is uploaded and there are no accounts.

- **Opening slides:** a title slide (subtopic, chosen points, estimated teaching time) and an **aims** slide built from the chosen points.
- **Hook (optional, unticked by default):** one concept challenge per deck, chosen from all the challenges in the subtopic's theme (its own first), with a "Read this challenge" link to the concept challenges page. The question comes after the title slide; the answer comes near the end, on a "Back to the hook" slide.
- **Per curriculum point:** clear, succinct bullet slides (new writing: not a word-for-word copy of the revision sheet or the topic page), key-equation slides, **derivation slides** (how an equation is derived, as numbered steps with editable equations, wherever the teacher's decks derive it), then the tips for using the equations, worked examples with **editable equations** (question slide, then step-by-step solution), and a quick check (one Paper 1A question from the question bank, chosen automatically, then the answer).
- **Paper 2 questions (optional, unticked by default):** the teacher ticks any of the subtopic's Paper 2 questions; they go near the end of the deck, each followed by its mark scheme (about 2 minutes a mark is added to the time).
- **Oracy (optional, only these two):** "Discuss the hook" (four corners for multiple-choice challenges, think-pair-share for open ones, then "I used to think… now I think…" before the hook's answer) and "Discuss a ToK question" (agree, build, challenge, for one chosen ToK question). The revision sheet builder's per-topic oracy activity is **not** used in the slides (teacher's decision).
- **Optional extras:** ToK and NoS slides (discussion prompts in the speaker notes), a "Learn more" slide with video links.
- **Estimated teaching time:** each curriculum point has an estimate in minutes; the page shows the total for the ticked points, and it appears on the title slide.

## 2. Teacher's decisions so far

- **PowerPoint (.pptx), not Google Slides** (November 2026): Google Slides has no editable equations, and creating Slides files from the site would need Google sign-in, a Google Cloud project and Google's app review. Google Slides users can upload the .pptx to Drive (equations then show as pictures).
- **Curriculum points may use the guide's wording** (teacher's permission, November 2026, an exception to the no-copying rule like the guiding questions): short statements keep the guide's language; long ones are condensed. Credit the guide on the About page as for the guiding questions.
- **Template: our own design, "Option D: modern, with physics curves"** (teacher's choice, November 2026). Free template sites were ruled out: Slidesgo and SlidesMania forbid offering their templates (or modified versions) for download, and SlidesCarnival needs a credit slide and asks not to host its files.
- **Slide shape:** 16:9 widescreen (confirmed by the teacher, November 2026).

## 3. The design ("Option D")

Matched to the teacher's own decks (measured from A.1, C.1, D.1: PowerPoint's plain "Default Design", Arial, body text mostly 24 pt, sub-headings 28 pt, smaller text 18–20 pt, titles 44 pt).

- **Fonts and sizes:** Arial. Slide titles 40 pt bold; bullets 24 pt; sub-bullets and step text 20–24 pt; nothing below 18 pt (footer 12 pt is the only exception). Equations in PowerPoint's own maths font (Cambria Math) at 24 pt.
- **Theme colour per theme** (the site's colours): A `#1f5fbf`, B `#c2561a`, C `#0f8077`, D `#7b3fbf`, E `#2e7d32`. Text `#1c2430`, muted `#5b6676`, borders `#dde2e9`. No XYZ identity orange (CLAUDE.md).
- **Title slide:** a theme-colour panel on the left (about 40% of the width) with the subtopic code large ("A.1") at the bottom and faint white decoration (two projectile parabolas, one dashed, and a small velocity arrow, about 15–25% opacity); on the right a small rounded "pill" with the theme name in capitals, the subtopic title in bold, the chosen curriculum points, and "Estimated teaching time: …" in the theme colour.
- **Content slides:** a thin theme-colour bar along the top edge, a small faint wave motif in the top-right corner, the slide title in bold with a short rounded underline in the theme colour, round theme-colour bullet dots, diagrams on a light rounded panel (`#f7f9fd`, border `#dde2e9`), and a footer with a small theme-colour pill ("A.1"), the subtopic title and the slide number.
- **Worked examples:** the question as one line or two; the solution as numbered steps (theme-colour circles with white numbers), each step an editable equation; the key equation in a rounded card (tint `#eef4fd`, border `#c9dbf6`, with a "KEY EQUATION" pill). The card tint follows the theme colour.
- **Decoration** is faint and stays out of the content area; it is drawn as PowerPoint shapes in the slide master, so teachers can delete it.

## 4. Editable equations

PowerPoint stores equations as **OMML** (Office Math Markup Language) inside the slide XML, wrapped in `mc:AlternateContent` with a fallback picture (so Google Slides, Keynote and older viewers show an image).

- **Converter:** LaTeX (as on the site) → MathML (MathJax 4 can produce MathML) → OMML, written by us. Microsoft's `MML2OMML.XSL` can't be used (its licence doesn't allow publishing it). The topic pages use only **54 LaTeX commands** (`\times`, `\text`, `\dfrac`/`\frac`/`\tfrac`, Greek letters, `\sqrt`, `\approx`, `\propto`, `\sin`/`\cos`/`\tan`/`\ln`/`\log`, `\left`/`\right`, `\overline`, `\bar`, `\pm`/`\mp`, `\sum`, `\int`, `\odot`, arrows, spacing commands…), so a converter for that set is realistic; the checker should list any command it can't convert.
- **Fallback pictures:** MathJax's SVG output, turned into PNG in the browser.
- **Testing:** PowerPoint is installed on the teacher's computer (`C:\Program Files\Microsoft Office\Root\Office16\POWERPNT.EXE`), so tests can open each generated deck through PowerPoint's automation (COM, from PowerShell), check that the equations are real equation objects, and export slide pictures to look at.

## 5. How the .pptx is made

- No library: a .pptx is a zip of XML files. `js/labs/report.js` already builds .docx files this way (its `zip` and `crc32` can be shared). Our template (theme, slide master, layouts) is written as XML once and stored in the site; the generator adds slide files using its layouts.
- Images (diagrams from the topic pages, already SVG) become PNG pictures in the slides.

## 6. Content needed per subtopic

A new data file per subtopic (e.g. `teachers/slides/a1.json`), drafted by theme and **independently reviewed** (as for the teacher files), then checked by the teacher:
- curriculum points (guide wording, condensed if long), each with: an id, the topic-page section(s) it belongs to (the same section ids as the question tags), 1–2 aims, an estimated time in minutes, slide bullets (succinct, new writing), key equations (LaTeX), worked examples written for slides (question + steps as LaTeX), and optionally which concept challenge and questions suit it (questions can be found automatically from their `sections` tags).

## 7. Order of work

1. **Engine and A.1 pilot:** the page, the template (Option D), the .pptx writer, the LaTeX → OMML converter, fallback pictures, PowerPoint checks; A.1's curriculum points, slides, aims and times. Teacher checks the pilot deck in PowerPoint before anything else.
2. **Content for the other 23 subtopics**, by theme, drafted and reviewed.
3. Checker rules (missing aims or times, unknown sections, equations the converter can't handle), links from the builder and the home card, About page credit for the guide wording.

Progress: step 1 is done (8 November 2026). From step 3, the checker rules and the links are done; the About page credit for the guide wording is still to do.

## 8. How it is built (step 1)

- **Files:** `teachers/slides.html` (the page), `js/slides.js` (the form and the deck), `js/pptx.js` (the template and the .pptx writer: 7 layouts plus "Derivation", theme colour as accent1 so teachers can recolour a deck), `js/omml.js` (MathML → OMML, with a plain-text fallback for equations inside text), `tools/check-slides.mjs` (run by `tools/check.mjs`). The page keeps the teacher's choices in its address (`topic`, `points`, `types`, `hook`, `hooktalk`, `toktalk`, `tokq`, `p2`).
- **Slide types** (letters in `types`): `c` hook, `a` aims, `b` bullets, `e` key equations, `r` derivations, `d` diagrams, `w` worked examples, `q` quick checks, `p` Paper 2 questions, `t` ToK, `n` NoS, `v` videos. Hook and Paper 2 start unticked.
- **Data file** `teachers/slides/<topic>.json`: `topic`, `hours` (the guide's SL-and-HL hours; 0 for an HL-only subtopic), `hlHours` (its additional HL hours, if any), and `points`, each with `id`, `short`, `guide` (guide wording), `sections` (h2 ids on the topic page), `minutes`, `aims` (1–2), optional `hl: true` (HL content: an HL tag on the page and an orange HL label on its slides; counted in `hlHours`), optional `extra: true` (not in the guide's list for this subtopic; not counted in its hours), `challenge` (the suggested hook), `checks` (Paper 1A ids, optional; otherwise one is chosen by section) and `slides`:
  - `{ "type": "bullets", "title", "bullets": [string or [sub-bullets]], "notes" }` (any slide type can have `"hl": true`, which marks that slide as HL inside an SL point: say "HL only" on the slide too)
  - `{ "type": "equation", "title", "latex": string or up to 4 strings, "bullets" }`
  - `{ "type": "derivation", "title", "start", "steps": [{ "text", "latex" }], "notes" }`
  - `{ "type": "diagram", "title", "figure": "<title id of a figure on the topic page>", "bullets" }` (or `"svg": "figures/<file>.svg"` and `"alt"` for a figure drawn just for the slides, in `teachers/slides/figures/`: no ids or `<defs>`, and the same classes as the topic-page diagrams; or `"img": "figures/<file>.png"` for an openly licensed picture, with `"alt"` and `"credit"` (shown small under the slide text, and listed under Image credits on `about.html`))
  - `{ "type": "worked", "title", "question", "hint", "steps": [{ "text", "latex" }], "notes" }`
- **Text fitting:** PowerPoint doesn't shrink text when a file opens, so `js/slides.js` estimates the space text needs (an average Arial character is about 0.53 of the font size wide) and picks the size, the text width beside a picture, or how to split long Paper 2 questions and mark schemes over several slides. Aims, worked-solution steps and derivation steps are spread over as many slides as their measured heights need (at most five steps on a slide), and key equations too tall for the card are drawn smaller.
- **Testing:** build a deck in the preview, open it in PowerPoint through COM, count the equation objects, look for text taller than its box, and export the slides as pictures to look at. Write LaTeX into the data files with a script using `String.raw`: shell heredocs drop backslashes (the checker reports control characters and commands without their backslash).
