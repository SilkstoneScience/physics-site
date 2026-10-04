# DP Physics study-guide website: project rules

This folder (`physics-site`) is a static website for IB DP Physics students, hosted free on GitHub Pages.

## Who I'm working with
- The user is an IB DP Physics teacher and a **coding beginner**. Explain every step simply. Explain any technical term the first time you use it, and give exact commands or clicks.

## Session routine (the user works from two computers)
1. **Start of every session:** run `git pull` before doing anything else. If it reports a conflict or error, stop and explain it simply before continuing.
2. **End of every session, or whenever the user says they're done:** commit all changes with a clear message, then run `git push`. Confirm that the push worked.
- If `git` is not installed or the folder is not yet linked to GitHub, say so and help the user set it up.

## The source folder (physics-source)
- Its location is different on each computer. It is recorded in `CLAUDE.local.md`, which is per-computer and is **not** pushed to GitHub. If that file is missing or the path doesn't exist, ask the user for the path and create `CLAUDE.local.md`. Never write the path into this file.
- `Lessons/`: the teacher's lesson presentations, the **main source for the theme pages**. File names start with syllabus codes (A.1, A.2a, B.5b, ...), so they map directly onto subtopics:
  - `Lessons/New Curriculum Notes/Unit ...` and `Lessons/Unit A ... Unit E`: current-syllabus lessons. Where both hold the same file, compare them and use the newer or more complete one.
  - Several subtopics have separate SL and HL files: SL content on the main page, HL-only content marked "HL".
  - `Lessons/Unit Z - Measurements and Uncertianties`: measurement, uncertainties and vectors. This fits the tools/skills side of the course, not themes A–E. Ask the user before using it.
  - `Lessons/non-dp-lessons-Physics Unbound` and any `Old` / `Old Course` folders: not the current DP syllabus. Ignore them unless the user asks.
- `experimental-programme/practicals` → Practicals page. `experimental-programme/CSP` → Collaborative Sciences Project page.
- `IA/` (at the top level of physics-source, not inside experimental-programme) → IA page.
- `EE/` → Extended Essay guidance section.
- `Curriculum/DP Physics Guide 2025.pdf`: the official syllabus. Use it to check topic names and coverage, but don't copy its text.

## Copyright rules (IMPORTANT)
- **Reference only, never copy:** `copyrighted-reference/` and everything in it, especially the `Books`, `Daily Questions` and `Past Papers` subfolders. Apply the same rule to any folder named books, daily questions or past papers anywhere in physics-source.
  - IB past papers and mark schemes: use them only to learn the IB question style, mark-scheme style and command terms.
  - Textbooks: use them only to check physics accuracy and syllabus coverage. They are large, so look up only the relevant section. Never read a whole book.
- **Never copy** text, questions, worked examples, diagrams or images from those files into physics-site. Write all website content and questions in your own words, with your own numbers and contexts.
- Images in the teacher's own lesson presentations may be reused. If a diagram would be clearer redrawn as SVG, redraw it. Otherwise reuse the original image.
  - Some presentation images may themselves come from textbooks or IB papers (for example, they show a publisher's figure number, watermark or IB exam layout). Don't reuse those. Redraw them in your own style or ask the user.
- Compress every image before adding it: at most 1200 px wide, JPEG or WebP at about 80% quality, ideally under 200 KB. Save images in `images/<topic>/`, for example `images/a1/`.
- Don't publish student names or student work (for example from `EE/20xx-20xx`, `IA/Student Work` or CSP group lists).

## Adapting resources
- When the user asks to adapt files from `experimental-programme/to-adapt`, save the adapted versions as **Word documents (.docx)** in `experimental-programme/adapted-for-review` inside physics-source, for the user to check.
- Only add adapted material to the website **after the user approves it**.

## How the site is built
- Plain HTML, CSS and JavaScript with no build step, so any file can be edited directly. GitHub Pages serves the `main` branch from the root folder.
- Use relative links only, because the site lives at `https://<username>.github.io/physics-site/`. Each page sets `data-root` on `<body>` (`""` at the top level, `"../"` one folder down).
- `js/site.js` holds the syllabus list (themes A–E and subtopics), the MathJax settings, and the shared header, menu and footer. To rename a topic, edit it there.
- Pages:
  - `index.html`: home page.
  - `themes/`: `index.html` lists all themes, `a.html` to `e.html` are theme pages, and `a1.html`, `a2.html` and so on are subtopic pages.
  - `questions.html`: the question bank. Code is in `js/questions.js`.
  - `experimental/`: `index.html`, `practicals.html`, `csp.html`, `ia.html`.
  - `ee/index.html`: Extended Essay guidance.
  - `resources.html`: Google Drive links.
- Equations use MathJax: `$...$` inline, `$$...$$` displayed. Inside JSON files every backslash must be doubled, e.g. `"$v = u + at$"` but `"$\\Delta x$"`.
- Pages must work well on phones. Check new layouts at 375 px wide.

## Question bank format
- `questions/index.json` lists the question files. Each file (e.g. `questions/a.json`) is a JSON array of questions.
- Common fields: `id` (unique, e.g. `"A1-001"`), `theme` (`"A"`), `topic` (`"A.1"`), `paper` (`"1A"`, `"1B"` or `"2"`), `difficulty` (1 = foundation, 2 = standard, 3 = challenging), `level` (`"SL"` or `"HL"`), `stem` (question text, HTML allowed), optional `diagram` (path to an SVG in `questions/diagrams/`) and `diagramAlt` (a text description of the diagram).
- Paper 1A (multiple choice): `options` (4 strings), `answer` (index 0–3), `explanation`.
- Paper 1B and 2 (structured): `parts`, a list of `{ "label", "question", "marks", "markscheme": [one string per mark point] }`.
- Write mark schemes in IB style (one marking point per mark, ECF and alternative answers noted), but in your own words.
- Never change an existing question's `id`. Students' saved progress is keyed by it.

## Previewing
- Double-click `preview.bat` (or run `powershell -ExecutionPolicy Bypass -File tools/preview.ps1`), then open http://localhost:8000. A preview server is needed because browsers block the question bank from loading JSON files when a page is opened straight from disk.
