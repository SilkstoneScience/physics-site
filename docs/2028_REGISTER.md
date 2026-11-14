# The 2028 syllabus notes: register and clean-up plan

The IB updated the Physics guide and data booklet for **first exams in 2028**. Until then the site serves two groups: students sitting exams in 2026–2027 (2025 guide) and students sitting from 2028. So changed content is marked with purple "New for 2028" / "Changed for 2028" notes.

**After the May 2027 exams** (the last session on the 2025 guide for this school) every student is on the 2028 guide. Students then don't need to know that anything changed, so **all of these notes come off** (teacher's decision, 14 November 2026). This file lists every one, so the clean-up is a checklist and nothing is missed. This file is not published on the website.

## Keeping this register up to date

- The list at the bottom is written by a tool: `node tools/list-2028.mjs --write`. It scans every published page and data file for "2028", "2027" and the `y2028` / `new2028` markers.
- The checker (`node tools/check.mjs`) warns when a 2028 note has been added, changed or removed without the list being rewritten. So whenever any work adds a 2028 note, run the tool before committing.
- Always mark 2028 content in the standard ways (below), and always put the year "2028" or "2027" in any sentence about the change, so the tool can find it. If something can't be found that way, add it by hand to "Things the tool can't see".

## The standard markers (what the clean-up removes)

| Marker | Where | Clean-up after May 2027 |
|---|---|---|
| `<p class="new2028-note">…</p>` | under a topic page's lead paragraph | delete the whole paragraph |
| `<span class="tag y2028">New for 2028</span>` / `Changed for 2028` | headings, paragraphs, worked examples, checks | delete the tag |
| `<div class="new2028">` / `<p class="new2028">` | the purple line round a new block | keep the content, remove the class (and the `<div>` if it has no `id`) |
| Sentences such as "The 2028 guide says…", "new in the 2028 data booklet", "for exams from 2028" | inside those blocks | reword as plain content, with no mention of a change |
| `"y2028": true` | questions in `questions/*.json` | delete the field (the purple tag disappears) |
| `'2028'` as the fourth item of an equation | `DATA_BOOKLET` / `DATA_BOOKLET_MATHS` in `js/site.js` | delete the item; delete the "New for 2028" sentences in the `note` lines |
| `y2028` and the `.Y` syllabus IDs | generated Paper 2 recipes (`tools/p2/questions/`, `tools/p2/syllabus.mjs`) | change the recipes, rebuild, and re-approve each question (its fingerprint changes) |

## Clean-up plan for after May 2027

Do it as one piece of work, in a worktree, and check each step in the preview.

