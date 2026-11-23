// Checks the Lightspeed questions (lightspeed/a.json … e.json; game: js/lightspeed.js). Run by tools/check.mjs.
import { readFileSync } from 'node:fs';

const HL_TOPICS = new Set(['A.4', 'A.5', 'B.4', 'D.4', 'E.2']);

export function checkLightspeed({ err, warn, TOPICS }) {
  const seen = new Set();
  for (const theme of ['a', 'b', 'c', 'd', 'e']) {
    const file = `lightspeed/${theme}.json`;
    let list;
    try { list = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { err(file, `can't be read as JSON: ${e.message}`); continue; }
    if (!Array.isArray(list)) { err(file, 'must be a list of questions'); continue; }
    const perTopic = {};
    list.forEach((q, i) => {
      const where = `${file} #${i + 1}${q && q.id ? ` (${q.id})` : ''}`;
      if (!q || typeof q !== 'object') return err(where, 'not an object');
      const m = /^LS-([A-E])(\d)-\d{2}$/.exec(q.id || '');
      if (!m) err(where, 'id must look like LS-A1-01');
      else {
        if (m[1].toLowerCase() !== theme) err(where, `id belongs in lightspeed/${m[1].toLowerCase()}.json`);
        if (q.topic !== `${m[1]}.${m[2]}`) err(where, `topic should be ${m[1]}.${m[2]} to match the id`);
      }
      if (seen.has(q.id)) err(where, 'duplicate id'); seen.add(q.id);
      if (TOPICS && !TOPICS.has(q.topic)) err(where, `unknown topic ${q.topic}`);
      perTopic[q.topic] = (perTopic[q.topic] || 0) + 1;
      if (q.level !== 'SL' && q.level !== 'HL') err(where, 'level must be "SL" or "HL"');
      if (HL_TOPICS.has(q.topic) && q.level !== 'HL') err(where, `${q.topic} is HL only, so level must be "HL"`);
      if (typeof q.q !== 'string' || !q.q.trim()) err(where, 'missing question text (q)');
      else if (q.q.replace(/\$[^$]*\$/g, 'x').split(/\s+/).length > 40) warn(where, 'long question: can it be read in a few seconds?');
      if (typeof q.why !== 'string' || !q.why.trim()) err(where, 'missing explanation (why)');
      if ((q.q || '').split('$').length % 2 === 0 || (q.why || '').split('$').length % 2 === 0) err(where, 'unmatched $ in the maths');
      if (q.type === 'choice') {
        if (!Array.isArray(q.options) || q.options.length !== 4) err(where, 'choice questions need exactly 4 options');
        if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) err(where, 'answer must be 0, 1, 2 or 3');
        if (Array.isArray(q.options) && new Set(q.options).size !== q.options.length) err(where, 'two options are the same');
      } else if (q.type === 'number') {
        const n = q.numeric;
        if (!n || typeof n.answer !== 'number' || !Number.isFinite(n.answer)) err(where, 'number questions need numeric.answer');
        if (n && typeof n.unit !== 'string') err(where, 'numeric.unit must be a string ("" if there is no unit)');
      } else err(where, 'type must be "choice" or "number"');
      if (/upthrust/i.test(JSON.stringify(q))) warn(where, 'use "buoyancy force", not "upthrust"');
    });
    // The game needs 10 questions per round, also with "SL only" ticked.
    const sl = list.filter((q) => q && q.level === 'SL').length;
    if (sl < 10) err(file, `only ${sl} SL questions: a round needs 10`);
  }
}
