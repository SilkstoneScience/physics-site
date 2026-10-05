// Site checker: run with `node tools/check.mjs` from the physics-site folder.
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
  if (!/^[A-E]\d-\d{3}$/.test(q.id)) warn(where, 'id doesn\'t follow the pattern A1-001');
  const topic = TOPICS.get(q.topic);
  if (!topic) err(where, `unknown topic "${q.topic}"`);
  if (q.theme !== (topic ? topic.theme : q.theme)) err(where, `theme "${q.theme}" doesn't match topic ${q.topic}`);
  if (topic && q.id.slice(0, 2) !== q.topic.replace('.', '')) warn(where, `id doesn't start with its topic (${q.topic})`);
  if (!['1A', '1B', '2'].includes(q.paper)) err(where, `paper must be "1A", "1B" or "2", not ${JSON.stringify(q.paper)}`);
  if (![1, 2, 3].includes(q.difficulty)) err(where, 'difficulty must be 1, 2 or 3');
  if (!['SL', 'HL'].includes(q.level)) err(where, 'level must be "SL" or "HL"');
  if (topic && topic.hl && q.level !== 'HL') err(where, `${q.topic} is HL only, so level must be "HL"`);
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

for (const page of pages) {
  const html = read(page);
  const depth = page.split('/').length - 1;
  if (html.startsWith('---')) err(page, 'starts with "---": GitHub\'s Jekyll would process it as a template');
  if (!/<html lang="/.test(html)) err(page, 'missing <html lang="en">');
  if (!/<title>[^<]+<\/title>/.test(html)) err(page, 'missing <title>');
  if (!/name="viewport"/.test(html)) err(page, 'missing the viewport meta tag (needed for phones)');
  if (!/name="description"/.test(html)) warn(page, 'no meta description');
  const root = (html.match(/<body[^>]*data-root="([^"]*)"/) || [])[1];
  if (root === undefined) err(page, '<body> has no data-root');
  else if (root !== '../'.repeat(depth)) err(page, `data-root should be "${'../'.repeat(depth)}", not "${root}"`);
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
    const target = file ? path.posix.normalize(path.posix.join(path.posix.dirname(page), file)) : page;
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

// ---------- Report ----------
console.log(`Checked ${pages.length} pages, ${questionCount} questions and ${parseCases.length + markCases.length} marking tests.`);
if (warnings.length) console.log(`\n${warnings.length} warning(s):\n` + warnings.map((w) => '  ! ' + w).join('\n'));
if (errors.length) {
  console.log(`\n${errors.length} error(s):\n` + errors.map((e) => '  ✗ ' + e).join('\n'));
  process.exit(1);
}
console.log('\n✓ No errors.');
