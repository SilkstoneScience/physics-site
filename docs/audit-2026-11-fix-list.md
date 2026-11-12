# Accuracy audit of the 24 topic pages: fix list (12 November 2026)

Every page was checked by one reviewer, then every point was re-checked by a second, independent reviewer. This is the list as it was before any fixes. Parts 1 and 2 are now done: see docs/ACCURACY_AUDIT.md for the outcomes. Part 3 (optional points) has not been gone through by the teacher. Line numbers refer to the page's HTML file.

Totals: 31 clear slips, 33 confirmed points needing your decision, 46 optional judgement calls.

## Part 1: clear slips (C)

Objective mistakes with one obvious fix. I suggest fixing all of these.


### A.1

**C1** (line 603). The common-mistakes list says "g is negative". But the page defines g as 9.8 m s⁻² (a positive size) and tells students to use a = −g. Taken together these give a double negative. The fix says the acceleration is negative, which is what the rest of the page says.


### A.2

**C2** (lines 662–663). In the spin-dryer example the working shown doesn't give the answers shown. 126 × 0.25 is 31.5 (which rounds to 32, not 31) and 126² × 0.25 is 3969 (4.0 × 10³, not 3.9 × 10³). The answers are right when the unrounded ω is used, so the fix carries one more figure in the working; the answers stay the same. *Same wording also in: `teachers/slides/a4.json` lines 299 and 303 (A.4 lesson-slide worked example "A washing machine on spin", same numbers): `\\omega = \\dfrac{1200 \\times 2\\pi}{60} = 126\\ \\text{rad s}^{-1}` then `v = 126 \\times 0.25 = 31\\ \\text{m s}^{-1}` has the same slip (126 × 0.25 = 31.5). Suggested: change 126 to 125.7 in both lines there (edit with a script, as the project rules say for LaTeX in slide files). Not in `teachers/a2.json`, the questions or think files.*

**C3** (line 675). In the vertical-circle diagram the weight arrow is drawn longer at the top (60 units) than at the bottom (55 units). The weight of the ball is the same everywhere, and the page itself says arrow length shows the size of a force. The fix makes the two weight arrows the same length.


### A.3

**C4** (lines 327–328). In the power-station example the energy per day is rounded to 1.2 × 10¹⁴ J, and then 1.2 × 10¹⁴ ÷ 3.0 × 10⁷ is shown as 4.1 × 10⁶ kg. On a calculator that division gives 4.0 × 10⁶. The fix shows the energy to three figures so the line works; the answer (4.1 × 10⁶ kg, about 4000 tonnes) stays. Note: the first reviewer suggested 1.23, but the numbers printed on the page (1.43 × 10⁹ × 86 400) give 1.24, so 1.24 is the value to show.

**C5** (line 317). The fuel table says hydrogen has the "highest specific energy of any fuel", but two rows lower the same table gives uranium-235 a value about half a million times bigger, and the next paragraph calls uranium a "nuclear fuel". Adding the word "chemical" removes the contradiction.


### B.1

**C6** (line 398). On the black-body graph, the wavelength axis is labelled "0" where the axes cross, but the curves were plotted starting at 100 nm there. So the labelled axis is uneven (0 to 1000 is 120 px, 1000 to 2000 is 133 px), and a student reading the 5000 K peak from the labels gets about 530 nm instead of 580 nm. The fix removes the "0" and adds 500 and 1500 ticks on the true scale; the curves are not touched.


### B.2

