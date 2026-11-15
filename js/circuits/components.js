// Circuit builder: the component catalogue (plan: docs/CIRCUIT_BUILDER_PLAN.md).
// Each component type's terminals (in grid squares, before rotation), its settings with their units,
// defaults and limits, and the multimeter ranges with the display rules (resolution and OL).
// No electrical calculation happens here: that is js/circuits/engine.js.
// Works in the browser (window.Circuits.components) and in Node (require), so tools/circuits/test.mjs
// tests the same code the page runs.
(function (root) {
  'use strict';

  const TWO = [[-2, 0], [2, 0]];

  // Settings: { default, min, max, unit, label } for numbers; { default, options } for choices; { default } for true/false.
  const TYPES = {
    cell: {
      name: 'Cell', prefix: 'C', terminals: TWO, terminalNames: ['−', '+'],
      params: {
        emf: { default: 1.5, min: 0, max: 100, unit: 'V', label: 'emf' },
        r: { default: 0, min: 0, max: 1000, unit: 'Ω', label: 'internal resistance' },
      },
    },
    battery: {
      name: 'Battery', prefix: 'B', terminals: TWO, terminalNames: ['−', '+'],
      params: {
        emf: { default: 6, min: 0, max: 100, unit: 'V', label: 'emf' },
        r: { default: 0, min: 0, max: 1000, unit: 'Ω', label: 'internal resistance' },
      },
    },
    resistor: {
      name: 'Resistor', prefix: 'R', terminals: TWO, terminalNames: ['1', '2'],
      params: { R: { default: 10, min: 0, max: 1e7, unit: 'Ω', label: 'resistance' } },
    },
    variable: {
      name: 'Variable resistor', prefix: 'R', terminals: TWO, terminalNames: ['1', '2'],
      params: {
        R: { default: 50, min: 0, max: 1e7, unit: 'Ω', label: 'resistance' },
        min: { default: 0, min: 0, max: 1e7, unit: 'Ω', label: 'lowest resistance' },
        max: { default: 100, min: 0, max: 1e7, unit: 'Ω', label: 'highest resistance' },
      },
    },
    potentiometer: {
      name: 'Potentiometer', prefix: 'P', terminals: [[-2, 0], [2, 0], [0, -2]], terminalNames: ['end A', 'end B', 'slider'],
      params: {
        R: { default: 100, min: 0, max: 1e7, unit: 'Ω', label: 'total resistance' },
        pos: { default: 0.5, min: 0, max: 1, unit: '', label: 'slider position (0 = end A, 1 = end B)' },
      },
    },
    switch: {
      name: 'Switch', prefix: 'S', terminals: TWO, terminalNames: ['1', '2'],
      params: { closed: { default: true } },
    },
    lamp: {
      name: 'Lamp', prefix: 'L', terminals: TWO, terminalNames: ['1', '2'],
      params: {
        model: { default: 'ohmic', options: ['ohmic', 'filament'] },
        R: { default: 12, min: 0.01, max: 1e7, unit: 'Ω', label: 'resistance (ohmic lamp)' },
        Vrated: { default: 6, min: 0.1, max: 250, unit: 'V', label: 'rated p.d.' },
        Prated: { default: 3, min: 0.01, max: 1000, unit: 'W', label: 'rated power' },
      },
    },
    thermistor: {
      name: 'Thermistor', prefix: 'T', terminals: TWO, terminalNames: ['1', '2'],
      params: {
        temp: { default: 25, min: 0, max: 100, unit: '°C', label: 'temperature' },
        R25: { default: 10000, min: 1, max: 1e7, unit: 'Ω', label: 'resistance at 25 °C' },
        B: { default: 3950, min: 1000, max: 10000, unit: 'K', label: 'B value' },
      },
    },
    ldr: {
      name: 'Light-dependent resistor', prefix: 'D', terminals: TWO, terminalNames: ['1', '2'],
      params: { lux: { default: 300, min: 0, max: 10000, unit: 'lx', label: 'light level' } },
    },
    ammeter: {
      name: 'Ammeter', prefix: 'A', terminals: TWO, terminalNames: ['+', '−'],
      params: {
        ideal: { default: true },
        r: { default: 0.1, min: 0.001, max: 1e4, unit: 'Ω', label: 'resistance (real meter)' },
        range: { default: '2A', options: ['200mA', '2A', '10A'] },
      },
    },
    voltmeter: {
      name: 'Voltmeter', prefix: 'V', terminals: TWO, terminalNames: ['+', '−'],
      params: {
        ideal: { default: true },
        R: { default: 1e7, min: 1, max: 1e9, unit: 'Ω', label: 'resistance (real meter)' },
        range: { default: '20V', options: ['200mV', '2V', '20V', '200V'] },
      },
    },
  };

  // Multimeter ranges. A typical meter shows at most 1999 counts; the 10 A range is limited to 10 A by its fuse.
  // max: the largest value shown (above it: OL); res: resolution in SI units; scale and unit: how it is shown.
  const RANGES = {
    ammeter: {
      '200mA': { max: 0.1999, res: 1e-4, scale: 1000, unit: 'mA', decimals: 1 },
      '2A': { max: 1.999, res: 1e-3, scale: 1, unit: 'A', decimals: 3 },
      '10A': { max: 10, res: 1e-2, scale: 1, unit: 'A', decimals: 2 },
    },
    voltmeter: {
      '200mV': { max: 0.1999, res: 1e-4, scale: 1000, unit: 'mV', decimals: 1 },
      '2V': { max: 1.999, res: 1e-3, scale: 1, unit: 'V', decimals: 3 },
      '20V': { max: 19.99, res: 1e-2, scale: 1, unit: 'V', decimals: 2 },
      '200V': { max: 199.9, res: 1e-1, scale: 1, unit: 'V', decimals: 1 },
    },
  };

  // A complete, safe set of settings: defaults filled in, numbers kept within their limits, unknown choices replaced.
  function normalise(type, params) {
    const def = TYPES[type];
    if (!def) throw new Error(`Unknown component type "${type}"`);
    const given = params || {};
    const out = {};
    for (const [key, spec] of Object.entries(def.params)) {
      const v = given[key];
      if (spec.options) out[key] = spec.options.includes(v) ? v : spec.default;
      else if (typeof spec.default === 'boolean') out[key] = typeof v === 'boolean' ? v : spec.default;
      else out[key] = typeof v === 'number' && Number.isFinite(v) ? Math.min(spec.max, Math.max(spec.min, v)) : spec.default;
    }
    if (type === 'variable') { // keep min ≤ R ≤ max
      if (out.min > out.max) [out.min, out.max] = [out.max, out.min];
      out.R = Math.min(out.max, Math.max(out.min, out.R));
    }
    return out;
  }

  // What a digital meter shows for a value in SI units: { text, unit, ol, shown } (shown = the rounded value, in SI units).
  function meterDisplay(kind, range, value) {
    const r = RANGES[kind] && RANGES[kind][range];
    if (!r) throw new Error(`Unknown ${kind} range "${range}"`);
    if (!Number.isFinite(value)) return { text: 'OL', unit: r.unit, ol: true, shown: null };
    const count = Math.round(value / r.res);
    const shown = count * r.res;
    if (Math.abs(shown) > r.max * (1 + 1e-12)) return { text: 'OL', unit: r.unit, ol: true, shown: null };
    const text = count === 0 ? (0).toFixed(r.decimals) : (count * r.res * r.scale).toFixed(r.decimals);
    return { text, unit: r.unit, ol: false, shown: count === 0 ? 0 : shown };
  }

  // A terminal's position on the grid, for a component at (x, y) turned clockwise by rot (0, 90, 180 or 270 degrees).
  function terminalPosition(comp, t) {
    const def = TYPES[comp.type];
    let [x, y] = def.terminals[t];
    const turns = (((comp.rot || 0) / 90) % 4 + 4) % 4;
    for (let i = 0; i < turns; i++) [x, y] = [-y, x]; // a quarter turn clockwise (screen y points down)
    return [comp.x + x + 0, comp.y + y + 0];
  }

  const api = { TYPES, RANGES, normalise, meterDisplay, terminalPosition };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.Circuits = root.Circuits || {}).components = api;
})(typeof window !== 'undefined' ? window : globalThis);
