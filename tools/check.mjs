// Site checker: run with `node tools/check.mjs` from the physics-site folder.
// `node tools/check.mjs --sitemap` also rewrites sitemap.xml from the list of pages.
// Checks the question bank, the links between pages, each page's basic set-up, the
// syllabus/equation data in js/site.js, and the marking of typed numerical answers.
// Errors (✗) must be fixed; warnings (!) are worth a look. Exit code 1 if there are errors.
// GitHub runs this on every push (.github/workflows/check.yml). No packages needed.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://physics.silkstone.xyz/';
const SKIP_DIRS = new Set(['.git', '.github', '.claude', 'tools', 'node_modules', 'docs']);
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/^﻿/, '');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

// ---------- 1. Syllabus and equation data from js/site.js ----------
// Run site.js in a sandbox with a pretend browser, then read window.SYLLABUS etc.
function loadSiteData() {
  const noop = () => {};
  const el = () => null;
  const document = {
    body: { dataset: {}, classList: { add: noop }, append: noop },
    getElementById: el, querySelector: el, querySelectorAll: () => [],
    addEventListener: noop, createElement: () => ({ setAttribute: noop, addEventListener: noop, classList: { add: noop } }),
    readyState: 'complete', referrer: '',
  };
  const sandbox = { document, location: { origin: '', pathname: '/' }, history: {}, localStorage: { getItem: el, setItem: noop }, console };
  sandbox.window = sandbox;
  sandbox.addEventListener = noop;
  vm.createContext(sandbox);
  vm.runInContext(read('js/site.js'), sandbox, { filename: 'js/site.js' });
  return sandbox;
}
const site = loadSiteData();
const TOPICS = new Map(site.SYLLABUS.flatMap((t) => t.topics.map((s) => [s.id, { ...s, theme: t.id }])));

for (const [id] of TOPICS) {
  const file = 'themes/' + site.topicFile(id);
  if (!exists(file)) err('js/site.js', `topic ${id} has no page ${file}`);
}
for (const t of site.SYLLABUS) if (!exists(`themes/${t.id.toLowerCase()}.html`)) err('js/site.js', `theme ${t.id} has no page`);
for (const [id, d] of Object.entries(site.DATA_BOOKLET)) {
  if (!TOPICS.has(id)) err('js/site.js DATA_BOOKLET', `unknown topic ${id}`);
  for (const c of d.constants || []) if (!site.CONSTANTS[c]) err('js/site.js DATA_BOOKLET', `${id} uses unknown constant "${c}"`);
  if (TOPICS.get(id)?.hl) for (const [label, , hl] of d.equations) if (!hl) warn('js/site.js DATA_BOOKLET', `${id} is HL only, but "${label}" isn't marked HL`);
}
// A fourth item marks an equation as new or changed for the 2028 data booklet ('2028'); nothing else is allowed there.
for (const [id, d] of [...Object.entries(site.DATA_BOOKLET), ['maths', site.DATA_BOOKLET_MATHS || { equations: [] }]]) {
  for (const [label, , , mark] of d.equations) if (mark !== undefined && mark !== '2028') err('js/site.js DATA_BOOKLET', `${id}: "${label}" has an unknown marker "${mark}" (use '2028')`);
}
if (!site.DATA_BOOKLET_MATHS) err('js/site.js', 'DATA_BOOKLET_MATHS (the maths and uncertainties equations) is missing');

// ---------- 2. Question bank ----------
const { checkNumeric, parseNumber } = createRequire(import.meta.url)('../js/numeric.js');
const questionIds = new Map(); // id -> topic

// A single backslash in JSON turns \theta into a tab, \frac into a form feed, \nu into a new line...
const CONTROL = /[\t\b\f\r]/;
function checkText(where, s, field) {
  if (typeof s !== 'string' || !s.trim()) { err(where, `${field} is missing or empty`); return; }
  if (CONTROL.test(s)) err(where, `${field} contains a control character: a backslash in LaTeX probably needs doubling (e.g. "\\\\theta")`);
  const dollars = (s.replace(/\\\$/g, '').match(/\$/g) || []).length;
  if (dollars % 2) err(where, `${field} has an odd number of $ signs, so an equation isn't closed`);
  if (/\$[^$]*\n[^$]*\$/.test(s)) err(where, `${field} has a line break inside an equation: probably "\\n..." (e.g. \\nu) needing a double backslash`);
}

