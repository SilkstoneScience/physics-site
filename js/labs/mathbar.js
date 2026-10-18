// Maths toolbar for answer boxes: <div class="answer"> … <textarea> … </div>.
// One toolbar appears above whichever answer box has focus. Its buttons insert symbols (², ⁻¹, ×, √, Δ, ω …),
// and typing shortcuts turn ^2 into ², ^-1 into ⁻¹ and _net into ₙₑₜ. The answers stay plain text, so they look
// the same on the page and in the Word report.
(() => {
  const boxes = [...document.querySelectorAll('.answer textarea')];
  if (!boxes.length) return;

  const KEYS = [
    ['²', 'squared', 'x²'], ['³', 'cubed', 'x³'], ['⁻¹', 'to the power minus one', 'x⁻¹'], ['⁻²', 'to the power minus two', 'x⁻²'],
    ['√', 'square root'], ['×', 'times'], ['÷', 'divided by'], ['±', 'plus or minus'],
    ['≈', 'approximately equal to'], ['∝', 'proportional to'], ['≠', 'not equal to'], ['→', 'arrow'],
    ['°', 'degrees'], ['Δ', 'delta'], ['θ', 'theta'], ['ω', 'omega'], ['π', 'pi'], ['λ', 'lambda'], ['μ', 'mu'], ['ρ', 'rho'],
    ['ₙₑₜ', 'subscript net', 'Fₙₑₜ'],
  ];
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  const SUB = { a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ', s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ', '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };

  const bar = document.createElement('div');
  bar.className = 'mathbar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Maths symbols');
  bar.innerHTML = KEYS.map(([s, name, label]) => `<button type="button" data-ins="${s}" aria-label="${name}" title="${name}">${label || s}</button>`).join('')
    + '<p class="vlab-small">Shortcuts: type <code>^2</code> for ², <code>^-1</code> for ⁻¹, <code>_net</code> for ₙₑₜ, <code>sqrt</code> for √. Write fractions as <i>a</i> / <i>b</i>, for example F = m v² / r.</p>';
  let current = null;

  function insert(box, text) {
    const s = box.selectionStart, e = box.selectionEnd;
    box.value = box.value.slice(0, s) + text + box.value.slice(e);
    box.selectionStart = box.selectionEnd = s + text.length;
    box.dispatchEvent(new Event('input', { bubbles: true }));   // so the answer is saved
  }

  // Shortcuts, applied to the text before the cursor once a power or subscript is finished
  function shortcuts(box, final) {
    const pos = box.selectionStart, before = box.value.slice(0, pos), after = box.value.slice(pos);
    const end = final ? '(?=\\s|$|[^\\w-])' : '(?=[^\\w-])';
    let b = before
      .replace(new RegExp('\\^(-?\\d+)' + end, 'g'), (m, n) => n.split('').map(c => SUP[c]).join(''))
      .replace(new RegExp('_([a-z0-9]+)' + end, 'g'), (m, w) => w.split('').every(c => SUB[c]) ? w.split('').map(c => SUB[c]).join('') : m)
      .replace(/\bsqrt/g, '√');
    if (final) b = b.replace(/\^(-?\d+)$/, (m, n) => n.split('').map(c => SUP[c]).join(''))
      .replace(/_([a-z0-9]+)$/, (m, w) => w.split('').every(c => SUB[c]) ? w.split('').map(c => SUB[c]).join('') : m);
    if (b !== before) {
      box.value = b + after;
      box.selectionStart = box.selectionEnd = b.length;
      box.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  boxes.forEach(box => {
    box.addEventListener('focus', () => { current = box; box.before(bar); });
    box.addEventListener('input', (e) => { if (!e.isTrusted) return; shortcuts(box, false); });
    box.addEventListener('blur', () => shortcuts(box, true));
  });
  // mousedown, not click: the answer box keeps its focus and cursor position
  bar.addEventListener('mousedown', (e) => {
    const b = e.target.closest('[data-ins]');
    if (!b || !current) return;
    e.preventDefault();
    insert(current, b.dataset.ins);
  });
  // keyboard users: Enter or Space on a button, then back to the answer box
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ins]');
    if (!b || !current || e.detail) return;   // e.detail > 0 means a mouse click, already handled
    insert(current, b.dataset.ins);
    current.focus();
  });
})();