**C7** (line 354). The alt text (the description read out to students who can't see the picture) says the yearly CO₂ cycle is "lowest in October". In the picture's inset the lowest monthly point is September (about −2.85), with October just above it (about −2.75); the smooth curve's minimum is between them, nearer September.


### B.3

**C8** (line 243 (and caption, line 245)). The diagram lists "before: mu", "after: −mu", then "change: 2mu". With the signs shown, change = after − before = −2mu, so the three labels don't agree with each other. The fix gives the change its sign in the diagram and makes the caption say "size". The outline's step 1 ("Its momentum changes by 2mu", line 249) reads as a size and can stay.

**C9** (line 171). One lower-case p for pressure in the simulation task; the page (and the data booklet) uses capital P everywhere else. ("p–V diagram" is a conventional name and stays.)


### B.4

**C10** (lines 366 and 368). The coins example gives the entropy of the "5 heads" state as 7.6 × 10⁻²⁴ J K⁻¹. The power of ten is wrong: 1.38 × 10⁻²³ × 5.53 = 7.6 × 10⁻²³. The same wrong value is then used three times (once on line 366, twice on line 368). The page's own 4-coin check (line 417, 2.5 × 10⁻²³ for ln 6) shows the slip, since ln 252 is bigger than ln 6.

**C11** (line 210). The line shows 2.52 × 300 = 760 K "(about 490 °C)". 2.52 × 300 is 756, and the Celsius figure was worked from the already-rounded 760 (760 − 273 = 487 → "490"). The real answer is 756 K = 483 °C, which is "about 480 °C", so the Celsius value shown is off by 10 °C. The fix shows the product as it is and corrects the Celsius value. (If the teacher prefers to keep "760 K" as a 2 s.f. answer, only "490" needs to become "480".)


### C.1

**C12** (line 143 (and 145)). The small graph of acceleration against displacement is drawn sloping *up* to the right, which shows a ∝ +x. Its own title and caption (and the equation a = −ω²x) say the gradient is negative. The fix flips the line so it slopes down to the right, and moves the two tick labels to the side of the axis the line is not on. *Same wording also in: `teachers/slides/c1.json` line 317 uses this same figure (`"figure": "c1bt"`, drawn from the topic page by `figureFromPage` in `js/slides.js`), so the C.1 lesson deck shows the same wrong graph and is corrected by the same fix; any deck already downloaded needs regenerating. No other copy of the graph in `questions/diagrams`, `think/diagrams` or `teachers/slides/figures`.*


### C.2

**C13** (line 259). The linking question's label doesn't match the title of the B.1 section it points to (the site rule is label = code + section title). The link itself works.


### C.3

**C14** (line 230). In the simulation task the critical angle is written "c", but everywhere else on the page it is θc and c means the speed of light. The fix uses the page's own symbol.


### D.1

**C15** (line 191). In the "where the pulls balance" diagram the caption says the Earth's field and the Moon's field at P are equal and opposite, but the Earth arrow is drawn nearly twice as long as the Moon arrow. The fix shortens the Earth arrow so both are the same length. (I shorten the Earth arrow rather than lengthen the Moon arrow as the first reviewer proposed, because a longer Moon arrow would end right under the Moon circle, x = 342 to 358, and its arrowhead could touch it.)


### D.2

**C16** (line 333). In the solenoid diagram the field lines really do cross each other, twice above the axis and twice below, just outside each end. The line that is nearer the wires inside the coil comes back on the outermost loop, and the line nearer the axis comes back on the inner loop, so they have to cross. The page itself says field lines never cross. The fix swaps which loop each line returns on and widens the two outer loops, so the four loops are properly nested. Classes, arrow markers and arrow positions are unchanged.

**C17** (lines 382 to 383). In "four charges on a square" the working shown divides by 0.141 m. Typed into a calculator, that gives 2.55 × 10⁵ V, which rounds to 2.6, not the 2.5 printed. The final answers are right (they come from the unrounded distance). The fix keeps one more figure in the distance so the working shown gives the stated answer.


### D.4

**C18** (line 249 (graph), 252 (caption)). In the "coil moving through a field" graphs, the emf is drawn positive (above its axis) while the flux is rising, but the caption says the emf is the negative gradient of the flux graph, and the generator graphs further down the page do follow the minus sign. The fix flips the two emf steps so the graph matches its caption and the other figure. The caption's bracket "(Sign shown for one choice of direction.)" does not really rescue it: once the flux is drawn positive, the sign of the emf from ε = −NΔΦ/Δt is fixed. If the teacher would rather keep the picture, the alternative is to reword the caption (see below), which makes this a TEACHER item instead.

**C19** (line 341). The check question says a horizontal rod falls through a horizontal magnetic field and the answer says an emf BvL appears between its ends. That is only true if the rod is at right angles to the field; a horizontal rod could lie along a horizontal field, and then the emf between its ends is zero. The fix states the missing condition; the answer is unchanged.


### E.1

**C20** (line 114). The caption says the dashed circle shows "where the atom would end if the nucleus were drawn this big", then says the atom is really 10 000 times wider. In the drawing the circle is only 19 times wider than the nucleus dot, so the first sentence is not true. The fix says plainly that the circle is not to scale.

**C21** (line 308). The Bohr-orbit picture's title says the three orbits have radii in the ratio 1 : 4 : 9, but they are drawn 10 : 36 : 81. Making the inner orbit 9 units gives exactly 1 : 4 : 9.

**C22** (line 221). The worked example gets 488 nm where the measured line is 486 nm and blames "rounding the levels". The levels are not the main cause (−0.85 and −3.40 eV are exactly 13.6/16 and 13.6/4). Nearly all the difference comes from using h, c and e to three significant figures.

**C23** (line 290). The question gives Z for aluminium but not for gold, yet the solution uses 79. The physics data booklet has no periodic table, so the question should give it (the previous worked example does).

**C24** (line 321). An intermediate step has a number with no unit. The matching step two examples earlier (line 278) has its unit.


### E.2

**C25** (line 252). In the Compton example, part (a) gives the scattered wavelength as 2.24 × 10⁻¹¹ m. A student who puts that into E = hc/λ gets 8.88 × 10⁻¹⁵ J, but the page prints 8.87 (it used the unrounded 2.243). The final answer (1.1 × 10⁻¹⁵ J, about 7 keV) is the same either way. The simplest fix is to print the value the student will get.

**C26** (line 101). In the photocell diagram the wire that should join the cathode starts 9 units to the left of the cathode's lower tip, floating inside the tube, so the circuit looks broken. Moving the wire's start to the tip of the cathode joins it up.


### E.3

**C27** (line 148). The line shows 28.3 ÷ 4 = 7.07, but 28.3 ÷ 4 is 7.075, which a student rounds to 7.08. The 7.07 is right (it comes from the unrounded 28.295); showing the unrounded value in the division makes the line reproduce.

**C28** (line 404). The "common mistakes" box says "More binding energy means a more stable nucleus". Stability goes with binding energy **per nucleon**, not the total: uranium-235 has about 1800 MeV in total (the page's own example) and iron-56 about 490 MeV, yet iron is the more stable. Section 3 (line 154) says it correctly, so the page contradicts itself.

**C29** (line 217). "Billions [of neutrinos] pass through your body every second" is far too small. About 65 billion solar neutrinos cross every square centimetre each second, so for a whole body it is of the order of a hundred trillion per second.


### E.5

**C30** (line 164). The line multiplies 3.00 × 10⁸ by the seconds in a year and shows 9.46 × 10¹⁵ m, but that product is 9.47 × 10¹⁵. The booklet's 9.46 comes from the more precise speed of light, 2.998 × 10⁸.

**C31** (line 199). The Maths link says parallax angles are "millions of times smaller" than 0.1 rad. The largest stellar parallax (0.77 arcseconds) is only about 27 000 times smaller; "millions" is true only for the smallest angles measured from the ground.


## Part 2: confirmed, but your decision (D)

The reviewers agree something is inconsistent or missing, but the fix involves a teaching choice.


### A.1

**D1** (lines 38 and 228–230). The page tags "non-uniform acceleration on a graph" as New for 2028 and tells students sitting exams before 2028 it is only "extra practice". But the 2025 guide already lists "motion with uniform and non-uniform acceleration" and instantaneous acceleration "and how to determine them", so current students need it. The 2028 guide only adds a sentence of guidance (listed in its appendix as a correction), and the site's own rule names "non-uniform acceleration graphically" as clarified wording that gets no tag. Needs the teacher's decision because it removes a 2028 tag. *Same wording also in: `teachers/a1.json` line 12 (revision summary: `<span class=\"tag y2028\">New for 2028</span> <strong>Non-uniform acceleration</strong> is treated graphically…`): remove the tag there too if the teacher agrees. No `y2028` question in `questions/a.json`; no 2028 mention in `teachers/slides/a1.json`; no other file links to `#non-uniform`.*


### A.2

**D2** (lines 675–685). In the same diagram the arrows also show a smaller net force towards the centre at the bottom than at the top, which is the wrong way round (the ball is faster at the bottom, so it needs more centripetal force there). The page's message, tension smallest at the top and largest at the bottom, is still drawn correctly. A true-to-scale version isn't practical (the tension at the bottom must exceed the tension at the top by six times the weight), so the choice is between redrawing the arrows or just saying "not to scale". Teacher's decision.

**D3** (lines 38 and 612). The page tags the 2028 guide's one-word change ("linear speed" became "linear velocity") as New for 2028. What the page says is accurate, and the equation is unchanged. But the site's rule is that clarified wording gets no tag, and this change is not in the agreed list of new relationships. The teacher may have flagged it deliberately (A.1, A.2 and A.3 all carry such notes), so it is the teacher's decision. *Same wording also in: `teachers/a2.json` line 28 (revision summary: `<span class=\"tag y2028\">New for 2028</span> The guide links $\\omega$ to the linear <strong>velocity</strong>…`): treat it the same way. No other file links to `#linear-velocity`.*

**D4** (lines 525–553 (also 36–37, 88–92)). "Collisions in two dimensions" is correctly tagged HL (the guide makes 2D collisions HL only), but it isn't laid out the way the site's rule for HL-inside-SL content asks: no orange margin line, no "end of HL" line, no mention in the lead paragraph, contents list or page title. It is a consistency point, not a physics error; how much HL signposting such a short passage needs is the teacher's choice. *Same wording also in: not applicable.*


### A.3

**D5** (line 38). The note under the lead paragraph carries a "New for 2028" tag for two wording changes ("kinetic" energy; energy density "per unit volume"). The site's rule names exactly these two as clarified wording that gets no tag. The note is accurate and there are no tags in the body. Same pattern as A.1 and A.2, so one decision from the teacher can cover all three pages.


### A.5

**D6** (line 143). The page says the 1887 Michelson–Morley experiment found no change "whatever the season". The 1887 measurements were taken over a few days in July; Michelson and Morley planned to repeat them through the year but did not, and it was later experiments that covered other seasons. Also "no change at all" is stronger than their result (a shift far smaller than predicted). I am confident of this from general knowledge, but it is a historical nuance, so the teacher decides.

**D7** (line 56). A ToK question says "Lorentz and FitzGerald had found the right equations before Einstein". FitzGerald proposed length contraction as an idea; the transformation equations are Lorentz's (with Larmor and Poincaré). The site's own scientist entry for Lorentz says it correctly. Historical wording, so teacher's decision.


### B.1

**D8** (lines 188–189). The worked example asks for "the average kinetic energy of a molecule in air" and uses 3/2 k_BT. Four lines earlier the page says this exact formula is for an ideal monatomic gas and that molecules also rotate. Air is diatomic, so 3/2 k_BT is only the translational part. The number (6.2 × 10⁻²¹ J) is right for what the formula gives; the context contradicts the page's own note. Changing the gas to helium keeps every number. Teacher's call because it changes the example's context (the lesson slides already use a helium balloon, at 220 K, so the two would be similar).

**D9** (lines 41, 453, 492 (and `js/site.js` 157, `teachers/b1.json` 28)). The site rule says only relationships the 2028 update specifies get a "New for 2028" tag (for B.1 that is I = P/A), and that clarified wording, with "ideal monatomic gas" named as the example, gets none. The page tags two clarifications ("luminosity is synonymous with radiated power", "apparent brightness is synonymous with intensity"), the equations-panel note calls all three clarifications "New for 2028", and the revision-sheet summary tags the same two. This is inconsistent with the written rule, but it may be deliberate, so it needs the teacher's decision. If the rule is applied strictly: *Same wording also in: `teachers/b1.json` line 28 (two `tag y2028` spans, on "Luminosity means radiated power" and on "the intensity of the star's light where it is received"; the third, on Intensity I = P/A, is correct). `search-index.json` holds the two bold phrases as search keywords, so rerun `node tools/check.mjs --sitemap` after any change, and `node tools/check-teachers.mjs --reviewed b1` after checking the summary.*


### B.2

**D10** (line 37). The opening sentence says "Without its atmosphere" the Earth would be at −18 °C. That figure keeps the albedo at 0.30, which is mostly clouds, so it is really the temperature without greenhouse gases; the page's own worked example is titled "the Earth without greenhouse gases". A very common simplification; the fix is harmless but is a wording choice.

**D11** (line 289). The caption says the bend and asymmetric stretch "have natural frequencies in the infrared, and these are the ones that absorb", which implies the symmetric stretch is not at an infrared frequency. All three are in the infrared; the symmetric stretch doesn't absorb because it leaves the molecule's charge balanced. That reason is beyond the syllabus, so how much to say is the teacher's choice. Shortest safe wording:

**D12** (line 294). The page says the resonance model "can't explain why only certain sharp frequencies are absorbed", but two paragraphs earlier it uses that model to explain exactly that (absorption is strong when the infrared frequency matches a natural frequency). What the classical model really can't explain is absorption in whole photons and the detailed pattern of many sharp lines. This matters because the guide has a linking question on the resonance model's limitations (guide text line 1828). The replacement is longer, so it is a wording decision. *Same wording also in: `teachers/b2.json` line 28: "but only the energy-level model explains why just certain sharp frequencies are absorbed" (same idea; change it to match if the page changes).*


### B.3

**D13** (lines 7 and 15). The page's hidden description (shown in search results and link previews, and stored in the site search) still writes the pressure equation the old way, "P = ρv²/3", without "rms". The agreed rule is that the rewritten form replaces the old one everywhere. I have put this with the teacher only because there is no agreed plain-text way to write v_rms² (MathJax doesn't work in a description). *Same wording also in: `search-index.json` (a copy of this description). It is generated: run `node tools/check.mjs --sitemap` after the change, don't edit it by hand.*


### B.5

**D14** (line 393). The question says "A 9.0 V battery" but the solution uses 9.0 V as the emf. In a section whose whole point is emf against terminal p.d. (and with a "common mistake" about confusing them), the question should say which it is. A wording change, so the teacher decides; I recommend it.


### C.1

**D15** (line 120). Angular frequency is described as "2π radians per cycle", which is a conversion factor rather than a definition (read literally, ω would always be 2π). The fix says what ω is. Wording choice, so the teacher's call.


### C.2

**D16** (line 273 (last sentence)). I ∝ A² is new for 2028, and the page has a properly tagged "New for 2028" block for it starting on the very next line. But the sentence just before that block already states I ∝ A² in ordinary untagged text, so a 2025–2027 student reads it as required. Deleting that one sentence removes the duplicate; the tagged block says it all. It is a "New for 2028" tagging matter, so the teacher decides. *Same wording also in: `teachers/c2.json` line 28 has the same content but already puts the "New for 2028" tag on the I ∝ A² key box, so it is fine. `teachers/slides/c2.json` (lines 199–326) marks it new for 2028 throughout.*


### C.3

**D17** (line 376). The sentence says the white central maximum has "coloured edges: blue on the inside and red on the outside". Blue-inside, red-outside is the order of colours in each *side* maximum. The edge of the central band itself is reddish only, because blue reaches its first dark point at a smaller angle than red. The guide limits single-slit work to monochromatic light, so this is an extra; a small rewording makes it correct. I am confident of the physics, but it is a wording and content decision. *Same wording also in: `teachers/slides/c3.json` line 1133 (teacher note: "the centre stays white with coloured edges, since each colour has its own width"): this gives no colour order, so it is acceptable as it is.*


### C.4

**D18** (lines 207–211). In the guitar-string example the two lengths are given to 2 significant figures, but the speed (143) and the fretted frequency (146 Hz) are quoted to 3, and λ₃ is written 0.43 m and then used as 0.433 in the check on the same line. All the arithmetic is right. Simplest repair, if wanted: give the lengths to 3 s.f. Sig-fig style is the teacher's decision.


### D.1

**D19** (line 413). The worked example "launching and raising a satellite" uses $GM = 3.98 \times 10^{14}$ and $R = 6.37 \times 10^6$ m in its solution, but the question does not give them (the two other HL examples, lines 315 and 377, do). The radius can be worked out from "400 km up", but GM cannot. The fix adds the same bracket of data used on line 315. Harmless, but it adds text to a question, so it is the teacher's call.

**D20** (after line 410). The guide's guidance (2025 guide, D.1 additional HL) lists the energy conditions for an orbiting satellite to escape. The page covers escape from the surface and orbital energy separately, and the last check gives $v_{\text{orbital}} = v_{\text{esc}}/\sqrt{2}$, but nowhere says what extra energy a satellite already in orbit needs. Adding a paragraph is a content decision. *Same wording also in: not checked as an omission in teachers/d1.json (the summary follows the page).*

**D21** (after line 351). The guide says fields include the (assumed) uniform field near a surface and that students must be able to map fields using potential. Section 10 describes equipotentials only for the radial field. One extra bullet would close the gap; teacher's decision.


### D.2

**D22** (lines 432, 443). The bullet just above the dipole figure says equipotentials drawn at equal steps are closer together where the field is stronger. The figure's equipotentials are evenly spaced along the line joining the charges, so they are not at equal steps. The figure is a correct set of equipotentials, and its caption does not claim equal steps, but a student could apply the bullet to it and conclude the field is uniform between the charges. A few words in the caption would prevent that.

**D23** (line 505). The project rule says HL check questions carry the orange HL tag. This one is marked only with the plain text "HL:". The same plain-text style is used on D.1 (lines 475, 479) and, outside Theme D, on E.1 (373, 377) and E.3 (436, 440), while C.1, C.3 and C.5 use the tag. It is a marking convention, so the teacher should choose one style for all of them. *Same wording also in: themes/d1.html lines 475 and 479 (same change: replace `<summary>HL: ` with `<summary><span class="tag hl">HL</span> `); themes/e1.html 373, 377; themes/e3.html 436, 440.*


### D.4

**D24** (line 295). The maths-link box says of ε₀ = NBAω "you don't need to use it". It is true that the formula is not in the data booklet, but the guide's guidance says the quantitative treatment of induced emf includes rectangular coils rotating in fields. A student could read the sentence as "no calculations on rotating coils". How strongly to word this is the teacher's decision.

**D25** (section 4, after line 227). The guide gives two examples of relative motion: a coil moved in or out of a field (covered in section 5) and a magnet oscillating on a spring above a coil (not mentioned anywhere on the page). It is only a "for example" in the guidance, so adding it is optional.


### E.1

**D26** (line 146 (with line 114)). The text says the nucleus is about 10⁻¹⁵ m across and the atom 10⁻¹⁰ m, which is a ratio of 100 000. The scattering figure's caption 30 lines earlier says the atom is "about 10 000 times wider than the nucleus". The two disagree. For gold (the nucleus in the picture, radius 7.0 × 10⁻¹⁵ m in section 8) 10⁻¹⁴ m and "10 000 times" are the right values, so the recommended fix changes line 146. But "nucleus 10⁻¹⁵ m, atom 10⁻¹⁰ m" is also the usual textbook order-of-magnitude pair (the Hodder book gives 10⁻¹⁵ m for a nuclear diameter), so the other option is to keep line 146 and change the caption to "about 100 000 times". Teacher to choose; the two lines must end up agreeing. *Same wording also in: `teachers/e1.json` line 8 ("Nucleus about $10^{-15}$ m across; atom about $10^{-10}$ m"): change to match whichever option is chosen (no "10 000" there, so it is consistent on its own).*

**D27** (line 227 (with 176 and 183)). Line 227 says cool hydrogen is transparent to visible light (true: from the ground state the smallest jump needs ultraviolet). But section 4 says white light through "a cool gas" gives dark lines, and its figure shows hydrogen's four visible absorption lines. Each statement is fine alone; together a sharp student will see a contradiction. Visible hydrogen absorption lines need atoms already in n = 2, which happens only in hot hydrogen (a star's atmosphere). Adding a sentence is a content decision. *Same wording also in: `teachers/e1.json` line 20 repeats "Cool hydrogen is transparent to visible light…" (correct on its own; no change needed unless the teacher wants the same note).*


