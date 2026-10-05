# Progress log

What has been built so far, and what is still to do. The rules for working on the site are in `CLAUDE.md`.
This file is not published on the website (see `_config.yml`).

## Topic notes and questions (all five themes done)
- A.1 Kinematics: notes and 19 Paper 1A questions.
- A.2 Forces and momentum: notes, 22 Paper 1A and 2 Paper 2.
- A.3 Work, energy and power: notes, 20 Paper 1A and 2 Paper 2.
- A.4 Rigid body mechanics (HL only): notes, 12 Paper 1A and 2 Paper 2, all HL.
- A.5 Galilean and special relativity (HL only): notes, 12 Paper 1A and 2 Paper 2, all HL.
- B.1 Thermal energy transfers (no HL content): notes, 14 Paper 1A and 2 Paper 2.
- B.2 Greenhouse effect: notes, 12 Paper 1A and 2 Paper 2.
- B.3 Gas laws: notes, 14 Paper 1A and 2 Paper 2, plus the earlier sample B3-001.
- B.4 Thermodynamics (HL only): notes, 12 Paper 1A and 2 Paper 2, all HL.
- B.5 Current and circuits: one page in two parts (B.5a and B.5b); 16 Paper 1A and 2 Paper 2.
- C.1 SHM (with HL part): notes, 16 Paper 1A and 2 Paper 2, 6 of them HL.
- C.2 Wave model: notes, 12 Paper 1A and 1 Paper 2.
- C.3 Wave phenomena (with HL part): notes, 21 Paper 1A and 2 Paper 2, 8 of them HL.
- C.4 Standing waves and resonance (no HL content): notes, 16 Paper 1A and 2 Paper 2.
- C.5 Doppler effect (with HL part): notes, 14 Paper 1A and 2 Paper 2, 5 of them HL.
- D.1 Gravitational fields (with HL part): notes, 16 Paper 1A and 2 Paper 2 plus the earlier sample D1-001, 7 of them HL.
- D.2 Electric and magnetic fields (with HL part): notes, 16 Paper 1A and 2 Paper 2, 7 of them HL.
- D.3 Motion in electromagnetic fields (no HL content): notes, 14 Paper 1A and 2 Paper 2.
- D.4 Induction (HL only): notes, 12 Paper 1A and 2 Paper 2, all HL.
- E.1 Structure of the atom (with HL part): notes, 15 Paper 1A and 2 Paper 2, 6 of them HL.
- E.2 Quantum physics (HL only): notes, 11 Paper 1A and 3 Paper 2, all HL.
- E.3 Radioactive decay (with HL part): notes, 18 Paper 1A and 3 Paper 2, 7 of them HL.
- E.4 Fission (no HL content): notes, 11 Paper 1A and 2 Paper 2.
- E.5 Fusion and stars (no HL content): notes, 13 Paper 1A and 2 Paper 2.

## Images
- Creative Commons / public-domain photos on A.1, B.1, C.3, C.4, D.2, D.3, E.1, E.3 and E.5, each credited in its caption and on the About page.
- E.5 HR diagrams: ESO's diagram (CC BY 4.0) and AstroOgier's diagram with lines of constant radius (CC0). These replaced the CSIRO ATNF diagram, whose terms allow only personal use.

## Other pages
- Skills page (Tool 3), ToK page, About page with joke of the day.
- IA page (`experimental/ia.html`): built from the Physics guide, the IA Introduction slides (embedded from Drive), `IA/Teacher Created Gudance/2026 - Student IA Workbook.docx` (main source), the IA Clarifications notes, Tsokos's "The Scientific Investigation" and the 2025 subject reports. Links (Drive "Guidance" folder, school accounts only): Student IA Workbook, Draft Self-Review, Final Submission Check, Exemplar A and B reports, Exemplar B with margin notes, comment sheets for both exemplars. The three exemplar PDFs were re-saved as fresh files on 2026-10-05 to remove student names left in older saved versions.
- CSP page (Survival on a Tropical Island; written for any year as Day 1–3): embeds the Session Briefings Google Slides and links the Student Guide, Session Worksheets and Colony Pitch Guide (school accounts only); physics toolkit.

## Site technical work (October 2026 audit)
- Internal files (`CLAUDE.md`, `tools/`, …) no longer published (`_config.yml`).
- `tools/check.mjs` checker, run by GitHub Actions on every push; typed-answer marking moved to `js/numeric.js` and tested.
- Question bank keeps working if a file or question is broken.
- Accessibility: focus and screen-reader feedback in the question bank, skip link, focus outlines, reduced motion.
- MathJax pinned to 4.1.3.
- 404 page, robots.txt, sitemap.xml, favicon, link-preview (Open Graph) tags and descriptions on every page.

