// Propagation of uncertainties for derived (calculated) columns, using the IB convention taught in
// DP Physics (Tool 3): uncertainties are combined as WORST-CASE LINEAR SUMS, not added in quadrature.
//   sum / difference      y = Σ cᵢxᵢ            Δy = Σ |cᵢ| Δxᵢ          (absolute uncertainties add)
//   product / quotient    y = k Π xᵢ^nᵢ          Δy/|y| = Σ |nᵢ| Δxᵢ/|xᵢ|  (fractional uncertainties add;
//                                                                        a power multiplies by |n|)
// Both are first-order (small-uncertainty) approximations, which is what the IB expects.
//
// A derived column declares its propagation instead of writing a formula for the uncertainty:
//   propagation: { form: 'product', terms: [{ of: 'R', n: 2 }] }                      // y = R²
//   propagation: { form: 'product', terms: [{ of: 'L', n: -1 }] }                     // y = 1/L
//   propagation: { form: 'sum', terms: [{ of: 'N', coef: (p) => 1 / p.dt, unc: 'poisson' }],
//                  neglect: [{ single: 'Nb', reason: '…' }] }                          // y = (N − b)/Δt
// A term names a column (of) or a single reading (single). Its uncertainty is that column's own
// uncertainty unless the term gives one: a number, or 'poisson' (√N for a count).
// Anything the formula depends on but the propagation leaves out must be listed in neglect, with a
// reason; the validator checks that it really is small (see validate.mjs).

export function sumUncertainty(terms) {
  return terms.reduce((s, t) => s + Math.abs(t.coef) * t.unc, 0);
}
export function productUncertainty(y, terms) {
  return Math.abs(y) * terms.reduce((s, t) => s + (Math.abs(t.n) * t.unc) / Math.abs(t.value), 0);
}

// Works out a derived value's uncertainty from its declaration, for one row.
// input(term) must return { value, unc } for the column or single reading the term names.
export function propagate(spec, y, input, p) {
  const terms = spec.terms.map((t) => ({ ...input(t), coef: typeof t.coef === 'function' ? t.coef(p) : t.coef, n: t.n }));
  if (spec.form === 'sum') return sumUncertainty(terms);
  if (spec.form === 'product') return productUncertainty(y, terms);
  throw new Error(`unknown propagation form "${spec.form}" (use "sum" or "product")`);
}