### E.2

**D28** (`js/site.js` line 272). The Σ panel writes the Compton equation as Δλ = …, while the booklet and the page's own key box write λ_f − λ_i = Δλ = …. The panel never says which wavelength is subtracted from which. Not an error; the project rule is to use the booklet's form. *Same wording also in: n/a.*

**D29** (line 45). The Nature of science box credits Planck (1900) and Einstein (1905) jointly with proposing that light comes in packets. Planck quantised the energy of the emitters; it was Einstein who proposed that light itself is made of quanta (which is why the next sentence, that Planck resisted the idea, is true). I am confident of this history, but how much nuance to put in the box is the teacher's call.


### E.4

**D30** (line 266). A check answer on this SL-and-HL page says fission fragments "lie above the band of stability". The band of stability (neutron–proton ratio) is HL-only content in E.3. The physics is right and the phrase is in brackets, but an SL student has not met the term. Whether to label it HL or reword is a marking decision. *Same wording also in: `questions/e.json` line 1163 uses "above the band of stability" in an E.3 question (appropriate there; worth a glance that it is `"level": "HL"`).*


### E.5

**D31** (line 105 (with the worked example at 123–125)). The photo caption near the top says "about 4 million tonnes of the Sun's mass is converted … every second". That is the answer to the worked example "At what rate is the Sun losing mass?" a few lines below (4.3 × 10⁹ kg s⁻¹, "over four million tonnes every second"), so the "try it first" example is given away by an always-visible caption. The number is correct; it is the site's own give-away rule that is broken. The automatic checker does not catch it because the photo is outside the worked-example box. Rewording a caption is the teacher's call.