function checkQuestion(q, file) {
  const where = `${file} ${q.id || '(no id)'}`;
  if (typeof q.id !== 'string' || !q.id) { err(where, 'missing id'); return; }
  if (questionIds.has(q.id)) err(where, 'duplicate id');
  questionIds.set(q.id, q.topic);
  // Paper 2 linking questions (20 marks, several themes: paper "2L") have topic "Linking", no theme, and list their topics.
  const linking = q.paper === '2L';
  if (!/^([A-E]\d-(\d{3}|B\d{2}|P\d{2})|LQ-[SH]\d{2})$/.test(q.id)) warn(where, 'id doesn\'t follow the pattern A1-001 (D3-B01 for a generated Paper 1B dataset, A1-P01 or LQ-S01 for a generated Paper 2 question)');
  const topic = linking ? null : TOPICS.get(q.topic);
  if (linking) {
    if (q.topic !== 'Linking' || q.theme !== '') err(where, 'a linking question (paper "2L") has topic "Linking" and theme ""');
    if (!Array.isArray(q.topics) || !q.topics.length || !q.topics.every((t) => TOPICS.has(t))) err(where, 'a linking question lists its topics (known subtopics) in "topics"');
    else if (q.level !== 'HL' && q.topics.some((t) => TOPICS.get(t).hl)) err(where, 'a linking question with an HL-only topic must be HL');
  } else {
    if (!topic) err(where, `unknown topic "${q.topic}"`);
    if (q.theme !== (topic ? topic.theme : q.theme)) err(where, `theme "${q.theme}" doesn't match topic ${q.topic}`);
    if (topic && q.id.slice(0, 2) !== q.topic.replace('.', '')) warn(where, `id doesn't start with its topic (${q.topic})`);
  }
  if (!['1A', '1B', '2', '2L'].includes(q.paper)) err(where, `paper must be "1A", "1B", "2" or "2L", not ${JSON.stringify(q.paper)}`);
  if (![1, 2, 3].includes(q.difficulty)) err(where, 'difficulty must be 1, 2 or 3');
  // Paper 1B is the same paper for SL and HL students, so it uses SL material only: level "SL_HL".
  if (!['SL', 'HL', 'SL_HL'].includes(q.level)) err(where, 'level must be "SL", "HL" or "SL_HL"');
  if ((q.paper === '1B') !== (q.level === 'SL_HL')) err(where, 'Paper 1B questions (and only those) have level "SL_HL": Paper 1B is common to SL and HL');
  if (topic && topic.hl && q.level !== 'HL') err(where, `${q.topic} is HL only, so level must be "HL"${q.paper === '1B' ? ' (and Paper 1B can\'t use HL-only topics)' : ''}`);
  // "y2028": true marks content new in the guide for exams from 2028 (tagged and filterable in the question bank).
  if (q.y2028 !== undefined && q.y2028 !== true) err(where, '"y2028" must be true (or left out)');
  checkText(where, q.stem, 'stem');
  if (q.diagram) {
    if (!exists(q.diagram)) err(where, `diagram file not found: ${q.diagram}`);
    if (!q.diagramAlt) err(where, 'diagram has no diagramAlt (text description)');
  }

  if (q.paper === '1A') {
    if (!Array.isArray(q.options) || q.options.length !== 4) err(where, 'needs exactly 4 options');
    else q.options.forEach((o, i) => checkText(where, o, `option ${'ABCD'[i]}`));
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) err(where, 'answer must be 0, 1, 2 or 3');
    if (q.explanation) checkText(where, q.explanation, 'explanation'); else warn(where, 'no explanation');
    return;
  }
  if (!Array.isArray(q.parts) || !q.parts.length) { err(where, 'structured question needs a "parts" list'); return; }
  const labels = new Set();
  q.parts.forEach((pt, i) => {
    const pw = `${where} (${pt.label || i + 1})`;
    if (!pt.label) err(pw, 'part has no label');
    if (labels.has(pt.label)) err(pw, 'duplicate part label');
    labels.add(pt.label);
    checkText(pw, pt.question, 'question');
    if (!Number.isInteger(pt.marks) || pt.marks < 1) err(pw, 'marks must be a whole number of at least 1');
    if (!Array.isArray(pt.markscheme) || !pt.markscheme.length) err(pw, 'needs a markscheme list');
    else pt.markscheme.forEach((m, j) => checkText(pw, m, `markscheme point ${j + 1}`));
    if (pt.numeric) checkNumericField(pw, pt.numeric);
  });
}

function checkNumericField(where, n) {
  if (typeof n.answer !== 'number' || !isFinite(n.answer)) { err(where, 'numeric.answer must be a number'); return; }
  if (n.range && (!Array.isArray(n.range) || n.range.length !== 2 || !n.range.every(Number.isFinite))) err(where, 'numeric.range must be [min, max]');
  if (n.tolerance !== undefined && !(n.tolerance > 0 && n.tolerance < 1)) err(where, 'numeric.tolerance should be a fraction such as 0.02');
  // The stored answer must be marked right, and listed mistakes must not be.
  if (checkNumeric(n, String(n.answer)).status !== 'right') err(where, `numeric: the answer ${n.answer} itself isn't accepted (check range/tolerance)`);
  for (const m of n.mistakes || []) {
    if (typeof m.value !== 'number' || !m.feedback) err(where, 'each numeric mistake needs a value and feedback');
    else if (checkNumeric(n, String(m.value)).status === 'right') err(where, `numeric: the mistake value ${m.value} is accepted as correct`);
  }
}

let questionCount = 0;
try {
  const index = JSON.parse(read('questions/index.json'));
  for (const file of index.files) {
    const rel = 'questions/' + file;
    if (!exists(rel)) { err('questions/index.json', `lists ${file}, which doesn't exist`); continue; }
    let list;
    try { list = JSON.parse(read(rel)); } catch (e) { err(rel, `isn't valid JSON: ${e.message}`); continue; }
    if (!Array.isArray(list)) { err(rel, 'should be a list [ ... ] of questions'); continue; }
    list.forEach((q) => checkQuestion(q, rel));
    questionCount += list.length;
  }
} catch (e) {
  err('questions/index.json', e.message);
}

// ---------- 2b. Paper 1B datasets (tools/1b) ----------
// Rebuilds every dataset in memory: each must pass the validator, questions/1b.json must be
// exactly what the generator produces (so nobody has edited it by hand or forgotten to rebuild),
// and the generator/validator's own tests must pass.
const p1b = await import('./1b/build.mjs');
const { formatDiag } = await import('./1b/validate.mjs');
const built1b = p1b.buildAll(await p1b.loadDatasets(), TOPICS);
for (const x of built1b.diags) (x.level === 'error' ? err : warn)(`Paper 1B ${x.dataset}`, formatDiag(x).split('\n').slice(1, -1).map((s) => s.trim()).join(' | '));
// Published files: the cards (questions/1b.json) and one data file per APPROVED dataset (questions/1b/<id>.json).
const split1b = p1b.splitForPublish(built1b.questions, p1b.DATA_DIR);
const rebuild = 'is out of date or edited by hand: run `node tools/1b/build.mjs` to rebuild it from tools/1b/datasets';
if (!exists(p1b.OUTPUT) || read(p1b.OUTPUT).replace(/\r/g, '') !== split1b.cards) err(p1b.OUTPUT, rebuild);
for (const [file, text] of Object.entries(split1b.files)) {
  if (!exists(file) || read(file).replace(/\r/g, '') !== text) err(file, rebuild);
}
if (exists(p1b.DATA_DIR)) {
  for (const f of fs.readdirSync(path.join(ROOT, p1b.DATA_DIR))) {
    if (!split1b.files[`${p1b.DATA_DIR}/${f}`]) err(`${p1b.DATA_DIR}/${f}`, 'is not an APPROVED dataset: delete it (or run node tools/1b/build.mjs)');
  }
}
const tests1b = await (await import('./1b/test.mjs')).runTests();
for (const f of tests1b.failures) err('tools/1b/test.mjs', f);

