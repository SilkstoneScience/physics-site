# Paper 1B: how to continue on any computer

Last updated **8 October 2026**. A step-by-step guide for resuming Paper 1B work, written so that it needs nothing
outside this repository. For the full state of the project, read `docs/PAPER1B_PROJECT_STATUS.md`.

---

## Where things stand

### Current production
- **`main` is production.** GitHub Pages publishes the `main` branch as the live website.
- **Batch 1 is live.** It reached `main` in `a9f8c58` ("Merge paper-1b: Paper 1B pilots, Batch 1 and review pipeline").
- **The production commit is `4ca0f74`** ("Merge contact form on the About page", 7 October 2026). It adds 26 commits of
  general website work after `a9f8c58` (EE page, Resources, guiding questions, photos, copyright notice, contact form);
  none of them touches Paper 1B (`questions/1b.json` and `tools/1b/` are unchanged since `a9f8c58`).
- **13 Paper 1B datasets are approved and published:** 5 original pilots (A1-B01, B5-B01, C4-B01, D3-B01, E3-B01) and 8 Batch 1 datasets (A1-B02, A2-B01, A2-B02, B1-B01, B1-B02, B3-B01, C1-B01, D1-B01).

### Development branches
- **`paper-1b`** (`a3fa896`): the **historical** Batch 1 development branch. Everything on it is already in `main`. Keep it, but don't develop on it.
- **`paper1b-batch2`**: the **current** branch for Batch 2 development, on GitHub. Created from `main` at `a9f8c58`, then
  brought up to date with production `main` (`4ca0f74`) on 8 October 2026.

### Batch 2 status
- **Batch 2 has NOT been generated.**
- No Batch 2 dataset is approved, and none is in production.
- Batch 2 development begins from the current production `main`, on `paper1b-batch2`.

---

## Resume instructions

Run the commands in a terminal. On Windows the "Git Bash" or PowerShell terminal both work for these commands.

### 1. Clone the repository (first time on a computer)
```
git clone https://github.com/SilkstoneScience/physics-site.git
cd physics-site
```
If the repository is already on the computer, open its `physics-site` folder and run `git fetch` instead.

### 2. Check out the Batch 2 branch
```
git fetch
git checkout paper1b-batch2
git pull
```
`paper1b-batch2` is on GitHub, so `git checkout` creates it locally from `origin/paper1b-batch2`. Only if it is ever
missing, create it from production:
```
git checkout -b paper1b-batch2 origin/main
```

### 3. Confirm `main` and the development branch
```
git branch --show-current
git log -1 --oneline origin/main
git log -1 --oneline
git status
```
- The first command must print `paper1b-batch2`. **If it prints `main`, stop and switch branches before changing anything.**
- `origin/main` should be the production commit (`4ca0f74` or a later, deliberately merged production commit).
- `main` should be contained in `paper1b-batch2`: `git merge-base --is-ancestor origin/main HEAD` prints nothing and
  succeeds. If production has moved on, merge `main` into `paper1b-batch2` before starting new work.
- `git status` should report a clean working tree.

### 4. Install dependencies
- Install **Node.js** if it isn't already installed (Windows: `winget install OpenJS.NodeJS.LTS`, then reopen the terminal). Check with `node --version`.
- There are **no npm packages** to install: the repository has no `package.json`.
- Create `CLAUDE.local.md` in `physics-site` (it is not stored in git). It records where the `physics-source` folder and the reference cache are on this computer; see `CLAUDE.md` for what it contains. It is needed only for work that reads source material such as lessons and past papers.

### 5. Run the test suite
```
node tools/1b/test.mjs
```
Expect "✓ All 543 Paper 1B tests passed" (more if tests have been added since).

### 6. Run the Paper 1B build
```
node tools/1b/build.mjs
```
Expect it to end with "Production (questions/1b.json): 9 APPROVED dataset(s)" and 4 in the local preview: after Phase 12, A2-B01, A2-B02, B3-B01 and C1-B01 await re-approval (13 once they are re-approved; see `docs/PAPER1B_PHASE12_TOOLING.md`). It also rebuilds the local preview
(`questions/1b-preview.json`), which is never committed.

**Windows note:** after a build, `git status` may list the question files as modified even though nothing changed.
Git converts line endings on Windows, and the build writes Unix line endings. Check with `git diff --stat`; if it
shows no lines changed, restore the committed copies with `git checkout -- questions/`.

### 7. Run the site checker
```
node tools/check.mjs
```
Expect "✓ No errors". The same check runs on GitHub after every push.

