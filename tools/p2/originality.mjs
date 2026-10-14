// Originality check for Paper 2 questions (docs/PAPER2_SPECIFICATION.md section 5).
//
// IB papers: no run of 8 or more words in a question (stem, parts, mark scheme) may also appear in any cached
// IB Paper 2 or mark scheme (2016–2025). Runs that appear in 5 or more different IB documents are stock exam
// phrasing ("the graph shows the variation of"), not a particular question, and are ignored.
// Daily Questions (non-IB): no run of 6 or more words shared with the transcript of the Daily Question that
// inspired the question (stricter, because the situation and topic may be the same).
//
// The IB texts and transcripts are copyrighted reference material, so they live only in this computer's
// reference cache (outside the website), found from CLAUDE.local.md or the DP_REFERENCE_CACHE variable.
// On GitHub there is no cache: the check is then skipped, and tools/p2/review.mjs refuses to record a review
// unless the check has run on the reviewer's computer.
import fs from 'node:fs';
import path from 'node:path';

export const IB_RUN = 8;
export const DAILY_RUN = 6;
export const STOCK_DOCS = 5;

export function findCache(root) {
  if (process.env.DP_REFERENCE_CACHE) return process.env.DP_REFERENCE_CACHE;
  const local = path.join(root, 'CLAUDE.local.md');
  if (!fs.existsSync(local)) return null;
  const m = fs.readFileSync(local, 'utf8').match(/cached at:\s*`([^`]+)`/);
  return m && fs.existsSync(m[1]) ? m[1] : null;
}

// Words for comparison: lower case, tags removed, every number (with any unit after it) and every piece of
// MathJax replaced by one "#", so "a car of mass 1600 kg", "a car of mass 950 kg" and
// "a car of mass $m$" all count as the same words, as do "6.0 m s-1" and "8.5 $\text{m s}^{-1}$".
const UNIT_WORDS = new Set(['m', 's', 'kg', 'g', 'n', 'j', 'w', 'v', 'k', 'c', 'hz', 'pa', 'kpa', 'mpa', 'mol', 'ev', 'kev', 'mev', 'km', 'cm', 'mm', 'nm', 'kw', 'mw', 'kj', 'mj', 'ms', 'h', 't', 'mt', 'ω', 'l', 'u', 'ly', 'pc', 'au', 'bq', 'kv', 'ma', 'min', 'rad', 'sr', 'wb']);
export function words(text) {
  const raw = String(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\$[^$]*\$/g, ' # ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/[‘’]/g, '\'')
    .toLowerCase()
    .replace(/\d+([.,]\d+)?/g, ' # ')
    .replace(/\.{2,}/g, ' ') // answer-line dots in the papers
    .replace(/[^a-z#']+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const out = [];
  for (const w of raw) {
    const last = out[out.length - 1];
    if (last === '#' && (w === '#' || UNIT_WORDS.has(w))) continue; // a number's unit and powers belong to it
    out.push(w);
  }
  return out;
}

const runsOf = (ws, n) => {
  const out = new Set();
  for (let i = 0; i + n <= ws.length; i++) {
    const run = ws.slice(i, i + n);
    if (run.filter((w) => w !== '#').length >= n - 2) out.add(run.join(' ')); // runs that are mostly numbers don't count
  }
  return out;
};

let ibCorpus = null;
// All 8-word runs in the cached IB Paper 2 texts, with the documents each appears in.
export function loadIbCorpus(cache) {
  if (ibCorpus && ibCorpus.cache === cache) return ibCorpus;
  const dirs = ['past-papers-legacy-p2', 'past-papers-2025'].map((d) => path.join(cache, d)).filter((d) => fs.existsSync(d));
  const files = dirs.flatMap((d) => fs.readdirSync(d).filter((f) => /paper_2/i.test(f) && f.endsWith('.txt')).map((f) => path.join(d, f)));
  const where = new Map();
  for (const f of files) {
    for (const run of runsOf(words(fs.readFileSync(f, 'utf8')), IB_RUN)) {
      const list = where.get(run);
      if (!list) where.set(run, [path.basename(f)]);
      else if (list.length < STOCK_DOCS && !list.includes(path.basename(f))) list.push(path.basename(f));
    }
  }
  ibCorpus = { cache, files: files.length, where };
  return ibCorpus;
}

// The text of a question, field by field, for the check.
export function questionTexts(q) {
  const out = [['stem', q.stem]];
  for (const pt of q.parts) {
    out.push([`(${pt.label}) question`, pt.question]);
    pt.markscheme.forEach((m, i) => out.push([`(${pt.label}) mark scheme ${i + 1}`, m]));
  }
  return out;
}

// Returns { ran, problems: [{ field, run, source }], note }.
export function checkOriginality(def, q, root) {
  const cache = findCache(root);
  if (!cache) return { ran: false, problems: [], note: 'no reference cache on this computer: originality not checked' };
  const ib = loadIbCorpus(cache);
  if (!ib.files) return { ran: false, problems: [], note: `no IB Paper 2 texts found in ${cache}` };
  const problems = [];
  const texts = questionTexts(q);
  const seen = new Set();
  for (const [field, text] of texts) {
    for (const run of runsOf(words(text), IB_RUN)) {
      const docs = ib.where.get(run);
      if (docs && docs.length < STOCK_DOCS && !seen.has(run)) {
        seen.add(run);
        problems.push({ field, run, source: docs.join(', ') });
      }
    }
  }
  const o = def.originality || {};
  if (o.inspiredBy) {
    const t = o.transcript && path.join(cache, o.transcript);
    if (!t || !fs.existsSync(t)) {
      problems.push({ field: 'originality.transcript', run: '', source: `the transcript of ${o.inspiredBy} is missing (${o.transcript || 'none given'}): type it into the reference cache so it can be compared` });
    } else {
      const daily = runsOf(words(fs.readFileSync(t, 'utf8')), DAILY_RUN);
      for (const [field, text] of texts) {
        for (const run of runsOf(words(text), DAILY_RUN)) {
          if (daily.has(run) && !seen.has(run)) { seen.add(run); problems.push({ field, run, source: o.inspiredBy }); }
        }
      }
    }
  }
  return { ran: true, problems, note: `${ib.files} IB Paper 2 files${o.inspiredBy ? ` and the transcript of ${o.inspiredBy}` : ''}` };
}
