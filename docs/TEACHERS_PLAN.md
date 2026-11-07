# For Teachers: revision-sheet builder (plan)

Status: **all 24 subtopics built (November 2026)**, with an SL/HL level choice (see section 6d); still marked "In development" (tag on the page and its card, plus a work-in-progress notice). Linked from a **home-page card only** ("For teachers"); teacher's decision: no main-menu item yet. The About page's copyright section says sheets may be copied for classroom use. The A.1 summary was checked against the OCR'd Kirk study guide (text in the reference cache), adding five points. Files: `teachers/index.html`, `teachers/index.json` (the subtopics on offer), `teachers/a1.json`, `js/teachers.js`, `css/teachers.css`, `tools/check-teachers.mjs` (called from `tools/check.mjs`); teacher videos are added to the weekly link check. `?print=student` / `?print=teacher` shows a sheet in print layout (used to test the PDFs with headless Edge).
## 1. What it is

A page, `teachers/index.html`, where any teacher picks **one subtopic** (A.1, A.2, …; no combining topics) and builds:

- a **student revision sheet**, and
- a **teacher key / notes** for the same sheet.

Both download as **PDF** (the browser's own "Save as PDF", with a print layout designed for A4). MathJax and SVG diagrams print correctly this way. An editable Word version may come later; it is harder because Word can't read MathJax.

## 2. Parts of the student sheet (in this order)

| Part | Default | Source |
|---|---|---|
| Hook: concept challenge and/or big question | Concept challenge on | `think/concepts.json`, `think/big-questions.json` (matched by topic) |
| 1 short ToK question | On | The topic page's "Knowledge and science" box |
| 1 short NoS idea | On | The same box |
| Revision notes | On | **New condensed summary** per subtopic (section 4) |
| Worked examples | On (can be turned off) | Topic page `div.worked`, **solutions visible** on the sheet |
| Self-test | On | Question bank, Paper 1A and Paper 2 |

The teacher can tick parts on or off, and set the number of self-test questions.

**Self-test questions:** random by default, with a **Swap** button on each question, plus a **"Choose questions myself"** mode listing every question for that subtopic.

## 3. Teacher key / notes

- Answers and mark schemes for the self-test; concept-challenge reveal and "Clearing misconceptions"; big-question "What physicists think so far".
- **Discussion prompts** for the ToK question and the NoS idea (new writing, per subtopic).
- **Labs:** read automatically from `experimental/practicals.html` (a card whose subtitle starts with the topic code, e.g. "A.2 …"; "Coming soon" cards without a link are left out). Plus an **"also useful for"** list in each subtopic's teacher file, for labs that suit a second topic (e.g. the pendulum lab, C.1 on its card, also useful for A.1). The page must check that each "also useful for" entry points to a lab page that exists.
- **Simulations:** read automatically from the topic's section of the Simulations list (`tools/build-links.mjs`, keys `a1` … `e5`).
- **"Learn more" video ideas:** 2–3 specific videos per subtopic, for use in the lesson or to share with students. Each confirmed with YouTube's oEmbed lookup before adding, and included in the weekly link check (`tools/check-links.mjs`).
- **No lesson slides** (they are shared with school accounts only).

## 4. Condensed revision summaries

- One data file per subtopic, e.g. `teachers/a1.json`, holding: the summary, the ToK/NoS discussion prompts, the video ideas and the "also useful for" labs.
- Written in our own words **from the site's own topic page**, checked against the guide's Understandings. The Kirk Oxford Study Guide (`Kirk Study Guide 2023.txt` in the reference cache) is used **only as a checklist** of what matters most: it is copyrighted reference, never copied.
- Possible later extra (ask first): show the summaries on the topic pages as "Quick revision".

## 5. Reminder when a topic page changes

Each teacher file stores a **fingerprint** of its topic page's text (a short code computed from the page; it changes whenever the page's content changes). `node tools/check.mjs` **warns** (doesn't fail) when a topic page's fingerprint no longer matches, e.g. "teachers/a1.json: themes/a1.html has changed since its summary was last checked". After looking at the summary, the teacher (or Claude) runs a command to record the new fingerprint. A fingerprint is used rather than file dates because dates aren't reliable across two computers and GitHub.

## 6. Other decisions

- **Shareable links:** the page address stores the choices (topic, parts, chosen question ids), so a teacher can bookmark or share an exact sheet. If a saved link names a question that no longer exists, the page picks a replacement.
- **Copyright footer** on both documents: © Mark Silkstone, may be copied for classroom use, with a link to the site. Add a matching line to `about.html#copyright`.
- **The teacher key is public** (a static site can't hide it). Accepted: the mark schemes are already visible in the question bank.
- **Extended Essay:** removed from the main menu, added as a card on the Experimental Programme landing page (`experimental/index.html`); the home-page card stays. `ee/index.html` keeps its name.
- **Still to decide:** whether "For teachers" goes in the main menu or is only a home-page card.

## 6d. SL and HL (November 2026)

Teacher's decision: the builder has a **Level** choice. "SL and HL" (the default) shows everything, with HL notes, worked examples and questions tagged HL; "SL only" leaves out all HL content. HL-only subtopics (`hl: true` in `window.SYLLABUS`) are always HL, and the choice is locked. What counts as HL:
- revision summary: an entry with `"hl": true`, or a part with `class="hl-only"` (written `<li class="hl-only"><span class="tag hl">HL</span> …</li>`); HL-only topics need no marks (the checker warns if they have any, or if a topic with no HL content has some);
- worked examples: those inside the page's `div.hl-zone`, or with an HL tag in their heading;
- questions, concept challenges and big questions: `"level": "HL"`.
The level is kept in the page address (`level=SL`).

**How A.2–E.5 were written:** one drafting helper per theme (from the topic page, checked against the guide's Understandings and the Kirk study guide as a checklist only; videos confirmed with YouTube oEmbed), then an independent reviewer per theme or two (physics, HL marks, 2028 tags, wording copied from Kirk, history in the prompts). Every fix the reviewers proposed was applied; the page fingerprints were recorded after review.

## 6e. Oracy activity (November 2026)

Teacher's request: each teacher file has an `oracy` activity for the teacher notes (tick box "Oracy activity", on by default; it never appears on the student sheet). About 60–90 words: the structure and timing (ABC discussion, opinion line, think–pair–share, explain it to a younger student, hot seat, odd one out, talk tokens, structured debate; varied across topics), a physics claim worth arguing over (SL content, so it suits SL sheets), 2–3 sentence starters, and "Listen for:" what a strong answer includes. Several restate a concept challenge for the topic, which suits a sheet that uses that challenge as its hook.

## 6b. Essential skills sheets (agreed, built LATER)

**Teacher's decision (November 2026): build the theme/topic sheets first; trial the skills sheets afterwards.** The design below is approved but not to be started until the topic sheets are working.

- Besides the subtopics, the teacher can choose **Essential skills**, then tick **sub-skills** (the Skills page's numbered sections) under its four parts: (1) numbers, units and maths, (2) measurement and uncertainty, (3) tables and graphs, (4) vectors. Ticking a part ticks all its sub-skills; any mix across parts is allowed.
- **Notes:** a condensed summary **per sub-skill** (so any selection can be assembled), written from `skills.html`; worked examples from the chosen sections.
- **Question counts (all sheets):** the teacher chooses how many. Topic sheets: up to 10 Paper 1A and up to 5 Paper 2. Skills sheets: Paper 1B, teacher's choice. Never allow more than the bank has for the current selection (show "N available").
- **ToK and NoS:** from the Skills page's own "Knowledge and science" box.
- **Self-test: Paper 1B questions.** Each 1B question already lists the skills it tests (`skills` in `questions/1b.json`, e.g. `percentage-uncertainty`, `linearisation`). A small lookup table maps those tags to the four parts. Only 20 questions are published so far, and none mainly test vectors or units, so part 4 (and maybe part 1) would use Paper 1A/2 skills questions or wait for new 1B batches. A 1B question is a whole dataset with several parts, so the count is small (1–3).
- **Concept challenges:** they fit well (measurement and graphs are full of misconceptions: precise vs accurate, whether averaging removes a systematic error, whether a line must pass through the origin). They need a new topic code (e.g. `"Skills"`) that `js/think.js` and `tools/check.mjs` accept, so add it **after** the concept-challenge task is merged.

## 6c. Follow-up: choosing sub-parts of a topic (agreed idea, not started)

Teacher's decision (November 2026): keep the trial as it is for now; come back to this later.

- **Worked examples move inside the notes**, each straight after the summary part it belongs to (as on the topic pages), so choosing a sub-part brings its worked examples. The "Worked examples" tick box stays.
- **Sub-part tags on questions:** a new optional field, e.g. `"sections": ["projectiles"]`, using the topic page's section ids (`describing`, `graphs`, `suvat`, `freefall`, `projectiles`, `relative`, `drag` for A.1). Never change a question's `id`. The checker validates every tag against the page.
- **Questions that cover several sub-parts** list them all, main one first. The "all its sub-parts must be chosen" rule was **rejected by the teacher** (it leaves too few Paper 2 questions). Proposed instead: a question is offered when its **main** sub-part is chosen; Paper 2 parts are tagged one by one, and a part that uses a sub-part not on the sheet is labelled on the student sheet (e.g. "Also uses: fluid resistance") and noted in the teacher notes. Parts are never removed, because later parts often build on earlier answers. **Teacher's decision (November 2026): this rule ("Option 1: main sub-part, with labels") is the one to use, but the sub-part choice itself waits until there are more Paper 2 questions; sheets stay whole-topic for now.** The tags are added now (to the hand-written questions, and to every new question), checked by `tools/check.mjs`.
- **Tagging done (November 2026):** all 453 hand-written questions (`questions/a.json` … `e.json`) are tagged, per part for structured questions. Method: two independent blind taggings per theme; 343 agreed fully; 85 agreed on the main section, and kept only the extra tags both chose; the other 25 (different main section, or a part with no tag in common) were settled by reading the question against the topic page. Checked by `tools/check-sections.mjs` (in `tools/check.mjs`). New questions are tagged when written (rule in CLAUDE.md). **Generated questions tagged too (November 2026, teacher agreed):** all 20 Paper 1B and 12 short Paper 2 questions, tagged in their recipe files with the same two-blind-pass method (15 identical; 11 settled by reading). The generators pass the tags through, and both review fingerprints leave them out (Paper 1B lists its fields; Paper 2's `canonicalContent` removes them); checked before and after: every review status and fingerprint unchanged, and the built questions identical apart from the tags. The 4 linking questions aren't tagged.
- **A.1 coverage found (November 2026):** Paper 1A: describing motion 4, graphs 7, equations of motion and free fall 5, projectiles 2, relative velocity 2, fluid resistance 2. Paper 2: graphs 1 (A1-P02), projectiles + fluid resistance 1 (A1-P01). Thin parts need about 3 more Paper 1A questions each; Paper 2 is the main gap.

## 7. Order of work

1. Move the Extended Essay menu link. **Wait until the concept-challenge task (branch `worktree-think-batch-2`) has been merged into `main`** (teacher's decision), because both edit `js/site.js`.
2. **A.1 pilot:** `teachers/a1.json` (summary, prompts, videos), the builder page, PDF layout, fingerprint warning. Teacher checks it in the preview before it goes live.
3. Concept challenges for the remaining topics (teacher adds the extra labs meanwhile).
4. Teacher files for A.2, A.3 and onwards.
5. Later: trial the essential skills sheets (section 6b).
