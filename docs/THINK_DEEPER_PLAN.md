# Think deeper: plan (draft for the teacher's approval)

Status: **pilot built (November 2026), waiting for the teacher's check.** The teacher accepted all the proposals below (four pages, "What physicists think so far" as a reveal, automatic links from the ToK boxes, the pilot mix). One change: the A.2 "string breaks" challenge was swapped for "the tractor and the trailer" (Newton's third law), because the question bank already has a string-breaks question.

## 1. What it is

A new section for thinking beyond exam questions, with three collections plus the existing ToK page:

| Collection | What it is | Sorted by |
|---|---|---|
| **Concept challenges** | A picture and a short situation that tests conceptual understanding (in the spirit of Hewitt's Next-Time Questions, but all our own). Some multiple choice, some open "predict, then reveal". The reveal explains the physics and why the tempting wrong answer is wrong. | Theme and topic (A.1, A.2…), HL tagged |
| **Big questions** | Paradoxes, contradictions and unanswered questions that students can understand but that make them think harder (e.g. the Fermi paradox). | Kind: *Still unsolved* / *Solved, but surprising*, with topic tags |
| **Puzzles** | *Merged into the concept challenges (teacher's decision, 7 November 2026), keeping their PZ ids; `think/puzzles.html` forwards old links.* | — |
| **Knowledge and science** | The existing ToK/NoS page (`tok.html`, file name unchanged). | — |

Kept separate from the question bank (that stays exam-style).

## 2. Where it lives

- **Not in the main menu yet** (teacher's decision).
- The home page's "Reflect" card becomes **Think deeper** (label and title), with new text such as "Concept challenges, big questions, puzzles, and how physics produces knowledge." It links to the new hub page instead of straight to `tok.html`.
- *Proposal:* new folder `think/`:
  - `think/index.html`: the hub, with one card per collection (and one for the ToK page).
  - `think/concepts.html`: concept challenges, with a topic filter (theme → topic) and an "SL only" filter like the question bank.
  - `think/big-questions.html`: big questions, grouped by kind.
  - `think/puzzles.html`: puzzles.
- `tok.html` stays where it is (links and search results depend on it); its breadcrumb and a short note link back to the hub.
- *Proposal:* each topic page's "Knowledge and science" box ends with one extra line, e.g. "Think deeper: 3 concept challenges and 1 big question on A.1 →", added automatically by `js/site.js` (no clutter on theme pages, no hand-editing of 24 pages).

## 3. How each item looks

### Concept challenge
1. Title and topic tag (HL tag if needed).
2. Picture: our own SVG diagram, a Wikimedia Commons (CC BY / BY-SA / CC0 / public domain) photo, or an image from the teacher's own lessons or photos. **No AI-generated images.**
3. The situation and question.
4. Either four options (multiple choice) or "Make your prediction, then reveal" (open).
5. **Reveal**: the answer and explanation, including a "Clearing misconceptions" part (the teacher's name for it) on why the tempting wrong answer is wrong.
6. "I've thought about this" tick, saved only in this browser.

### Big question
1. Title, kind label (*Still unsolved* / *Solved, but surprising*), picture.
2. The puzzle in plain words, written so the puzzle is obvious from the question itself.
3. **Why it's puzzling**: a reveal, only when it isn't already obvious.
4. *Proposal:* **What physicists think so far**: a reveal, so a class can discuss first.
5. 2–3 discussion questions.
6. Links: related topic pages, NoS aspects (the guide's list) and ToK knowledge questions, and 1–2 good videos or articles (checked to work, open access).

### Puzzle
Same layout as a concept challenge, tagged *Just for fun* (and *Beyond the syllabus* where it is).

### Show on the board
A button on every item opens it full screen: large text and picture, answer hidden, a reveal button, and arrow keys / buttons for next and previous. For lesson starters.

## 4. How it's built (*proposal*, no new libraries or services)

- Content lives in data files, like the question bank: `think/concepts.json`, `think/big-questions.json`, `think/puzzles.json`. One script, `js/think.js`, draws the cards, filters, reveals, ticks and board mode. Adding an item later = adding one entry to a file.
- Each item has a permanent `id` (`CC-A1-01`, `BQ-01`, `PZ-01`), never renamed, because the ticks are saved against it.
- Images in `images/think/`, compressed (≤ 1200 px wide, ideally < 200 KB), credited under the picture and on the About page.
- `tools/check.mjs` checks the files: unique ids, known topics, images exist and have alt text and credits, every multiple-choice item has four options and an answer, every big question has 2–3 discussion questions, all links point somewhere real.
- Pages work at 375 px wide and in dark mode; the board mode is checked on a projector-sized window.

## 5. Sources and copyright

- **Next-Time Questions** (teacher's Drive folder): Paul Hewitt's. Their wording and pictures are copyrighted, but ideas and concepts aren't (teacher's decision, November 2026): we use ones that link well to the DP syllabus freely, including the same situation where it tests the idea best. Every question is written in our own words, with our own numbers and a newly drawn picture. They're listed in a private tracking note (not on the site) so we don't reuse the same idea twice.
- Wikimedia Commons photos: licence and author checked on each file page.
- The teacher's lesson images: allowed, except images that are themselves from textbooks or IB papers.

## 6. Pilot (to check together before anything else)

*Proposal:* 6 Theme A concept challenges, 5 big questions, 2 puzzles.

**Concept challenges (Theme A)**
1. A.1: A ball thrown straight up: what is its acceleration at the very top? (multiple choice)
2. A.1: One ball dropped, one thrown sideways from the same height at the same moment: which lands first? (predict, then reveal)
3. A.2: A truck hits a fly: which feels the bigger force? (multiple choice)
4. A.2: A ball whirled on a string; the string breaks: which path does it take? (four drawn paths)
5. A.3: Two tracks of the same height, one with a dip: which ball arrives first, and which is faster at the end? (predict, then reveal)
6. A.4 (HL): A spinning skater pulls their arms in and speeds up: where does the extra kinetic energy come from? (open)

**Big questions**
1. *Still unsolved*: The Fermi paradox: if the galaxy is so old and so big, where is everybody? (E.5, D.1)
2. *Solved, but surprising*: Olbers' paradox: why is the night sky dark? (B.1 inverse-square law, E.5)
3. *Solved, but surprising*: The twin paradox: if each twin sees the other's clock run slow, who ends up older? (A.5, HL)
4. *Still unsolved* (partly): The arrow of time: the laws of motion work the same backwards, so why can't you unscramble an egg? (B.4 entropy)
5. *Still unsolved*: Dark matter: galaxies spin too fast for the matter we can see. What's missing? (D.1, E.5)

**Puzzles**
1. A kilogram of feathers or a kilogram of gold: which weighs more? Reveal: the same weight (*mg*), but on a scale in air the feathers read about 1 g less, because of upthrust on their larger volume (about 0.8 L of keratin, not the fluffy pile).
2. A rock in a rowing boat is thrown overboard into a pond: does the water level rise, fall or stay the same? (*Beyond the syllabus*)

## 7. Steps after approval

1. Go through the Next-Time Questions folder and list the ones that match the DP syllabus (ideas only).
2. Build the hub, the three pages, `js/think.js`, board mode and the checker rules, with the pilot items.
3. Change the home-page card.
4. Test (phone width, dark mode, board mode), run the checker, then check the pilot together before writing more.
5. Later: 2–3 concept challenges per topic for Themes A–E, more big questions and puzzles, the automatic links from the topic pages' ToK boxes, and possibly a "challenge of the week" (only if the home page stays uncluttered).

## 8. Open points for the teacher

- Is the `think/` folder with four pages right, or should all three collections share one page with tabs?
- Should "What physicists think so far" be a reveal (for class discussion) or shown straight away?
- Are the automatic "Think deeper" links at the end of each topic's ToK box wanted?
- Are the pilot items the right mix?
