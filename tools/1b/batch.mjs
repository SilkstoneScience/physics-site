// Risk classification and batch acceptance for Paper 1B datasets (docs/PAPER1B_SPECIFICATION.md section 16).
//
// Every dataset is classified automatically:
//   RED    it fails validation or the independent physics audit, it changed since review, or its author flagged
//          a serious problem (for example a serious originality concern). Must be fixed; can't be accepted.
//   AMBER  it passes, but a person should judge it: the first example of a MEDIUM- or HIGH-risk archetype,
//          a judgement-heavy feature not yet used in an individually reviewed dataset, an uncertainty-sensitive
//          conclusion, a validator warning, an author's review flag, or a missing archetype/originality note.
//   GREEN  everything else.
//
// A batch is accepted by the teacher as ONE recorded decision (review.mjs accept-batch). Acceptance needs:
// no RED; every AMBER dataset individually TEACHER-REVIEWED, or explicitly waived by the teacher with a reason;
// a sample of GREEN datasets individually TEACHER-REVIEWED (about 15 %, at least 1); every dataset at least
// PHYSICS-REVIEWED and unchanged; no unwaived diversity warning; and the teacher's confirmation that no
// systemic generator or validator problem was found. Accepting promotes each dataset to APPROVED with an
// audit trail that says whether the teacher inspected that dataset individually (inspected: true/false).
// Nothing here ever records TEACHER-REVIEWED: only an individual review does that.

import { contextProblems, contextRepetition } from './contexts.mjs';

// Matrix risk of each archetype (docs/PAPER1B_ARCHETYPE_MATRIX.md, section 1).
export const ARCHETYPE_RISK = {
  M1: 'LOW', M2: 'LOW', M3: 'MEDIUM', M4: 'MEDIUM',
  L1: 'LOW', L2: 'LOW', L3: 'LOW', L4: 'HIGH',
  N1: 'LOW', N2: 'LOW', N3: 'MEDIUM', N4: 'MEDIUM', N5: 'MEDIUM',
  G1: 'MEDIUM', G2: 'HIGH', G3: 'LOW',
  V1: 'MEDIUM', V2: 'HIGH', V3: 'MEDIUM',
  E1: 'MEDIUM', E2: 'HIGH', E3: 'LOW', E4: 'HIGH',
  D1: 'HIGH', D2: 'HIGH', D3: 'HIGH',
};

// Features that need human judgement the first time they are used: a dataset using one of these is AMBER
// until some individually teacher-reviewed APPROVED dataset has used it.
export const JUDGEMENT_FEATURES = [
  'systematic:zero-offset', 'systematic:calibration', 'systematic:drift', 'systematic:heat-loss',
  'source:secondary', 'source:model', 'source:observational', 'model:empirical',
  'claim:validRange', 'claim:notLinear', 'graph:log', 'graph:tangent', 'graph:area', 'diagram:instrument',
];

export const SAMPLE_FRACTION = 0.15; // of GREEN datasets (target 10–20 %), at least 1 when there are any
export const AI_NAME = /\b(claude|assistant|ai|automated|bot|script)\b/i;

// The features a dataset uses (only those detectable from its definition).
export function featuresOf(def) {
  const f = new Set();
  for (const c of Object.values(def.columns || {})) for (const s of c.systematic || []) f.add(`systematic:${s.type}`);
  for (const s of Object.values(def.singles || {})) for (const e of s.systematic || []) f.add(`systematic:${e.type}`);
  if (def.source && def.source !== 'primary') f.add(`source:${def.source}`);
  for (const cl of def.claims || []) f.add(`claim:${cl.type}`);
  if (def.graph && def.graph.fit) f.add(`fit:${def.graph.fit}`);
  for (const k of def.features || []) f.add(k); // declared by the author when not detectable (e.g. graph:log)
  return f;
}

const approvalOf = (rec) => (rec && rec.status === 'APPROVED' ? [...rec.history].reverse().find((h) => h.status === 'APPROVED') : null);
// Individually inspected and approved by the teacher (older records without a basis were individual approvals).
export const individuallyApproved = (rec) => {
  const a = approvalOf(rec);
  return !!a && (a.basis === undefined || a.basis === 'individual' || a.inspected === true);
};

