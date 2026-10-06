# DP Physics study-guide website: project rules

This folder (`physics-site`) is a static website for IB DP Physics students, hosted free on GitHub Pages.

## Who I'm working with
- The user is an IB DP Physics teacher and a **coding beginner**. Explain every step simply. Explain any technical term the first time you use it, and give exact commands or clicks.

## Working rules
- Change only what the task needs. Don't edit unrelated files or restyle parts that already work.
- Don't change the site's architecture (frameworks, build steps, backends, accounts, analytics, new libraries) without asking first.
- Never rename a question `id` or an existing page's file name: links and students' saved progress depend on them.
- Test in the preview before committing (at 375 px wide and in dark mode for layout changes), and run the checker (see below).

## Session routine (the user works from two computers)
1. **Start of every session:** run `git pull` before doing anything else. If it reports a conflict or error, stop and explain it simply before continuing.
2. **Before every commit:** run `node tools/check.mjs` and fix any errors (✗). It checks the question files, links, page set-up and answer marking. GitHub runs it again after each push (`.github/workflows/check.yml`) and emails the user if it fails. Needs Node.js: if `node` isn't found, install it with `winget install OpenJS.NodeJS.LTS`.
3. **End of every session, or whenever the user says they're done:** commit all changes with a clear message, then run `git push`. Confirm that the push worked.
- If `git` is not installed or the folder is not yet linked to GitHub, say so and help the user set it up.

## The source folder (physics-source)
- Its location is different on each computer. It is recorded in `CLAUDE.local.md`, which is per-computer and is **not** pushed to GitHub. If that file is missing or the path doesn't exist, ask the user for the path and create `CLAUDE.local.md`. Never write the path into this file.
- `Lessons/`: the teacher's lesson presentations, the **main source for the theme pages**. File names start with syllabus codes (A.1, A.2a, B.5b, ...), so they map directly onto subtopics:
  - `Lessons/New Curriculum Notes/Unit ...` and `Lessons/Unit A ... Unit E`: current-syllabus lessons. Where both hold the same file, compare them and use the newer or more complete one.
  - Several subtopics have separate SL and HL files: SL content on the main page, HL-only content marked "HL".
  - Topic content agreed with the user: relative velocity is introduced in A.1 (1D and simple 2D), even though the syllabus places it formally in A.5.
- When a subtopic's lessons are split into several presentations (for example A.2a, A.2b, A.2c), keep **one page** but divide it into labelled parts in the **same order as the decks**. Use a `part-banner` per part, a grouped contents list, and continuous section numbering. See `themes/a2.html`. Go through **every** slide of every deck and cover everything that's in the syllabus, adding anything the guide requires that the slides miss.
- Every topic page starts (after the lead paragraph, before the contents list) with a **"Knowledge and science" box** (`<section class="tok">`). It has two halves:
  - **Nature of science:** 2–5 tags naming aspects from the guide's NoS list (Observations, Patterns and trends, Hypotheses, Experiments, Measurement, Models, Evidence, Theories, Falsification, Science as a shared endeavour, Global impact of science), each with a short paragraph linking it to this topic.
  - **ToK:** 4–5 knowledge questions, each a bold question plus one or two sentences of physics context.
  - Use ideas from the deck's NoS/ToK slides where present, in your own words. End with a link to `tok.html`.
