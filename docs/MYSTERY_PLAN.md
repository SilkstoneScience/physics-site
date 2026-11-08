# Physics mystery games: plan for the first case

Draft for the teacher's review (8 November 2026). Nothing is built yet.
This file is not published (`docs/` is excluded in `_config.yml`).

## 1. The idea in one paragraph
Students are detectives with a case file: a short crime story, a floor plan, witness statements and evidence.
Some statements contain **physics claims**. Students test each claim with a calculation from a different part of
the syllabus, write a short note on what it proves, and finally **write an accusation** that links the evidence
to the physics. One case takes about 25–35 minutes and works on a phone, alone or in groups.

## 2. Case 1: "The vanishing meteorite"
**Syllabus areas:** A.1 Kinematics, B.1 Thermal energy transfers, B.5 Current and circuits, C.2 Wave model.
All SL, so every student can play it.

**Theft, not murder (suggested).** A theft keeps it school-friendly while it plays exactly like a murder mystery.
Later cases could use a murder if you prefer: that's your call (see section 9).

### The story (what students read first)
A stormy Friday evening at the Hilltop Science Museum. At **20:14:00** the alarm on a display case in the
**first-floor gallery** goes off. When people arrive, the glass is smashed and the museum's prize exhibit, a 4 kg
iron meteorite, is gone. Next morning the brass key to the display case is found in the flowerbed below the
museum's west wall. Four people were in or near the building. One of them is the thief.

### The suspects (names and roles can change)
| Suspect | Role | Their story, in short | Looks suspicious because… |
|---|---|---|---|
| **Dr Ines Navarro** | Visiting astronomer | "I was at the radio-telescope hut across the field, about 900 m away, filming the storm." | She studies iron meteorites and the museum refused to lend her this one. *(red herring)* |
| **Sam Okafor** | Runs the museum café | "I'd just served my last customer and put the kettle on. The alarm went just before it boiled. I came out and saw Lena at the bottom of the stairs, and we ran up to the gallery together." | Alone, no camera in the café kitchen. |
| **Lena Fischer** | Student intern | "I was in the second-floor workshop wiring a lamp for the new exhibit. When the alarm went I ran downstairs." | The workshop is on the **west side of the second floor**. *(red herring)* |
| **Victor Hale** | Deputy director | "The power went off at about 20:13 and I was stuck in the lift until 20:25. I used my phone torch, then the battery went flat, so I couldn't call anyone." | Nobody saw him until 20:25. A letter in the case file hints he owes money. |

**What really happened (the solution):** Victor smashed the case at 20:14:00, ran up to his office (second floor,
west side) and threw the key out of the window at 20:14:40, then hid the meteorite and later walked out of the lift.
His story fails twice on physics. The other three stories hold up.

