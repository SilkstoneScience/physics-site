// Review status of Paper 1B datasets, kept in tools/1b/reviews.json (a plain file in the repository).
//
// Statuses, in order:
//   DRAFT             work in progress (also any dataset that fails validation). Local preview only.
//   AUTO-VALIDATED    passes every automatic check, but no person has reviewed it. Local preview only.
//   PHYSICS-REVIEWED  someone has checked the physics against the --audit report. Local preview only.
//   TEACHER-REVIEWED  the teacher has reviewed the question. Local preview only.
//   APPROVED          the teacher has approved it for students. Only these go into questions/1b.json.
// AUTO-VALIDATED is never stored: it is what a passing dataset is until someone records a review.
// Automatic validation is not a review: only a person (with a name and a date) can move a dataset beyond it.
//
// The freeze: every review records the dataset's fingerprint (see fingerprint.mjs) and saves a snapshot in
// tools/1b/frozen/<id>.json. If the dataset later builds differently (for example because shared code
// changed), the checker fails and reports what changed, until it is reverted or explicitly reset and re-reviewed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { diffContent } from './fingerprint.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REGISTRY = path.join(HERE, 'reviews.json');
export const FROZEN = path.join(HERE, 'frozen');
export const STATUSES = ['DRAFT', 'AUTO-VALIDATED', 'PHYSICS-REVIEWED', 'TEACHER-REVIEWED', 'APPROVED'];
export const REVIEWED = ['PHYSICS-REVIEWED', 'TEACHER-REVIEWED', 'APPROVED'];

export function loadRegistry() {
  if (!fs.existsSync(REGISTRY)) return { datasets: {} };
  return JSON.parse(fs.readFileSync(REGISTRY, 'utf8').replace(/^﻿/, ''));
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

// The current status of a dataset, given whether it passes validation and its current fingerprint.
// changed: true means it was reviewed, but no longer builds to the reviewed content (the freeze is broken).
export function stateFor(id, valid, fingerprint, reg) {
  const rec = reg.datasets[id];
  if (rec && rec.status === 'DRAFT') return { status: 'DRAFT', changed: false, rec };
  if (rec && REVIEWED.includes(rec.status)) {
    const changed = rec.fingerprint !== fingerprint;
    return { status: valid ? rec.status : 'DRAFT', changed, rec };
  }
  return { status: valid ? 'AUTO-VALIDATED' : 'DRAFT', changed: false, rec };
}

// Whether a review may be recorded (used by review.mjs set; tested in test.mjs). Returns an error message, or null.
// Reviews go in order with no skipping; a dataset must pass every check and be unchanged since its last review;
// TEACHER-REVIEWED and APPROVED must name a person, never an assistant or a script.
export const NOT_A_PERSON = /\b(claude|assistant|ai|automated|bot|script)\b/i;
export function reviewProblem(rec, wanted, by, { valid = true, changed = false } = {}) {
  if (!by) return 'say who is reviewing (--by "<name>")';
  if (!REVIEWED.includes(wanted)) return `status must be one of ${REVIEWED.join(', ')}`;
  if (!valid) return 'the dataset doesn\'t pass the automatic checks';
  if (changed) return 'the dataset has changed since its last review: reset it first';
  const current = rec && REVIEWED.includes(rec.status) ? rec.status : 'AUTO-VALIDATED';
  const order = ['AUTO-VALIDATED', ...REVIEWED];
  if (order.indexOf(wanted) !== order.indexOf(current) + 1) return `the dataset is ${current}: the next review is ${order[order.indexOf(current) + 1] || '(none: already APPROVED)'}, not ${wanted}`;
  if ((wanted === 'TEACHER-REVIEWED' || wanted === 'APPROVED') && NOT_A_PERSON.test(by)) return `${wanted} must be recorded for a person (the teacher), not "${by}"`;
  return null;
}

// The checker's error when a reviewed dataset would change: which fields, and both fingerprints.
export function freezeDiagnostic(id, rec, content, fingerprint) {
  const before = loadSnapshot(id);
  const changes = before ? diffContent(before, content) : [];
  const shown = changes.slice(0, 8).map((c) => `${c.path}: "${c.before}" → "${c.after}"`);
  return {
    level: 'error', code: 'frozen-changed', dataset: id, where: `${rec.status} dataset`,
    message: `this dataset was ${rec.status} (by ${rec.history[rec.history.length - 1].by}, ${rec.history[rec.history.length - 1].date}) but now builds differently. `
      + 'Undo the change, or reset it with tools/1b/review.mjs and review it again. '
      + (changes.length ? `${changes.length} field(s) changed: ${shown.join('; ')}${changes.length > 8 ? '; …' : ''}` : '(no snapshot found to compare)'),
    expected: `fingerprint ${rec.fingerprint.slice(0, 16)}…`,
    got: `fingerprint ${fingerprint.slice(0, 16)}…`,
    changes,
  };
}