// What has been established by individually reviewed, APPROVED, unchanged datasets. `contexts` maps each archetype to
// the context families of its individually inspected examples (rule C1 below).
export function establishedSets(results, registry) {
  const archetypes = new Set();
  const features = new Set();
  const contexts = new Map();
  for (const r of results) {
    const rec = registry.datasets[r.id];
    if (!r.valid || r.state.changed || !individuallyApproved(rec)) continue;
    for (const a of r.def.archetypes || []) {
      archetypes.add(a);
      if (!contexts.has(a)) contexts.set(a, new Set());
      contexts.get(a).add(r.def.contextFamily || r.id);
    }
    for (const f of featuresOf(r.def)) features.add(f);
  }
  return { archetypes, features, contexts };
}

// Rule C1 (adopted by the teacher, 8 October 2026): a HIGH-risk archetype is established only by TWO individually inspected
// approved examples in different context families. Until then every example is AMBER ("first" or "second example").
export const HIGH_RISK_EXAMPLES_NEEDED = 2;
// Rule C6 (adopted 8 October 2026): AMBER reasons at this level can't be waived: the dataset must be inspected individually.
const HIGH_LEVEL = /^(first example of archetype w+ (HIGH risk)|second example of HIGH-risk archetype)/;

// RED / AMBER / GREEN for one built dataset (r = an entry of buildAll's results), with reasons.
export function classify(r, { diags, established, verdictMargin }) {
  const red = [];
  const amber = [];
  const mine = diags.filter((x) => x.dataset === r.id);
  for (const x of mine.filter((y) => y.level === 'error')) red.push(`${x.code}: ${x.where}`);
  if (r.state && r.state.changed) red.push('changed since its last review');
  for (const fl of r.def.reviewFlags || []) (fl.flag === 'originality-serious' || fl.serious ? red : amber).push(`author flag ${fl.flag}: ${fl.note || ''}`.trim());
  for (const x of mine.filter((y) => y.level === 'warning')) amber.push(`validator warning ${x.code}: ${x.message}`);
  const arch = r.def.archetypes || [];
  if (!arch.length) amber.push('no archetype declared');
  for (const a of arch) {
    if (!(a in ARCHETYPE_RISK)) amber.push(`unknown archetype ${a}`);
    else if (!established.archetypes.has(a) && ARCHETYPE_RISK[a] !== 'LOW') amber.push(`first example of archetype ${a} (${ARCHETYPE_RISK[a]} risk)`);
    else if (ARCHETYPE_RISK[a] === 'HIGH' && established.contexts) {
      const seen = established.contexts.get(a) || new Set();
      const others = [...seen].filter((fam) => fam !== r.def.contextFamily);
      if (seen.size < HIGH_RISK_EXAMPLES_NEEDED) amber.push(`second example of HIGH-risk archetype ${a} (C1: needs ${HIGH_RISK_EXAMPLES_NEEDED} individually inspected examples in different contexts; inspected so far: ${seen.size}${others.length < seen.size ? ', in the same context family as this one' : ''})`);
    }
  }
  for (const f of featuresOf(r.def)) {
    if (JUDGEMENT_FEATURES.includes(f) && !established.features.has(f)) amber.push(`first use of ${f}`);
  }
  if (!r.def.originality) amber.push('no originality note');
  // Uncertainty-sensitive conclusions: a verdict close to its minimum margin.
  const d = r.built && r.built.d;
  for (const cl of (r.def.claims || []).filter((c) => c.type === 'verdict')) {
    const res = d && d.r[cl.result];
    if (!res || !res.range) continue;
    const gap = cl.value < res.range[0] ? res.range[0] - cl.value : cl.value > res.range[1] ? cl.value - res.range[1] : Math.min(cl.value - res.range[0], res.range[1] - cl.value);
    if (gap < 2 * verdictMargin * Math.abs(res.value)) amber.push(`uncertainty-sensitive verdict on ${cl.result} (${(100 * gap / Math.abs(res.value)).toFixed(1)} % from the range edge)`);
  }
  // Context family and objects (contexts.mjs): a missing, unknown or incomplete declaration needs a person.
  for (const p of contextProblems(r.def)) amber.push(p);
  // Data the author has declared regular on purpose (validate.mjs, regularity check): a person must agree.
  for (const [k, c] of Object.entries(r.def.columns || {})) {
    if (c.regularity) amber.push(`regular data accepted by the author in column ${k} (${(c.regularity.accept || []).join(', ')}): ${c.regularity.reason}`);
  }
  // First example of a LOW-risk archetype: GREEN, but preferred for the teacher's sample.
  const newLow = arch.filter((a) => ARCHETYPE_RISK[a] === 'LOW' && !established.archetypes.has(a));
  const cls = red.length ? 'RED' : amber.length ? 'AMBER' : 'GREEN';
  const notWaivable = amber.filter((x) => HIGH_LEVEL.test(x));
  return { id: r.id, class: cls, reasons: [...red, ...amber], waivable: !notWaivable.length, notWaivable, priority: newLow.length ? `first example of LOW-risk archetype ${newLow.join(', ')}` : null };
}

