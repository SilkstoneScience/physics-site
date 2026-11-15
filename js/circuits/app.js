// Circuit builder: starts the page (plan: docs/CIRCUIT_BUILDER_PLAN.md). Stage 3: Free Build with an example circuit.
// Saving, share links, board mode and "show the working" come in stage 4; Challenge Mode in stage 5.
// window.CircuitApp is the editor, for tools/circuits/ui-test.html (which drives the real interface).
(function () {
  'use strict';
  const host = document.getElementById('circuit-builder');
  if (!host || !window.Circuits || !window.Circuits.editor) return;

  // A cell, a switch, an ammeter and a lamp in series, with a voltmeter across the lamp.
  const EXAMPLE = {
    v: 1,
    components: [
      { id: 'b1', type: 'battery', label: 'B1', x: -4, y: -4, rot: 0, params: { emf: 6, r: 0 } },
      { id: 's1', type: 'switch', label: 'S1', x: 4, y: -4, rot: 0, params: { closed: true } },
      { id: 'a1', type: 'ammeter', label: 'A1', x: 10, y: 0, rot: 90, params: { ideal: true, range: '2A' } },
      { id: 'l1', type: 'lamp', label: 'L1', x: 4, y: 4, rot: 0, params: { model: 'ohmic', R: 12, Prated: 3 } },
      { id: 'v1', type: 'voltmeter', label: 'V1', x: 4, y: 8, rot: 180, params: { ideal: true, range: '20V' } },
    ],
    junctions: [],
    wires: [
      { id: 'w1', from: { c: 'b1', t: 1 }, to: { c: 's1', t: 0 }, via: [] },
      { id: 'w2', from: { c: 's1', t: 1 }, to: { c: 'a1', t: 0 }, via: [] },
      { id: 'w3', from: { c: 'a1', t: 1 }, to: { c: 'l1', t: 1 }, via: [] },
      { id: 'w4', from: { c: 'l1', t: 0 }, to: { c: 'b1', t: 0 }, via: [] },
      { id: 'w5', from: { c: 'v1', t: 0 }, to: { c: 'l1', t: 1 }, via: [] },
      { id: 'w6', from: { c: 'v1', t: 1 }, to: { c: 'l1', t: 0 }, via: [] },
    ],
  };

  window.CircuitApp = window.Circuits.editor.create(host, { drawing: EXAMPLE });
})();
