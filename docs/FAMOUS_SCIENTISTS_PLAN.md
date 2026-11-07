# Famous scientists: plan (draft for the teacher, November 2026)

**Aim:** each subtopic page (A.1–E.5) gets a short "Famous scientist" box: a portrait, a one-line caption and an expandable "What they achieved" section. The same scientist is an optional part of the revision sheet builder. The selection deliberately includes scientists from many countries, ethnicities and backgrounds, and women, alongside the traditional European names.

Status: **draft. Nothing is built until the teacher agrees this plan and picks from the candidate list (section 6).**

## 1. Data: one shared file

`scientists.json` at the top level of the site, keyed by subtopic, so the topic pages and the builder both read it (like `think/concepts.json`). A list per subtopic allows one or two scientists per page.

```json
{
  "A.1": [
    {
      "id": "oresme",
      "name": "Nicole Oresme",
      "years": "c. 1320–1382",
      "origin": "France",
      "image": "images/scientists/oresme.jpg",
      "alt": "Medieval painting of Oresme at a desk with an armillary sphere",
      "credit": { "author": "…", "file": "https://commons.wikimedia.org/wiki/File:…",
                  "licence": "Public domain", "licenceUrl": "…" },
      "caption": "Drew speed against time as a shape, centuries before graphs.",
      "achievements": "<p>…</p><ul><li>…</li></ul>",
      "place": "graphs",
      "level": "SL"
    }
  ]
}
```

- `id` is permanent (like question ids).
- `place`: the `<h2>` section id on the topic page where the box appears (see section 3).
- `level`: "HL" when the link is to HL-only content (the box then gets the HL tag).
- Facts are checked against reliable sources, listed in section 7 of this file (**not on the page**). The text is in our own words.

## 2. Pictures

- Only Wikimedia Commons files licensed CC BY, CC BY-SA, CC0 or public domain (checked through the Commons API `extmetadata`, as CLAUDE.md describes). Many older scientists have public-domain portraits; for living or recent scientists an open photo may not exist, and then the candidate may need to change.
- Compressed to at most 1200 px wide (portraits will be smaller, about 400 px), under 200 KB, saved in `images/scientists/`.
- Credit under the picture (`<span class="credit">Photo: Author, Wikimedia Commons, licence. Resized.</span>`) and in the "Image credits" list on `about.html`.
- No AI-generated images.

## 3. On the topic page

