# Mr Silkstone's Physics

A study guide for IB Diploma Programme Physics (SL and HL), live at **https://physics.silkstone.xyz**.

Notes for every syllabus topic (A.1–E.5), an interactive question bank, a data-booklet equations panel, and guidance on skills, the Internal Assessment, the Collaborative Sciences Project and ToK.

This site is not produced or endorsed by the International Baccalaureate Organization.

## How it works
- Plain HTML, CSS and JavaScript, with no build step. GitHub Pages publishes the `main` branch.
- `themes/`: topic notes, one page per topic. `js/site.js`: the syllabus list, the shared header and menu, and the data-booklet equations.
- `questions/*.json`: the question bank's questions. `js/questions.js` shows them; `js/numeric.js` marks typed numerical answers.
- Equations are drawn by MathJax.
- Students' progress is saved only in their own browser. There are no accounts, and no personal data is collected.

## Working on it
- Preview: double-click `preview.bat`, then open http://localhost:8000.
- Check before committing: `node tools/check.mjs` (needs Node.js). GitHub runs the same check after every push.
- Project rules (content style, copyright, question format): `CLAUDE.md`. What's done and still to do: `PROGRESS.md`.

## Copyright
The notes, questions and diagrams are original work. Photos are credited on the About page with their Creative Commons or public-domain licences.