## 3. The four clues
Each clue has: the **evidence** (a document in the case file), a **calculation** (typed number, marked automatically
by the site's existing number checker, `js/numeric.js`), a **"what does this prove?"** choice, and a
**detective's note** (one or two sentences the student writes, then compares with a model note).
Every number below has been recalculated.

### Clue 1: The thunderclap (C.2 Wave model): clears Dr Navarro
- **Evidence:** the lightning-rod strike counter on the museum roof logs a strike at 20:14:05. Dr Navarro's video
  shows the flash at 20:14:05.0 and the thunder on its soundtrack at 20:14:07.7. A note gives the speed of sound
  in air as 340 m s⁻¹.
- **Calculation:** distance from the strike to her camera = 2.7 s × 340 m s⁻¹ ≈ **920 m**.
- **What it proves:** her camera was about 900 m from the museum, just as she said (inside the museum the delay would
  be well under 0.1 s). She was at the hut 5 seconds after the theft, so she can't be the thief.
- **Physics points to bring out:** light's travel time (about 3 µs) is negligible; sound is much slower.
- **Tempting mistakes to give feedback on:** dividing instead of multiplying (0.0079 m), forgetting to subtract the
  two times.

### Clue 2: The café kettle (B.1 Thermal energy transfers): confirms Sam's timeline *and* that the power was on
- **Evidence:** the café till receipt for the last customer is timed 20:10:52; Sam says he switched the kettle on
  straight after. The kettle's label: 3.0 kW. Sam filled it to the 1.5 litre line with tap water at 10 °C.
  Data: c of water = 4200 J kg⁻¹ K⁻¹, 1 litre of water has a mass of 1.0 kg.
- **Calculation:** Q = mcΔT = 1.5 × 4200 × 90 = 567 000 J; time = Q / P = **189 s** (3 min 9 s).
- **What it proves:** even with no heat losses, the kettle can't boil before about 20:14:09. So "the alarm went just
  before it boiled" fits, and Sam was in the café kitchen at the moment of the theft. It also proves **the power was
  still on after 20:14**, which matters for Victor's story (clue 4).
- **Physics points:** real kettles lose some energy to the surroundings, so the real time is a bit longer: this
  makes the time a minimum, and the argument still works. ("Why does the argument still work?" is a good
  written-note question.)
- **Tempting mistakes:** using 100 °C instead of ΔT = 90 K (210 s), using 3.0 W or forgetting kilo (189 000 s).

### Clue 3: The falling key (A.1 Kinematics): the thief went up to the second floor
- **Evidence:** a security camera at ground level (50 frames per second) films the flowerbed. The upper windows are
  hidden by rain, but at 20:14:40 a small object falls into view. In the last two frames before it lands, it moves
  **0.23 m** downwards. A floor guide gives window-sill heights: first floor 3.5 m, second floor 7.0 m,
  dome (third floor) 10.5 m. It was a heavy brass key, so air resistance is negligible.
- **Calculation:** speed just before landing ≈ 0.23 m / 0.020 s = 11.5 m s⁻¹; height from v² = 2gh:
  h = 11.5² / (2 × 9.8) ≈ **6.7 m**, so the **second floor** (first floor would give about 0.17 m per frame, the dome 0.29 m).
- **What it proves:** the key was thrown from a second-floor west window 40 s after the theft. The rooms there are
  the **workshop** (Lena's) and the **deputy director's office** (Victor's).
- **Physics points:** if the key was thrown sideways, its vertical motion is the same as a drop (horizontal and
  vertical motions are independent): good for a written note. The frame speed is an average over the last frame,
  slightly less than the landing speed, which doesn't change the floor.
- **Tempting mistakes:** using v = h/t-style "distance over time" for the whole fall; forgetting to square; using
  0.23 m per *second*.
- **Red-herring moment:** this clue makes Lena look guilty. Students must use clue 2 (Sam saw Lena on the ground
  floor just after the alarm, and they reached the gallery together) to see she couldn't have been upstairs at 20:14:40.

### Clue 4: The flat phone (B.5 Current and circuits): Victor's story breaks
- **Evidence:** Victor says he used his phone torch for about 10 minutes, then the battery died. He'd told a colleague
  earlier it was "on about 20 %". The phone's spec sheet: the full battery stores **14 400 C** of charge (shown as
  "4000 mAh", with a note converting it, because battery capacity in mAh isn't in the guide). The torch with the
  screen on draws a current of **0.40 A**.
- **Calculation:** charge used in 10 minutes: Δq = IΔt = 0.40 × 600 = **240 C**, which is about 1.7 % of a full
  battery; 20 % (2880 C) would last 2880 / 0.40 = 7200 s = **2 hours**.
- **What it proves:** the battery couldn't have gone flat, so his reason for not calling for help is false.
  Together with clue 2 (the power was on after 20:14, so no power cut at 20:13 stopped the lift), Victor's whole
  alibi collapses.
- **Physics points:** current is the rate of flow of charge (I = Δq/Δt, as the guide words it in B.5).
- **Tempting mistakes:** using 10 instead of 600 s (4 C), multiplying by voltage when charge is asked for.

## 4. The accusation (the literacy finale)
Unlocked once all four clues are solved (or earlier, for a "bold detective" bonus).
1. **Choose the thief.**
2. **Pick the evidence** that proves it (from cards for all the clues, including tempting but irrelevant ones such as
   Dr Navarro's motive).
3. **Write the accusation** in 4–6 sentences. A writing frame is offered but optional:
   *"The thief was … because … . The [evidence] shows … , and since … , this means … . The other suspects could not
   have done it because … ."*
4. **Compare with the model accusation**, ticking a checklist like a mark scheme: names Victor; uses the kettle to
   show the power was on; uses the battery charge to show the phone couldn't have died; uses the key to place the
   thief on the second floor 40 s later; explains why Lena is cleared; gives the physics reason each time, not just
   "it doesn't add up".

Model accusation (draft): *"Victor Hale stole the meteorite. He said the power failed at 20:13, but Sam's kettle
needed at least 189 s of 3.0 kW to boil after 20:11, so the power was still on after 20:14. He also said his phone
died after 10 minutes of torch, but that uses only 240 C, about 2 % of the battery. The key was thrown from a
second-floor window: it landed at about 11.5 m s⁻¹, which means a fall of about 6.7 m. The only second-floor west
rooms are his office and the workshop, and Lena had already been seen downstairs with Sam."*

## 5. Literacy and engagement features
- **Read closely:** students tap a sentence in a statement to **pin it as a claim** to test. Pinning the right claims
  earns a "sharp eye" badge (no penalty for extra pins).
- **Detective's notebook:** each solved clue adds the student's own note. The notebook becomes the plan for the
  accusation.
- **Command terms:** the clue tasks use IB command terms (calculate, deduce, explain, justify), linked to the
  Exam technique page.
- **Interview a suspect:** after some clues, a follow-up question for a suspect unlocks (choose 1 of 3 questions):
  more text to read and sometimes a new detail.
- **Rank** at the end, e.g. Constable, Sergeant, Inspector, Chief Inspector (fewer hints and wrong answers = higher rank).
- **Class mode:** "Show on the board", and a printable case file so groups can work on paper and argue it out (oracy).

## 6. How it would be built (no new libraries, same style as the rest of the site)
- `mystery.html?case=meteorite`: one page that plays any case; code in `js/mystery.js`, styles in `css/mystery.css`.
- One data file per case: `mysteries/meteorite.json` (story, suspects, evidence, clues with typed answers, model
  notes, accusation checklist). A new case later means writing a new data file, not new code.
- Pictures: our own SVGs (floor plan, the camera frames, the kettle label, the phone spec sheet). No AI images.
- Progress saved only in that browser, like the escape room.
- **A Games page** (`games.html`) holding the escape room and the mysteries, with **one** home-page card
  ("Play: review games") in place of the separate escape-room card.
- The checker (`tools/check.mjs`) gets rules for the case files: ids, every clue has a typed answer and a model
  note, pictures have alt text, and the numbers in the model answers match the calculations.

## 7. Checking before it goes live
- Every number recalculated by a script (done for this draft: 918 m, 567 000 J and 189 s, 11.5 m s⁻¹ and 6.75 m,
  0.17/0.23/0.29 m per frame, 240 C, 1.7 %, 2 h).
- An **independent review** by fresh reviewers: the physics, the logic of the solution (is there any way another
  suspect could have done it?), and that no picture or wording gives the answer away.
- Your check in the preview before anything is pushed.

## 8. Effort
About the size of a Think deeper batch: the page and code once (reusable for every later case), then this case's
writing and pictures. Later cases would be mostly writing.

## 9. Decisions for you
1. **Theft or murder** for this case (and for later ones)?
2. **Setting and names:** happy with a science museum and these four characters?
3. **A Games page** with one home-page card, replacing the escape-room card?
4. **How much help:** a hint per clue (with a rank penalty), plus the optional writing frame?
5. **Next cases:** for example a case for themes D and E (a sabotaged space mission?), or one HL case.
