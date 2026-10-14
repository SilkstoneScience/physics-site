// Independent check of every Paper 2 answer (docs/PAPER2_SPECIFICATION.md section 6).
// Each question's results are worked out again here, from first principles, WITHOUT using the question's own
// calc(), tools/p2/constants.mjs or tools/p2/generate.mjs (tools/p2/test.mjs checks this file imports nothing).
// Write each entry from the physics, not by copying the question's calculation.
//
// An entry receives the given values exactly as the question states them ({ value, unit }) and returns every
// result in the question's display unit (the unit the result is shown in). The build fails if any result
// differs from the question's by more than 0.01 %.
// Data-booklet values used here are typed from the booklet itself, independently of constants.mjs.

export const INDEPENDENT = {
};
