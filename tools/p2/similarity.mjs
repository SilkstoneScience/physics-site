// Similarity between Paper 2 questions (docs/PAPER2_SPECIFICATION.md section 5, "not too similar to a previous
// question", teacher's rule of 7 November 2026): a new question may test the same concepts as an existing one,
// but its SITUATION must differ and its SEQUENCE OF PARTS should differ from the other generated questions.
//
// Two measures, both computed on the built question (the text students see):
//   1. Wording overlap: the Jaccard index of the content words of the stem and part questions (HTML, MathJax,
//      numbers, units, command terms and common words removed). The same situation described twice shares most of
//      its content words (satellite, orbit, Earth, altitude …); the same concept in a new situation does not.
//   2. Part structure: each part is reduced to "command term + main syllabus id" (generated questions) or
//      "command term + topic" (hand-written questions, which have no syllabus ids), and the longest run of
//      identical consecutive parts, in order, is found.
// Thresholds were calibrated on the 64 questions live on 7 November 2026 (node tools/p2/similarity.mjs prints
// the closest pairs). The batch-1 questions that reused a hand-written question's situation score 30–36 %
// (B4-P01 / B4-013 pV cycles, E2-P01 / E2-012 photoelectric graphs, D1-P01 / D1-019 satellite energies,
// D3-P01 / D3-016 parallel wires); unrelated questions in the same topic score under 20 %. So a new question
// above WARN needs a different situation (none in a new batch should warn), and above ERROR it fails the build.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { COMMAND_TERMS } from './syllabus.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

export const THRESHOLDS = { warnJaccard: 0.25, errorJaccard: 0.40, warnRun: 3, errorRun: 4 };

// Words that say nothing about the situation: grammar, command terms, generic exam words and quantities that
// nearly every question mentions.
const STOP = new Set(`
about above according after again against all also always among another any are around assume assuming
because been before being below between both but can cannot change changes constant could describe
described does down during each either end ends every exactly find first following for from give given
gives has have here how however into its just large less level made make makes may more most much must
near negligible new not now number off one only other over part per rest same shown shows since small
some state such take taken than that the their then there these they this those through time times too
total towards two under until upon use used using value values very was were what when where which
while with within without would you your
calculate determine estimate explain outline show suggest deduce sketch draw identify discuss predict
justify compare comment label define distinguish derive evaluate analyse annotate construct formulate
measure plot list write
question diagram graph figure table data value reading result answer approximate approximately
initial final mass speed velocity energy force distance length height direction magnitude rate
moving moves stationary horizontal vertical uniform
`.split(/\s+/).filter(Boolean));

const stem = (w) => w.replace(/(ies)$/, 'y').replace(/(sses|xes|ches|shes)$/, (m) => m.slice(0, -2)).replace(/s$/, '');

// Content words of a piece of question HTML.
export function contentWords(html) {
  const text = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\$[^$]*\$/g, ' ')            // MathJax
    .replace(/&[a-z]+;|&#\d+;/g, ' ')
    .replace(/[A-Za-z]*\d[\w.×^−\-]*/g, ' ') // numbers and units attached to them
    .toLowerCase();
  const out = new Set();
  for (const w of text.match(/[a-z][a-z-]{2,}/g) || []) {
    if (w.length < 4 || STOP.has(w)) continue;
    const s = stem(w);
    if (s.length >= 3 && !STOP.has(s)) out.add(s);
  }
  return out;
}

export function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let both = 0;
  for (const w of a) if (b.has(w)) both++;
  return both / (a.size + b.size - both);
}

// The command term a hand-written part starts with (generated parts record theirs).
export function termOf(text) {
  const t = String(text || '').replace(/<[^>]+>/g, ' ').trim();
  const terms = [...COMMAND_TERMS].sort((x, y) => y.length - x.length);
  for (const s of t.split(/(?<=[.?!])\s+/)) for (const term of terms) if (new RegExp(`^${term}\\b`, 'i').test(s.trim())) return term;
  return '?';
}

// One label per part: command term + main syllabus id (or topic for hand-written questions).
export function structureOf(q) {
  return q.parts.map((p) => `${p.command || termOf(p.question)}|${(p.syllabus && p.syllabus[0]) || q.topic || ''}`);
}

// Longest run of identical consecutive labels, in the same order in both.
export function longestRun(a, b) {
  let best = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      let n = 0;
      while (i + n < a.length && j + n < b.length && a[i + n] === b[j + n]) n++;
      if (n > best) best = n;
    }
  }
  return best;
}

