# Famous scientists: plan (draft for the teacher, November 2026)

**Aim:** each subtopic page (A.1–E.5) gets a short "Famous scientist" box: a portrait, a one-line caption and an expandable "What they achieved" section. The same scientist is an optional part of the revision sheet builder. The selection deliberately includes scientists from many countries, ethnicities and backgrounds, and women, alongside the traditional European names.

Status: **complete (8 November 2026).** All 48 scientists (two per subtopic, A.1–E.5) are on the site, each batch fact-checked and checked by the teacher before it was pushed. Sections 1–6 are the original plan; 6b is the approved list; 7 has the sources.

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

### Theme B
- **Telkes:** Lemelson-MIT, https://lemelson.mit.edu/resources/maria-telkes ; PBS American Experience, https://www.pbs.org/wgbh/americanexperience/features/sun-queen-capturing-the-sun-queen ; MIT Technology Review, https://www.technologyreview.com/2010/06/22/202508/the-house-of-the-day-after-tomorrow/ ; Scientific American, https://www.scientificamerican.com/article/maria-telkes-the-biophysicist-who-harnessed-solar-power/ . The solar still was for the OSRD (not "the Navy"); the MIT blame story is contested and left out.
- **Black:** University of Edinburgh, https://chem.ed.ac.uk/about-us/history/professors/joseph-black . The Watt/separate-condenser link is contested (said on the page); https://engines.egr.uh.edu/episode/678 .
- **Foote:** APS News, https://www.aps.org/apsnews/2023/07/carbon-dioxide-atmosphere-eunice-foote ; Ortiz & Jackson (2020), Notes and Records 76(1), https://doi.org/10.1098/rsnr.2020.0031 ; no known portrait: AIP, https://www.aip.org/history-programs/niels-bohr-library/ex-libris-universum/initial-conditions-episode-1-eunice-foote . Not "discovered the greenhouse effect".
- **Manabe:** Carbon Brief, https://www.carbonbrief.org/prof-john-mitchell-how-a-1967-study-greatly-influenced-climate-change-science ; NOAA, https://celebrating200years.noaa.gov/breakthroughs/climate_model ; Nobel 2021 citation via Stockholm University, https://su.se/english/news/the-nobel-prize-in-physics-2021-1.576920 .
- **Boyle:** SEP, https://plato.stanford.edu/entries/boyle/ ; Linda Hall Library, https://www.lindahall.org/about/news/scientist-of-the-day/robert-boyle . The law is in the 1662 edition; Towneley credited by Boyle; Mariotte independent (1676–79).
- **Bernoulli:** MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Bernoulli_Daniel/ ; S. G. Brush, https://www.terpconnect.umd.edu/~brush/pdf/ITALENC.pdf . The modern Bernoulli equation is Euler's.
- **Carnot:** MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Carnot_Sadi/ . He never wrote η = 1 − Tc/Th.
- **Boltzmann:** MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Boltzmann/ ; SEP, https://plato.stanford.edu/entries/statphys-Boltzmann/ . Planck first wrote S = k log W and introduced k. He died by suicide in 1906 after years of depression; the page says only that he suffered from depression and poor health and died in 1906 (sensitive wording, offered to the teacher).
- **Latimer:** Latimer House, https://www.lewislatimerhouse.org/about ; Edison Papers, https://edison.rutgers.edu/resources/latimer/inventing-a-better-life-latimer-s-technical-career and https://edison.rutgers.edu/resources/latimer/the-george-latimer-case ; NPS, https://home.nps.gov/articles/000/latimer.htm ; patent US 252,386, https://patents.google.com/patent/US252386A/en . The Bell drawings rest only on his own account (said on the page); he didn't improve Edison's bulb.
- **Ohm:** MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Ohm/ ; Flensburg HistoLab, https://www.uni-flensburg.de/en/working-group-physics/histolab/thematical-subsections/electricity/ohms-torsion-balance ; ETHW, https://ethw.org/Milestones:Standardisation_of_the_Ohm,_1861-1867 . He resigned; he wasn't dismissed.

