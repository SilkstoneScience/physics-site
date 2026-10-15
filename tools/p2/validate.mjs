// Checks a Paper 2 question definition and the question built from it (docs/PAPER2_SPECIFICATION.md
// sections 3–8). Returns a list of { level: 'error' | 'warning', code, message }.
// Errors stop the build; warnings (for example the guide's limits, group 2) are listed for the reviewer.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { SYLLABUS_IDS, EXCLUDED, LIMITS, COMMAND_TERMS, EXPLAIN_TERMS, CALC_TERMS } from './syllabus.mjs';
import { PLACEHOLDER, shownValue } from './generate.mjs';
import { sigFig } from './units.mjs';

const { checkNumeric } = createRequire(import.meta.url)('../../js/numeric.js');
export const NOT_A_PERSON = /\b(claude|assistant|ai|automated|bot|script)\b/i;
const NOTE_LINE = /^(OR|Allow|Accept|Do not accept|Award|Note|Examiners|Any)\b/i;
export const INDEPENDENT_TOLERANCE = 1e-4; // stricter than the spec's 0.5 %
export const SHOW_THAT_TOLERANCE = 0.05;

const plain = (s) => String(s).replace(/<[^>]*>/g, ' ').replace(/\$[^$]*\$/g, ' ');
const CONTROL = /[\t\b\f\r]/;