// ---------- 2c. Paper 2 questions (tools/p2) ----------
// As for Paper 1B: questions/p2.json must be exactly what tools/p2/build.mjs makes from the APPROVED questions
// in tools/p2/questions, every question must pass its checks, and the tools' own tests must pass.
const p2 = await import('./p2/build.mjs');
const built2 = p2.buildAll(await p2.loadQuestions(), TOPICS);
for (const x of built2.diags) {
  if (x.code === 'originality-skipped') continue; // no reference cache (e.g. on GitHub); reviews can't be recorded there anyway
  (x.level === 'error' ? err : warn)(`Paper 2 ${x.question}`, `[${x.code}] ${x.message}`);
}
if (!exists(p2.OUTPUT) || read(p2.OUTPUT).replace(/\r/g, '') !== built2.json) err(p2.OUTPUT, 'is out of date or edited by hand: run `node tools/p2/build.mjs` to rebuild it from tools/p2/questions');
const tests2 = await (await import('./p2/test.mjs')).runTests();
for (const f of tests2.failures) err('tools/p2/test.mjs', f);

// ---------- 2d. Science news (tools/news) ----------
// Every stored story must be valid, and news.html / news/latest.json must match the stored stories.
let newsCount = 0;
try {
  const news = await import('./news/news-lib.mjs');
  const stories = news.loadArchive();
  newsCount = stories.length;
  for (const p of news.archiveProblems(stories, new Set(TOPICS.keys()))) err('news/archive', p);
  const hidden = news.loadHidden();
  for (const h of hidden) if (!stories.some((s) => news.isHidden(s, [h]))) warn('news/hidden.json', `"${h}" doesn't match any stored story (use its id or the article's address)`);
  const { buildOutputs } = await import('./news/build.mjs');
  const { latest, html } = buildOutputs();
  if (!exists('news/latest.json') || read('news/latest.json').replace(/\r/g, '') !== latest) err('news/latest.json', 'is out of date: run `node tools/news/build.mjs`');
  if (!exists('news.html') || read('news.html').replace(/\r/g, '') !== html) err('news.html', 'is out of date: run `node tools/news/build.mjs`');
} catch (e) {
  err('news', e.message);
}

// ---------- 2e. Think deeper: concept challenges, big questions and puzzles (think/*.json, drawn by js/think.js) ----------
// Ids are permanent (students' "I've thought about this" ticks are saved against them).
const NOS = ['Observations', 'Patterns and trends', 'Hypotheses', 'Experiments', 'Measurement', 'Models', 'Evidence',
  'Theories', 'Falsification', 'Science as a shared endeavour', 'Global impact of science'];
