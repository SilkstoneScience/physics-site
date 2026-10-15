// Tests for the Paper 2 tools: units, constants, syllabus lists, originality, and every validation rule
// (each rule is broken on purpose and must be caught). Run: node tools/p2/test.mjs
// tools/check.mjs runs these too (runTests()).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseUnit, toSI, fmtSig, fmtQuantity } from './units.mjs';
import { CONSTANTS } from './constants.mjs';
import { UNDERSTANDINGS, SYLLABUS_IDS, EXCLUDED, LIMITS, COMMAND_TERMS } from './syllabus.mjs';
import { words, checkOriginality } from './originality.mjs';
import { buildAll, loadTopics, fingerprintOf, ROOT } from './build.mjs';
import { reviewProblem } from './registry.mjs';
import { GOOD_SHORT, GOOD_SHORT_INDEPENDENT, GOOD_LINKING, GOOD_LINKING_INDEPENDENT } from './fixtures/examples.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export async function runTests() {
  const failures = [];
  let count = 0;
  const check = (name, ok, detail = '') => { count++; if (!ok) failures.push(`${name}${detail ? `: ${detail}` : ''}`); };
  const near = (a, b, rel = 1e-9) => Math.abs(a - b) <= rel * Math.max(Math.abs(a), Math.abs(b), 1e-300);
  const topics = loadTopics();
  const IND = { 'A1-P90': GOOD_SHORT_INDEPENDENT, 'LQ-S90': GOOD_LINKING_INDEPENDENT };
  const clone = (def) => ({ ...structuredClone({ ...def, calc: undefined }), calc: def.calc });
  const build = (defs, opts = {}) => buildAll(defs.map((def) => ({ file: `${def.id}.mjs`, def })), topics,
    { registry: { questions: {} }, independent: IND, originality: false, ...opts });
  const codesFor = (def, opts) => build([def], opts).diags.filter((x) => x.level === 'error').map((x) => x.code);

  // ----- Units and numbers -----
  check('unit m s^-1 in site style', parseUnit('m s^-1').tex === '$\\text{m s}^{-1}$', parseUnit('m s^-1').tex);
  check('unit J kg^-1 K^-1 in site style', parseUnit('J kg^-1 K^-1').tex === '$\\text{J kg}^{-1}\\text{ K}^{-1}$', parseUnit('J kg^-1 K^-1').tex);
  check('unit MeV c^-2', parseUnit('MeV c^-2').tex === '$\\text{MeV c}^{-2}$', parseUnit('MeV c^-2').tex);
  check('plain unit needs no MathJax', parseUnit('kg').tex === 'kg');
  check('25 °C is 298 K (data booklet: + 273)', toSI(25, parseUnit('°C')) === 298);
  check('a change of 5 Δ°C is 5 K', toSI(5, parseUnit('Δ°C')) === 5);
  check('2.0 kW is 2000 W', toSI(2.0, parseUnit('kW')) === 2000);
  check('1 pc = 3.26 ly', near(toSI(1, parseUnit('pc')), 3.26 * 9.46e15));
  check('N m^2 kg^-2 dimensions', parseUnit('N m^2 kg^-2').dim.join() === '3,-1,-2,0,0,0');
  check('unknown unit rejected', (() => { try { parseUnit('furlong'); return false; } catch { return true; } })());
  check('fmtSig keeps trailing zeros', fmtSig(12, 3) === '12.0' && fmtSig(0.5, 2) === '0.50');
  check('fmtSig scientific for large values', fmtSig(3.0e8, 2) === '$3.0 \\times 10^{8}$', fmtSig(3.0e8, 2));
  check('fmtSig scientific for small values', fmtSig(6.63e-34, 3) === '$6.63 \\times 10^{-34}$');
  check('fmtSig rounding up a power of ten', fmtSig(99960, 2) === '$1.0 \\times 10^{5}$', fmtSig(99960, 2));
  check('fmtSig rounds whole numbers to the figures asked for', fmtSig(252, 2) === '250' && fmtSig(1649, 2) === '1600' && fmtSig(25.4, 2) === '25', `${fmtSig(252, 2)} ${fmtSig(1649, 2)} ${fmtSig(25.4, 2)}`);
  check('fmtSig groups 5-digit integers only', fmtSig(15000, 5) === '15 000' && fmtSig(1600, 2) === '1600');
  check('fmtSig uses powers of ten when trailing zeros are not significant', fmtSig(63000, 2) === '$6.3 \\times 10^{4}$' && fmtSig(0.001, 2) === '$1.0 \\times 10^{-3}$', fmtSig(63000, 2) + ' ' + fmtSig(0.001, 2));
  check('fmtQuantity with degrees', fmtQuantity(30, 2, '°') === '30°');

  // ----- Constants: typed again from the 2025 data booklet, page 3 and 4 -----
  const BOOKLET = { g: 9.8, G: 6.67e-11, NA: 6.02e23, R: 8.31, kB: 1.38e-23, sigma: 5.67e-8, k: 8.99e9, eps0: 8.85e-12, c: 3.00e8, h: 6.63e-34, e: 1.60e-19, me: 9.110e-31, mp: 1.673e-27, mn: 1.675e-27, u: 1.661e-27, u_MeV: 931.5, S: 1.36e3, R0: 1.20e-15, ly: 9.46e15, pc_ly: 3.26, AU: 1.50e11, kWh: 3.60e6, T0: 273, wien: 2.9e-3 };
  for (const [k, v] of Object.entries(BOOKLET)) check(`constant ${k} matches the data booklet`, CONSTANTS[k] && CONSTANTS[k].value === v, CONSTANTS[k] && String(CONSTANTS[k].value));
  check('μ0 = 4π × 10⁻⁷', near(CONSTANTS.mu0.value, 4 * Math.PI * 1e-7));
  for (const [k, c] of Object.entries(CONSTANTS)) {
    check(`constant ${k} has a valid unit`, (() => { try { parseUnit(c.unit); return true; } catch { return false; } })());
    // its printed text gives the same number
    const t = c.text.replace(/\\times\s*10\^\{(-?\d+)\}/, 'e$1').replace(/\s/g, '').replace('4\\pie', '');
    if (!/pi/.test(c.text)) check(`constant ${k}: printed text matches the value`, near(Number(t), c.value), c.text);
  }
  check('G dimensionally gives N for two masses', parseUnit('N m^2 kg^-2 kg^2 m^-2').dim.join() === parseUnit('N').dim.join());

  // ----- Syllabus -----
  for (const [id, t] of topics) {
    check(`syllabus covers ${id}`, !!UNDERSTANDINGS[id]);
    if (UNDERSTANDINGS[id]) check(`HL-only topic ${id} has only AHL items`, !t.hl || !(UNDERSTANDINGS[id].sl || []).length);
  }
  check('syllabus IDs look right', [...SYLLABUS_IDS.keys()].every((k) => /^([A-E]\.\d|T|NOS)\.[HY]?\d+$/.test(k)));
  check('about 250 understandings listed', SYLLABUS_IDS.size > 200, String(SYLLABUS_IDS.size));
  const caught = (txt) => EXCLUDED.filter((x) => x.re.test(txt)).map((x) => x.id);
  for (const bad of ['a step-up transformer', 'the rms current', 'quarks in a proton', 'a capacitor discharges', 'polarised light', 'the fundamental frequency', 'the first overtone', 'Hubble constant', 'the uncertainty principle', 'a wind turbine', 'drift velocity of electrons', 'Malus\'s law']) check(`excluded: "${bad}" is caught`, caught(bad).length > 0);
  for (const ok of ['the rms speed of the molecules', 'the first harmonic', 'the photon energy', 'electrons in a wire', 'a solar cell supplies', 'efficiency of the power station', 'the second harmonic', 'binding energy per nucleon', 'a moving charge', 'the internal resistance']) check(`allowed: "${ok}" is not excluded`, caught(ok).length === 0, caught(ok).join());
  check('limits name their topic', LIMITS.every((x) => /^[A-E]\.\d(\/[A-E]\.\d)?$/.test(x.topic)));
  check('command terms include Show that and Calculate', COMMAND_TERMS.includes('Show that') && COMMAND_TERMS.includes('Calculate'));

  // ----- The independent check imports nothing -----
  const indSrc = fs.readFileSync(path.join(HERE, 'independent.mjs'), 'utf8');
  check('independent.mjs imports nothing (it must not use the question code or constants.mjs)', !/^\s*import\b/m.test(indSrc) && !/require\(/.test(indSrc));

  // ----- The examples pass -----
  const good = build([GOOD_SHORT, GOOD_LINKING]);
  const goodErrors = good.diags.filter((x) => x.level === 'error');
  check('the example questions pass every check', !goodErrors.length, goodErrors.map((x) => `${x.question} ${x.code}: ${x.message}`).join(' | '));
  check('passing questions go to the preview, not production', good.preview.length === 2 && good.questions.length === 0);
  const short = good.preview.find((q) => q.id === 'A1-P90');
  check('numbers are filled in from the given values', short && short.stem.includes('32 m') && short.stem.includes('8.5 $\\text{m s}^{-1}$'));
  check('a "show that" value is rounded honestly', short && short.parts[0].question.includes('about 2.6 s'));
  check('placeholders inside MathJax are written as MathJax', short && short.parts[0].markscheme[0] === '$32 = \\tfrac{1}{2} \\times 9.8 \\times t^2$ ✓', short && short.parts[0].markscheme[0]);
  check('the typed answer is stored unrounded with the accept range', short && short.parts[1].numeric.answer === 21.7218 && short.parts[1].numeric.range.join() === '20.8,22.6');
  check('the accept range in the mark scheme is the stored range', short && short.parts[1].markscheme[2].includes('20.8 to 22.6'));
  const link = good.preview.find((q) => q.id === 'LQ-S90');
  check('a linking question is paper 2L, topic "Linking", with its topics listed', link && link.paper === '2L' && link.topic === 'Linking' && link.theme === '' && link.topics.length === 4);
  check('building is deterministic', build([GOOD_SHORT]).json === build([GOOD_SHORT]).json);

  // ----- Each rule catches its own break -----
  const expect = (name, def, code, opts) => {
    const codes = codesFor(def, opts);
    check(`rule ${code}: ${name}`, codes.includes(code), `got ${codes.join(', ') || 'no errors'}`);
  };
  let d;
  d = clone(GOOD_SHORT); d.parts[0].markscheme.pop(); expect('marking points must equal the marks', d, 'markscheme');
  d = clone(GOOD_SHORT); d.parts[2].syllabus = ['A.1.99']; expect('unknown syllabus ID', d, 'syllabus');
  d = clone(GOOD_SHORT); d.parts[2].syllabus = ['A.1.Y1']; expect('2028 content needs y2028: true', d, 'y2028');
  d = clone(GOOD_SHORT); d.y2028 = true; expect('y2028: true needs some 2028 content', d, 'y2028');
  d = clone(GOOD_SHORT); d.parts[2].syllabus = ['A.1.Y1']; d.y2028 = true;
  check('a 2028 question passes and is tagged y2028 on the site', !codesFor(d).length && build([d]).preview[0].y2028 === true, codesFor(d).join());
  d = clone(GOOD_SHORT); d.topics = ['A.1', 'A.2']; d.parts[2].syllabus = ['A.2.H1']; expect('AHL content in an SL question', d, 'level');
  d = clone(GOOD_SHORT); d.parts[2].syllabus = ['C.2.1']; expect('a syllabus ID outside the question\'s topics', d, 'syllabus');
  d = clone(GOOD_SHORT); d.stem += '<p>It is lit by a lamp on a transformer.</p>'; expect('a term that is not on the 2025 syllabus', d, 'excluded');
  d = clone(GOOD_SHORT); d.stem += '<p>It is lit by a lamp on a transformer.</p>'; d.waivers = { excluded: { ac: { by: 'Claude', reason: 'test' } } }; expect('an exclusion can only be waived by a person', d, 'excluded');
  d = clone(GOOD_SHORT); d.stem += '<p>It is lit by a lamp on a transformer.</p>'; d.waivers = { excluded: { ac: { by: 'Mr Silkstone (teacher)', reason: 'context only' } } };
  check('an exclusion waived by the teacher is a warning, not an error', !codesFor(d).includes('excluded'));
  d = clone(GOOD_SHORT); d.parts[0].markscheme[1] = '$t = 2.56\\ \\text{s}$ ✓'; expect('a number typed into the mark scheme', d, 'typed-number');
  d = clone(GOOD_SHORT); d.stem = d.stem.replace('[[h]]', '32 m'); expect('a number typed into the stem', d, 'typed-number');
  d = clone(GOOD_SHORT); d.literals = { 32: 'test' }; d.stem = d.stem.replace('[[h]]', '32 m');
  check('a listed literal is allowed', !codesFor(d).includes('typed-number'));
  d = clone(GOOD_SHORT); d.calc = (v) => ({ t: { value: Math.sqrt(2 * v.h / 9.81), unit: 's', sf: 3 }, x: { value: v.u * Math.sqrt(2 * v.h / 9.81), unit: 'm', sf: 2 }, vy: [1, 'm s^-1'], speed: [1, 'm s^-1'], wrong_x: [1, 'm'] }); expect('a constant typed into the calculation', d, 'calc-literal');
  d = clone(GOOD_SHORT); expect('a wrong independent result', d, 'independent', { independent: { 'A1-P90': (gv) => ({ ...GOOD_SHORT_INDEPENDENT(gv), x: GOOD_SHORT_INDEPENDENT(gv).x * 1.01 }) } });
  d = clone(GOOD_SHORT); expect('a missing independent check', d, 'independent', { independent: {} });
  d = clone(GOOD_SHORT); d.calc = (v, K) => { const t = Math.sqrt(2 * v.h / K.g); return { t: [t, 's', 3], x: [v.u * t * t, 'm', 2], vy: [K.g * t, 'm s^-1', 2], speed: [Math.hypot(v.u, K.g * t), 'm s^-1', 2], wrong_x: [1, 'm', 2] }; };
  expect('a dimensionally wrong formula', d, 'dimensions');
  d = clone(GOOD_SHORT); d.parts[0].showThat.sf = 1; d.parts[0].question = d.parts[0].question.replace('[[t:2u]]', '[[t:1u]]'); expect('a dishonest "show that" value (3 for 2.56)', d, 'show-that');
  d = clone(GOOD_SHORT); d.parts[1].numeric.mistakes = [{ result: 'x', feedback: 'x' }]; expect('a listed mistake that is actually right', d, 'numeric');
  d = clone(GOOD_SHORT); d.parts[1].question = 'Find the horizontal distance.'; expect('the command term must start the task', d, 'command');
  d = clone(GOOD_SHORT); d.parts[1].command = 'Find'; expect('the command term must be an IB one', d, 'command');
  d = clone(GOOD_SHORT); d.parts[1].markscheme.pop(); expect('a part that uses an earlier answer needs ECF', d, 'markscheme');
  d = clone(GOOD_SHORT); d.parts[2].examinerNote = ''; expect('every part needs an examiner note', d, 'markscheme');
  d = clone(GOOD_SHORT); d.stem += '<p>[[zz]]</p>'; expect('an unknown placeholder', d, 'placeholder');
  d = clone(GOOD_SHORT); d.parts.pop(); expect('a short question needs an explanation part', d, 'structure');
  d = clone(GOOD_SHORT); d.parts.pop(); expect('a short question has at least 5 marks', d, 'marks');
  d = clone(GOOD_SHORT); d.given.h.value = 500; expect('a given value outside its plausible range', d, 'plausible');
  d = clone(GOOD_SHORT); d.given.u.value = 8.53; expect('a given value with more figures than stated', d, 'given');
  d = clone(GOOD_SHORT); d.id = 'A2-P90'; expect('the id must start with its topic', d, 'meta', { independent: { 'A2-P90': GOOD_SHORT_INDEPENDENT } });
  d = clone(GOOD_SHORT); d.topics = ['A.4']; expect('an HL-only topic in an SL question', d, 'level');
  d = clone(GOOD_SHORT); d.parts[2].question = 'Outline why the air expands adiabatically.'; expect('adiabatic changes are HL only', d, 'level');
  d = clone(GOOD_SHORT); d.diagram = { file: 'questions/diagrams/no-such-file.svg', alt: 'A diagram that does not exist, used for the test.' }; expect('a missing diagram file', d, 'diagram');
  d = clone(GOOD_SHORT); d.calc = (v, K) => ({ ...GOOD_SHORT.calc(v, K), t: [Math.sqrt(2 * v.h / K.g) * (1 + Math.random()), 's', 3] }); expect('a calculation that isn\'t deterministic', d, 'determinism');
  d = clone(GOOD_SHORT); d.originality = { note: 'short' }; expect('an originality note is required', d, 'originality');
  d = clone(GOOD_SHORT); d.parts[1].markscheme[1] = '$x = [[x:3]]\\ \\text{m}$ ✓✓'; expect('one ✓ per marking point', d, 'markscheme');
  d = clone(GOOD_LINKING); d.parts.pop(); expect('a linking question has exactly 20 marks', d, 'marks');
  d = clone(GOOD_LINKING); d.parts.filter((pt) => pt.label.startsWith('e')).forEach((pt) => { pt.syllabus = ['B.5.6']; }); d.topics = ['B.1', 'A.3', 'B.5'];
  expect('a linking question covers three themes', d, 'structure');
  d = clone(GOOD_LINKING); d.parts[1].dependsOn = []; expect('a linking question uses a "show that" value later', d, 'structure');
  d = clone(GOOD_LINKING); d.parts.find((pt) => pt.label === 'e(iv)').markscheme.shift(); expect('"any n from" needs its note line', d, 'markscheme');
  d = clone(GOOD_LINKING); d.id = 'LQ-H90'; expect('a linking id matches its level', d, 'meta', { independent: { 'LQ-H90': GOOD_LINKING_INDEPENDENT } });
  d = clone(GOOD_SHORT); d.parts[1].question += ' Give your answer in m s^-1.'; expect('units with negative powers outside MathJax', d, 'units');
  d = clone(GOOD_SHORT); d.stem += '<p>A helium-4 nucleus and a carbon-12 nucleus.</p>'; d.literals = { 12: 'test' };
  check('nuclide names such as helium-4 are not mistaken for units', !codesFor(d).includes('units'), codesFor(d).join());

  // ----- Originality (a pretend reference cache, so this also runs on GitHub) -----
  const cache = fs.mkdtempSync(path.join(os.tmpdir(), 'p2-orig-'));
  const saved = process.env.DP_REFERENCE_CACHE;
  try {
    fs.mkdirSync(path.join(cache, 'past-papers-2025'));
    fs.writeFileSync(path.join(cache, 'past-papers-2025', 'may-2099_Physics_paper_2_TZ1_SL.txt'), '1. A stone is thrown horizontally at 6.0 m s-1 from the top of a cliff 45 m high.');
    // a phrase found in 5 or more papers is stock phrasing and is ignored
    for (let i = 0; i < 5; i++) fs.writeFileSync(path.join(cache, 'past-papers-2025', `stock-${i}_paper_2.txt`), 'Outline how air resistance would change the horizontal distance travelled by it.');
    process.env.DP_REFERENCE_CACHE = cache;
    check('words(): ECF clauses (a mark-scheme convention) are ignored', words('x ✓; allow ECF from (a)(i) and (a)(ii)').join(' ') === 'x');
    check('words(): numbers become # and MathJax is removed', words('A car of mass 1600 kg, $v = 2$').join(' ') === 'a car of mass #' && words('at 6.0 m s-1 from').join(' ') === words('at 8.5 $\\text{m s}^{-1}$ from').join(' '));
    const o1 = checkOriginality(GOOD_SHORT, build([GOOD_SHORT]).preview[0], ROOT);
    check('originality: an 8-word run copied from an IB paper is caught', o1.ran && o1.problems.some((p) => /stone is thrown horizontally at # from the/.test(p.run)), JSON.stringify(o1.problems));
    check('originality: stock phrasing in 5+ papers is ignored', !o1.problems.some((p) => /air resistance would change/.test(p.run)));
    check('originality: a copied run fails the build', build([GOOD_SHORT], { originality: true }).diags.some((x) => x.code === 'originality'));
    const daily = clone(GOOD_SHORT);
    daily.originality = { inspiredBy: 'Daily Questions/A.1 - Kinematics/Q99.png', transcript: 'daily/Q99.txt', note: 'Same situation as the Daily Question, reworded and new numbers.' };
    check('originality: a missing Daily Question transcript is a problem', checkOriginality(daily, build([daily]).preview[0], ROOT).problems.some((p) => /transcript/.test(p.source)));
    fs.mkdirSync(path.join(cache, 'daily'));
    fs.writeFileSync(path.join(cache, 'daily', 'Q99.txt'), 'How far from the foot of the cliff does the stone land in the water?');
    check('originality: a 6-word run shared with the Daily Question is caught', checkOriginality(daily, build([daily]).preview[0], ROOT).problems.some((p) => /foot of the cliff/.test(p.run)));
    fs.writeFileSync(path.join(cache, 'daily', 'Q99.txt'), 'Find the range of a pebble flicked off a wall.');
    check('originality: different wording passes', !checkOriginality(daily, build([daily]).preview[0], ROOT).problems.some((p) => p.source.startsWith('Daily')));
  } finally {
    if (saved === undefined) delete process.env.DP_REFERENCE_CACHE; else process.env.DP_REFERENCE_CACHE = saved;
    fs.rmSync(cache, { recursive: true, force: true });
  }

  // ----- Review status and the freeze -----
  const first = build([GOOD_SHORT]).results[0];
  const approved = { questions: { 'A1-P90': { status: 'APPROVED', fingerprint: first.fingerprint, history: [{ status: 'APPROVED', by: 'Teacher', date: '2026-10-14' }] } } };
  const pub = build([GOOD_SHORT], { registry: approved });
  check('an APPROVED, unchanged question is published', pub.questions.length === 1 && pub.preview.length === 0);
  const changed = clone(GOOD_SHORT); changed.given.h.value = 33;
  const frozen = build([changed], { registry: approved });
  check('a change to an APPROVED question fails the freeze', frozen.diags.some((x) => x.code === 'frozen-changed') && frozen.questions.length === 0);
  check('the fingerprint ignores nothing that students see', fingerprintOf(build([changed]).results[0].content) !== first.fingerprint);
  check('a review record without a question file is an error', build([], { registry: approved }).diags.some((x) => x.code === 'registry'));
  check('an assistant can\'t record APPROVED', !!reviewProblem({ status: 'TEACHER-REVIEWED' }, 'APPROVED', 'Claude', {}));
  check('reviews can\'t skip a stage', !!reviewProblem({ status: 'AUTO-VALIDATED' }, 'APPROVED', 'Mr Silkstone', {}));
  check('the next stage in order is allowed', reviewProblem({ status: 'AUTO-VALIDATED' }, 'PHYSICS-REVIEWED', 'Mr Silkstone', {}) === null);

  return { count, failures };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { count, failures } = await runTests();
  for (const f of failures) console.log(`✗ ${f}`);
  console.log(failures.length ? `\n✗ ${failures.length} of ${count} Paper 2 tests failed.` : `✓ All ${count} Paper 2 tests pass.`);
  process.exit(failures.length ? 1 : 0);
}