**D32** (line 293). The page says an 8-solar-mass star leaves a white dwarf "well below" 1.4 solar masses. 8 solar masses is the boundary case: such stars leave the heaviest white dwarfs, roughly 1.0 to 1.3 solar masses, so "below" is right but "well below" is not. (Most of the mass is also lost as stellar wind in the giant stages, not only as the final planetary nebula.) Astronomical detail from memory, so for the teacher to decide.

**D33** (lines 269, 276 and 334). The dedicated block on the Chandrasekhar and Oppenheimer–Volkoff limits (lines 278–294) and the note under the lead are correctly tagged "New for 2028". But the two limits are also named in bold, with their values, in the two evolution lists just above the block and in a check answer, with no tag. A student sitting exams in 2026 or 2027 can't tell from those lines that the named limits are not in their guide. Whether the tagged block is enough, or the list items need tags too, is the teacher's decision under the 2028 rules. *Same wording also in: `teachers/e5.json` lines 28 and 32 name the Chandrasekhar limit in the revision summary and mistakes list; `questions/e.json` lines 1912, 2019–2027 and `questions/p2.json` line 2829–2834 use the limits (check those questions carry `"y2028": true`); `think/big-questions.json` line 671 mentions the 1.4-solar-mass figure in passing (no tag needed there).*


