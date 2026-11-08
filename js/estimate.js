// Estimation challenges (estimate.html). Items are in estimate/items.json. A student states their assumptions and
// an estimate; it is judged by how many times bigger or smaller it is than a sensible model answer, and the model's
// reasoning is then shown. Finished items are saved only in this browser, against their ids.
(function () {
  const app = document.getElementById('es-app');
  if (!app) return;
  const live = document.getElementById('es-live');
  const DONE = 'estimate-done';
  let items = [];
  let at = 0;
  let view = fresh();

  function fresh() { return { hint: false, why: '', typed: '', result: null, shown: false }; }
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function announce(t) { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 50); }
  function typeset() {
    const run = () => window.MathJax && MathJax.typesetPromise && MathJax.typesetPromise([app]).catch(console.error);
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) MathJax.startup.promise.then(run);
    else window.addEventListener('load', run, { once: true });
  }
  function readDone() { try { return JSON.parse(localStorage.getItem(DONE)) || {}; } catch (e) { return {}; } }
  function markDone(id) { const d = readDone(); d[id] = true; try { localStorage.setItem(DONE, JSON.stringify(d)); } catch (e) { /* storage blocked: fine */ } }
  const topicTitle = (t) => {
    const x = (window.SYLLABUS || []).flatMap((th) => th.topics).find((y) => y.id === t);
    return x ? x.title : '';
  };

  async function init() {
    try {
      const res = await fetch('estimate/items.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      items = await res.json();
    } catch (e) {
      console.error(e);
      app.innerHTML = '<p class="notice">Sorry, the challenges could not be loaded. (If you opened this page straight from your computer, use the preview server instead.)</p>';
      return;
    }
    app.addEventListener('click', onClick);
    app.addEventListener('input', onInput);
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) { document.body.classList.remove('nr-on-board'); boardLabel(); } });
    render();
  }

  // How far the estimate is from the model answer, in powers of ten.
  function judge(value, answer) {
    const off = Math.abs(Math.log10(value / answer));
    if (off <= Math.log10(3)) return { cls: 'good', text: '<strong>Excellent.</strong> Your estimate is within a factor of 3 of ours.' };
    if (off <= 1) return { cls: 'good', text: '<strong>In the right ballpark.</strong> Your estimate is within a factor of 10 of ours.' };
    const n = Math.round(off);
    return { cls: 'order', text: `<strong>Quite a long way off.</strong> Your estimate differs from ours by about ${n} order${n === 1 ? '' : 's'} of magnitude. Look at which assumption made the difference.` };
  }

  function render() {
    const q = items[at];
    const done = readDone();
    app.innerHTML = `
      <div class="ex-head">
        <span class="ex-count">Challenge ${at + 1} of ${items.length}</span>
        <button type="button" class="button ghost small" data-act="board">${document.body.classList.contains('nr-on-board') ? 'Leave the board view' : 'Show on the board'}</button>
      </div>
      <section class="ex-question">
        <h2 class="ex-h">${q.title}</h2>
        <p class="my-meta"><a class="tag" href="themes/${window.topicFile(q.topic)}#${q.section}">${q.topic} ${topicTitle(q.topic)}</a>
          <span class="tag">${q.level}</span> ${done[q.id] ? '<span class="tag sim-tag">✓ Done</span>' : ''}</p>
        <p class="ex-stem">${q.question}</p>
      </section>
      ${view.hint
    ? `<div class="nr-model"><p><strong>What you need to estimate:</strong></p><ul>${q.think.map((t) => `<li>${t}</li>`).join('')}</ul></div>`
    : '<p><button type="button" class="button ghost small" data-act="hint">What should I estimate?</button></p>'}
      <label class="es-label" for="es-why"><strong>Your assumptions.</strong> Write down each value you're assuming, and why it's reasonable.</label>
      <textarea id="es-why" rows="3">${esc(view.why)}</textarea>
      <label class="es-label" for="es-ans"><strong>Your estimate</strong></label>
      <p class="es-row"><input id="es-ans" type="text" autocomplete="off" inputmode="text" value="${esc(view.typed)}" placeholder="e.g. 3e5">
        <span>${q.unit}</span>
        <button type="button" class="button small" data-act="check">Check my estimate</button></p>
      <p class="my-help">Type powers of ten as 3e5 or 3x10^5.</p>
      <div id="es-fb" aria-live="polite">${view.error ? `<p class="notice">${view.error}</p>` : ''}</div>
      ${view.shown ? reveal(q) : '<p><button type="button" class="button ghost small" data-act="reveal">Show our reasoning without answering</button></p>'}
      <p class="ex-nav">
        <button type="button" class="button ghost small" data-act="prev"${at ? '' : ' disabled'}>← Previous</button>
        <button type="button" class="button ghost small" data-act="next"${at < items.length - 1 ? '' : ' disabled'}>Next →</button>
      </p>`;
    typeset();
  }

  function reveal(q) {
    return `${view.result ? `<p class="ex-row-verdict ${view.result.cls}">${view.result.text}</p>` : ''}
      <div class="nr-model">
        <p><strong>Our reasoning:</strong></p>
        <ol>${q.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
        <p><strong>Why it's interesting:</strong> ${q.note}</p>
      </div>
      <p class="my-help">Yours can be different and still be right: an estimate is only as good as the assumptions behind it. Compare yours with ours, and decide which you trust more.</p>`;
  }

  function onInput(e) {
    if (e.target.id === 'es-why') view.why = e.target.value;
    if (e.target.id === 'es-ans') view.typed = e.target.value;
  }
  function onClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act;
    const q = items[at];
    if (a === 'hint') { view.hint = true; render(); }
    else if (a === 'check') {
      const got = window.Numeric.parseNumber(view.typed);
      if (!got || !(got.value > 0)) {
        view.error = 'Please type your estimate as a positive number, such as 3000, 3e3 or 3x10^3.';
        render();
        document.getElementById('es-ans').focus();
        return;
      }
      view.error = '';
      view.result = judge(got.value, q.answer);
      view.shown = true;
      markDone(q.id);
      announce('Our reasoning is now shown.');
      render();
    } else if (a === 'reveal') { view.shown = true; markDone(q.id); render(); }
    else if (a === 'next' || a === 'prev') { at += a === 'next' ? 1 : -1; view = fresh(); render(); window.scrollTo(0, 0); }
    else if (a === 'board') {
      const on = document.body.classList.toggle('nr-on-board');
      if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
      if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
      boardLabel();
    }
  }
  function boardLabel() {
    const b = app.querySelector('[data-act="board"]');
    if (b) b.textContent = document.body.classList.contains('nr-on-board') ? 'Leave the board view' : 'Show on the board';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