### Theme C
- **Huygens:** MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Huygens/ ; Met Museum (Coster clock), https://www.metmuseum.org/art/collection/search/205602 ; Linda Hall Library, https://www.lindahall.org/christiaan-huygens-2/ . The period formula is given in modern form only.
- **Zhang Heng:** MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Zhang_Heng/ ; Hsiao & Yan (2009) on reconstructions, https://www.jstage.jst.go.jp/article/jaee/9/4/9_4_4_1/_article ; the Longxi quake, https://dzdz.ac.cn/EN/Y2004/V26/I1/52 . The mechanism is unknown (said on the page). The fact-check thought C.2 (seismic waves) the more honest fit; kept on C.1 with the pendulum described as a reconstruction (offered to the teacher).
- **Lehmann:** encyclopedia.com, https://www.encyclopedia.com/science/encyclopedias-almanacs-transcripts-and-maps/lehmann-inge-1888-1993 ; EBSCO, https://www.ebsco.com/research-starters/earth-and-atmospheric-sciences/lehmann-discovers-earths-inner-core . The liquid outer core from S-waves was Oldham, Gutenberg and Jeffreys; she *proposed* the inner core.
- **J. C. Bose:** IEEE milestone, https://ethw.org/Milestones:First_Millimeter-wave_Communication_Experiments_by_J.C._Bose,_1894-96 ; NRAO (Emerson), https://www.cv.nrao.edu/~demerson/bose/bose.html ; patent US 755,840, https://patents.google.com/patent/US755840 . The Marconi claim is contested and left out.
- **Ibn al-Haytham:** Dictionary of Scientific Biography (A. I. Sabra), https://www.encyclopedia.com/science/dictionaries-thesauruses-pictures-and-press-releases/ibn-al-haytham-abu . No refraction law; the madness story is a later anecdote (said on the page); "father of the scientific method" avoided.
- **Ibn Sahl:** R. Rashed, Isis 81 (1990), https://doi.org/10.1086/355456 . Ratio of lengths, for crystal only (said on the page).
- **Germain:** MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Germain/ ; APS, https://www.aps.org/apsnews/2004/05/this-month-in-physics-history . No portrait from life is known for certain (said on the page).
- **Raman:** DSB, https://encyclopedia.com/science/dictionaries-thesauruses-pictures-and-press-releases/raman-chandrasekhara-venkata ; drums, https://repository.ias.ac.in/52555 .
- **Doppler:** MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Doppler/ and DSB, https://mathshistory.st-andrews.ac.uk/DSB/Doppler.pdf ; KNMI on Buys Ballot, https://www.knmi.nl/over-het-knmi/nieuws/doppler-experiment-buys-ballot-160-jaar-geleden . "Brass players" (sources differ: trumpet or horn); "lung disease" (probably tuberculosis).
- **Rubin:** NAS memoir (Bahcall, 2021), https://www.nasonline.org/wp-content/uploads/2024/06/rubin-vera.pdf ; APS, https://www.aps.org/apsnews/2023/05/vera-rubin-paper-dark-matter ; Public Law 116-97, https://www.congress.gov/116/plaws/publ97/PLAW-116publ97.htm . Not "discovered dark matter".