## Part 3: optional judgement calls (J)

The page is defensible as it is. Change only the ones you like.


### A.1

**J1** (line 458). The optional "Maths link" box shows the equation of the projectile's path. The equation is right, but the guide says the trajectory equation is not required, and the box doesn't say so. Adding one sentence is the teacher's call (the box is already labelled as an optional maths link).

**J2** (lines 327 and 482). Two worked-example captions, visible before the solution, state the step the hint asks the student to think about (the cliff caption says s = −25 m; the football caption says the vertical component falls to zero at the top). Neither gives a final answer, so the site's rule isn't broken. Changing them is a teaching-design choice; leaving them is reasonable.

**J3** (line 400). After describing the electromagnet-and-trapdoor method and video analysis, the page says "air resistance and reaction time are the main sources of error". Neither method involves human reaction time; it only matters for hand timing, which the page doesn't describe. The sentence is loose rather than wrong (it does go on to recommend electronic timing). Rewording is optional.


### A.3

**J4** (lines 199–201). Under the heading "When friction or drag act", the page says the change in mechanical energy equals the work done by friction and drag, which is negative. That is correct for those forces. The guide's guidance speaks of the work done by any non-conservative force, which includes forces that add mechanical energy (an engine, a push). The page's own examples use such forces, but the general rule isn't stated. Adding a sentence is the teacher's choice. *Same wording also in: not applicable.*

