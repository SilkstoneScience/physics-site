// Systematic effects: physically justified, deterministic changes to a measured column.
// They are applied to the physics model's value BEFORE random scatter and rounding, in the order listed.
// They are never random, and they are not a way of adding noise: each must state its physical cause
// and why it is realistic, and each is shown in the --audit report.
//
//   { type: 'zero-offset', offset, cause, justification }
//        reading = true + offset                     (offset in the column's unit; e.g. a balance not zeroed)
//   { type: 'calibration', factor, cause, justification }
//        reading = true × factor                     (e.g. a meter that reads 2 % high: factor 1.02)
//   { type: 'drift', rate, driver, cause, justification }
//        reading = true + rate × driver              (driver: a column, e.g. 'row.t'; rate in column unit per driver unit;
//                                                     e.g. a cell's emf falling as it is used)
//   { type: 'heat-loss', k, driver, cause, justification }
//        reading = true × (1 − k × driver)           (a fraction k of the energy lost per unit of the driver, e.g. per second of
//                                                     heating; k × driver must stay below 0.5 for every row)
export const SYSTEMATIC_TYPES = {
  'zero-offset': { params: ['offset'], effect: 'reading = true value + offset' },
  calibration: { params: ['factor'], effect: 'reading = true value × factor' },
  drift: { params: ['rate', 'driver'], effect: 'reading = true value + rate × driver' },
  'heat-loss': { params: ['k', 'driver'], effect: 'reading = true value × (1 − k × driver)' },
};

const driverValue = (eff, row) => {
  const [src, name] = String(eff.driver).split('.');
  if (src !== 'row' || !(name in row)) throw new Error(`systematic ${eff.type}: driver "${eff.driver}" must be a column given as row.<name>`);
  return row[name];
};

// Applies a column's systematic effects to one value (the physics model's value for this row).
export function applySystematic(effects, v, row) {
  for (const eff of effects || []) {
    if (eff.type === 'zero-offset') v += eff.offset;
    else if (eff.type === 'calibration') v *= eff.factor;
    else if (eff.type === 'drift') v += eff.rate * driverValue(eff, row);
    else if (eff.type === 'heat-loss') v *= 1 - eff.k * driverValue(eff, row);
    else throw new Error(`unknown systematic effect "${eff.type}"`);
  }
  return v;
}

// Problems with the declarations (used by the validator): missing cause or justification, unknown
// type, missing parameters, or a heat loss that would remove half the energy or more.
export function checkSystematic(effects, rows) {
  const problems = [];
  for (const eff of effects || []) {
    const t = SYSTEMATIC_TYPES[eff.type];
    if (!t) { problems.push(`unknown type "${eff.type}" (use ${Object.keys(SYSTEMATIC_TYPES).join(', ')})`); continue; }
    if (typeof eff.cause !== 'string' || !eff.cause.trim()) problems.push(`${eff.type}: state the physical cause`);
    if (typeof eff.justification !== 'string' || !eff.justification.trim()) problems.push(`${eff.type}: justify why this effect and its size are realistic`);
    for (const k of t.params) if (eff[k] === undefined) problems.push(`${eff.type}: needs ${k}`);
    if (eff.type === 'heat-loss') {
      for (const row of rows) {
        let x;
        try { x = eff.k * driverValue(eff, row); } catch (e) { problems.push(e.message); break; }
        if (!(x >= 0 && x < 0.5)) { problems.push(`heat-loss: k × driver = ${x.toPrecision(3)} in some row (must be from 0 to 0.5)`); break; }
      }
    }
    if (eff.type === 'calibration' && !(eff.factor > 0.8 && eff.factor < 1.25)) problems.push('calibration: a factor outside 0.8–1.25 is not a plausible calibration error');
  }
  return problems;
}