### Theme D
- **Katherine Johnson:** NASA biography, https://www.nasa.gov/centers-and-facilities/langley/katherine-johnson-biography/ ; NASA TN D-233, https://ntrs.nasa.gov/citations/19980227091 ; on the film, https://www.collectspace.com/news/news-010517a-hidden-figures-john-glenn-mystery.html . First woman *in her division* credited as a report author; the Glenn check was before launch, not on the pad; "Apollo Moon landings", not Apollo 11 specifically.
- **Mary Golda Ross:** Smithsonian NASM, https://airandspace.si.edu/stories/editorial/mary-g-ross-aerospace-engineer ; Oklahoma Historical Society, https://www.okhistory.org/publications/enc/entry?entry=RO041 ; NASA, https://www.nasa.gov/image-article/mary-ross-hidden-figure ; US Mint coin, https://www.usmint.gov/learn/coins-and-medals/collectible-coins/native-american-dollar-coins/2019-american-indians-in-space . "Founded the Skunk Works" avoided (it dates from 1943); "first known"; great-great-granddaughter of John Ross. No openly licensed photo found, so the coin is shown (said on the page); placed in the HL "Escape speed" section, as the coin shows her escape-energy equation.
- **Coulomb:** MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Coulomb/ ; APS, https://aps.org/publications/apsnews/201606/physicshistory.cfm . Priestley and Cavendish came earlier; the precision of his results is debated (both said on the page).
- **Shen Kuo:** DSB (N. Sivin), https://www.encyclopedia.com/science/encyclopedias-almanacs-transcripts-and-maps/shen-kua ; MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Shen_Kua/ . "Earliest known clear description", not the inventor of the compass. Picture: a modern statue (said on the page).
- **J. J. Thomson:** AIP, https://history.aip.org/exhibits/electron/jj1897.htm ; Nobel lecture, https://web.lemoyne.edu/GIUNTA/EA/THOMSONann.HTML ; Nobel 1906, https://www.nobelprize.org/prizes/physics/1906/summary/ . About 1000× in 1897, later about 1800×; "plum pudding" is a later nickname.
- **Joan Feynman:** Physics Today obituary, https://physicstoday.aip.org/obituaries/joan-feynman ; APS, https://www.aps.org/apsnews/2020/08/joan-feynman-obituary ; NASA biography, https://science.nasa.gov/wp-content/uploads/2023/09/SWLH-BIO_Joan_Feynman.pdf . Not "discovered how auroras form"; medal year differs between sources (2000/2002), so no year is given.
- **Faraday:** Royal Institution, https://www.rigb.org/node/2696 and https://www.rigb.org/christmas-lectures/history-christmas-lecturesr ; MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Faraday/ . No knighthood is known to have been offered; he didn't start the Christmas Lectures.
- **Tesla:** ETHW, https://ethw.org/Nikola_Tesla ; rotating fields milestone, https://ethw.org/Milestones:Rotating_Fields_and_Early_Induction_Motors,_1885-1888 ; Adams plant, https://ethw.org/Milestones:Adams_Hydroelectric_Generating_Plant,_1895 ; radio myth, https://www.mercurians.org/1998_fall/misreading.htm . Ferraris independent; not "inventor of radio".