**J5** (line 322). "A nuclear power station uses a few tonnes of uranium a year" is the right order-of-magnitude contrast with coal, but loose: a large station fissions roughly one tonne of uranium-235 a year and loads a few tens of tonnes of fuel. This is from general knowledge, not a cached reference, so low confidence; the teacher may prefer to leave it.

**J6** (line 228). The spring-launcher question asks "How high does the ball rise?" without saying from where. The answer 4.1 m is measured from the ball's starting position with the spring compressed; from the point where it leaves the spring it would be 4.0 m. The arithmetic is right; making the question explicit is optional.


### A.4

**J7** (lines 324 and 331). The two worked examples in section 7 (skater, coupled bodies) use rotational kinetic energy, ½Iω², but the page doesn't introduce it until section 9. The skater's hint gives the formula; the coupled-bodies hint doesn't. The physics and numbers are right; this is about reading order. A pointer in the hints is the smallest change. *Same wording also in: not applicable.*

**J8** (line 314). "Neutron stars can rotate hundreds of times a second" is true as a fact (the fastest known spin about 700 times a second), but those very fast ones were spun up later by matter from a companion star; newly formed ones typically spin tens of times a second. The sentence slightly overstates what the collapse alone does. From general knowledge, not a cached reference. Leaving it as is would be defensible.

**J9** (line 218). The "Maths link: rates of change" box shows a second derivative and integrals, but its tags list only AA SL 5.1, 5.9 and AI SL 5.1, 5.5. By the section list in the project rules, the second derivative is AA SL 5.7 / AI HL 5.10 and anti-differentiation is AA SL 5.5. The maths guides aren't in the reference cache, so this must be checked against them before changing. *Same wording also in: not applicable.*

**J10** (lines 130 and 427). The page says a force through the axis has θ = 0 and so no torque. A force pointing towards the axis has θ = 180°; sin θ is zero either way, so the conclusion is right and only the bracket is incomplete. Optional precision.


### A.5

**J11** (lines 130–133). In the train example, 1.5 + 30 is given as 31.5 m s⁻¹. With the train's speed written as "30", the answer is quoted to one more decimal place than the data strictly supports. Many teachers would accept 31.5 here (the example is about the transformation, and 30 reads as exact). Purely a significant-figure style choice; leaving it is fine.


### B.1

**J12** (lines 236–237). The kettle example writes Q = 4.0 × 10⁵ J, then divides 4.03 × 10⁵ by 2000, writes 200 s, and calls it "about 3.4 minutes". 200 s is 3.3 minutes; the 3.4 comes from the unrounded 201.6 s. Nothing is wrong, but the three numbers don't follow from each other as shown. A rounding-style choice, so for the teacher.


### B.2

**J13** (line 372). "About an hour" is the time for the original bath (5% drain) to get 95% of the way to equilibrium. The sentence comes straight after "making the plug hole smaller", and with a smaller hole the approach is slower, so "its new level … about an hour" is loose. A reasonable reader would not be misled about the physics, so this is a wording decision.

**J14** (line 348). "releases carbon that was stored underground for millions of years as CO₂" can be read as if the carbon was stored as CO₂. It was stored as coal, oil and gas and is released as CO₂. Wording only; low priority.


### B.3

**J15** (line 288). "Helium atoms move nearly three times faster than nitrogen molecules." The ratio is 2.65. "Nearly three" is loose rather than wrong, and "times faster" is everyday wording; a more exact phrase is easy, but it is a wording preference.


### B.4

**J16** (line 238 (and `js/site.js` 191, `teachers/b4.json` 20)). The efficiency box says "useful work / energy input"; both data booklets print "useful work / input energy". Same meaning, different word order. The site rule says key boxes should match the booklet's equations, and the lesson-slide data already says "input energy", so matching is tidy, but nothing is wrong. *Same wording also in: the three places above are all of them. `teachers/slides/b4.json` (lines 786, 847, 1002) already uses "input energy". The phrase "energy input" in D.1, the A.3 slides and `think/concepts.json` is ordinary prose, not this equation: leave it.*