// A question in the shape the comparison needs, from a built generated question (with its recipe) or a
// hand-written question from questions/<theme>.json.
export function profile(q, def) {
  const parts = q.parts.map((p, i) => ({ question: p.question, command: def ? def.parts[i].command : undefined, syllabus: def ? def.parts[i].syllabus : undefined }));
  const words = contentWords([q.stem, ...q.parts.map((p) => p.question)].join(' '));
  const situation = def && def.situation ? contentWords(def.situation) : null;
  return { id: q.id, topic: q.topic, topics: def ? def.topics : [q.topic], level: q.level, source: def ? 'generated' : 'hand-written', words, situation, structure: structureOf({ parts, topic: q.topic }) };
}

export function loadHandWritten(root = ROOT) {
  const out = [];
  for (const f of ['a', 'b', 'c', 'd', 'e']) {
    const file = path.join(root, 'questions', `${f}.json`);
    if (!fs.existsSync(file)) continue;
    for (const q of JSON.parse(fs.readFileSync(file, 'utf8'))) if (q.paper === '2' && Array.isArray(q.parts)) out.push(profile(q));
  }
  return out;
}

export function compare(a, b) {
  const sameTopic = a.topics.some((t) => b.topics.includes(t));
  const run = longestRun(a.structure, b.structure);
  const situation = a.situation && b.situation ? jaccard(a.situation, b.situation) : 0;
  return { jaccard: jaccard(a.words, b.words), run, sameTopic, situation };
}

// Diagnostics for every generated question against every other question (generated or hand-written).
// `generated` is [{ id, def, built }] from the build; returns [{ level, code, question, where, message }].
export function similarityDiagnostics(generated, { root = ROOT, thresholds = THRESHOLDS } = {}) {
  const gen = generated.filter((r) => r.built).map((r) => profile(r.built.question, r.def));
  const all = [...gen, ...loadHandWritten(root)];
  const diags = [];
  for (const a of gen) {
    for (const b of all) {
      if (b.id === a.id) continue;
      const c = compare(a, b);
      const pair = `${a.id} and ${b.id} (${b.source})`;
      const wordy = `share ${(100 * c.jaccard).toFixed(0)} % of their content words`;
      if (c.jaccard >= thresholds.errorJaccard || (c.situation >= 0.5 && b.source === 'generated')) {
        diags.push({ level: 'error', code: 'similar', question: a.id, message: `${pair} ${c.situation >= 0.5 ? 'declare the same situation' : wordy}: use a different situation` });
      } else if (c.jaccard >= thresholds.warnJaccard) {
        diags.push({ level: 'warn', code: 'similar', question: a.id, message: `${pair} ${wordy}${c.sameTopic ? ' in the same topic' : ''}: check the situation really differs` });
      }
      if (b.source === 'generated' && c.run >= thresholds.errorRun) {
        diags.push({ level: 'error', code: 'similar-parts', question: a.id, message: `${pair} have ${c.run} consecutive parts with the same command term and syllabus id: vary the sequence of parts` });
      } else if (b.source === 'generated' && c.run >= thresholds.warnRun && c.sameTopic) {
        diags.push({ level: 'warn', code: 'similar-parts', question: a.id, message: `${pair} have ${c.run} consecutive parts with the same command term and syllabus id: vary the sequence of parts` });
      }
    }
  }
  // one line per pair (the loop reports a pair from each side when both are generated)
  const seen = new Set();
  return diags.filter((d) => { const key = d.code + d.message.replace(/^(\S+) and (\S+)/, (m, x, y) => [x, y].sort().join(' and ')); if (seen.has(key)) return false; seen.add(key); return true; });
}

// Calibration: node tools/p2/similarity.mjs [n] prints the n closest pairs among all live Paper 2 questions.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const n = Number(process.argv[2]) || 20;
  const { loadQuestions, loadTopics, buildAll } = await import('./build.mjs');
  const { results } = buildAll(await loadQuestions(), loadTopics(), { originality: false, similarity: false });
  const gen = results.filter((r) => r.built).map((r) => profile(r.built.question, r.def));
  const all = [...gen, ...loadHandWritten()];
  const pairs = [];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) pairs.push({ a: all[i], b: all[j], ...compare(all[i], all[j]) });
  pairs.sort((x, y) => y.jaccard - x.jaccard);
  console.log(`${all.length} questions (${gen.length} generated); ${pairs.length} pairs. Closest by content words:`);
  for (const p of pairs.slice(0, n)) console.log(`  ${(100 * p.jaccard).toFixed(0).padStart(3)} %  run ${p.run}  ${p.a.id.padEnd(7)} ${p.b.id.padEnd(7)} ${p.sameTopic ? 'same topic' : ''}`);
  const runs = pairs.filter((p) => p.a.source === 'generated' && p.b.source === 'generated' && p.run >= 2).sort((x, y) => y.run - x.run);
  console.log('Generated pairs sharing a run of 2+ identical parts (command + syllabus id):');
  for (const p of runs.slice(0, n)) console.log(`  run ${p.run}  ${p.a.id.padEnd(7)} ${p.b.id.padEnd(7)}`);
}