// A repeatable "random" order from the batch id, so the suggested sample can't be hand-picked.
function seededOrder(ids, seedText) {
  let h = 2166136261;
  for (const ch of seedText) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const rnd = () => { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0; return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  return ids.map((id) => [rnd(), id]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
}

// Diversity within a batch: the same apparatus twice, one archetype or sequence dominating, or a context family or
// object repeated within the batch or already common in the rest of the bank (`others`; contexts.mjs).
export function diversityWarnings(members, others = []) {
  const out = [];
  const seen = new Map();
  for (const r of members) {
    const a = r.def.apparatus;
    if (!a) continue;
    if (seen.has(a)) out.push(`apparatus "${a}" used by ${seen.get(a)} and ${r.id}`);
    else seen.set(a, r.id);
  }
  if (members.length >= 4) {
    const count = {};
    for (const r of members) { const main = (r.def.archetypes || [])[0]; if (main) count[main] = (count[main] || 0) + 1; }
    for (const [a, n] of Object.entries(count)) if (n / members.length > 0.35) out.push(`archetype ${a} is the main archetype of ${n} of ${members.length} datasets (over 35 %)`);
  }
  out.push(...contextRepetition(members, others));
  return out;
}

// Everything the teacher needs to decide on a batch.
export function batchPlan(batchId, { results, diags, registry, verdictMargin }) {
  const members = results.filter((r) => r.def.batch === batchId);
  const established = establishedSets(results.filter((r) => r.def.batch !== batchId), registry);
  const rows = members.map((r) => {
    const c = classify(r, { diags, established, verdictMargin });
    const rec = registry.datasets[r.id];
    return { ...c, status: r.state.status, individuallyReviewed: !!rec && ['TEACHER-REVIEWED', 'APPROVED'].includes(rec.status) && (rec.status === 'TEACHER-REVIEWED' || individuallyApproved(rec)) };
  });
  const greens = rows.filter((x) => x.class === 'GREEN');
  const sampleSize = greens.length ? Math.max(1, Math.ceil(SAMPLE_FRACTION * greens.length)) : 0;
  const prioritised = greens.filter((x) => x.priority).map((x) => x.id);
  const rest = seededOrder(greens.filter((x) => !x.priority).map((x) => x.id), batchId);
  const suggestedSample = [...prioritised, ...rest].slice(0, Math.max(sampleSize, prioritised.length ? 1 : 0));
  return { batchId, rows, sampleSize, suggestedSample, diversity: diversityWarnings(members, results.filter((r) => r.def.batch !== batchId)) };
}

// The batch-acceptance decision. Returns { registry, approved: [...], errors: [...] }; on errors the registry is
// returned unchanged. `fingerprints` maps dataset id → current fingerprint.
export function acceptBatch(plan, registry, { by, date, note, recordedBy, waive = {}, systemicOk, fingerprints }) {
  const errors = [];
  if (!by) errors.push('say who accepts the batch, with --by "<name>"');
  else if (AI_NAME.test(by)) errors.push(`a batch can only be accepted by a person (the teacher), not "${by}"`);
  if (!note) errors.push('give a note describing what was reviewed, with --note "<text>"');
  if (!systemicOk) errors.push('confirm that no systemic generator or validator problem was found (--systemic-ok)');
  if (!plan.rows.length) errors.push(`batch ${plan.batchId} has no datasets`);
  if (registry.batches && registry.batches[plan.batchId]) errors.push(`batch ${plan.batchId} has already been decided`);
  for (const x of plan.rows) {
    const rec = registry.datasets[x.id];
    if (x.class === 'RED') errors.push(`${x.id} is RED (${x.reasons.join('; ')}): fix it first; RED can't be waived`);
    if (!rec || !['PHYSICS-REVIEWED', 'TEACHER-REVIEWED', 'APPROVED'].includes(rec.status)) errors.push(`${x.id} needs at least PHYSICS-REVIEWED before batch acceptance`);
    if (x.class === 'AMBER' && !x.individuallyReviewed && !waive[x.id]) errors.push(`${x.id} is AMBER (${x.reasons.join('; ')}): review it individually, or waive it with --waive ${x.id} "<reason>"`);
  }
  for (const id of Object.keys(waive)) {
    const x = plan.rows.find((y) => y.id === id);
    if (!x) errors.push(`--waive ${id}: not in this batch`);
    else if (x.class !== 'AMBER') errors.push(`--waive ${id}: only AMBER datasets can be waived (it is ${x.class})`);
    else if (!waive[id]) errors.push(`--waive ${id}: give a reason`);
    else if (x.waivable === false) errors.push(`--waive ${id}: can't be waived (rule C6): ${x.notWaivable.join('; ')}. Review it individually`);
  }
  const sampled = plan.rows.filter((x) => x.class === 'GREEN' && x.individuallyReviewed).map((x) => x.id);
  if (sampled.length < plan.sampleSize) errors.push(`the GREEN sample needs ${plan.sampleSize} individually TEACHER-REVIEWED dataset(s); ${sampled.length} so far (suggested: ${plan.suggestedSample.join(', ')})`);
  for (const w of plan.diversity) if (!waive.diversity) errors.push(`diversity: ${w} (fix it, or waive with --waive diversity "<reason>")`);
  if (errors.length) return { registry, approved: [], errors };

  const reg = JSON.parse(JSON.stringify(registry));
  const who = { by, date, ...(recordedBy ? { recordedBy } : {}) };
  const approved = [];
  for (const x of plan.rows) {
    const rec = reg.datasets[x.id];
    if (rec.status === 'APPROVED') continue;
    const fp = fingerprints[x.id];
    const inspected = rec.status === 'TEACHER-REVIEWED';
    if (!inspected) {
      rec.history.push({
        status: 'BATCH-ACCEPTED', ...who, batch: plan.batchId, risk: x.class, inspected: false, fingerprint: fp,
        note: x.class === 'AMBER' ? `AMBER waived by the teacher: ${waive[x.id]}` : 'GREEN: passed validation and the independent physics audit; accepted as part of the batch; not individually inspected by the teacher',
      });
    }
    rec.history.push({ status: 'APPROVED', ...who, basis: 'batch', batch: plan.batchId, inspected, risk: x.class, fingerprint: fp, note: `Approved by batch acceptance of ${plan.batchId}` });
    rec.status = 'APPROVED';
    rec.fingerprint = fp;
    approved.push({ id: x.id, inspected, risk: x.class });
  }
  reg.batches = reg.batches || {};
  reg.batches[plan.batchId] = {
    decision: 'ACCEPTED', ...who, note,
    datasets: plan.rows.map((x) => ({ id: x.id, risk: x.class, reasons: x.reasons, inspected: x.individuallyReviewed, ...(waive[x.id] ? { waived: waive[x.id] } : {}) })),
    sampleSize: plan.sampleSize, sampled, systemicOk: true,
    ...(waive.diversity ? { diversityWaived: waive.diversity, diversity: plan.diversity } : {}),
  };
  return { registry: reg, approved, errors: [] };
}