**J17** (lines 248–256). In the rectangular-cycle diagram the tick spacing (1.0 and 3.0 are 200 px apart across, 100 px apart up) means the axes cross at V = 0.3 and P = 0.2, not at zero, with no break mark. No "0" is printed, every labelled value is right, and the shaded area is described in words, so no answer is affected. Redrawing it to scale from the origin is optional. If wanted, use V: x = 40 + 90V and P: y = 190 − 46P: - line 248: `x="110" y="50" width="200" height="100"` → `x="130" y="52" width="180" height="92"` - line 252 grid lines → `(40,52)–(130,52)`, `(40,144)–(130,144)`, `(130,144)–(130,190)`, `(310,144)–(310,190)` - line 253 tick labels: `y="55"` → `y="57"` (3.0) and `y="155"` → `y="149"` (1.0) - line 254 tick label: `x="110"` → `x="130"` (1.0); 3.0 stays at 310 - line 255 arrows → `130,144→130,55`, `130,52→307,52`, `310,52→310,141`, `310,144→133,144` - line 256 letters → A `(116,160)`, B `(116,46)`, C `(316,46)`, D `(316,160)`


### B.5

**J18** (line 396). The lost volts, 9.0 − 8.4 = 0.6 V, has one significant figure, but r is then quoted to two (0.86 Ω). The arithmetic is right. I don't agree with the first reviewer's fix of writing "0.60": by the usual subtraction rule (keep one decimal place) 0.6 is the correct way to write it, and "0.60" would claim precision the data don't have. If the teacher wants the significant figures to be strict, change the data instead.

**J19** (lines 257 and 259). "Reversing the p.d. gives the same shape upside down." The negative half of the lamp's graph is the positive half turned half a turn about the origin. Turning a picture upside down *is* a half turn, so the phrase is defensible; "rotated half a turn about the origin" is clearer. The identical sentence also appears twice, in the caption (line 257) and again in the next paragraph (line 259).

**J20** (line 47). The page says Ohm's results were at first dismissed "partly because good meters hardly existed". As I remember the history, the main reason was hostility in Germany to his mathematical treatment (his 1827 book), and Ohm built his own sensitive galvanometer and used a thermocouple as a steady source. The "partly" keeps the sentence from being false. I have not checked a source, so this is for the teacher to check before changing anything.


### C.1

**J21** (line 261 (and caption, line 279)). The first reviewer said "lit from the side" contradicts the figure. I only half agree: if the figure is read as a view from above of a ball going round a horizontal circle, light from the side does throw the shadow along a horizontal line on a wall, exactly as drawn. The real (small) gap is that the figure gives x = x₀ cos ωt while the booklet equation just below is x = x₀ sin(ωt + φ), and the page never says the figure is the φ = π/2 case. Optional one-sentence addition to the caption.

**J22** (line 231 (with lines 193, 342)). The page says the potential energy is "elastic for a spring", but the worked example uses a *hanging* mass, where the ½kx² about equilibrium is elastic plus gravitational together. No number is affected. Pedantic; safe to leave.


### C.2

**J23** (line 273 (first part)). The same paragraph, headed "Link to B.1", defines intensity as power per unit area with I = P/4πr², untagged. In the 2025 guide B.1 only has apparent brightness b = L/4πd²; "intensity as power per unit area, I = P/A" is new for 2028 and b1.html tags it so. The physics is right, and the 2025 guide's own C.2 linking question talks about the intensity of an electromagnetic wave and the inverse square law, so leaving it untagged is defensible. Optional: add the 2025 form so the B.1 link is exact. *Same wording also in: `teachers/c2.json` line 28 (same untagged I = P/4πr² sentence).*

**J24** (line 164). The task tells students to turn on the "Stopwatch". As far as I remember (and the first reviewer says the same), PhET's Wave on a String labels that tick-box "Timer". Neither of us could run the simulation, so please open it and look before changing anything.

**J25** (line 166). The task says "Increase the tension", but (from memory) the simulation's Tension slider starts at its highest setting, so it can only be lowered. Please check in the live simulation.

**J26** (line 243). The spectrum table gives "optical fibres" as a use of visible light. Fibre communication actually uses infrared (roughly 850–1550 nm); visible light goes down fibres mainly for endoscope lighting and decorative lamps. Not strictly false, but a student could learn "optical fibres = visible light". Changing table content is the teacher's call.


### C.3

**J27** (line 465). A common-mistake line says "going into a denser medium", meaning optically denser. The page never defines optical density, and mass density does not decide refractive index. The correcting sentence after it is already right. Optional tidy-up.

**J28** (section 5, lines 244–263). The guide asks for "wavefront-ray diagrams showing refraction and diffraction". The refraction figure has wavefronts and a ray; the diffraction figure has wavefronts only. Nothing is wrong or missing as content; adding a few ray arrows to the diffraction picture is an optional improvement for the teacher to decide. *Same wording also in: not applicable.*


### C.4

**J29** (line 149). "Points near antinodes have the most energy and nodes have none" is strictly true only of kinetic energy; on a string the stretching (potential energy) is actually greatest at the nodes. It is a common simplification at this level, so it is defensible; adding the word "kinetic" makes it exact.

**J30** (lines 290 and 306). In the resonance-tube example, the picture shown before the solution has a caption (and a hidden title) saying the second resonance is half a wavelength longer than the first, which is the key step of the method. No number is given away, and the hint points the same way, so this is a judgement about how much the picture should help.


### C.5

**J31** (line 270). The train's speed is also given as "about 58 km/h" in brackets. The number is right; only the notation differs from the m s⁻¹ style. It reads as an everyday comparison, and C.4's bridge caption uses "km/h" the same way, so I would leave it. *Same wording also in: `themes/c4.html` line 410 ("about 64 km/h", Tacoma Narrows caption): change both or neither.*