## XYZ visual identity (October 2026)
- Light-orange XYZ motif: home-page hero ("The XYZ of DP Physics") with animated axes and orbit, category cards with line icons, section-heading accents, a small axes mark in the header on every page, and an orange underline for the current menu item. Styles are in the "XYZ motif" section at the end of `css/style.css`.

## Still to do
From the October 2026 site audit, in priority order (P1 = high value, P2 = useful, P3 = future/optional).
Ask the user before starting any item marked "decide".

### P1: content
- **Paper 1B (data-based) questions.** Infrastructure built (October 2026, branch `paper-1b`): generator, validator, graphs, diagram components and tests in `tools/1b/` (see its README). Three prototype datasets: D3-B01 current balance, B5-B01 internal resistance, E3-B01 half-life; plus the older hand-written B3-001 (now level `SL_HL`). Physics audit (6 October 2026): models now explicit and built from vetted, tested laws (`tools/1b/laws.mjs`); E3-B01 measurement model corrected (counts over each interval, not an instantaneous rate) and regenerated; `--audit` report added. Open MEDIUM/LOW audit items: B5 parameters too close to Nov 2025 P2 (r ≈ 0.8 Ω) and its x-uncertainty, B5 noise justification, E3 omitted point with no plotting task, D3 clamp rod in the gap, seed and accepted-range policies, mark-scheme lock on typed answers, small graph text on phones. Five pilots (7 October 2026): the three approved prototypes plus A1-B01 (horizontal launcher, repeated readings, R² against h, testing a manufacturer's claim) and C4-B01 (standing waves on a string, f against 1/L, μ, third-harmonic prediction). New laws (projectile range, weight, string harmonic), repeated readings with a trials table, relative noise, and a standing-wave diagram check. Coverage gap: no thermal-physics pilot yet (B.1 or B.3 would be next). Next: the user reviews the two new pilots; then the agreed pilots (A.1 spring launcher with repeat readings, C.4 standing waves on a string), then the 20-topic coverage plan. Still to build when needed: repeated trials (mean ± half-range), more diagram components (launcher, string and pulley), and an interactive "draw a line" tool (later).
- **Practicals page.** Still a placeholder with three cards. Build from `experimental-programme/practicals` in physics-source.
- **Extended essay page.** Still a placeholder. Build from `EE/` in physics-source.
- **Resources page Drive links.** All still "coming soon"; needs the folder links from the user.

### P2: useful
- **Teacher question sets by link and a print view** (decide). E.g. `questions.html?ids=A1-003,A2-010` for homework sets, and a clean printed worksheet with or without mark schemes. The user will decide the details.
- **Graph and uncertainty tool.** One page where students paste data, linearise it and see error bars, a best-fit line and steepest/shallowest gradients. Serves the IA, Paper 1B and Tool 3 at once. Needs tests for its maths.
- **Progress export/import, random quick quiz, spaced review.** All possible without accounts, using the progress already saved in the browser. Export lets students move progress between devices or hand it in; quizzes and spaced review support retrieval practice.
- **Guiding questions on topic pages.** Show each topic's guiding questions from the IB guide (in our own words) near the top, linking the notes to the guide's framing.
- **Tools 1–2 and the Inquiry process.** Link the practicals to the guide's Tool 1 (experimental techniques), Tool 2 (technology) and Inquiry 1–3; only Tool 3 (Skills page) is covered now.
- **PhET simulations.** Link or embed free, openly licensed PhET simulations on the relevant topic pages, instead of building our own.
- **Layout checks.** The menu at 768 px (tablets) may wrap onto two lines (consider raising the 760 px breakpoint); check the "Σ Equations" button never covers the question bank's "Next" button on small phones.

### P3: future/optional
- **Site search.** A small search index of page headings and question stems, searched in the browser. Worth it once students revise across many topics.
- **Split question files by topic.** Only needed past about 1,500 questions, when loading every file at once gets slow on phones. Keep all question ids unchanged.
- **XYZ favicon and social card** (decide). The browser-tab icon and the link-preview image are still the old blue design.
- **More XYZ motif uses** (decide). Possible later: topic-page headers, the question bank's empty or loading states. Keep it subtle.
- **No-JavaScript message.** A `<noscript>` line with a home link, since the menu is drawn by JavaScript.

### Not planned (agreed in the audit)
- No framework, build step, backend, accounts or student analytics without a concrete teaching need and school approval.
- No student-facing AI chatbot. No custom-built physics simulations where PhET exists.