1. **Run `node tools/list-2028.mjs`** and work through the list, file by file, using the table above.
2. **Content that exists only for exams up to 2027** needs the teacher's decision, not just a tag removed:
   - **Self-induction** (`themes/d4.html#self`, the D.4 revision sheet and slide notes, question **D4-011**): the 2028 guide no longer mentions it. Options: delete the section and retire the question, or keep the section as unmarked background. (A question's `id` is never reused or renamed; a retired question is removed from the file.)
   - Any other "for exams before 2028" sentence the list shows.
3. **Data booklets:** make the 2028 booklet the only one. In `js/site.js`: `DATA_BOOKLET_URL` takes the 2028 annotated booklet's address, `DATA_BOOKLET_2028_URL` and the 2025 entry of `EXAM_BOOKLETS` go, with their menu items and the equations panel's "2025 ↗ · 2028 ↗" links. On `resources.html`: one annotated-booklet card and one exam-copy card, with "2028" and "new" taken out of their wording.
4. **Equations panel notes** (`note:` lines in `js/site.js`): remove "New for 2028:" sentences; keep the physics.
5. **Revision sheets** (`teachers/*.json`) and **lesson slide data** (`teachers/slides/*.json`): remove the tags and "new for 2028" labels and notes; then mark the summaries as checked (`node tools/check-teachers.mjs --reviewed <topic>`).
6. **The teacher's lesson decks** on Drive and in physics-source (not in this repository): delete the "Changes for exams from 2028" slide and the purple "New for 2028" labels. The teacher checks and copies decks; this is only a reminder.
7. **Rules and tools:** remove the 2028 marking rules from `CLAUDE.md` (the "2028 syllabus changes" bullet, the `y2028` paragraph of the question bank format, `--theme-d` uses for the tag in `css/style.css`: `.tag.y2028`, `.new2028`, `.new2028-note`), the `y2028` handling in `js/questions.js` and `js/site.js`, and the `NEW_2028` list in `tools/p2/syllabus.mjs`. Update references to "the 2025 guide" and "the 2025 data booklet" in `CLAUDE.md` and `CLAUDE.local.md` to the 2028 documents.
8. **Finish:** `node tools/list-2028.mjs` should print "0 places" (apart from booklet file names, if any remain). Then delete this file, `tools/list-2028.mjs` and its line in `tools/check.mjs`, rebuild the search index (`node tools/check.mjs --sitemap`) and record the changed pages in the audit record.

## Decisions already made about 2028 marking (until the clean-up)

- Only relationships the 2028 update specifies are tagged; clarified wording is not (list in `CLAUDE.md`, question bank format).
- B.1: the two "synonymous" statements (luminosity is radiated power; apparent brightness is intensity) stay tagged with I = P/A, and question B1-020 is tagged to match (audit decisions D9 and T4).
- E.5: the Chandrasekhar and Oppenheimer–Volkoff limits stay named, untagged, in the evolution lists as well as in the tagged block (audit decision D33).
- D.4: self-induction is marked "Changed for 2028" on the page; question D4-011 says in its explanation that it is needed only up to 2027 (audit decision T7).

## Things the tool can't see

- The teacher's lesson decks (step 6 above).
- The annotated 2028 data booklet itself (a PDF on Drive).
- Pictures: none carry a 2028 label at present.

## The list

<!-- LIST:START (written by tools/list-2028.mjs --write; do not edit by hand) -->
132 places in 46 files.

### Topic pages

- `themes/b1.html` (6)
  - line 41: New for 2028 For exams from 2028: luminosity means radiated power; intensity $I = \frac{P}{A}$ is new (and in the data booklet); and apparent brightness is the intensity …
  - line 453: New for 2028 The 2028 guide states that luminosity is synonymous with radiated power : the luminosity of any body (a star, a lamp filament, a planet) is the total power i…
  - line 474: the box drawn round a "New for 2028" block (class new2028)
  - line 475: Intensity New for 2028
  - line 479: …2$, so intensity is in $\text{W m}^{-2}$. This equation is new in the 2028 data booklet.
  - line 492: New for 2028 The 2028 guide states that apparent brightness is synonymous with intensity : $b$ is simply the intensity $I = \frac{P}{A}$ of a star's light where it is rec…
- `themes/b3.html` (3)
  - line 38: New for 2028 For exams from 2028 the guide adds the difference between rms speed and average speed, and why rms is used .
  - line 259: the box drawn round a "New for 2028" block (class new2028)
  - line 260: Root-mean-square speed New for 2028
- `themes/c2.html` (3)
  - line 38: New for 2028 For exams from 2028 the guide adds that the intensity of a wave is proportional to the square of its amplitude, $I \propto A^2$ .
  - line 274: the box drawn round a "New for 2028" block (class new2028)
  - line 275: Intensity and amplitude New for 2028
- `themes/c4.html` (2)
  - line 38: New for 2028 For exams from 2028 the guide adds that you should derive the wavelength–length relationship for the $n$th harmonic and see how it sets the harmonic names , …
  - line 203: New for 2028 The 2028 guide asks you to work this out yourself: find the relationship between the wavelength and the length for the $n$th harmonic ($L = \frac{n\lambda}{2…
- `themes/d1.html` (2)
  - line 38: New for 2028 For exams from 2028 the guide says that all students should be able to deduce Kepler's third law for circular orbits , from the centripetal and gravitational…
  - line 212: New for 2028 From the 2028 exams, the guide says that all students (SL and HL) should be able to deduce Kepler's third law from the centripetal force and gravitational fo…
- `themes/d2.html` (1)
  - line 320: New for 2028 The size of the field around a long straight wire, $B = \dfrac{\mu_0 I}{2\pi r}$, is now in the data booklet. It is used in D.3: see D.3 The field of a long …
- `themes/d3.html` (5)
  - line 38: New for 2028 For exams from 2028 the guide and data booklet add the magnetic field strength of an infinitely long straight wire, $B = \frac{\mu_0 I}{2\pi r}$ , for SL and…
  - line 261: the box drawn round a "New for 2028" block (class new2028)
  - line 262: The field of a long straight wire New for 2028
  - line 263: …wire are circles centred on the wire (D.2, right-hand grip rule). The 2028 data booklet adds the size of this field at a distance $r$ from an infinitely long wire carryin…
  - line 269: Worked example: a compass near a cable New for 2028
- `themes/d4.html` (2)
  - line 38: Changed for 2028 For exams from 2028 the guide no longer mentions self-induction ; everything else in D.4 is unchanged.
  - line 309: Changed for 2028 For exams before 2028, only a qualitative understanding of self-induction is needed. The 2028 guide removes self-induction from the guidance altogether (…
- `themes/e3.html` (3)
  - line 38: New for 2028 For exams from 2028, HL students should know that the strong nuclear force's range is of order $10^{-15}$ m. This page already covers it.
  - line 116: the box drawn round a "New for 2028" block (class new2028)
  - line 122: HL New for 2028 Its range is of order $10^{-15}$ m, about the size of a nucleon.
- `themes/e5.html` (3)
  - line 38: New for 2028 For exams from 2028 the guide adds the role of the Chandrasekhar and Oppenheimer–Volkoff limits as an SL understanding.
  - line 278: the box drawn round a "New for 2028" block (class new2028)
  - line 279: The role of the Chandrasekhar and Oppenheimer–Volkoff limits New for 2028

### Question bank (hand-written)

- `questions/b.json` (3)
  - line 1926: question B1-018: "New for 2028" tag
  - line 1963: question B1-020: "New for 2028" tag
  - line 1982: question B3-020: "New for 2028" tag
- `questions/c.json` (3)
  - line 1617: question C2-015: "New for 2028" tag
  - line 1636: question C2-016: "New for 2028" tag
  - line 1675: question C4-021: "New for 2028" tag
- `questions/d.json` (5)
  - line 340: question D1-018: "New for 2028" tag
  - line 1474: question D4-011: …ke a spark. (Self-induction is needed, qualitatively, for exams up to 2027; for exams from 2028 the guide no longer mentions it.)"
  - line 1647: question D1-021: "New for 2028" tag
  - line 1684: question D3-018: "New for 2028" tag
  - line 1703: question D3-019: "New for 2028" tag
- `questions/e.json` (3)
  - line 1890: question E5-015: "New for 2028" tag
  - line 1981: question E3-024: "New for 2028" tag
  - line 2018: question E5-017: "New for 2028" tag

### Question bank (generated: change the recipe in tools/, then rebuild and re-approve)

- `questions/p2.json` (5)
  - line 844: question B3-P01: "New for 2028" tag
  - line 1756: question C4-P01: "New for 2028" tag
  - line 2068: question D1-P02: "New for 2028" tag
  - line 2291: question D3-P01: "New for 2028" tag
  - line 2801: question E5-P01: "New for 2028" tag

### Equations panel, menu and shared code

- `css/style.css` (4)
  - line 176: /* "New for 2028": content added or changed in the 2028 guide and data booklet (first exams 2028). Theme D's violet, so it
  - line 178: .tag.y2028 { background: var(--surface); border: 1px solid var(--theme-d); color: var(--theme-d); }
  - line 179: .new2028 { border-left: 4px solid var(--theme-d); padding-left: 12px; margin: 14px 0; }
  - line 180: .new2028-note { background: var(--surface); border: 1px solid var(--border); border-left: 5px solid var(--theme-d); border-radius: var(--radius); padding: 8px 14px; margi…
- `js/questions.js` (1)
  - line 360: ${q.y2028 ? ' New for 2028 ' : ''}
- `js/site.js` (25)
  - line 58: // The annotated 2028 data booklet (first exams 2028), shared with school accounts. Used in the same places as DATA_BOOKLET_URL.
  - line 59: window.DATA_BOOKLET_2028_URL = 'https://drive.google.com/file/d/1qBKKdonH8niolrCUezJUjftQBiIURMZ3/view';
  - line 61: …a booklet on Google Drive (school accounts only): 2025 for exams 2025–2027, 2028 for exams from 2028.
  - line 62: … and the two cards on the Resources page (data-exam-booklet="2025" / "2028").
  - line 65: '2028': 'https://drive.google.com/file/d/1UMJv_T_bHSSDJqFKM_dzzD-zZcUjCZU2/view',
  - line 69: …rom the 2025 IB Physics data booklet (same symbols), updated from the 2028 data booklet (first exams 2028);
  - line 71: // Each equation is [label, TeX, HL?, '2028'?]: a third item 'true' marks it HL only; a fourth item '2028' marks it as new
  - line 72: // in the 2028 data booklet (shown with a "New for 2028" tag). An equation the booklet merely rewrote is simply updated, with no tag.
  - line 154: ['Intensity (power per unit area)', 'I = \\frac{P}{A}', false, '2028'],
  - line 157: note: 'New for 2028: $\\overline{E}_k = \\tfrac{3}{2}k_BT$ is for an ideal monatomic gas; luminosity means radiated power; apparent brightness is the intensity of the lig…
  - line 244: …th of a long straight wire', 'B = \\frac{\\mu_0 I}{2\\pi r}', false, '2028'],
  - line 357: …inties" and opened by default on the Skills page. Checked against the 2028 booklet, pages 2–3.
  - line 368: ['Surface area of a sphere', 'A = 4\\pi r^2', false, '2028'],
  - line 372: …\text{initial value}}{\\text{initial value}} \\times 100\\%', false, '2028'],
  - line 373: … value} + \\text{initial value}}{2}\\right)} \\times 100\\%', false, '2028'],
  - line 374: … \\text{actual value}}{\\text{actual value}} \\times 100\\%', false, '2028'],
  - line 375: …solute uncertainty}}{\\text{measured value}} \\times 100\\%', false, '2028'],
  - line 380: note: 'The four percentage equations are new in the 2028 data booklet, so that every exam uses the same definitions. More on these: the Skills page .',
  - line 517: ['Data booklet 2028 (exam copy)', EXAM_BOOKLETS['2028'], true],
  - line 528: ['Annotated data booklet 2028', DATA_BOOKLET_2028_URL, true],
  - line 749: const booklet2028Card = document.querySelector('#data-booklet-2028 a');
  - line 750: if (booklet2028Card) booklet2028Card.href = DATA_BOOKLET_2028_URL;
  - line 1091: const newTag = ' New for 2028 ';
  - line 1115: ? 'Open the annotated data booklet: 2025 ↗ · 2028 ↗ '
  - line 1134: ' ${label}${hl ? ' HL ' : ''}${mark === '2028' ? newTag : ''} $$${tex}$$ ').join('') +
- `js/slides.js` (1)
  - line 315: …classList?.contains('tag')) continue; // little tags such as "New for 2028" don't belong on a slide

### Revision sheet summaries

- `teachers/b1.json` (1)
  - line 28: …a sphere $A = 4\\pi R^2$). Doubling $T$ multiplies $L$ by 16. New for 2028 Luminosity means radiated power, for any body. Comparing with the Sun: $\\dfrac{L}{L_\\odot} = …
- `teachers/b3.json` (1)
  - line 20: …\rho$. Know the idea and the result, not the full derivation. New for 2028 rms speed : square the speeds, take the mean, then the square root. It is not the mean speed (1…
- `teachers/c2.json` (1)
  - line 28: …W m}^{-2}$) from a point source: $I = \\dfrac{P}{4\\pi r^2}$. New for 2028 $$I \\propto A^2$$ Intensity is proportional to the square of the amplitude : doubling $A$ give…
- `teachers/c4.json` (1)
  - line 16: …he pattern and count the half- or quarter-wavelengths in $L$. New for 2028 Derive $L = \\frac{n\\lambda}{2}$ (matching ends) or $L = \\frac{n\\lambda}{4}$ with $n$ odd (n…
- `teachers/d1.json` (1)
  - line 16: …, so the orbital speed and period depend only on $M$ and $r$. New for 2028 Deduce Kepler's third law (SL and HL): substitute $v = \\dfrac{2\\pi r}{T}$ to get $$T^2 = \\fr…
- `teachers/d2.json` (1)
  - line 28: …(anticlockwise current seen from an end means that end is N). New for 2028 The field of a long straight wire, $B = \\dfrac{\\mu_0 I}{2\\pi r}$, is now in the data booklet…
- `teachers/d3.json` (1)
  - line 24: …ong straight wire: concentric circles (right-hand grip rule). New for 2028 its size is $B = \\dfrac{\\mu_0 I}{2\\pi r}$: proportional to $I$, inversely proportional to $r…
- `teachers/d4.json` (1)
  - line 28: "html": " Changed for 2028 Qualitative only for exams before 2028; the 2028 guide no longer mentions it (inductance and RL circuits are not required either way). A changi…
- `teachers/e3.json` (1)
  - line 8: …ort range; it acts on protons and neutrons, not electrons. HL New for 2028 Its range is of order $10^{-15}$ m, about the size of a nucleon. "
- `teachers/e5.json` (1)
  - line 28: …up and right to red giants → across and down to white dwarfs. New for 2028 The role of the limits (they apply to the mass of the core left behind, not the original star):…

### Lesson slide data

- `teachers/slides/b1.json` (2)
  - line 1028: "notes": "New for exams from 2028. Intensity as I = P/A is in the 2028 data booklet."
  - line 1045: "notes": "New for exams from 2028. A tiny power gives an intensity comparable with direct sunlight at the Earth's surface. The eye then focuses the beam to a tiny spot, s…
- `teachers/slides/b3.json` (2)
  - line 230: "notes": "New for exams from 2028. The guide asks for the difference between rms velocity and average velocity, and why rms is preferred in the gas laws. The rms velocity…
  - line 307: "notes": "New for exams from 2028. The list is only to show the idea: the guide does not ask students to calculate an rms speed from a list of speeds. The rms speed is la…
- `teachers/slides/c2.json` (6)
  - line 224: "notes": "New for exams from 2028. The guide states only the proportionality; the fixed frequency and medium are the conditions that make it true, because the energy of e…
  - line 248: "notes": "New for exams from 2028. The guide asks only for the proportionality. This argument links it to the energy stored in a spring from A.3."
  - line 272: "notes": "New for exams from 2028. Students meet the inverse-square law in B.1. The common slip is to say that the amplitude also follows an inverse-square law. Warn them…
  - line 284: "notes": "New for exams from 2028. Ask what a graph of $I$ against $A^{2}$ would look like (a straight line through the origin)."
  - line 305: "notes": "New for exams from 2028. The open field matters: indoors, reflections from the walls would stop the simple $1/r$ pattern from holding."
  - line 326: "notes": "New for exams from 2028. The tone's frequency and the medium at the microphone do not change, so $I \\propto A^{2}$ applies. Point out the contrast: 96% of the …
- `teachers/slides/c3.json` (1)
  - line 1517: "notes": "New for exams from 2028. The link $I \\propto A^2$ in the last bullet is from C.2. Two slits give a central peak 4 times as intense as one slit; three give 9 ti…
- `teachers/slides/c4.json` (6)
  - line 242: "notes": "New for exams from 2028. The harmonic number comes from the relationship between $L$ and $\\lambda$, so the pattern after the first is the 3rd harmonic, with fr…
  - line 368: "notes": "New for exams from 2028. Students should be able to find this relationship from a sketch. The next pattern after the 3rd harmonic has five quarter-wavelengths: …
  - line 404: "notes": "New for exams from 2028. In any system, the $n$th harmonic has frequency $nf_{1}$, so the name always tells you the frequency multiple."
  - line 420: "notes": "New for exams from 2028. The change is the naming on the right, where $n$ is odd. The same results apply to strings and to pipes, because only the type of bound…
  - line 461: "notes": "New for exams from 2028. Only the last bullet is the change; the others apply to every exam session."
  - line 490: "notes": "New for exams from 2028. Students must name these the 3rd and 5th harmonics. A check on (c): $198 \\times 1.73 \\approx 343$ $\\text{m s}^{-1}$."
- `teachers/slides/d1.json` (2)
  - line 484: "notes": "New for exams from 2028. The derivation on the next slide is now expected of all students, SL and HL."
  - line 512: "notes": "New for exams from 2028. The 2028 guide says all students should be able to deduce Kepler's third law from the centripetal and gravitational force relationships…
- `teachers/slides/d2.json` (1)
  - line 1018: "notes": "New for exams from 2028. $B = \\mu_0 I/2\\pi r$ is now in the data booklet; the guide lists it under D.3, where students calculate with it, so here it only expl…
- `teachers/slides/d3.json` (4)
  - line 56: "notes": "New for exams from 2028. The 2028 data booklet adds this equation. Point out that $\\dfrac{\\mu_0}{2\\pi} = 2 \\times 10^{-7}$ $\\text{T m A}^{-1}$, which makes…
  - line 80: "notes": "New for exams from 2028. Lightning currents are typically tens of kiloamperes, so even 100 m away the brief magnetic pulse is as strong as the Earth's field."
  - line 103: "notes": "New for exams from 2028 (part b). Here the wire's field points the same way as the Earth's horizontal field, so the needle still points north. Ask where on the …
  - line 662: "notes": "New for exams from 2028 (step 1 only): the field of a long straight wire is now in the guide and data booklet. The force between parallel wires was already on t…
- `teachers/slides/d4.json` (1)
  - line 583: "notes": "Required for exams in 2025–2027, qualitatively only (inductance and RL circuits are not required). Changed for exams from 2028: the 2028 guide no longer include…
- `teachers/slides/e3.json` (1)
  - line 1247: "notes": "New for exams from 2028. The 2028 guide asks HL students to know that the range is of order 10⁻¹⁵ m. At even shorter distances (below about 0.5 × 10⁻¹⁵ m) the f…
- `teachers/slides/e5.json` (4)
  - line 945: …asekhar and Oppenheimer-Volkoff limits (from the guide for exams from 2028).",
  - line 970: "notes": "New for exams from 2028. The Oppenheimer–Volkoff limit is not known precisely, because the behaviour of matter at nuclear densities is uncertain: quote \"about …
  - line 982: "notes": "New for exams from 2028."
  - line 1000: "notes": "New for exams from 2028. A core of 0.6 solar masses is typical of a white dwarf left by a Sun-like star. Ask students why the second star must have exploded as …

### Other pages and data

- `ee/index.html` (1)
  - line 27: …om first idea to final submission. It is for essays first assessed in 2027.
- `experimental/database-kepler.html` (1)
  - line 37: This is Kepler's third law . Deducing it is New for 2028 in the syllabus. You can test it in two ways:
- `resources.html` (5)
  - line 47: …ata booklet with notes explaining the equations, for exams in 2025 to 2027. Opens in Google Drive. The equations for each topic are also in the Σ Equations button on ever…
  - line 48: the box drawn round a "New for 2028" block (class new2028)
  - line 49: Annotated data booklet 2028 The new IB physics data booklet for exams from 2028, with notes explaining the equations. Opens in Google Drive (school account).
  - line 52: …data booklet, exactly as you get it in the exam, for exams in 2025 to 2027. Opens in Google Drive (school account).
  - line 53: Data booklet 2028 (exam copy) The new clean IB physics data booklet for exams from 2028. Opens in Google Drive (school account).
- `scientists.json` (1)
  - line 813: …her. This is the Chandrasekhar limit (new in the guide for exams from 2028), and he won the 1983 Nobel Prize in Physics. ",
- `skills.html` (3)
  - line 246: … volume $= \frac{4}{3}\pi r^{3}$; surface area $= 4\pi r^{2}$ New for 2028 (in the data booklet from 2028)
  - line 262: the box drawn round a "New for 2028" block (class new2028)
  - line 263: New for 2028 From the 2028 exams, all four are printed in the data booklet, so every exam uses the same definitions. The booklet writes them in words:
- `think/concepts.json` (1)
  - line 1350: …\"intensity ∝ amplitude²\" in so many words; the guide for exams from 2028 does.) Cover one slit and the amplitude at the centre drops from $2A$ to $A$, so the intensity …
<!-- LIST:END -->