### D.1

**J32** (lines 328, 343). The label "gradient = −g" sits beside a tangent that slopes upwards. It is correct (it matches the booklet's $g = -\Delta V_g/\Delta r$ and the caption underneath, which says the same thing), but a student could misread it as "the gradient is negative". My recommendation: leave it. If the teacher wants it changed, the least disruptive option is the label only.


### D.2

**J33** (line 155). "A grounded conductor is discharged" is true for a conductor on its own, but a few lines earlier the induction example earths a sphere with a charged rod nearby and it ends up charged. Loose wording rather than a wrong fact; the teacher may prefer to leave it. *Same wording also in: teachers/d2.json line 12 (same sentence in the revision summary: "so a grounded conductor is discharged (fuel tankers, lightning conductors)"). If the page changes, change this too and re-mark the summary as reviewed.*


### D.3

**J34** (lines 100, 123). The first example ends with 2.7 × 10⁷ m s⁻¹ and the next one says "the electrons from the previous example" but quotes 2.65 × 10⁷. Both are correct roundings of the same value, and carrying the less-rounded figure forward is good practice. A student might just wonder where 2.65 came from. Significant-figure style, so the teacher's call; either of the two options below fixes it.

**J35** (line 278). How to find the direction of a wire's field (right-hand grip rule) is taught on D.2. On this page the only pointer to it is inside the "New for 2028" block, which a 2025 to 2027 student may skip. No gap in the site; the suggestion just adds a pointer in the main text.


### D.4

**J36** (line 301). "The peak emf halves to 31.5 V" quotes three figures from a two-figure value (63 V). Halving is exact, so this is defensible, and 32 V would hide the "exactly half" point. My recommendation: leave it. If the teacher prefers tidy figures, change the question's value instead.


### E.1

**J37** (line 279). "About six times the radius of the gold nucleus" is really about six and a half times. Not wrong enough to matter; a wording choice.

**J38** (`js/site.js` line 266). The Σ equations panel for E.1 lists the constants h, c, e and R₀. The HL calculations on the page also use k, u and mₑ, which already exist in the constants list. Adding them is optional. *Same wording also in: n/a.*


### E.2

**J39** (line 122). The table says the maximum kinetic energy "depends only on frequency". It also depends on the metal (the work function); the intended contrast is with brightness, and section 1 words it that way. The cell also uses the symbol E_k where the rest of the page uses E_max. A wording preference. *Same wording also in: `teachers/e2.json` line 55 (oracy activity): "$E_{\max} = hf - \Phi$ depends only on frequency" (same looseness; there the equation beside it shows Φ).*


### E.3

**J40** (lines 113 and 122). The SL box says the strong force acts up to about 3 × 10⁻¹⁵ m, "roughly the distance between neighbouring nucleons"; the HL 2028 line says its range is of order 10⁻¹⁵ m, "about the size of a nucleon". Both numbers are the same order of magnitude and both are acceptable, but neighbouring nucleons are nearer 2 × 10⁻¹⁵ m apart, so the comparison is loose and a student may wonder which figure to quote. Optional tidy-up.

**J41** (line 54). The ToK prompt says half-lives "are known to many decimal places". That overstates it: most are known to three to five significant figures (carbon-14 is 5730 ± 40 years). A ToK prompt, not examinable; optional.

**J42** (line 324 (and 331)). "Nothing beyond Z = 83 (bismuth) is stable" is the standard school statement and literally true, but it implies bismuth is stable. Bismuth-209 has been known since 2003 to alpha-decay, with a half-life of about 2 × 10¹⁹ years, so the heaviest truly stable nuclide is lead-208. Negligible for IB; change only if the teacher wants strict accuracy. *Same wording also in: `teachers/e3.json` line 37 ("Nothing beyond $Z = 83$ is stable.").*


### E.4

**J43** (line 118). The estimate says "each of the 236 nucleons gains about 0.9 MeV". Strictly, the incoming neutron and the two or three released neutrons are free (no binding energy), so about 235 nucleons become more tightly bound. The answer, about 200 MeV, is the same. A precision-of-wording choice for a deliberately rough estimate. *Same wording also in: `teachers/e4.json` line 12 ("about $236 \times 0.9 \approx 200$ MeV per fission"): change together if changed.*

**J44** (line 201). "A coal-fired station of the same power burns about 8000 tonnes of coal a day." With the page's own numbers (3.0 GW of heat, coal 3 × 10⁷ J per kg) it comes to about 8600 tonnes, which rounds to 9000. But "the same power" could mean the same electrical output, and a coal station is a little more efficient than 33%, which gives 7000 to 8000 tonnes. As an order-of-magnitude comparison "about 8000" is defensible.


### E.5

**J45** (line 249). The instability strip is described only as "a narrow, nearly vertical band crossing the main sequence" and is not drawn. That is not false, but the guide requires students to know its location on the HR diagram, and this description doesn't say where: the strip meets the main sequence a little to the hot side of the Sun and runs upwards, between the main sequence and the red giants, to the supergiants. Adding detail (or drawing it) is a content decision. *Same wording also in: `teachers/e5.json` line 24 ("near-vertical band crossing the main sequence").*

**J46** (line 187). The key-equation box writes "arcsecond"; the data booklet and the site's own Σ panel write "arc-second". The rest of the page's prose uses "arcsecond" throughout, so only the equation box would change to match the booklet's notation. *Same wording also in: n/a (the panel already has the booklet's form).*

