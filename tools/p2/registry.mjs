// Review status of Paper 2 questions, kept in tools/p2/reviews.json. The same statuses and rules as Paper 1B
// (tools/1b/registry.mjs, whose review rules are reused here):
//   DRAFT → AUTO-VALIDATED → PHYSICS-REVIEWED → TEACHER-REVIEWED → APPROVED
// AUTO-VALIDATED is never stored: it is what a passing question is until a person records a review.
// Every review records the question's fingerprint and saves a snapshot in tools/p2/frozen/<id>.json; if the
// question later builds differently, the checker fails until it is undone or reset and reviewed again.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { diffContent } from '../1b/fingerprint.mjs';
export { STATUSES, REVIEWED, reviewProblem, NOT_A_PERSON } from '../1b/registry.mjs';
import { REVIEWED } from '../1b/registry.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REGISTRY = path.join(HERE, 'reviews.json');
export const FROZEN = path.join(HERE, 'frozen');

export function loadRegistry() {
  if (!fs.existsSync(REGISTRY)) return { questions: {} };
  const reg = JSON.parse(fs.readFileSync(REGISTRY, 'utf8').replace(/^﻿/, ''));
  reg.questions = reg.questions || {};
  return reg;
}
export function saveRegistry(reg) {
  fs.writeFileSync(REGISTRY, JSON.stringify(reg, null, 2) + '\n');
}
export function loadSnapshot(id) {
  const f = path.join(FROZEN, `${id}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, '')) : null;
}
export function saveSnapshot(id, content) {
  fs.mkdirSync(FROZEN, { recursive: true });
  fs.writeFileSync(path.join(FROZEN, `${id}.json`), JSON.stringify(content, null, 2) + '\n');
}

export function stateFor(id, valid, fingerprint, reg) {
  const rec = reg.questions[id];
  if (rec && rec.status === 'DRAFT') return { status: 'DRAFT', changed: false, rec };
  if (rec && REVIEWED.includes(rec.status)) return { status: valid ? rec.status : 'DRAFT', changed: rec.fingerprint !== fingerprint, rec };
  return { status: valid ? 'AUTO-VALIDATED' : 'DRAFT', changed: false, rec };
}

export function freezeDiagnostic(id, rec, content, fingerprint) {
  const before = loadSnapshot(id);
  const changes = before ? diffContent(before, content) : [];
  const last = rec.history[rec.history.length - 1];
  return {
    level: 'error', code: 'frozen-changed',
    message: `this question was ${rec.status} (by ${last.by}, ${last.date}) but now builds differently. Undo the change, or reset it with tools/p2/review.mjs and review it again. `
      + (changes.length ? `${changes.length} field(s) changed: ${changes.slice(0, 8).map((c) => `${c.path}: "${c.before}" → "${c.after}"`).join('; ')}${changes.length > 8 ? '; …' : ''}` : '(no snapshot found to compare)')
      + ` (fingerprint ${rec.fingerprint.slice(0, 16)}… → ${fingerprint.slice(0, 16)}…)`,
  };
}

// Batch risk classes (docs/PAPER2_SPECIFICATION.md section 9). RED: fails a check (can't be accepted).
// AMBER: the teacher inspects it (or waives it with a reason). GREEN: may be accepted after a sample.
export function classify(r, diags) {
  const mine = diags.filter((x) => x.question === r.id);
  if (!r.valid) return { class: 'RED', reasons: mine.filter((x) => x.level === 'error').map((x) => x.message) };
  const reasons = [];
  const def = r.def;
  if (def.type === 'linking') reasons.push('linking question');
  if (def.level === 'HL') reasons.push('HL question');
  if (def.y2028) reasons.push('new for 2028 (checked against the 2028 guide)');
  if (def.originality && def.originality.inspiredBy) reasons.push(`inspired by a Daily Question (${def.originality.inspiredBy})`);
  if ((def.parts || []).some((pt) => pt.marks >= 3 && !['Calculate', 'Determine', 'Show that', 'Estimate'].includes(pt.command))) reasons.push('has a 3–4 mark explanation part');
  if (mine.some((x) => x.code === 'limit')) reasons.push('touches a guidance limit');
  if (mine.some((x) => x.code === 'excluded-waived')) reasons.push('has a waived syllabus exclusion');
  if (r.originality && !r.originality.ran) reasons.push('originality check not run');
  if (def.batchRule === 'inspect-all') reasons.push('its batch is inspected in full (the first batch tests the process)');
  return { class: reasons.length ? 'AMBER' : 'GREEN', reasons };
}
export const SAMPLE_FRACTION = 0.2;
