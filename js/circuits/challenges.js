// Circuit builder: Challenge Mode (plan: docs/CIRCUIT_BUILDER_PLAN.md, section 7). Challenges are in
// experimental/circuits/challenges.json. Three types:
//   target   build a circuit that meets the checks (marked by js/circuits/marking.js: readings and connections)
//   measure  find a hidden value by measuring; the typed answers are marked by js/numeric.js
//   predict  a given circuit with its switch open: type predictions, then close the switch and compare
// A challenge is ticked as done in this browser (saved against its permanent id) when its checks pass, its answers
// are right, or (predict) the predictions have been compared. Hints appear one at a time; no scores or timer.
(function (root) {
  'use strict';
  const { model: M, marking: K } = root.Circuits;
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const TYPE = { target: 'Build it', measure: 'Measure it', predict: 'Predict it' };
  const fmt = (v, unit) => (Number.isFinite(v) ? `${Number(v.toPrecision(3))} ${unit}` : '∞');

  // opts: { panel, data, storage: { get, set }, createEditor(editorOpts), onChange() }
  function mount(opts) {
    const { panel, data, storage } = opts;
    let editor = null;
    const done = () => new Set(storage.get('done') || []);
    const markDone = (id) => { const s = done(); s.add(id); storage.set('done', [...s]); };

    function list() {
      if (editor) { editor.destroy(); editor = null; }
      const d = done();
      panel.innerHTML = `
        <h2 class="ck-ch-title">Challenges</h2>
        <p>Build a circuit to a target, find a hidden value by measuring, or predict meter readings before you switch on. Hints are there if you need them.</p>
        <ul class="ck-ch-list">${data.map((c) => `
          <li><button type="button" class="ck-ch-card${d.has(c.id) ? ' ck-done' : ''}" data-open="${esc(c.id)}">
            <span class="tag">${esc(TYPE[c.type])}</span>${d.has(c.id) ? '<span class="ck-tick" aria-label="done">✓</span>' : ''}
            <strong>${esc(c.title)}</strong>
            <span class="ck-small">${esc(c.summary || '')}</span>
          </button></li>`).join('')}</ul>`;
      panel.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => open(b.dataset.open)));
      if (opts.onChange) opts.onChange(null);
    }

    function open(id) {
      const ch = data.find((c) => c.id === id);
      if (!ch) { list(); return; }
      if (editor) editor.destroy();
      let hints = 0;
      panel.innerHTML = `
        <p class="ck-ch-back"><button type="button" class="ck-btn" data-back>← All challenges</button></p>
        <h2 class="ck-ch-title"><span class="tag">${esc(TYPE[ch.type])}</span> ${esc(ch.title)}${done().has(ch.id) ? ' <span class="ck-tick" aria-label="done">✓</span>' : ''}</h2>
        <div class="ck-ch-brief">${ch.brief}</div>
        ${ch.type === 'predict' ? `<div class="ck-ch-form">${ch.predict.map((p, i) => `<label class="ck-field"><span class="ck-flabel">${esc(p.label)}</span><span class="ck-fin"><input type="text" inputmode="decimal" autocomplete="off" data-pred="${i}"><span class="ck-unit">${esc(p.unit)}</span></span></label>`).join('')}</div>` : ''}
        ${ch.type === 'measure' ? `<div class="ck-ch-form">${ch.answers.map((a, i) => `<label class="ck-field"><span class="ck-flabel">${esc(a.label)}</span><span class="ck-fin"><input type="text" inputmode="decimal" autocomplete="off" data-ans="${i}"><span class="ck-unit">${esc(a.unit)}</span></span></label>`).join('')}</div>` : ''}
        <div class="ck-buttons">
          ${ch.type === 'target' ? '<button type="button" class="ck-btn ck-primary" data-check>Check my circuit</button>' : ''}
          ${ch.type === 'measure' ? '<button type="button" class="ck-btn ck-primary" data-check>Check my answers</button>' : ''}
          ${ch.type === 'predict' ? '<button type="button" class="ck-btn ck-primary" data-check>Close the switch and compare</button>' : ''}
          ${(ch.hints || []).length ? `<button type="button" class="ck-btn" data-hint>Show a hint (1 of ${ch.hints.length})</button>` : ''}
        </div>
        <div class="ck-ch-hints"></div>
        <div class="ck-ch-result" aria-live="polite"></div>`;
      const result = panel.querySelector('.ck-ch-result');
      panel.querySelector('[data-back]').addEventListener('click', list);
      const hintBtn = panel.querySelector('[data-hint]');
      if (hintBtn) hintBtn.addEventListener('click', () => {
        if (hints >= ch.hints.length) return;
        panel.querySelector('.ck-ch-hints').insertAdjacentHTML('beforeend', `<p class="ck-ch-hint"><strong>Hint ${hints + 1}:</strong> ${ch.hints[hints]}</p>`);
        hints++;
        if (hints >= ch.hints.length) hintBtn.disabled = true;
        else hintBtn.textContent = `Show a hint (${hints + 1} of ${ch.hints.length})`;
      });
      const success = (html) => {
        markDone(ch.id);
        result.innerHTML = `${html}${ch.explanation ? `<div class="ck-ch-expl"><h3>Why</h3>${ch.explanation}</div>` : ''}`;
        typeset(result);
      };
      panel.querySelector('[data-check]').addEventListener('click', () => {
        if (ch.type === 'target') {
          const m = K.markDrawing(ch, editor.store.drawing);
          const rows = m.results.map((r) => `<li class="${r.pass ? 'ck-pass' : 'ck-fail'}">${r.pass ? '✓' : '✗'} ${esc(r.text)}${r.now !== undefined && r.now !== null && !r.pass ? ` <span class="ck-small">(now ${esc(fmt(r.now, r.unit || ''))})</span>` : ''}</li>`).join('');
          const list2 = `<ul class="ck-ch-checks">${rows}</ul>`;
          if (m.all) success(`<p class="ck-ch-ok">Well done: your circuit does everything the challenge asks.</p>${list2}`);
          else result.innerHTML = `<p>Not yet: look at the points marked ✗, change your circuit and check again.</p>${list2}`;
        } else if (ch.type === 'measure') {
          const inputs = [...panel.querySelectorAll('[data-ans]')];
          const marks = ch.answers.map((a, i) => root.Numeric.checkNumeric({ answer: a.answer, range: a.range, anySign: !!a.anySign }, inputs[i].value));
          if (marks.some((x) => x.status === 'unreadable')) { result.innerHTML = '<p class="ck-fail">Type a number in each box first.</p>'; return; }
          const rows = ch.answers.map((a, i) => `<li class="${marks[i].status === 'right' ? 'ck-pass' : 'ck-fail'}">${marks[i].status === 'right' ? '✓' : '✗'} ${esc(a.label)}</li>`).join('');
          if (marks.every((x) => x.status === 'right')) success(`<p class="ck-ch-ok">Well done: both values are within the range expected from careful measurements.</p><ul class="ck-ch-checks">${rows}</ul><p class="ck-small">${ch.answers.map((a) => `${esc(a.label)}: ${esc(fmt(a.answer, a.unit))}`).join('; ')}.</p>`);
          else result.innerHTML = `<p>Not yet. Check your readings and your method, then try again.</p><ul class="ck-ch-checks">${rows}</ul>`;
        } else {
          const inputs = [...panel.querySelectorAll('[data-pred]')];
          if (inputs.some((x) => !root.Numeric.parseNumber(x.value))) { result.innerHTML = '<p class="ck-fail">Type a prediction in each box first.</p>'; return; }
          inputs.forEach((x) => { x.readOnly = true; });
          editor.store.change('switch', (d) => M.ops.setParam(d, ch.switch, 'closed', true));
          const values = K.predictedValues(ch, editor.store.drawing);
          const rows = ch.predict.map((p, i) => {
            const right = root.Numeric.checkNumeric({ answer: values[i], tolerance: p.tolerance ?? 0.02 }, inputs[i].value).status === 'right';
            return `<li class="${right ? 'ck-pass' : 'ck-fail'}">${right ? '✓' : '✗'} ${esc(p.label)}: you predicted ${esc(inputs[i].value.trim())} ${esc(p.unit)}; it is ${esc(fmt(values[i], p.unit))}</li>`;
          });
          const n = rows.filter((r) => r.includes('ck-pass')).length;
          panel.querySelector('[data-check]').disabled = true;
          success(`<p class="ck-ch-ok">${n} of ${rows.length} predictions right.</p><ul class="ck-ch-checks">${rows.join('')}</ul>`);
        }
      });
      editor = opts.createEditor({
        drawing: ch.start,
        resetTo: ch.type === 'predict' ? null : ch.start,
        locked: ch.locked || [],
        hidden: ch.hidden || [],
        toolbox: ch.toolbox || {},
        readOnly: ch.type === 'predict',
        noWorking: ch.type !== 'target',
      });
      typeset(panel);
      if (opts.onChange) opts.onChange(ch.id);
    }
    function typeset(el) { if (root.MathJax && root.MathJax.typesetPromise) root.MathJax.typesetPromise([el]).catch(() => {}); }

    return { list, open, get editor() { return editor; }, destroy() { if (editor) editor.destroy(); editor = null; panel.innerHTML = ''; } };
  }

  (root.Circuits = root.Circuits || {}).challenges = { mount };
})(window);