### Theme E
- **Rutherford:** AIP, https://history.aip.org/exhibits/rutherford/sections/alpha-particles-atom.html ; CERN Courier, https://cerncourier.com/a/rutherford-transmutation-and-the-proton/ ; the "15-inch shell" quote, https://en.wikiquote.org/wiki/Ernest_Rutherford . The quote is a 1936 memory (described as "years later"); Nobel 1908 was in Chemistry, for McGill work; no oxygen identification claimed for 1919.
- **Nagaoka:** DSB, https://encyclopedia.com/science/dictionaries-thesauruses-pictures-and-press-releases/nagaoka-hantaro ; Physics Today (Badash 1967), https://physicstoday.aip.org/features/nagaoka-to-rutherford-22-february-1911 ; National Diet Library, https://www.ndl.go.jp/portrait/e/datas/5176 . "Heavy" centre; probably didn't shape Rutherford's argument (said on the page).
- **S. N. Bose:** MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Bose/ ; the Phil. Mag. rejection, https://arxiv.org/pdf/2210.13967 ("reportedly"); relativity translation, https://gutenberg.org/cache/epub/66944/pg66944-images.html .
- **Imes:** APS News, https://www.aps.org/apsnews/2008/11/elmer-imes-publishes-infrared-spectroscopy ; Rackham (Michigan), https://rackham.umich.edu/discover-rackham/a-scholar-and-a-trailblazer/ ; isotopes, https://arxiv.org/pdf/1112.2339 . The 1919 paper was his alone; others made the isotope interpretation (said on the page).
- **Curie:** AIP, https://history.aip.org/exhibits/curie/ and https://history.aip.org/exhibits/curie/war1.htm ; notebooks, https://www.sciencealert.com/these-personal-effects-of-marie-curie-will-be-radioactive-for-another-1-500-years . She didn't discover radioactivity (Becquerel); she named it and showed it was atomic.
- **Wu:** NAS memoir (Benczer-Koller, 2009), https://www.nasonline.org/wp-content/uploads/2024/06/wu-chien-shiung.pdf . "First Lady of Physics" has no traceable source, so it's given as "often called".
- **Meitner:** Stuewer, https://www.mprl-series.mpg.de/media/proceedings/5/11/Proc5ch9.pdf ; Atomic Heritage Foundation, https://ahf.nuclearmuseum.org/ahf/profile/lise-meitner/ ; NPS, https://www.nps.gov/people/women-of-the-manhattan-project-lise-meitner.htm .
- **Fermi:** Chicago Pile-1, https://ethw.org/Chicago_Pile-1 ; Laura Fermi, https://ahf.nuclearmuseum.org/ahf/profile/laura-fermi/ . His Nobel "new elements" were mostly fission products (said on the page).
- **Payne-Gaposchkin:** DSB (Gingerich), https://mathshistory.st-andrews.ac.uk/DSB/payne-gaposchkin.pdf . Not "first woman full professor at Harvard": the first woman to head a Harvard department (1956).
- **Chandrasekhar:** MacTutor, https://mathshistory.st-andrews.ac.uk/Biographies/Chandrasekhar/ ; priority, https://physicstoday.aip.org/letters/placing-chandras-work-in-historical-context . Others found simpler limits at about the same time (said on the page). The Chandrasekhar limit is new in the 2028 guide.

**Pictures (theme E):** public domain, except Wu (AIP Emilio Segrè Visual Archives, CC BY 4.0) and the HCl spectrum (Cnrowley, CC BY-SA 4.0). The Smithsonian "no known copyright restrictions" photos of Wu were not used, because that isn't one of the allowed licences. No openly licensed photo of Elmer Imes was found, so (teacher's choice, 8 November 2026) his box shows an openly licensed modern measurement of the kind of spectrum he measured.

**Pictures (theme D):** public domain, except Shen Kuo's statue (CatOnMars, CC BY-SA 4.0) and Joan Feynman (Maia Weinstock, CC BY-SA 4.0). Mary Golda Ross is shown on the 2019 US Mint coin (public domain); "$1" is written "one-dollar" so MathJax doesn't treat it as an equation.

**Pictures (theme C):** public domain, except the seismoscope model (Kowloonese, CC BY-SA 3.0) and Rubin (NOIRLab/NSF/AURA, CC BY 4.0). No authentic portraits exist of Zhang Heng, Ibn al-Haytham or Ibn Sahl, so their boxes show a model of the seismoscope, the eye diagram from an early copy of the *Book of Optics*, and a page of Ibn Sahl's treatise.

**Pictures (theme B):** public domain, except Joseph Black (Wellcome Collection, CC BY 4.0; the National Galleries painting's licence was unclear) and Manabe (Japanese Ministry of Education, CC BY 4.0). No portrait of Foote is known (a 2024 drawing on Commons was not used), so her box shows the page of her 1856 paper.

**Pictures (theme A):** all public domain on Wikimedia Commons, licences checked through the Commons API. No portrait of al-Khazini exists, so his box shows his balance from a c. 1270 manuscript (University of Pennsylvania, LJS 386). Resized to 480 px wide (800 px for the manuscript), 28–119 KB each.

## 8. Steps

1. Teacher agrees this plan and the candidate list.
2. Theme A pilot: write the text, check every fact, find and credit the pictures, build the topic-page box and the builder option, add the checker rules, check at 375 px and in dark mode.
3. Teacher checks the pilot in the preview; push only with the teacher's OK.
4. Themes B–E in batches.