export function validateQuestion(def, built, { root, topics, originality, independent }) {
  const out = [];
  const err = (code, message) => out.push({ level: 'error', code, message });
  const warn = (code, message) => out.push({ level: 'warning', code, message });
  const q = built.question;
  const results = built.results;
  const linking = def.type === 'linking';

  // ---- 1. Format ----
  if (!['short', 'linking'].includes(def.type)) err('meta', 'type must be "short" or "linking"');
  if (!['SL', 'HL'].includes(def.level)) err('meta', 'level must be "SL" or "HL"');
  if (![1, 2, 3].includes(def.difficulty)) err('meta', 'difficulty must be 1, 2 or 3');
  if (!def.batch) err('meta', 'say which batch the question belongs to (batch: "batch-1")');
  if (!def.title) err('meta', 'give the question a short title (for the audit)');
  if (!Array.isArray(def.topics) || !def.topics.length) err('meta', 'topics must list the subtopics, e.g. ["A.1"]');
  else {
    for (const t of def.topics) {
      if (!topics.has(t)) err('meta', `unknown topic ${t}`);
      else if (topics.get(t).hl && def.level !== 'HL') err('level', `${t} is HL only, so the question must be HL`);
    }
    if (linking) {
      if (!/^LQ-[SH]\d{2}$/.test(def.id)) err('meta', 'a linking question id looks like LQ-S01 (SL) or LQ-H01 (HL)');
      else if ((def.id[3] === 'S') !== (def.level === 'SL')) err('meta', `id ${def.id} doesn't match level ${def.level} (S = SL, H = HL)`);
    } else if (!/^[A-E]\d-P\d{2}$/.test(def.id) || def.id.slice(0, 2) !== def.topics[0].replace('.', '')) {
      err('meta', `a short question id looks like ${def.topics[0].replace('.', '')}-P01 (its first topic, then P and a number)`);
    }
  }
  if (!def.originality || typeof def.originality.note !== 'string' || def.originality.note.length < 20) err('originality', 'originality.note must say where the idea came from and why it is not a copy');
  if (def.originality && def.originality.inspiredBy && !/^Daily Questions\//.test(def.originality.inspiredBy)) err('originality', 'originality.inspiredBy names a file in the Daily Questions folder (IB papers may only be used for style)');
  const texts = [['stem', def.stem, q.stem], ...def.parts.flatMap((pt, i) => [
    [`(${pt.label}) question`, pt.question, q.parts[i].question],
    ...(pt.markscheme || []).map((m, j) => [`(${pt.label}) mark scheme ${j + 1}`, m, q.parts[i].markscheme[j]]),
  ])];
  for (const [where, , text] of texts) {
    if (CONTROL.test(text)) err('mathjax', `${where} contains a control character: a backslash probably needs doubling ("\\\\theta")`);
    if ((text.replace(/\\\$/g, '').match(/\$/g) || []).length % 2) err('mathjax', `${where} has an odd number of $ signs`);
    if (/\[\[|\]\]/.test(text)) err('placeholder', `${where} has a placeholder that wasn't filled`);
    if (/\^-?\d|\b[A-Za-z]+-[1-4]\b|\bm\/s\b|[⁻¹²³]/.test(plain(text))) err('units', `${where}: write units with negative powers in MathJax (use a placeholder with a unit)`);
  }

  // ---- 2. Structure ----
  const parts = def.parts || [];
  const total = parts.reduce((s, pt) => s + pt.marks, 0);
  const letters = [...new Set(parts.map((pt) => String(pt.label).charAt(0)))];
  const labels = new Set();
  parts.forEach((pt) => {
    if (!/^[a-h](\((i|ii|iii|iv|v|vi)\))?$/.test(pt.label)) err('labels', `part label "${pt.label}" should look like a, b or b(ii)`);
    if (labels.has(pt.label)) err('labels', `part label ${pt.label} is used twice`);
    labels.add(pt.label);
    if (!Number.isInteger(pt.marks) || pt.marks < 1 || pt.marks > 4) err('marks', `(${pt.label}) marks must be 1 to 4`);
  });
  letters.forEach((l, i) => { if (l !== 'abcdefgh'[i]) err('labels', `parts should be lettered in order a, b, c… (found ${letters.join(', ')})`); });
  if (linking) {
    if (total !== 20) err('marks', `a linking question has exactly 20 marks (this one has ${total})`);
    if (letters.length < 4 || letters.length > 6) err('structure', `a linking question has 4–6 lettered parts (this one has ${letters.length})`);
  } else {
    if (total < 5 || total > 11) err('marks', `a short question has 5–11 marks (this one has ${total})`);
    if (parts.filter((pt) => pt.marks === 4).length > 1) err('marks', 'a short question has at most one 4-mark part');
  }
  const terms = parts.map((pt) => pt.command);
  parts.forEach((pt, i) => {
    if (!COMMAND_TERMS.includes(pt.command)) err('command', `(${pt.label}) command "${pt.command}" is not an IB command term`);
    else {
      const txt = plain(q.parts[i].question);
      const re = new RegExp(`(^|[.:;!?]\\s+|^\\s*)${pt.command.replace(/ /g, '\\s+')}\\b`);
      if (!re.test(txt.trim())) err('command', `(${pt.label}) the task should start with its command term "${pt.command}"`);
    }
    if (pt.marks === 4 && !EXPLAIN_TERMS.concat(CALC_TERMS).includes(pt.command)) err('marks', `(${pt.label}) a 4-mark part should be an extended explanation or calculation`);
  });
  if (!terms.some((t) => EXPLAIN_TERMS.includes(t))) err('structure', 'needs at least one explanation part (Outline, Explain, Describe, Discuss, Suggest…)');
  if (!terms.some((t) => CALC_TERMS.includes(t))) err('structure', 'needs at least one calculation part (Calculate, Determine, Show that, Estimate…)');
  if (linking) {
    const show = parts.filter((pt) => pt.command === 'Show that');
    if (!show.length) err('structure', 'a linking question needs at least one "Show that" part');
    else if (!parts.some((pt) => (pt.dependsOn || []).some((d) => show.some((s) => s.label === d)))) err('structure', 'a later part should use a "Show that" value (dependsOn), so students can carry on');
  }

  // ---- 3. Syllabus ----
  const themes = new Set();
  let uses2028 = false;
  let hlMarks = 0;
  const marksByTopic = {};
  parts.forEach((pt) => {
    if (!Array.isArray(pt.syllabus) || !pt.syllabus.length) { err('syllabus', `(${pt.label}) needs syllabus IDs`); return; }
    let hl = false;
    for (const id of pt.syllabus) {
      const u = SYLLABUS_IDS.get(id);
      if (!u) { err('syllabus', `(${pt.label}) unknown syllabus ID ${id}`); continue; }
      if (u.hl) hl = true;
      if (u.y2028) uses2028 = true;
      if (/^[A-E]/.test(u.topic)) {
        themes.add(u.topic[0]);
        if (def.topics && !def.topics.includes(u.topic)) err('syllabus', `(${pt.label}) ${id} is from ${u.topic}, which isn't in the question's topics`);
        marksByTopic[u.topic] = (marksByTopic[u.topic] || 0) + pt.marks / pt.syllabus.length;
      }
      if (u.hl && def.level === 'SL') err('level', `(${pt.label}) ${id} (${u.label}) is additional higher level content, so it can't be in an SL question`);
    }
    if (hl) hlMarks += pt.marks;
  });
  if (uses2028 && def.y2028 !== true) err('y2028', 'a part tests content new for 2028 (a .Y syllabus ID), so the question needs y2028: true');
  if (def.y2028 === true && !uses2028) err('y2028', 'y2028: true, but no part tests content new for 2028 (a .Y syllabus ID)');
  if (def.level === 'HL' && hlMarks === 0) err('level', 'an HL question must test some additional higher level content');
  if (linking && def.level === 'HL' && hlMarks < 4) err('level', `an HL linking question needs at least 4 marks of AHL content (has ${hlMarks})`);
  if (linking && themes.size < 3) err('structure', `a linking question covers at least three themes (A–E); this one covers ${[...themes].join(', ') || 'none'}`);
  if (!linking && def.topics && def.topics[0] && (marksByTopic[def.topics[0]] || 0) < total / 2) err('syllabus', `a short question should be mainly ${def.topics[0]} (at least half its marks)`);

  const allText = texts.map(([, , t]) => plain(t)).join(' \n ');
  const textWithMath = texts.map(([, , t]) => t.replace(/<[^>]*>/g, ' ')).join(' \n ');
  for (const x of EXCLUDED) {
    const m = allText.match(x.re) || textWithMath.match(x.re);
    if (!m) continue;
    const w = def.waivers && def.waivers.excluded && def.waivers.excluded[x.id];
    if (w && w.by && !NOT_A_PERSON.test(w.by) && w.reason) warn('excluded-waived', `"${m[0]}" (${x.area}: not on the 2025 syllabus) waived by ${w.by}: ${w.reason}`);
    else err('excluded', `"${m[0]}" is not on the 2025 syllabus (${x.area}). Remove it, or the teacher can waive it (waivers.excluded.${x.id} with by and reason)`);
  }
  for (const x of LIMITS) {
    // A limit applies only to questions on its topic (x.topic may be "B.3/B.4").
    if (!(def.topics || []).some((t) => x.topic.split('/').includes(t))) continue;
    const m = allText.match(x.re);
    if (m) warn('limit', `"${m[0]}" touches a guidance limit (${x.topic}). Allowed: ${x.allowed}. Not allowed: ${x.notAllowed}`);
  }
  if (def.level === 'SL' && /\badiabatic/i.test(allText)) err('level', 'adiabatic changes are HL only (B.4)');

  // ---- 4. Numbers ----
  // Given values: plausible range, stated precision.
  for (const [k, g] of Object.entries(def.given || {})) {
    if (!g.what) err('given', `given ${k} needs "what" (what the value is)`);
    if (!Array.isArray(g.range) || g.range.length !== 2) err('given', `given ${k} needs a plausible range [min, max]`);
    else if (g.value < g.range[0] || g.value > g.range[1]) err('plausible', `given ${k} = ${g.value} is outside its plausible range ${g.range.join(' to ')}`);
    if (sigFig(g.value, g.sf) !== g.value) err('given', `given ${k} = ${g.value} has more significant figures than sf: ${g.sf}`);
  }
  for (const [k, r] of Object.entries(results)) {
    if (r.range && (shownValue(r) < r.range[0] || shownValue(r) > r.range[1])) err('plausible', `result ${k} = ${shownValue(r).toPrecision(4)} ${r.unit} is outside its plausible range ${r.range.join(' to ')}`);
  }
  // No numbers typed into the text: they must come from placeholders (or be listed in literals with a reason).
  const literals = new Set(Object.keys(def.literals || {}));
  for (const [where, template] of texts) {
    const bare = String(template)
      .replace(PLACEHOLDER, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/10\^\{[^}]*\}/g, ' ')
      .replace(/[\^_]\{[^}]*\}/g, ' ')
      .replace(/[\^_]-?\d/g, ' ')
      .replace(/\\[td]?frac\{\d+\}\{\d+\}/g, ' ')
      .replace(/\b[a-h]\((i|ii|iii|iv|v)\)/g, ' ')
      .replace(/\((i|ii|iii|iv|v)\)/g, ' ');
    for (const m of bare.matchAll(/(?<![A-Za-z\\\d.])\d+(?:\.\d+)?(?![\d])/g)) {
      const n = m[0];
      if (/^\d$/.test(n) || literals.has(n)) continue;
      err('typed-number', `${where}: the number ${n} is typed in. Use a placeholder (a given value, a result or [[K.…]]), or list it in literals with a reason`);
    }
  }
  for (const [n, why] of Object.entries(def.literals || {})) if (!why) err('typed-number', `literal ${n} needs a reason`);
  // No numbers typed into the calculation: only the given values, data-booklet constants and small integers.
  if (typeof def.calc === 'function') {
    const src = def.calc.toString().replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\b(range|sf):\s*(\[[^\]]*\]|\d+)/g, ' '); // plausible ranges and significant figures are checks, not calculation
    const allowed = new Set(['0', '1', '2', '3', '4', ...Object.keys(def.calcLiterals || {})]);
    for (const m of src.matchAll(/(?<![\w.$])\d+(?:\.\d+)?(?:e[-+]?\d+)?(?![\w.])/gi)) {
      if (!allowed.has(m[0])) err('calc-literal', `the calculation contains the number ${m[0]}: use a given value or a constant (K.…), or list it in calcLiterals with a reason`);
    }
    for (const [n, why] of Object.entries(def.calcLiterals || {})) if (!why) err('calc-literal', `calcLiteral ${n} needs a reason`);
  }
  for (const p of built.dimensionProblems || []) err('dimensions', p);
  // Show that: the stated value must be honest (within 5 % of the true value).
  parts.forEach((pt, i) => {
    if (pt.command !== 'Show that') return;
    if (!pt.showThat || !results[pt.showThat.result]) { err('show-that', `(${pt.label}) needs showThat: { result, sf } naming the value shown`); return; }
    const r = results[pt.showThat.result];
    const exact = shownValue(r);
    const stated = sigFig(exact, pt.showThat.sf);
    if (Math.abs(stated - exact) > SHOW_THAT_TOLERANCE * Math.abs(exact)) err('show-that', `(${pt.label}) "about ${stated}" is more than 5 % from the true value ${exact.toPrecision(4)}: use more significant figures or change the given values`);
    if (!new RegExp(`\\[\\[${pt.showThat.result}:${pt.showThat.sf}u?\\]\\]`).test(pt.question)) err('show-that', `(${pt.label}) the question should state the value with [[${pt.showThat.result}:${pt.showThat.sf}u]]`);
    if (!q.parts[i].markscheme.some((m) => /\d/.test(m))) err('show-that', `(${pt.label}) the mark scheme should give the value to more figures than the question`);
  });
  // Independent check (tools/p2/independent.mjs)
  const ind = independent && independent[def.id];
  if (typeof ind !== 'function') err('independent', `no independent check for ${def.id} in tools/p2/independent.mjs`);
  else {
    let iv;
    try {
      const v = Object.fromEntries(Object.entries(def.given || {}).map(([k, g]) => [k, { value: g.value, unit: g.unit || '' }]));
      iv = ind(v);
    } catch (e) { err('independent', `the independent check crashed: ${e.message}`); }
    if (iv) {
      for (const [k, r] of Object.entries(results)) {
        if (k.startsWith('wrong_')) continue;
        if (!(k in iv)) { err('independent', `the independent check doesn't calculate ${k}`); continue; }
        const mine = shownValue(r);
        if (!(Math.abs(iv[k] - mine) <= INDEPENDENT_TOLERANCE * Math.abs(mine))) err('independent', `${k}: the question gives ${mine.toPrecision(6)} ${r.unit}, the independent check gives ${Number(iv[k]).toPrecision(6)}`);
      }
      for (const k of Object.keys(iv)) if (!(k in results)) warn('independent', `the independent check calculates ${k}, which the question doesn't use`);
    }
  }

  // ---- 5. Mark schemes ----
  parts.forEach((pt, i) => {
    const ms = q.parts[i].markscheme;
    if (!ms.length) { err('markscheme', `(${pt.label}) has no mark scheme`); return; }
    let ticks = 0;
    ms.forEach((m, j) => {
      const n = (m.match(/✓/g) || []).length;
      if (NOTE_LINE.test(m.trim())) { if (n && !/^OR\b/i.test(m.trim())) err('markscheme', `(${pt.label}) point ${j + 1} is a note but has a ✓`); if (/^OR\b/i.test(m.trim())) return; return; }
      if (n !== 1) err('markscheme', `(${pt.label}) point ${j + 1} should have exactly one ✓ (or start with OR/Allow/Accept/Award/Note)`);
      ticks += n;
    });
    if (pt.anyOf != null) {
      if (pt.anyOf !== pt.marks) err('markscheme', `(${pt.label}) anyOf must equal the marks`);
      if (ticks <= pt.marks) err('markscheme', `(${pt.label}) "any ${pt.marks} from" needs more marking points than marks`);
      if (!ms.some((m) => new RegExp(`^Any ${pt.marks}\\b`, 'i').test(m.trim()))) err('markscheme', `(${pt.label}) say "Any ${pt.marks} from:" in a note line`);
    } else if (ticks !== pt.marks) err('markscheme', `(${pt.label}) has ${ticks} marking point(s) for ${pt.marks} mark(s)`);
    for (const d of pt.dependsOn || []) {
      if (!parts.some((x) => x.label === d)) err('markscheme', `(${pt.label}) depends on a part ${d} that doesn't exist`);
    }
    if ((pt.dependsOn || []).length && CALC_TERMS.includes(pt.command) && !ms.some((m) => /\bECF\b/.test(m))) err('markscheme', `(${pt.label}) uses an earlier answer, so the mark scheme should allow ECF`);
    if (!pt.examinerNote || pt.examinerNote.length < 15) err('markscheme', `(${pt.label}) needs an examinerNote (the intended reasoning, for the reviewer)`);
    // Typed numerical answers
    const n = q.parts[i].numeric;
    if (n) {
      if (checkNumeric(n, String(n.answer)).status !== 'right') err('numeric', `(${pt.label}) the answer ${n.answer} itself isn't accepted`);
      for (const mk of n.mistakes || []) if (checkNumeric(n, String(mk.value)).status === 'right') err('numeric', `(${pt.label}) the mistake value ${mk.value} would be marked right`);
      if (['Show that', 'Explain', 'Outline', 'Describe'].includes(pt.command)) err('numeric', `(${pt.label}) "${pt.command}" parts don't get a typed numeric answer`);
    } else if (['Calculate', 'Determine'].includes(pt.command) && pt.noNumeric !== true) warn('numeric', `(${pt.label}) is a calculation without a typed answer (add numeric, or noNumeric: true with a reason in the examinerNote)`);
  });

  // ---- 6. Diagrams ----
  const images = [];
  if (def.diagram) {
    if (!def.diagram.alt || def.diagram.alt.length < 30) err('diagram', 'the diagram needs alt text describing it (30+ characters)');
    images.push(def.diagram.file);
  }
  for (const [where, , text] of texts) {
    for (const m of text.matchAll(/<img\b[^>]*>/g)) {
      const src = (m[0].match(/src="([^"]+)"/) || [])[1];
      if (!/alt="[^"]{30,}"/.test(m[0])) err('diagram', `${where}: an image needs alt text (30+ characters)`);
      if (src) images.push(src);
    }
  }
  for (const file of images) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) { err('diagram', `diagram file not found: ${file}`); continue; }
    if (file.endsWith('.svg')) {
      const svg = fs.readFileSync(full, 'utf8');
      if (!/<title>[^<]+<\/title>/.test(svg)) err('diagram', `${file} needs a <title>`);
      if (/<g\b[^>]*font-size/.test(svg)) err('diagram', `${file}: put font-size on each <text>, not on a <g>`);
    }
  }

  // ---- 7. Originality ----
  if (originality) {
    if (!originality.ran) warn('originality-skipped', originality.note);
    for (const p of originality.problems) err('originality', `${p.field}: "${p.run}" also appears in ${p.source}. Reword it`);
  }
  return out;
}