### 8. Start the local preview
Double-click `preview.bat`, or run:
```
powershell -ExecutionPolicy Bypass -File tools/preview.ps1
```
then open http://localhost:8000 in a browser. Close the window (or press Ctrl+C) to stop it.

### 9. Inspect the existing 13 Paper 1B datasets
- All Paper 1B questions: http://localhost:8000/questions.html?paper=1B
- One question: http://localhost:8000/questions.html?paper=1B&q=D1-B01 (change the ID)
- Review status and approval basis of every dataset: `node tools/1b/review.mjs status`
- The physics behind each dataset: `node tools/1b/build.mjs --audit`
- AO balance: `node tools/1b/ao.mjs --parts`

Datasets that aren't approved appear only in the local preview, marked "Preview only: STATUS".

### 10. Read the design documents (in this order)
1. `docs/PAPER1B_PROJECT_STATUS.md`: current state, production bank, review architecture, tooling, limitations, NEXT ACTION.
2. `docs/PAPER1B_SPECIFICATION.md`: the design rules every dataset must follow, and the review model (section 16).
3. `docs/PAPER1B_ARCHETYPE_MATRIX.md`: the 26 question archetypes and their risk levels.
4. `docs/PAPER1B_BATCH1_RETROSPECTIVE.md`: what Batch 1 showed, the tooling to fix first (section 7), and Batch 2 priorities (section 9).
5. `tools/1b/README.md`: how to write a dataset file and what the validator checks.

### 11. Plan Batch 2
- First decide on, and implement, the MUST FIX tooling in the retrospective (section 7). These are the checks for repeated context families, too-regular data, graph values outside the plotted axes, and giveaways across parts.
- Choose about 8 datasets following the retrospective's priorities (section 9). Prefer second examples of the HIGH-risk archetypes in new contexts, the missing archetypes and topics, more Difficulty 1, and diagrams. Avoid springs, loaded wires and electrical heaters for now.
- Record the plan in the repository (for example in the project status file) before generating anything.

### 12. Only then generate Batch 2
On `paper1b-batch2`:
1. Write each dataset in `tools/1b/datasets/<ID>.mjs` with `batch: 'batch-2'`, `archetypes`, `apparatus`, an `originality` note, and an AO tag on every part (see `tools/1b/README.md`).
2. Add an independent physics audit for each dataset in `tools/1b/independent.mjs`.
3. Run `node tools/1b/build.mjs` until there are no errors or warnings, then `node tools/1b/test.mjs` and `node tools/check.mjs`.
4. Read every generated question in the preview (Batch 1 showed that reading catches problems the checks miss).
5. Record PHYSICS-REVIEWED for each dataset: `node tools/1b/review.mjs set <ID> PHYSICS-REVIEWED --by "<name>" --note "<what was checked>"`.
6. Run `node tools/1b/review.mjs batch batch-2` and `node tools/1b/ao.mjs --batch batch-2`.
7. The teacher inspects the AMBER datasets (or waives them with written reasons) and the GREEN sample, then decides on `node tools/1b/review.mjs accept-batch batch-2 …`.
8. Commit and push `paper1b-batch2`. Merging into `main` is a separate teacher decision, taken after the full checks pass again.

---

## Production safety rules

- **Never generate directly on `main`.** Develop on `paper1b-batch2`. Check `git branch --show-current` before every commit.
- **Never populate production from development without approval.** Only APPROVED, unchanged datasets are written to `questions/1b.json` (by `build.mjs`, never by hand), and a development branch reaches `main` only on the teacher's instruction.
- **Never mark datasets APPROVED automatically.** APPROVED, TEACHER-REVIEWED and batch acceptance always name a person. Claude records them only on the teacher's explicit instruction, with `--recorded-by`.
- **Never label a dataset TEACHER-REVIEWED unless the teacher personally inspected it.**
- **Use batch acceptance for qualifying uninspected datasets.** GREEN datasets, and AMBER datasets the teacher waives with a written reason, are approved through `node tools/1b/review.mjs accept-batch`, which records `inspected: false`. RED datasets can never be accepted.
- **Validate before merging:** `node tools/1b/test.mjs`, `node tools/1b/build.mjs` and `node tools/check.mjs` must all pass on the branch being merged and again on `main` after the merge, before pushing.
- **Run the complete QA pipeline before production:** validation and independent physics audit (the build), tests, the batch plan (`review.mjs batch`), the AO report (`ao.mjs`), the site checker, reading the questions in the preview, teacher sampling, and batch acceptance.
- **Never silently change a reviewed dataset.** If the checker reports `frozen-changed`, stop and tell the teacher. A reviewed dataset is changed only with `review.mjs reset` and a fresh review.