const thinkIds = new Set();
function checkThinkFigure(where, f, field) {
  if (!f) return;
  if (!f.alt) err(where, `${field} has no alt text`);
  if (f.svg && !exists(`think/${f.svg}`)) err(where, `${field}: file not found: think/${f.svg}`);
  if (f.img) {
    if (!exists(path.posix.normalize(`think/${f.img}`))) err(where, `${field}: image not found: ${f.img}`);
    if (!f.credit) err(where, `${field}: a photo needs a credit (author, source, licence)`);
  }
  if (!f.svg && !f.img) err(where, `${field} needs "svg" or "img"`);
  for (const k of ['caption', 'credit']) if (f[k]) checkText(where, f[k], `${field}.${k}`);
}
function checkThinkItem(it, file, idPattern) {
  const where = `${file} ${it.id || '(no id)'}`;
  if (!idPattern.test(it.id || '')) err(where, `id should look like ${idPattern.source.replace(/[\^$\\]/g, '')}`);
  if (thinkIds.has(it.id)) err(where, 'duplicate id');
  thinkIds.add(it.id);
  for (const k of ['title', 'question']) checkText(where, it[k], k);
  const topics = it.topic ? [it.topic] : it.topics;
  if (!Array.isArray(topics)) err(where, 'needs "topic" or a "topics" list');
  else for (const t of topics) if (!TOPICS.has(t) && t !== 'Skills') err(where, `unknown topic "${t}" (use a syllabus topic such as A.1, or "Skills")`);
  if (it.level !== undefined && !['SL', 'HL'].includes(it.level)) err(where, 'level must be "SL" or "HL"');
  if (topics && topics.some((t) => TOPICS.get(t)?.hl) && it.level !== 'HL') err(where, 'uses an HL-only topic, so level must be "HL"');
  if (!it.figure) err(where, 'needs a "figure" (every card shows its picture as a tile)');
  checkThinkFigure(where, it.figure, 'figure');
  checkThinkFigure(where, it.revealFigure, 'revealFigure');
  if (/upthrust/i.test(JSON.stringify(it))) warn(where, 'says "upthrust": the syllabus term is "buoyancy force" (A.2)');
}
function checkThinkAnswer(it, file) {
  const where = `${file} ${it.id}`;
  if (!['choice', 'open'].includes(it.type)) err(where, 'type must be "choice" or "open"');
  if (it.type === 'choice') {
    if (!Array.isArray(it.options) || it.options.length < 2 || it.options.length > 4) err(where, 'a choice item needs 2 to 4 options');
    else {
      it.options.forEach((o, i) => checkText(where, o, `option ${i + 1}`));
      if (!Number.isInteger(it.answer) || it.answer < 0 || it.answer >= it.options.length) err(where, 'answer must be the number of a correct option (0 = first)');
    }
  }
  checkText(where, it.reveal, 'reveal'); // still needed with a revealVideo: it becomes "Prefer to read it?"
  if (it.revealVideo) {
    const v = it.revealVideo;
    if (!/^[\w-]{11}$/.test(v.youtube || '')) err(where, 'revealVideo.youtube must be an 11-character YouTube video id');
    if (!v.title || !v.channel) err(where, 'revealVideo needs a title and a channel');
  }
  if (!it.tempting) err(where, 'needs "tempting" (the "Clearing misconceptions" part of the answer)');
  else checkText(where, it.tempting, 'tempting');
}
// Each diagram appears twice on a page (as a tile and full size), so ids inside it would clash.
for (const f of exists('think/diagrams') ? fs.readdirSync(path.join(ROOT, 'think/diagrams')).filter((n) => n.endsWith('.svg')) : []) {
  const svg = read(`think/diagrams/${f}`);
  if (/\sid="/.test(svg) || /<defs[\s>]/.test(svg)) err(`think/diagrams/${f}`, 'contains an id or <defs>: each picture appears twice on the page, so ids would clash (arrowheads use the page\'s #ah1, #ah2, #ah3)');
}
function readThink(rel) {
  if (!exists(rel)) { err(rel, 'is missing'); return []; }
  try { const list = JSON.parse(read(rel)); if (Array.isArray(list)) return list; err(rel, 'should be a list [ ... ]'); } catch (e) { err(rel, `isn't valid JSON: ${e.message}`); }
  return [];
}
for (const it of readThink('think/concepts.json')) {
  // Ids: CC-A1-01 for a syllabus topic, CC-SK-01 for a Skills challenge (topic "Skills", always SL).
  // PZ-01… are the former puzzles, merged in November 2026: they keep their ids (students' ticks are saved against them).
  checkThinkItem(it, 'think/concepts.json', /^(CC-([A-E]\d|SK)|PZ)-\d{2}$/);
  const idTopic = it.topic === 'Skills' ? 'SK' : (it.topic || '').replace('.', '');
  if (!it.topic) err(`think/concepts.json ${it.id}`, 'a concept challenge has one "topic"');
  else if (it.id && !it.id.startsWith('PZ-') && it.id.slice(3, 5) !== idTopic) err(`think/concepts.json ${it.id}`, `id doesn't match its topic (${it.topic}: use CC-${idTopic}-…)`);
  if (it.topic === 'Skills' && it.level === 'HL') err(`think/concepts.json ${it.id}`, 'Skills challenges are for everyone: level "SL"');
  checkThinkAnswer(it, 'think/concepts.json');
}
for (const it of readThink('think/big-questions.json')) {
  const where = `think/big-questions.json ${it.id}`;
  checkThinkItem(it, 'think/big-questions.json', /^BQ-\d{2}$/);
  if (!['unsolved', 'solved'].includes(it.kind)) err(where, 'kind must be "unsolved" or "solved"');
  checkText(where, it.thinking, 'thinking');
  if (it.thinkingVideo) {
    const v = it.thinkingVideo;
    if (!/^[\w-]{11}$/.test(v.youtube || '')) err(where, 'thinkingVideo.youtube must be an 11-character YouTube video id');
    if (!v.title || !v.channel) err(where, 'thinkingVideo needs a title and a channel');
  }
  if (it.puzzling) checkText(where, it.puzzling, 'puzzling');
  if (!Array.isArray(it.discussion) || it.discussion.length < 2 || it.discussion.length > 3) err(where, 'needs 2 or 3 discussion questions');
  else it.discussion.forEach((d, i) => checkText(where, d, `discussion ${i + 1}`));
  if (!Array.isArray(it.nos) || !it.nos.length) err(where, 'needs at least one NoS aspect');
  else for (const n of it.nos) if (!NOS.includes(n)) err(where, `"${n}" isn't one of the guide's NoS aspects`);
  checkText(where, it.tok, 'tok');
  if (!Array.isArray(it.links) || !it.links.length) err(where, 'needs at least one "Find out more" link');
  else for (const l of it.links) {
    if (!l.title || !/^https:\/\//.test(l.url || '')) err(where, 'each link needs a title and an https:// address');
    if (!['article', 'video'].includes(l.kind)) err(where, 'each link kind must be "article" or "video"');
  }
}

// ---------- 2f. Physics mysteries (mysteries/*.json, played by mystery.html and js/mystery.js) ----------
// Plan: docs/MYSTERY_PLAN.md. Each case's clue answers are marked by js/numeric.js, so they get the same checks as the question bank.
for (const name of exists('mysteries') ? fs.readdirSync(path.join(ROOT, 'mysteries')).filter((n) => n.endsWith('.json')) : []) {
  const rel = `mysteries/${name}`;
  let M;
  try { M = JSON.parse(read(rel)); } catch (e) { err(rel, `isn't valid JSON: ${e.message}`); continue; }
  if (M.id !== name.replace(/\.json$/, '')) err(rel, `"id" must match the file name (${name.replace(/\.json$/, '')})`);
  if (!exists('games.html') || !read('games.html').includes(`mystery.html?case=${M.id}`)) warn(rel, 'not linked from games.html yet');
  for (const k of ['title', 'intro', 'summary', 'time']) checkText(rel, M[k], k);
  if (!['SL', 'HL'].includes(M.level)) err(rel, 'level must be "SL" or "HL"');
  for (const t of M.topics || []) if (!TOPICS.has(t)) err(rel, `unknown topic "${t}"`);
  if (M.level === 'SL' && (M.topics || []).some((t) => TOPICS.get(t)?.hl)) err(rel, 'an SL case uses an HL-only topic');
  const suspects = new Set();
  for (const s of M.suspects || []) {
    const where = `${rel} suspect ${s.id}`;
    suspects.add(s.id);
    if (!s.name || !s.role || !Array.isArray(s.statement) || !s.statement.length) err(where, 'needs a name, a role and a statement (a list of sentences)');
    else s.statement.forEach((t, i) => checkText(where, t, `statement ${i + 1}`));
    for (const i of s.claims || []) if (!s.statement || !s.statement[i]) err(where, `claims lists sentence ${i}, which doesn't exist (0 = first)`);
  }
  if (suspects.size < 3) err(rel, 'a case needs at least 3 suspects');
  const evidence = new Set();
  for (const ev of M.evidence || []) {
    const where = `${rel} evidence ${ev.id}`;
    if (evidence.has(ev.id)) err(where, 'duplicate id');
    evidence.add(ev.id);
    checkText(where, ev.title, 'title');
    checkText(where, ev.html, 'html');
    if (ev.figure) {
      if (!ev.figure.alt) err(where, 'figure has no alt text');
      if (!ev.figure.svg || !exists(`mysteries/${ev.figure.svg}`)) err(where, `figure file not found: mysteries/${ev.figure.svg}`);
      else if (/\sid="/.test(read(`mysteries/${ev.figure.svg}`)) || /<defs[\s>]/.test(read(`mysteries/${ev.figure.svg}`))) err(where, 'the picture contains an id or <defs>: it can appear twice on the page (case file and clue), so ids would clash');
    }
  }
  const clues = new Set();
  for (const c of M.clues || []) {
    const where = `${rel} clue ${c.id}`;
    if (clues.has(c.id)) err(where, 'duplicate id');
    clues.add(c.id);
    for (const k of ['title', 'task', 'hint', 'working', 'notePrompt', 'modelNote']) checkText(where, c[k], k);
    if (!TOPICS.has(c.topic)) err(where, `unknown topic "${c.topic}"`);
    else if (!(M.topics || []).includes(c.topic)) err(where, `topic ${c.topic} isn't in the case's "topics" list`);
    else if (c.section) {
      const page = `themes/${c.topic.replace('.', '').toLowerCase()}.html`;
      if (!new RegExp(`\\sid="${c.section}"`).test(read(page))) err(where, `section "${c.section}" isn't an id on ${page}`);
    }
    for (const id of c.evidence || []) if (!evidence.has(id)) err(where, `evidence "${id}" doesn't exist`);
    if (!c.numeric) err(where, 'needs a "numeric" answer');
    else { checkNumericField(where, c.numeric); if (!c.numeric.unit) warn(where, 'numeric answer has no unit'); }
    const p = c.prove;
    if (!p || !Array.isArray(p.options) || p.options.length < 2 || p.options.length > 4) err(where, 'prove needs 2 to 4 options');
    else {
      checkText(where, p.question, 'prove.question');
      p.options.forEach((o, i) => checkText(where, o, `prove option ${i + 1}`));
      if (!Number.isInteger(p.answer) || p.answer < 0 || p.answer >= p.options.length) err(where, 'prove.answer must be the number of the correct option (0 = first)');
      p.options.forEach((o, i) => { if (i !== p.answer && !(p.feedback && p.feedback[i])) err(where, `prove option ${i + 1} is wrong but has no feedback`); });
    }
  }
  for (const iv of M.interviews || []) {
    if (!suspects.has(iv.suspect)) err(`${rel} interview`, `unknown suspect "${iv.suspect}"`);
    if (!clues.has(iv.after)) err(`${rel} interview ${iv.suspect}`, `unknown clue "${iv.after}"`);
    for (const q of iv.questions || []) { checkText(`${rel} interview ${iv.suspect}`, q.q, 'question'); checkText(`${rel} interview ${iv.suspect}`, q.a, 'answer'); }
  }
  const A = M.accusation || {};
  if (!suspects.has(A.culprit)) err(`${rel} accusation`, 'culprit must be one of the suspects');
  for (const s of suspects) if (s !== A.culprit && !(A.wrong || {})[s]) err(`${rel} accusation`, `no "wrong" explanation for ${s}`);
  if (!Array.isArray(A.cards) || !A.cards.some((c) => c.use === 'key')) err(`${rel} accusation`, 'needs evidence cards, at least one with use "key"');
  for (const c of A.cards || []) if (!['key', 'support', 'no'].includes(c.use) || !c.text || !c.why) err(`${rel} accusation`, 'each card needs text, why, and use "key", "support" or "no"');
  checkText(`${rel} accusation`, A.model, 'model');
  if (A.solution !== undefined) checkText(`${rel} accusation`, A.solution, 'solution');
  if (!Array.isArray(A.checklist) || !A.checklist.length) err(`${rel} accusation`, 'needs a checklist');
}

// ---------- 3. Pages: set-up and links ----------
function htmlFiles(dir = '') {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((d) => {
    const rel = path.posix.join(dir, d.name);
    if (d.isDirectory()) return SKIP_DIRS.has(d.name) ? [] : htmlFiles(rel);
    return d.name.endsWith('.html') ? [rel] : [];
  });
}
const pages = htmlFiles();
const mathjaxVersions = new Map(); // version -> pages using it
const idsCache = new Map();
function idsIn(rel) {
  if (!idsCache.has(rel)) idsCache.set(rel, new Set([...read(rel).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return idsCache.get(rel);
}

// ---------- 3a. Famous scientists (scientists.json, drawn on topic pages by js/site.js and in the revision sheet builder) ----------
// Plan and decisions: docs/FAMOUS_SCIENTISTS_PLAN.md. Pictures: openly licensed only, credited on the page and on about.html.
const OPEN_LICENCES = /^(public domain|CC0|CC BY( \d\.\d)?|CC BY-SA( \d\.\d)?)$/i;
function jpegWidth(rel) { // reads the width from a JPEG's frame header
  const b = fs.readFileSync(path.join(ROOT, rel));
  for (let i = 2; i < b.length - 9;) {
    if (b[i] !== 0xff) return null;
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return b.readUInt16BE(i + 7);
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}
if (exists('scientists.json')) {
  let sci = {};
  try { sci = JSON.parse(read('scientists.json')); } catch (e) { err('scientists.json', `isn't valid JSON: ${e.message}`); }
  const about = exists('about.html') ? read('about.html') : '';
  const seen = new Set();
  for (const [topic, list] of Object.entries(sci)) {
    if (!TOPICS.has(topic)) { err('scientists.json', `unknown subtopic "${topic}"`); continue; }
    if (!Array.isArray(list)) { err('scientists.json', `${topic} should be a list [ ... ]`); continue; }
    const page = 'themes/' + site.topicFile(topic);
    for (const s of list) {
      const where = `scientists.json ${topic} ${s.id || '(no id)'}`;
      if (!/^[a-z][a-z-]*$/.test(s.id || '')) err(where, 'id should be lower case letters and hyphens, e.g. "du-chatelet"');
      if (seen.has(s.id)) err(where, 'duplicate id');
      seen.add(s.id);
      for (const k of ['name', 'years', 'origin', 'caption', 'summary', 'achievements', 'prompt']) {
        if (!s[k]) err(where, `needs "${k}"`); else checkText(where, s[k], k);
      }
      if (!['SL', 'HL'].includes(s.level)) err(where, 'level must be "SL" or "HL"');
      else if (TOPICS.get(topic).hl && s.level !== 'HL') err(where, `${topic} is HL only, so level must be "HL"`);
      if (!s.place) err(where, 'needs "place" (the id of the <h2> section the box goes in)');
      else if (!new RegExp(`<h2[^>]*\\sid="${s.place}"`).test(read(page))) err(where, `place "${s.place}" isn't an <h2> section on ${page}`);
      if (!s.alt) err(where, 'the picture needs alt text');
      if (!s.image) err(where, 'needs a picture ("image")');
      else if (!exists(s.image)) err(where, `picture not found: ${s.image}`);
      else {
        const kb = fs.statSync(path.join(ROOT, s.image)).size / 1024;
        if (kb > 300) err(where, `${s.image} is ${Math.round(kb)} KB: compress it (ideally under 200 KB)`);
        else if (kb > 200) warn(where, `${s.image} is ${Math.round(kb)} KB (ideally under 200 KB)`);
        const w = /\.jpe?g$/i.test(s.image) ? jpegWidth(s.image) : null;
        if (w > 1200) err(where, `${s.image} is ${w} px wide (at most 1200 px)`);
      }
      const c = s.credit || {};
      if (!c.author || !c.file || !c.licence) err(where, 'credit needs "author", "file" (the Commons file page) and "licence"');
      else {
        if (!OPEN_LICENCES.test(c.licence)) err(where, `licence "${c.licence}" isn't allowed: only CC BY, CC BY-SA, CC0 or public domain`);
        if (!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(c.file)) err(where, 'credit.file should be the picture\'s Wikimedia Commons file page');
        if (!about.includes(c.file)) err(where, 'the picture is missing from the "Image credits" list on about.html');
      }
    }
  }
}

for (const page of pages) {
  const html = read(page);
  const depth = page.split('/').length - 1;
  if (html.startsWith('---')) err(page, 'starts with "---": GitHub\'s Jekyll would process it as a template');
  if (!/<html lang="/.test(html)) err(page, 'missing <html lang="en">');
  if (!/<title>[^<]+<\/title>/.test(html)) err(page, 'missing <title>');
  if (!/name="viewport"/.test(html)) err(page, 'missing the viewport meta tag (needed for phones)');
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const description = (html.match(/<meta name="description" content="([^"]*)">/) || [])[1];
  if (!description) err(page, 'no meta description (the summary search engines show)');
  // The 404 page is shown at any missing address, so it links from the top level ("/").
  const wantRoot = page === '404.html' ? '/' : '../'.repeat(depth);
  const root = (html.match(/<body[^>]*data-root="([^"]*)"/) || [])[1];
  if (root === undefined) err(page, '<body> has no data-root');
  else if (root !== wantRoot) err(page, `data-root should be "${wantRoot}", not "${root}"`);
  if (page !== '404.html') {
    // Canonical address, icons and link-preview (Open Graph) tags, which must match the title and description.
    const url = pageUrl(page);
    const meta = (prop) => (html.match(new RegExp(`<meta property="og:${prop}" content="([^"]*)">`)) || [])[1];
    const canonical = (html.match(/<link rel="canonical" href="([^"]*)">/) || [])[1];
    if (canonical !== url) err(page, `canonical link should be ${url}`);
    if (meta('url') !== url) err(page, `og:url should be ${url}`);
    if (meta('title') !== title?.replace(/"/g, '&quot;')) err(page, 'og:title must be the same as the <title>');
    if (meta('description') !== description) err(page, 'og:description must be the same as the meta description');
    if (!meta('image')) err(page, 'missing og:image (the link-preview picture)');
    if (!html.includes(`href="${root}favicon.svg"`)) err(page, 'missing the favicon link');
  }
  // MathJax must be pinned to one exact version everywhere (e.g. mathjax@4.1.3), so a new release can't change pages unannounced.
  for (const m of html.matchAll(/npm\/mathjax@([^/"]+)\//g)) {
    if (!/^\d+\.\d+\.\d+$/.test(m[1])) err(page, `MathJax version "${m[1]}" isn't pinned: use an exact version such as 4.1.3`);
    mathjaxVersions.set(m[1], [...(mathjaxVersions.get(m[1]) || []), page]);
  }
  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\salt="/.test(m[0])) err(page, `image without alt text: ${m[0].slice(0, 80)}`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  for (const id of new Set(ids.filter((x, i) => ids.indexOf(x) !== i))) err(page, `id="${id}" is used more than once`);

  for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
    const link = m[1].replace(/&amp;/g, '&');
    if (!link || /^(https?:|mailto:|tel:|data:|javascript:|\$\{)/.test(link)) continue;
    const [beforeHash, hash] = link.split('#');
    const [file, query] = beforeHash.split('?');
    const target = !file ? page
      : file.startsWith('/') ? path.posix.normalize(file.slice(1) || '.')
        : path.posix.normalize(path.posix.join(path.posix.dirname(page), file));
    if (target.startsWith('..')) { err(page, `link goes outside the site: ${link}`); continue; }
    const targetFile = target.endsWith('/') || target === '.' ? path.posix.join(target, 'index.html') : target;
    if (!exists(targetFile)) { err(page, `broken link: ${link}`); continue; }
    if (hash && targetFile.endsWith('.html') && !idsIn(targetFile).has(decodeURIComponent(hash))) err(page, `link to a missing #anchor: ${link}`);
    if (query && targetFile === 'questions.html') {
      const p = new URLSearchParams(query);
      if (p.get('topic') && !TOPICS.has(p.get('topic'))) err(page, `question link to unknown topic: ${link}`);
      if (p.get('q') && !questionIds.has(p.get('q'))) err(page, `question link to unknown question: ${link}`);
    }
  }
}

// ---------- 3b. Worked examples on topic pages: hints and spoilers ----------
// Each .worked box is: h3, the question <p>, a <p class="hint">, any set-up figures, then the solution (hidden by
// js/site.js until "Show solution"). Warn when the hint, or a figure shown before the solution, contains a result
// that the solution works out (a number after "=" in the solution) but the question doesn't give.
function workedBoxes(html) {
  const boxes = [];
  for (const m of html.matchAll(/<div class="worked">/g)) {
    let depth = 0;
    const tag = /<(\/?)div\b[^>]*>/g;
    tag.lastIndex = m.index;
    for (let t; (t = tag.exec(html));) {
      depth += t[1] ? -1 : 1;
      if (!depth) { boxes.push(html.slice(m.index + m[0].length, t.index)); break; }
    }
  }
  return boxes;
}
function topLevel(inner) { // the box's direct children: { tag, cls, html }, plus any loose text as tag '#text'
  const kids = [];
  const tag = /<(\/?)([a-zA-Z][\w-]*)\b([^>]*?)(\/?)>/g;
  let depth = 0, start = 0, open = null, last = 0;
  for (let t; (t = tag.exec(inner));) {
    const name = t[2].toLowerCase();
    if (['br', 'img', 'hr', 'input', 'meta', 'link'].includes(name) || t[4]) continue;
    if (!t[1]) {
      if (!depth) {
        const text = inner.slice(last, t.index).replace(/<!--[\s\S]*?-->/g, '');
        if (text.trim()) kids.push({ tag: '#text', cls: '', html: text });
        start = t.index; open = { tag: name, cls: (t[3].match(/class="([^"]*)"/) || [])[1] || '' };
      }
      depth++;
    } else if (--depth === 0) { kids.push({ ...open, html: inner.slice(start, tag.lastIndex) }); last = tag.lastIndex; }
  }
  const rest = inner.slice(last).replace(/<!--[\s\S]*?-->/g, '');
  if (rest.trim()) kids.push({ tag: '#text', cls: '', html: rest });
  return kids;
}
const plain = (s) => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&minus;|−/g, '-');
const numbersIn = (s) => [...plain(s)
  .replace(/(\d+(?:\.\d+)?)\s*(?:\\times|×)\s*10\^\{?(-?\d+)\}?/g, '$1e$2')
  .matchAll(/\d+(?:\.\d+)?(?:e-?\d+)?/g)].map((m) => Number(m[0]));
const resultsIn = (s) => new Set([...plain(s)
  .replace(/(\d+(?:\.\d+)?)\s*(?:\\times|×)\s*10\^\{?(-?\d+)\}?/g, '$1e$2')
  .matchAll(/(?:=|≈|\\approx)\s*\$?\s*-?(\d+(?:\.\d+)?(?:e-?\d+)?)/g)].map((m) => Number(m[1])));
// Constants and data-booklet values may appear in hints; so may small whole numbers.
const ALLOWED = new Set([...numbersIn(JSON.stringify([site.CONSTANTS, site.DATA_BOOKLET]).replace(/\\\\/g, '\\')),
  931.5, 13.6, 2.9e-3, 1.661e-27, 1360, 273, 0.5]);
const given = (n, set) => set.has(n) || ALLOWED.has(n) || (Number.isInteger(n) && n <= 10);
for (const page of pages.filter((p) => /^themes\/[a-e]\d\.html$/.test(p))) {
  workedBoxes(read(page)).forEach((inner, i) => {
    const kids = topLevel(inner);
    const where = `${page} worked example ${i + 1} ("${plain(kids[0]?.html || '').trim().slice(0, 40)}")`;
    if (kids[0]?.tag !== 'h3') { err(where, 'should start with an <h3> title'); return; }
    const q = kids[1];
    if (q?.tag !== 'p' || q.cls) { err(where, 'the question should be one <p> straight after the title'); return; }
    const hints = kids.filter((k) => /\bhint\b/.test(k.cls));
    if (hints.length !== 1) { err(where, hints.length ? 'has more than one hint' : 'has no <p class="hint"> (every topic-page worked example gets one)'); return; }
    const hint = hints[0];
    if (kids[2] !== hint) err(where, 'the hint should come straight after the question <p>');
    if (!/^<p class="hint"><strong>Hint:<\/strong>/.test(hint.html)) err(where, 'the hint should start <p class="hint"><strong>Hint:</strong>');
    if ((hint.html.match(/\$/g) || []).length % 2) err(where, 'the hint has an odd number of $ signs');
    const words = plain(hint.html).split(/\s+/).filter(Boolean).length;
    if (words > 60) warn(where, `the hint is long (${words} words): keep it to one to three short sentences`);
    let s = 3;
    const figs = [];
    while (kids[s]?.tag === 'figure') figs.push(kids[s++]);
    const sol = kids.slice(s);
    if (!sol.length) { err(where, 'has no solution after the question'); return; }
    if (sol.some((k) => k.tag === '#text' && /\S/.test(plain(k.html)) && !k.html.includes('$$'))) warn(where, 'has loose text outside any element');
    const qNums = new Set(numbersIn(q.html));
    const results = resultsIn(sol.map((k) => k.html).join(' '));
    const leak = (html) => [...new Set(numbersIn(html))].filter((n) => results.has(n) && !given(n, qNums));
    const hl = leak(hint.html);
    if (hl.length) warn(where, `the hint contains ${hl.join(', ')}, which the solution works out: does it give the answer away?`);
    for (const f of figs) {
      const fl = leak(f.html);
      if (fl.length) warn(where, `a diagram shown before the solution contains ${fl.join(', ')}, which the solution works out: move it after the first solution paragraph, or relabel it`);
    }
  });
}

// sitemap.xml must list every page except 404.html and pages marked noindex (e.g. think/puzzles.html, which only
// forwards old links to the concept challenges); it tells search engines what exists.
function pageUrl(page) { return SITE + page.replace(/(^|\/)index\.html$/, '$1'); }
const noindex = new Set(pages.filter((p) => /<meta name="robots" content="noindex/.test(read(p))));
const wantedUrls = pages.filter((p) => p !== '404.html' && !noindex.has(p)).map(pageUrl).sort();
const sitemapXml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + wantedUrls.map((u) => `  <url><loc>${u}</loc></url>\n`).join('') + '</urlset>\n';
// search-index.json feeds the site search (search.html, js/search.js): every page's title and description, and each
// section heading that has an id, with the bold key terms in that section. It is rebuilt with the sitemap.
const searchJson = buildSearchIndex();
if (process.argv.includes('--sitemap')) {
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemapXml);
  console.log(`Wrote sitemap.xml (${wantedUrls.length} pages).`);
  fs.writeFileSync(path.join(ROOT, 'search-index.json'), searchJson);
  console.log(`Wrote search-index.json (${Math.round(searchJson.length / 1024)} KB).`);
} else {
  if (!exists('sitemap.xml') || read('sitemap.xml').replace(/\r/g, '') !== sitemapXml) {
    err('sitemap.xml', 'is missing or out of date: run `node tools/check.mjs --sitemap` to rewrite it');
  }
  if (!exists('search-index.json') || read('search-index.json').replace(/\r/g, '') !== searchJson) {
    err('search-index.json', 'is missing or out of date (a page or heading changed): run `node tools/check.mjs --sitemap` to rebuild it');
  }
}

function buildSearchIndex() {
  // Left out: the home page, the search page itself, 404 and the news page (it changes three times a week by itself).
  const skip = new Set(['index.html', '404.html', 'search.html', 'news.html']);
  // Maths in a heading becomes plain text: "$E_{\max}$" -> "Emax"
  const clean = (s) => s.replace(/\$([^$]*)\$/g, (m, tex) => tex.replace(/\\(max|min)\b/g, '$1').replace(/\\[a-zA-Z]+/g, '').replace(/[{}_^]/g, ''))
    .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (m, n) => String.fromCharCode(n)).replace(/\s+/g, ' ').trim();
  const out = { pages: [], sections: [] };
  for (const page of pages.filter((p) => !skip.has(p) && !noindex.has(p)).sort()) {
    const html = read(page);
    const title = clean((html.match(/<title>([^<]*)<\/title>/) || [])[1] || '').replace(/ · Mr Silkstone's Physics$/, '').replace(/: IB Physics notes$/, '');
    const desc = clean((html.match(/<meta name="description" content="([^"]*)">/) || [])[1] || '');
    const p = out.pages.push([page, title, desc]) - 1;
    const main = (html.match(/<main[^>]*>([\s\S]*)<\/main>/) || [])[1] || '';
    const body = main.replace(/<!--[\s\S]*?-->/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
    // HL-only stretches of a page: from <div class="hl-zone"> to the "End of the HL-only content" line
    const hlRanges = [...body.matchAll(/class="hl-zone"/g)].map((m) => [m.index, body.indexOf('class="hl-end"', m.index)]);
    const heads = [...body.matchAll(/<(h2|h3)[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g)];
    heads.forEach((m, i) => {
      if (m[2] === 'tok-title') return;
      const end = i + 1 < heads.length ? heads[i + 1].index : body.length;
      const chunk = body.slice(m.index + m[0].length, end);
      const terms = [...new Set([...chunk.matchAll(/<(strong|dfn)>([\s\S]*?)<\/\1>|<h3>([\s\S]*?)<\/h3>/g)]
        .map((t) => clean(t[2] || t[3]).replace(/[.:,;]$/, '').replace(/^Worked example: /, ''))
        .filter((t) => t.length >= 3 && t.length <= 60 && !t.includes('$')))];
      const hl = /class="tag hl"/.test(m[3]) || hlRanges.some(([a, b]) => m.index > a && (b < 0 || m.index < b));
      out.sections.push([p, m[2], clean(m[3]).replace(/^\d+\.\s*/, '').replace(/\s*\bHL$/, ''), terms.join(' · '), hl ? 1 : 0]);
    });
  }
  return JSON.stringify(out) + '\n';
}

if (mathjaxVersions.size > 1) {
  err('pages', 'different MathJax versions are used: ' + [...mathjaxVersions].map(([v, p]) => `${v} (${p.length} page${p.length === 1 ? '' : 's'}, e.g. ${p[0]})`).join(', '));
}

// ---------- 4. Marking of typed numerical answers ----------
const parseCases = [
  ['0.047', 0.047, 2], ['4.7e-2', 0.047, 2], ['4.7×10^-2', 0.047, 2], ['4.7 x 10-2', 0.047, 2],
  ['4.7×10⁻²', 0.047, 2], ['4.7*10^(-2)', 0.047, 2], ['12 000', 12000, 2], ['12,000', 12000, 2],
  ['2,5', 2.5, 2], ['−3.20', -3.2, 3], ['10^5', 1e5, 1], ['.5', 0.5, 1], ['3.00e8', 3e8, 3],
  ['517', 517, 3], ['1500', 1500, 2], ['6.63×10^{-34}', 6.63e-34, 3],
];
for (const [text, value, sf] of parseCases) {
  const got = parseNumber(text);
  if (!got || Math.abs(got.value - value) > Math.abs(value) * 1e-12 || got.sf !== sf) {
    err('js/numeric.js', `parseNumber("${text}") gave ${JSON.stringify(got)}, expected value ${value} with ${sf} s.f.`);
  }
}
for (const bad of ['', 'abc', '4.7m', '1.2.3', '5/2']) if (parseNumber(bad)) err('js/numeric.js', `parseNumber("${bad}") should not be readable`);
const markCases = [
  [{ answer: 517 }, '517', 'right'], [{ answer: 517 }, '520', 'right'], [{ answer: 517 }, '530', 'wrong'],
  [{ answer: 0.04712 }, '0.047', 'right'], [{ answer: 0.04712 }, '0.05', 'wrong'],
  [{ answer: -9.8, anySign: true }, '9.8', 'right'], [{ answer: -9.8 }, '9.8', 'wrong'],
  [{ answer: 12, range: [11, 13] }, '13', 'right'], [{ answer: 12, range: [11, 13] }, '13.5', 'wrong'],
  [{ answer: 100, tolerance: 0.05 }, '104', 'right'], [{ answer: 3 }, 'three', 'unreadable'],
];
for (const [n, text, want] of markCases) {
  const got = checkNumeric(n, text).status;
  if (got !== want) err('js/numeric.js', `checkNumeric(${JSON.stringify(n)}, "${text}") gave ${got}, expected ${want}`);
}
if (checkNumeric({ answer: 10, mistakes: [{ value: 20, feedback: 'x' }] }, '20').mistake !== 0) err('js/numeric.js', 'a listed mistake value should be recognised');

// ---------- 5. Sub-part tags on questions ("sections"; the checks are in tools/check-sections.mjs) ----------
// Revision sheet builder: teacher files (teachers/*.json; the checks are in tools/check-teachers.mjs)
(await import('./check-teachers.mjs')).checkTeachers({ err, warn, TOPICS });
// Lesson slide generator: slide files (teachers/slides/*.json; the checks are in tools/check-slides.mjs)
(await import('./check-slides.mjs')).checkSlides({ err, warn, TOPICS });
(await import('./check-sections.mjs')).checkSections({ err, warn });

// ---------- Report ----------
console.log(`Checked ${pages.length} pages, ${questionCount} questions (${built1b.questions.length} generated Paper 1B datasets, ${built2.questions.length} generated Paper 2 questions), ${parseCases.length + markCases.length} marking tests, ${tests1b.count} Paper 1B tests, ${tests2.count} Paper 2 tests and ${newsCount} science news ${newsCount === 1 ? 'story' : 'stories'}.`);
if (warnings.length) console.log(`\n${warnings.length} warning(s):\n` + warnings.map((w) => '  ! ' + w).join('\n'));
if (errors.length) {
  console.log(`\n${errors.length} error(s):\n` + errors.map((e) => '  ✗ ' + e).join('\n'));
  process.exit(1);
}
console.log('\n✓ No errors.');