- **Equations panel:** when a topic's notes are written, add its data-booklet equations to `window.DATA_BOOKLET` in `js/site.js`. Use the booklet's symbols with short labels of our own, plus any constants the topic uses in `window.CONSTANTS`. Check every equation and constant against the PDF, because the extracted text is jumbled. The panel appears automatically on topic pages and follows the current question in the question bank.
- **HL content within an SL+HL topic** (user's requirement: HL must be unmistakable). See `themes/c1.html` and `themes/c3.html`:
  - SL sections first. Then `<div class="part-banner hl" id="hl">` with an "HL only" title and a note telling SL students where to skip to.
  - Then all HL sections inside `<div class="hl-zone">…</div>`, which draws an orange line down the margin. End it with `<p class="hl-end">End of the HL-only content…</p>`.
  - HL sections, worked examples, mistakes and checks each get a `<span class="tag hl">HL</span>`. The contents list groups "SL and HL" and "HL only".
  - The h1 gets a `+ HL extra` tag, and the lead paragraph says which sections are HL.
  - HL questions get `"level": "HL"`, so the "SL only" filter hides them. HL equations get `true` as their third item in `DATA_BOOKLET`, which shows an HL tag in the Σ panel.
- **Diagrams of exact curves** (sine waves, parabolas, interference patterns): calculate the points with a short PowerShell script and paste them into a `<polyline>`, rather than sketching by hand.
- Page style: follow `themes/a1.html`, which the user approved. It has a table of contents, key-equation boxes, worked examples with new contexts and numbers, inline SVG diagrams with colour-coded captions, common mistakes, and tap-to-reveal checks.
  - `Lessons/Unit Z - Measurements and Uncertianties`: measurement, uncertainties and vectors. This fits the tools/skills side of the course, not themes A–E. Ask the user before using it.
  - `Lessons/non-dp-lessons-Physics Unbound` and any `Old` / `Old Course` folders: not the current DP syllabus. Ignore them unless the user asks.
- `experimental-programme/practicals` → Practicals page. `experimental-programme/CSP` → Collaborative Sciences Project page.
- `IA/` (at the top level of physics-source, not inside experimental-programme) → IA page.
- `EE/` → Extended Essay guidance section.
- `Curriculum/2025 Physics data booklet.pdf`: the current data booklet. Use its constants and its symbols and notation for equations. Key equation boxes on topic pages should match the booklet's equations, written as MathJax in your own layout.
- `Curriculum/DP Physics Guide 2025.pdf`: the official syllabus. Use it to check topic names and coverage, but don't copy its text. Check every topic page against its "Understandings" and "Guidance" sections.
- **Reading lesson slides:** run `tools/pptx-text.ps1 -Pptx "<file>" -Out "<txt>"`. It lists each slide's text and image names. Save the output in the reference cache (`lessons/` subfolder), not in physics-site. Slides that contain only an image are often third-party questions (for example Hewitt "Next-Time Questions", textbook figures or past-paper items), so check them before reusing anything.
- **Reading PDFs:** this setup can't open PDFs directly. Use `tools/pdf-extract`:
  1. Run `extract-server.ps1 -Pdf "<pdf>" -Out "<txt>"` in the background.
  2. Open http://localhost:8010/ in the browser pane. It uses pdf.js from cdnjs and saves the text when the page shows "DONE".
  3. Save the text in this computer's reference cache (see `CLAUDE.local.md`), **never inside physics-site**.
  4. Search the cached text rather than re-extracting it. Large textbooks can be extracted the same way, then searched for the relevant section.

## Progress and agreed decisions
- What's finished and what's still to do is in `PROGRESS.md`. Update it when a piece of work is finished.
- Decisions agreed with the user on finished work (keep following these):
  - Images: don't use images from sites like CSIRO's without an explicit open licence (the CSIRO HR diagram on E.5 was replaced for this reason).
  - IA page: the Student IA Workbook is the main source; where it differs from the older slides, the workbook wins. Single-reading uncertainty in our IAs = the full least count. A hypothesis is required when investigating a relationship between two variables, not when determining a constant (then state the expected value). The guideline is 5 values of the independent variable × 5 trials, adjusted where justified. The method is written as clear steps, leaving out trivial connection steps.
  - IA documents: the Tsokos guide stays unshared; the IA Selection Document and student-work folders stay off the site. Before linking any student PDF, check the raw file for old `/Title` entries and multiple `%%EOF` markers (incremental saves keep old versions), not just the visible text. IB candidate codes are fine to leave in published student work (but never write a real one in this file); only names must be removed.
  - CSP page: never add group lists, the facilitator roster or the teacher rubric.
  - XYZ visual identity (October 2026): light orange (`--xyz` for fills, `--xyz-ink` for lines and text) is the identity accent **only** for the XYZ motif, the header mark, the home page and the current-menu underline. Orange already means HL, theme B, worked examples and `key-2` in diagrams, so don't use the identity orange in notes content, and keep links, buttons and focus outlines in the notes blue. `#F5A15A` is too pale for text on white: use `--xyz-ink` for text and thin lines, and put only dark text on `--xyz` fills. Keep the motif subtle (inline, decorative SVG with `aria-hidden="true"`; CSS animations only, so the reduced-motion rule stops them). Ask before adding it to new places.

## Working from Google Drive (cloud sessions)
- The teacher's lessons are also on Google Drive, which cloud sessions can read with the Google Drive tools: `Unit A - Space Time and Motion`, `Unit C - Wave Behaviour` (and other `Unit …` folders), `Curriculum` (contains `DP Physics Guide 2025.pdf`), `Books` (textbooks, including the `Oxford` folder) and `Daily Questions`.
- Drive gives slide **text** only, not images. Very large PDFs (the Oxford books, 70–190 MB) come back empty from Drive; read those on the teacher's computer with `tools/pdf-extract` instead.
- Many lesson slides are adapted from Tim Lund's materials and credit Pearson or Hodder, and their practice questions are often IB past-paper items. Use the ideas only; write everything, including questions, in your own words with new numbers.
- Formative tests (`… Formative.doc`) aren't used as class assessments, but they aren't IB style. They can inspire questions, rewritten in IB style.

## Copyright rules (IMPORTANT)
- **Reference only, never copy:** `copyrighted-reference/` and everything in it, especially the `Books`, `Daily Questions` and `Past Papers` subfolders. Apply the same rule to any folder named books, daily questions or past papers anywhere in physics-source.
  - IB past papers and mark schemes: use them only to learn the IB question style, mark-scheme style and command terms.
  - Textbooks: use them only to check physics accuracy and syllabus coverage. They are large, so look up only the relevant section. Never read a whole book.
- **Never copy** text, questions, worked examples, diagrams or images from those files into physics-site. Write all website content and questions in your own words, with your own numbers and contexts.
- Images in the teacher's own lesson presentations may be reused. If a diagram would be clearer redrawn as SVG, redraw it. Otherwise reuse the original image.
  - Some presentation images may themselves come from textbooks or IB papers (for example, they show a publisher's figure number, watermark or IB exam layout). Don't reuse those. Redraw them in your own style or ask the user.
- **Creative Commons and public-domain photos** (e.g. from Wikimedia Commons) may be used to show real experiments and events. Check the licence and author on the file's Commons page (via the API's `extmetadata`, or the page's `Author` field), and use only CC BY, CC BY-SA, CC0 or public-domain files (never "NC" or "ND"). Put the photo in a `figure.diagram` with `<img class="photo">`, alt text, and a caption ending in `<span class="credit">Photo: Author, <a>Wikimedia Commons</a> (file page), <a>licence</a> (licence page). Resized.</span>`. Add the same credit to the "Image credits" list on `about.html`. Cloud sessions: `thumb.wikimedia.org` is blocked, so download thumbnails from `upload.wikimedia.org/wikipedia/commons/thumb/…/1280px-…`, and go slowly (a few seconds between requests) to avoid rate limits.
- Compress every image before adding it: at most 1200 px wide, JPEG or WebP at about 80% quality, ideally under 200 KB. Save images in `images/<topic>/`, for example `images/a1/`.
- Student work (for example from `EE/20xx-20xx`, `IA/Student Work`) may be used on the site. If a piece contains student names (in the text, headers, file names, cover pages or metadata), **don't publish it yet**: tell the user exactly where the names appear, and the user will remove them first. Never publish CSP group lists.

## Adapting resources
- When the user asks to adapt files from `experimental-programme/to-adapt`, save the adapted versions as **Word documents (.docx)** in `experimental-programme/adapted-for-review` inside physics-source, for the user to check.
- Only add adapted material to the website **after the user approves it**.

## How the site is built
- Plain HTML, CSS and JavaScript with no build step, so any file can be edited directly. GitHub Pages serves the `main` branch from the root folder.
- **This repository and everything published from it are public.** `_config.yml` stops GitHub Pages publishing files that aren't for students (`CLAUDE.md`, `tools/`, `preview.bat`, hidden folders…); add any new non-site file or folder to its `exclude` list. Never put student names, candidate codes, emails or private links in any file here, including `CLAUDE.md` and commit messages. Pages must not start with a `---` front-matter block (Jekyll would then process them and could change `{{ }}` or `{% %}` text).
- Use relative links only, because the site lives at `https://<username>.github.io/physics-site/`. Each page sets `data-root` on `<body>` (`""` at the top level, `"../"` one folder down).
- `js/site.js` adds a "← Back to previous page" button to the bottom of every page automatically, so don't add one by hand. If the student came from outside the site, the button goes to the topic's theme page or the home page instead. In-page `#` links jump without adding a browser-history step, so this button always leaves the page.
- `js/site.js` holds the syllabus list (themes A–E and subtopics), the MathJax settings, and the shared header, menu and footer. To rename a topic, edit it there.
- **New pages:** copy the `<head>` of a page in the same folder and change the title, description, canonical and `og:` lines (`og:title` and `og:description` must match the title and description; the checker enforces this). Then run `node tools/check.mjs --sitemap` to add the page to `sitemap.xml`. `404.html` is the exception: GitHub shows it at any missing address, so its links start with `/`.
- Pages:
  - `index.html`: home page.
  - `themes/`: `index.html` lists all themes, `a.html` to `e.html` are theme pages, and `a1.html`, `a2.html` and so on are subtopic pages.
  - `questions.html`: the question bank. Code is in `js/questions.js`.
  - `experimental/`: `index.html`, `practicals.html`, `csp.html`, `ia.html`.
  - `ee/index.html`: Extended Essay guidance.
  - `tok.html`: explains NoS and ToK and how to use the topic boxes.
  - `skills.html`: Physics skills (Tool 3): units, accuracy and precision, significant figures, uncertainties, graphs and gradient uncertainty, vectors. Written from `A.0 - Essential Skills.pptx`, whose numbered examples come from a textbook, so all examples on the page are new.
  - `resources.html`: Google Drive links. The data booklet link lives in **one place**, `window.DATA_BOOKLET_URL` near the top of `js/site.js`. Both the equations panel and the Resources `#data-booklet` card use it. While it's empty, they say the link is "coming soon". Link to the PDF on Drive, and never put the IB PDF itself in this public folder.
- Equations use MathJax: `$...$` inline, `$$...$$` displayed. Inside JSON files every backslash must be doubled, e.g. `"$v = u + at$"` but `"$\\Delta x$"`.
- Pages load **MathJax 4**, pinned to one exact version on every page (`https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js`; new pages must copy this exact line). To upgrade, change the version on every page at once, then check equations still render; `tools/check.mjs` reports unpinned or mixed versions. MathJax 4 wraps long *inline* equations on phones. *Displayed* `$$...$$` equations don't wrap, so keep each one short. Put long chains on separate `$$` lines.
- Write units with negative powers inside MathJax so they can't split across lines: `$\text{m s}^{-1}$` (in JSON: `$\\text{m s}^{-1}$`).
- Long chains of working inside one `$...$` can't wrap on phones. Split them into several `$...$` pieces or use a displayed `$$...$$` equation.
- In SVG diagrams, put any `font-size` on each `<text>` element itself (the stylesheet overrides sizes set on a `<g>`), because phone screens enlarge diagram text to 19px.
- In SVG diagrams, keep in-picture labels short. Put longer explanations in a colour-coded `<figcaption>` using `key-1` (blue) and `key-2` (orange). Give small graphs `class="small"`.
- Pages must work well on phones. Check new layouts at 375 px wide.
- **Worked-example diagrams:** give a worked example an inline SVG diagram whenever a sketch helps (free-body diagrams, before/after collision sketches, ray diagrams, set-ups). Put it inside the `.worked` box, after the question, as a `figure.diagram` with a `<title>` and a colour-coded caption. Calculate exact curves (parabolas, sine waves) with a script.
- **Maths links:** where a physics idea uses DP Mathematics, add an `<aside class="maths-link">` box with an `h3` "Maths link: …" and a `<span class="tag">AA SL x.y</span>` naming the Maths: analysis and approaches syllabus section, checked against the AA guide (`mathematics-analysis-and-approaches-guide.pdf` on the teacher's Google Drive; IB-copyrighted, so use it for numbers only, never copy its text). Useful sections: 1.5/1.7 exponents and logs; 2.1 straight lines; 2.6 quadratic graphs (the guide links projectiles); 2.7 quadratic equations; 2.11 transformations; 3.1 3D shapes, sphere area (inverse-square law); 3.2 sine/cosine rule; 3.3 right/non-right trig applications (vectors, forces); 3.4 radians, arcs, sectors (circular motion, diffraction); 3.5 unit circle, tan; 3.6 Pythagorean identity; 3.7 sine/cosine functions, amplitude, period (SHM); 5.1 derivative as gradient and rate of change; 5.4 tangents (instantaneous velocity); 5.5 anti-differentiation with a boundary condition, areas; 5.6 derivatives of sin, cos, e^x, ln x and the chain rule (circular motion, induced emf); 5.7 second derivative (SHM); 5.8 maxima and minima; 5.9 kinematics; 5.10 indefinite integrals of sin, cos, 1/x, e^x; 5.11 definite integrals and areas; AHL 5.18 differential equations (decay curves). The school teaches Maths AI, which doesn't include all of these at SL (for example, derivatives of sin and cos). Add an HL tag if the box is in HL content. Keep them short and optional, and never let the physics depend on them.

## Question bank format
- `questions/index.json` lists the question files. Each file (e.g. `questions/a.json`) is a JSON array of questions.
- Common fields: `id` (unique, e.g. `"A1-001"`), `theme` (`"A"`), `topic` (`"A.1"`), `paper` (`"1A"`, `"1B"` or `"2"`), `difficulty` (1 = foundation, 2 = standard, 3 = challenging), `level` (`"SL"` or `"HL"`), `stem` (question text, HTML allowed), optional `diagram` (path to an SVG in `questions/diagrams/`) and `diagramAlt` (a text description of the diagram).
- Paper 1A (multiple choice): `options` (4 strings), `answer` (index 0–3), `explanation`.
- Paper 1B and 2 (structured): `parts`, a list of `{ "label", "question", "marks", "markscheme": [one string per mark point] }`.
- **Paper 1B (data-based) is common to SL and HL** (the 2025 SL and HL papers are identical; Paper 1A is not): `level: "SL_HL"`, SL material only, never an HL-only topic. New 1B questions are **generated**, never typed: one file per dataset in `tools/1b/datasets/` (id like `D3-B01`), built into `questions/1b.json` by `node tools/1b/build.mjs`, which validates everything first and writes nothing if anything fails. Never edit `questions/1b.json` by hand, and never change a published dataset's `id` or `seed`. Every dataset states its physics explicitly (scenario, principles, assumptions, derivation, parameters with units and plausible ranges, measurement models) and builds its model only from the vetted laws in `tools/1b/laws.mjs` (units checked at every step); add a law only with reference values and limiting cases. Review the physics with `node tools/1b/build.mjs --audit`. **Only APPROVED datasets are published**; statuses, reviews and fingerprints are in `tools/1b/reviews.json` (change them only with `node tools/1b/review.mjs`). Never record TEACHER-REVIEWED or APPROVED yourself unless the teacher has explicitly given that decision, and then add --recorded-by. If the checker reports `frozen-changed`, a reviewed dataset would change: stop and tell the teacher; don't reset it without their agreement. Every dataset also needs an independent physics audit in `tools/1b/independent.mjs`, written from first principles without the generator's laws or maths. How to write a dataset and what is checked: `tools/1b/README.md`. Self-marked "draw a line" parts show the examiner's graph in the mark scheme. Review model (agreed October 2026): new datasets come in batches; the teacher inspects AMBER datasets (or waives them with a reason) and a GREEN sample, then accepts the batch with `node tools/1b/review.mjs accept-batch`; uninspected datasets are approved with `inspected: false`, never recorded as TEACHER-REVIEWED (docs/PAPER1B_SPECIFICATION.md section 16). **Current state and the next action: read docs/PAPER1B_PROJECT_STATUS.md first.**
- **Typed numerical answers:** a calculation part whose answer is a single number gets `"numeric": { "answer": 517, "unit": "$\\text{m s}^{-1}$" }`. Optional: `"tolerance"` (relative, default 0.02), `"range": [min, max]` (use the mark scheme's "accept" range), `"anySign": true`, and `"mistakes": [{ "value": …, "feedback": "…" }]` for common wrong answers. The student types a number and it is marked automatically: within the tolerance, or correctly rounded to 2+ significant figures, earns the part's full marks; otherwise they can retry or open the mark scheme and self-mark (method marks, ECF). Store the unrounded answer. Give the unit in `unit` (the student types only the number), and make sure the question says which unit if it isn't SI. Don't use it for "show that", explain, or two-value parts. Code: `numericHtml` in `js/questions.js`; the marking (`checkNumeric`, `parseNumber`) is in `js/numeric.js`, tested by `tools/check.mjs`.
- Write mark schemes in IB style (one marking point per mark, ECF and alternative answers noted), but in your own words.
- Never change an existing question's `id`. Students' saved progress is keyed by it.
- Paper 1A style:
  - Four options, numerical options in ascending order.
  - Plausible distractors based on real misconceptions. The `explanation` says why the common wrong answers are tempting.
  - Spread the correct letters roughly evenly across A–D within each topic.
  - For "which graph" questions, put the four graphs in one SVG labelled A–D and use options like "Graph A".
  - "I, II and III" questions (as in the 2025 papers): stem `<p>Three statements about … are:</p><p>I. …<br>II. …<br>III. …</p><p>Which statements are correct?</p>`, options always "I and II only", "I and III only", "II and III only", "I, II and III" in that order. The explanation says why each statement is true or false. Every topic has at least one.
  - Use $g = 9.8$ m s⁻² everywhere (notes and questions). This is the value in the 2025 data booklet.
- The question bank shows one question at a time by default, with Previous/Next, a "Next question" button after answering, and a Back link to the page the student came from. "All on one page" is an option. Link to a set with `questions.html?topic=A.1`, or to one question with `&q=A1-004`.

## Home page and About page
- **Joke of the day** (`index.html`): the jokes are in `js/jokes.js` as `{ q, a }` pairs; `js/site.js` picks a random one on each load (never the same as last time on that device) and the "Reveal the answer" button shows the punchline. Use well-known published jokes (the teacher's choice), mostly physics. Keep them safe for school: no flirting, alcohol, rude or unkind jokes.
- **About page** (`about.html`): no photo of the teacher (removed at the user's request, October 2026; don't add one back unless asked). The dogs' photo stays. Only general professional details: never phone, email, date of birth, address, QTS number or referees.

## Previewing
- Double-click `preview.bat` (or run `powershell -ExecutionPolicy Bypass -File tools/preview.ps1`), then open http://localhost:8000. A preview server is needed because browsers block the question bank from loading JSON files when a page is opened straight from disk.