- Drawn automatically by `js/site.js` from `scientists.json` (no hand-written HTML on each page, so there's one place to edit).
- **Where it sits (teacher's decision, 7 November 2026): part-way down the page, in the section the scientist's work fits best.** The data's `place` field names that section's `<h2>` id (e.g. `"place": "graphs"` for Oresme puts the box at the end of "4. Motion graphs", just before the next section starts). With two scientists on a page, each sits in their own section. The checker reports an unknown `place` id, so renaming a section can't silently lose the box.
- Layout: portrait on the left (on top on phones), name, years, origin tag and the one-line caption on the right; below that a `<details>` "What they achieved" (the same open/close pattern as the "Check your understanding" boxes). Checked at 375 px and in dark mode.

## 4. In the revision sheet builder

- A new tick box "Famous scientist" (part letter `f`, saved in the sheet's link like the other parts).
- **What it shows: the teacher to choose** (question 3 below).

## 5. Automatic checks (`tools/check.mjs`)

Errors for: an unknown subtopic key, a missing or duplicate `id`, a missing picture file, missing alt text, a missing or incomplete credit (author, file page, licence), a licence that isn't CC BY, CC BY-SA, CC0 or public domain, a `place` id that isn't an `<h2>` section on the topic page, a picture wider than 1200 px or over 300 KB, and a credited picture missing from `about.html`. Warning for a subtopic page with no scientist yet (switched on once all 24 are written).

## Questions for the teacher

1. ~~Where on the topic page?~~ Decided: in the section the work fits best (section 3).
2. **One or two scientists per page?** One keeps it short; two lets a classic name sit beside a less well-known one.
3. **Builder:** student sheet (picture, caption and a short paragraph), teacher notes (the full achievements text plus a discussion prompt), or both?
4. **Candidate list:** pick from section 6 (or suggest others).

## 6. Candidate list (draft, for the teacher to choose from)

"Main" are my suggestions, chosen to balance regions, ethnicities and genders across the whole course. "Alternatives" can replace or join them. Facts here are only summaries; every fact is checked again before any text is written.

| Topic | Main suggestions | Origin | Link to the subtopic | Alternatives |
|---|---|---|---|---|
| A.1 Kinematics | Galileo Galilei (1564–1642) | Italy | Ramp experiments: falling objects accelerate uniformly; projectile path as two independent motions | **Nicole Oresme** (c. 1320–1382, France): showed speed against time as a shape, with the area giving the distance (mean speed theorem) |
| A.2 Forces and momentum | **Emmy Noether** (1882–1935) | Germany (Jewish; left for the USA in 1933) | Noether's theorem: conservation of momentum follows from the laws of physics being the same everywhere | Isaac Newton (England); Ibn Sina (c. 980–1037, Persia): an early idea of a moving body keeping a "tendency" to move (careful wording needed: a precursor of inertia, not Newton's law); Archimedes for buoyancy |
| A.3 Work, energy and power | **Émilie du Châtelet** (1706–1749) | France | Argued, using balls dropped into clay, that the "force" of motion goes with *v*², the idea behind kinetic energy; translated Newton's *Principia* into French | James Prescott Joule (England): energy conservation, the joule |
| A.4 Rigid body mechanics (HL) | **Al-Khazini** (fl. c. 1115–1130) | Merv, Seljuk Persia (now Turkmenistan) | *The Book of the Balance of Wisdom*: precision balances, centres of gravity, levers | Archimedes (Syracuse, Greek): law of the lever; Leonhard Euler (Switzerland): rotation of rigid bodies |
| A.5 Relativity (HL) | Albert Einstein (1879–1955) | Germany (Jewish; later Switzerland and USA) | Special relativity (1905) | Hendrik Lorentz (Netherlands): Lorentz transformation. Few diverse options fit this topic closely; the balance comes from other topics |
| B.1 Thermal energy transfers | **Mária Telkes** (1900–1995) | Hungary, emigrated to the USA | Stored solar energy as latent heat in melting salts; designed the heating for the 1948 Dover Sun House | Joseph Black (Scotland): discovered latent heat and specific heat |
| B.2 Greenhouse effect | **Eunice Newton Foote** (1819–1888) | USA | 1856: showed that air with carbon dioxide warms more in sunlight, the first known experiment pointing to the greenhouse effect | **Syukuro Manabe** (born 1931, Japan, worked in the USA): first realistic climate models, Nobel Prize 2021; John Tyndall (Ireland): infrared absorption by gases |
| B.3 Gas laws | Robert Boyle (1627–1691) | Ireland | Boyle's law (pressure and volume) | **Satyendra Nath Bose** (India): statistics of a "gas" of identical particles (beyond the syllabus, so a looser link; better in E.2); Daniel Bernoulli (Switzerland): first kinetic theory of gases; Ludwig Boltzmann |
| B.4 Thermodynamics (HL) | Sadi Carnot (1796–1832) | France | Maximum efficiency of a heat engine | Ludwig Boltzmann (Austria): entropy and disorder, S = k ln Ω; Rudolf Clausius (Germany): entropy |
| B.5 Current and circuits | **Lewis Latimer** (1848–1928) | USA (African American, son of people who escaped slavery) | Patented an improved way to make carbon filaments for electric lamps; worked on electric lighting with Edison's company | Georg Ohm (Germany); Alessandro Volta (Italy): the first battery |
| C.1 Simple harmonic motion | Christiaan Huygens (1629–1695) | Netherlands | The pendulum clock; the period of a pendulum | **Zhang Heng** (78–139, Han China): an early seismoscope (its inner pendulum mechanism is a modern reconstruction, so wording needs care) |
| C.2 Wave model | **Inge Lehmann** (1888–1993) | Denmark | Used seismic waves (P- and S-waves) to discover Earth's solid inner core (1936) | **Jagadish Chandra Bose** (1858–1937, India): pioneering microwave (millimetre-wave) experiments in the 1890s; James Clerk Maxwell (Scotland): light as an electromagnetic wave |
| C.3 Wave phenomena | **Ibn al-Haytham** (c. 965–c. 1040) | Basra (now Iraq), worked in Cairo | *Book of Optics*: experiments on reflection and refraction; insisted on testing ideas by experiment | **Ibn Sahl** (c. 940–1000, Baghdad): stated the law of refraction in 984, centuries before Snell; Thomas Young (England): double-slit interference |
| C.4 Standing waves and resonance | **Sophie Germain** (1776–1831) | France | Won the Paris Academy's prize (1816) for the theory of vibrating plates (Chladni figures), teaching herself mathematics | **C. V. Raman** (India): the harmonics of the violin and of Indian drums (tabla, mridangam); Ernst Chladni (Germany) |
| C.5 Doppler effect | Christian Doppler (1803–1853) | Austria | Proposed the Doppler effect (1842) | **Vera Rubin** (1928–2016, USA): used Doppler shifts to measure how fast galaxies spin, key evidence for dark matter |
| D.1 Gravitational fields | Johannes Kepler (1571–1630) or Isaac Newton | Germany / England | Kepler's laws (2028 guide: deducing Kepler's third law); Newton's law of gravitation | **Katherine Johnson** (1918–2020, USA, African American): calculated orbital trajectories for NASA's first crewed flights; **Mary Golda Ross** (1908–2008, Cherokee Nation): first known Native American woman engineer, worked on orbits and spacecraft at Lockheed |
| D.2 Electric and magnetic fields | Michael Faraday (1791–1867) or Charles-Augustin de Coulomb | England / France | Field lines (Faraday); Coulomb's law | **Shen Kuo** (1031–1095, Song China): described the magnetic needle compass and that it doesn't point exactly north (magnetic declination) |
| D.3 Motion in EM fields | J. J. Thomson (1856–1940) | England | Discovered the electron by deflecting cathode rays in electric and magnetic fields | **Joan Feynman** (1927–2020, USA): linked aurora and Earth's magnetic activity to the solar wind; Kristian Birkeland (Norway): aurora as charged particles guided by Earth's field; Ernest Lawrence (USA): the cyclotron |
| D.4 Induction (HL) | Michael Faraday (1791–1867) | England | Discovered electromagnetic induction (1831) | **Nikola Tesla** (1856–1943, Serbian, born in today's Croatia, emigrated to the USA): AC induction motor and AC power; Joseph Henry (USA) |
| E.1 Structure of the atom | Ernest Rutherford (1871–1937) | New Zealand | The nuclear atom (gold foil scattering) | **Hantaro Nagaoka** (1865–1950, Japan): a 1904 "Saturnian" atom with a heavy centre, which Rutherford cited; Niels Bohr (Denmark) |
| E.2 Quantum physics (HL) | **C. V. Raman** (1888–1970) | India | Raman scattering (1928): light changes energy when it scatters off molecules, more evidence for photons; Nobel Prize 1930, the first for an Asian scientist in science | **Satyendra Nath Bose** (India): counted photons statistically to derive Planck's law (1924), hence "boson"; Arthur Compton (USA); **Elmer Imes** (USA, African American): infrared spectra that confirmed quantised molecular energy levels; Louis de Broglie (France) |
| E.3 Radioactive decay | Marie Curie (1867–1934) | Poland, worked in France | Radioactivity, polonium and radium; two Nobel Prizes | **Chien-Shiung Wu** (1912–1997, China → USA): precision beta-decay experiments, including the parity experiment; **Hideki Yukawa** (Japan): predicted the particle behind the strong nuclear force; **César Lattes** (Brazil): co-discovered that particle, the pion; Harriet Brooks (Canada); Sameera Moussa (Egypt) |
| E.4 Fission | **Lise Meitner** (1878–1968) | Austria (Jewish; fled to Sweden in 1938) | With Otto Frisch, explained nuclear fission (1938–39) and its energy from the mass defect | Enrico Fermi (Italy): first nuclear reactor (1942); Homi Bhabha (India): founded India's nuclear energy research |
| E.5 Fusion and stars | **Cecilia Payne-Gaposchkin** (1900–1979) | England, worked in the USA | 1925: showed that stars are mostly hydrogen and helium, from their spectra | **Subrahmanyan Chandrasekhar** (India → USA): the Chandrasekhar limit (new in the 2028 guide); **Meghnad Saha** (India): ionisation equation explaining stellar spectral classes; Hans Bethe (Germany → USA): fusion in stars; Annie Jump Cannon (USA): spectral classes |

**Spread of the main suggestions (one per topic):** 9 women out of 24; scientists from the Islamic world (Al-Khazini, Ibn al-Haytham), South Asia (Raman), an African American (Latimer), Europe, North America and Oceania (Rutherford). East Asia, Latin America and Indigenous American scientists appear only among the alternatives, so choosing some of those (e.g. Katherine Johnson or Mary Golda Ross for D.1, Shen Kuo for D.2, Chien-Shiung Wu for E.3, Chandrasekhar for E.5) would widen the spread further. If the teacher chooses two per page, the alternatives in bold add East Asia, South Asia, Latin America and more Islamic-world scientists.

**Gaps to be honest about:** sub-Saharan African physicists with a close link to a specific subtopic are hard to find for this syllabus (Sameera Moussa, Egypt, is a North African option in E.3). Hayat Sindi (suggested in the brief) is a medical scientist (biotechnology), so she doesn't fit a physics subtopic well; not suggested.

## 6b. Approved list (teacher, 7 November 2026)

Two per page, each in the section their work fits best. The builder tick box adds the scientists to **both** the student sheet (picture, caption, short paragraph) and the teacher notes (full achievements and a discussion prompt). The teacher chose "main + bold alternatives" and settled D.1, E.2/C.4, E.3 and E.5. Where a topic had no bold alternative, the second name below is my pick from that topic's alternatives (marked *); the teacher can still swap these.

| Topic | Scientists |
|---|---|
| A.1 | Galileo Galilei; Nicole Oresme |
| A.2 | Emmy Noether; Isaac Newton* |
| A.3 | Émilie du Châtelet; James Prescott Joule* |
| A.4 (HL) | Al-Khazini; Archimedes* |
| A.5 (HL) | Albert Einstein; Hendrik Lorentz* |
| B.1 | Mária Telkes; Joseph Black* |
| B.2 | Eunice Newton Foote; Syukuro Manabe |
| B.3 | Robert Boyle; Daniel Bernoulli* (S. N. Bose moved to E.2) |
| B.4 (HL) | Sadi Carnot; Ludwig Boltzmann* |
| B.5 | Lewis Latimer; Georg Ohm* |
| C.1 | Christiaan Huygens; Zhang Heng |
| C.2 | Inge Lehmann; Jagadish Chandra Bose |
| C.3 | Ibn al-Haytham; Ibn Sahl |
| C.4 | Sophie Germain; C. V. Raman |
| C.5 | Christian Doppler; Vera Rubin |
| D.1 | Katherine Johnson; Mary Golda Ross |
| D.2 | Charles-Augustin de Coulomb*; Shen Kuo (Faraday goes to D.4) |
| D.3 | J. J. Thomson; Joan Feynman |
| D.4 (HL) | Michael Faraday; Nikola Tesla |
| E.1 | Ernest Rutherford; Hantaro Nagaoka |
| E.2 (HL) | Satyendra Nath Bose; Elmer Imes |
| E.3 | Marie Curie; Chien-Shiung Wu |
| E.4 | Lise Meitner; Enrico Fermi* |
| E.5 | Cecilia Payne-Gaposchkin; Subrahmanyan Chandrasekhar |

Spread: 14 women out of 48; 16 of the 48 are not of European descent (Islamic world 3, South Asia 4, East Asia 5, African American 3, Native American 1). If no openly licensed picture exists for someone, I'll say so and suggest a swap rather than use an unlicensed one.

## 7. Sources (filled in for each scientist as the text is written)

Each scientist's facts were checked by an independent fact-check (November 2026). Myths found and left out or corrected on the page are listed too.

**Data fields actually used:** `id`, `name`, `short` (for "What Galileo achieved"), `years`, `origin`, `place`, `level`, `image`, `alt`, `credit {author, file, licence}`, `caption` (one line, on the page), `summary` (a short paragraph for the student sheet), `achievements` (the expandable list on the page, and the teacher notes), `prompt` (a discussion question in the teacher notes).

### Theme A (pilot)
- **Galileo:** MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Galileo/ (ramps, t², parabola, *Two New Sciences* 1638 in Leiden, house arrest). The tower story comes only from Viviani's biography, so it's called possibly untrue.
- **Oresme:** Stanford Encyclopedia of Philosophy, https://plato.stanford.edu/entries/nicole-oresme/ ; MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Oresme/ ; Clagett (1968), *Nicole Oresme and the Medieval Geometry of Qualities and Motions*. He gave the first proof of the Merton mean speed theorem using figures. He did NOT apply it to free fall, and his figures were not graphs of data (both said on the page).
- **Noether:** MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Noether_Emmy/ ; "A Century of Noether's Theorem", https://arxiv.org/abs/1902.01989 . The Hilbert "bathing establishment" line and Einstein's NYT letter (possibly drafted by Weyl) are left out.
- **Newton:** MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Newton/ ; the apple story: https://blogs.scientificamerican.com/observations/whats-the-real-story-with-newton-and-the-apple-see-for-yourself/ . The second law is in momentum form in *Principia*.
- **du Châtelet:** SEP, https://plato.stanford.edu/entries/emilie-du-chatelet/ ; MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Chatelet/ . The clay experiments were 's Gravesande's, not hers; the fire essay didn't win, but it was published (1739); the ½ came later (Coriolis, 1829).
- **Joule:** Dictionary of National Biography (1892), https://en.wikisource.org/wiki/Dictionary_of_National_Biography,_1885-1900/Joule,_James_Prescott ; APS News, https://www.aps.org/apsnews/2015/06/joule-mechanical-equivalent-heat . The honeymoon waterfall story is true, but no measurement was made.
- **Al-Khazini:** Dictionary of Scientific Biography (R. E. Hall), https://www.encyclopedia.com/science/dictionaries-thesauruses-pictures-and-press-releases/al-khazini-abul-fath-abd-al-raman-sometimes-abu-manur-abd-al-raman-or-abd-al-rahman-manur . "Freed" isn't documented, so it isn't claimed. His idea of weight changing with distance was the opposite of Newton's, so the page only says it was "very different".
- **Archimedes:** MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Archimedes/ . The "place to stand" quote comes from Pappus, centuries later (said on the page).
- **Einstein:** MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Einstein/ ; Nobel Prize 1921, https://www.nobelprize.org/prizes/physics/1921/summary/ ; https://newspapers.ushmm.org/events/albert-einstein-quits-germany-renounces-citizenship (left Germany December 1932).
- **Lorentz:** MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Lorentz/ ; Nobel Prize 1902, https://www.nobelprize.org/prizes/physics/1902/summary/ ; FitzGerald, https://mathshistory.st-andrews.ac.uk/Biographies/FitzGerald/ ; Einstein's regard: https://einsteinpapers.press.princeton.edu/vol16-doc/56 .

**Pictures (theme A):** all public domain on Wikimedia Commons, licences checked through the Commons API. No portrait of al-Khazini exists, so his box shows his balance from a c. 1270 manuscript (University of Pennsylvania, LJS 386). Resized to 480 px wide (800 px for the manuscript), 28–119 KB each.

## 8. Steps

1. Teacher agrees this plan and the candidate list.
2. Theme A pilot: write the text, check every fact, find and credit the pictures, build the topic-page box and the builder option, add the checker rules, check at 375 px and in dark mode.
3. Teacher checks the pilot in the preview; push only with the teacher's OK.
4. Themes B–E in batches.
