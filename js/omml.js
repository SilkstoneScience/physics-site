// Turns equations into PowerPoint's own editable equations (OMML, Office Math Markup Language).
// Used by the lesson slide generator (teachers/slides.html, js/slides.js). Plan: docs/SLIDES_PLAN.md.
//
// The route is LaTeX (as written on the site) -> MathML (made by MathJax in the browser) -> OMML (this file).
// Omml.fromMathML(mathElement, { size, display }) returns the OMML text, plus a list of anything it couldn't convert.
// Omml.unsupported(latex) lists LaTeX commands outside the set this converter has been written and tested for;
// tools/check-slides.mjs uses it, so a slide file can't use a command that would come out wrong.
(() => {
  // ---------- The LaTeX commands the converter handles (everything the topic pages use, and a few more) ----------
  const GREEK = 'alpha beta gamma delta epsilon varepsilon zeta eta theta vartheta iota kappa lambda mu nu xi pi rho sigma tau upsilon phi varphi chi psi omega Gamma Delta Theta Lambda Xi Pi Sigma Phi Psi Omega'.split(' ');
  const COMMANDS = new Set([
    ...GREEK,
    // text and fonts
    'text', 'mathrm', 'textrm', 'mathit', 'mathbf', 'boldsymbol', 'operatorname',
    // fractions, roots, sums and integrals
    'frac', 'dfrac', 'tfrac', 'sqrt', 'sum', 'int', 'oint',
    // operators and relations
    'times', 'div', 'cdot', 'pm', 'mp', 'approx', 'propto', 'sim', 'simeq', 'equiv', 'neq', 'ne', 'leq', 'le', 'geq', 'ge', 'll', 'gg',
    'lt', 'gt', 'odot', 'otimes', 'parallel', 'perp', 'angle', 'circ', 'degree', 'infty', 'partial', 'nabla', 'hbar', 'ell', 'prime', 'therefore',
    // functions
    'sin', 'cos', 'tan', 'arcsin', 'arccos', 'arctan', 'ln', 'log', 'exp', 'max', 'min',
    // arrows
    'rightarrow', 'to', 'leftarrow', 'Rightarrow', 'Leftarrow', 'leftrightarrow', 'Leftrightarrow', 'uparrow', 'downarrow', 'rightleftharpoons',
    // brackets, accents
    'left', 'right', 'big', 'Big', 'bigg', 'Bigg', 'overline', 'bar', 'vec', 'hat', 'dot', 'ddot', 'tilde', '{', '}', '|', '%', '$',
    // spacing and dots
    ',', ';', ':', '!', ' ', 'quad', 'qquad', 'ldots', 'dots', 'cdots',
  ]);
  function unsupported(latex) {
    const out = new Set();
    for (const m of String(latex).matchAll(/\\([A-Za-z]+|.)/g)) if (!COMMANDS.has(m[1])) out.add('\\' + m[1]);
    for (const env of String(latex).matchAll(/\\begin\{([^}]*)\}/g)) out.add(`\\begin{${env[1]}}`);
    return [...out];
  }

  // ---------- MathML -> OMML ----------
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const FUNCS = new Set(['sin', 'cos', 'tan', 'arcsin', 'arccos', 'arctan', 'ln', 'log', 'exp', 'max', 'min', 'lim']);
  const NARY = new Set(['∑', '∫', '∮', '∏']);
  // accents (\vec, \hat, \dot …): the MathML character -> the combining character OMML expects
  const ACCENTS = { '→': '⃗', '⃗': '⃗', '^': '̂', 'ˆ': '̂', '˙': '̇', '.': '̇', '¨': '̈', '~': '̃', '˜': '̃', '¯': '̅', '‾': '̅', '―': '̅', '_': '̅' };
  const SPACES = [[0.12, ''], [0.2, ' '], [0.25, ' '], [0.5, ' '], [1.5, ' '], [Infinity, '  ']];

  function fromMathML(math, { size = 2400, display = false, color } = {}) {
    const problems = [];
    const fill = color ? `<a:solidFill><a:srgbClr val="${color}"/></a:solidFill>` : '';
    const run = (text, style) => {
      // style: 'i' italic variable, 'p' plain (upright), 'b' bold upright, 'bi' bold italic, 'nor' ordinary text (keeps spaces)
      if (text === '') return '';
      const mr = style === 'nor' ? '<m:rPr><m:nor/></m:rPr>' : style === 'i' ? '' : `<m:rPr><m:sty m:val="${style}"/></m:rPr>`;
      const ital = style === 'i' || style === 'bi' ? ' i="1"' : ' i="0"';
      const bold = style === 'b' || style === 'bi' ? ' b="1"' : ' b="0"';
      return `<m:r>${mr}<a:rPr lang="en-GB" sz="${size}"${ital}${bold}>${fill}<a:latin typeface="Cambria Math" panose="02040503050406030204" pitchFamily="18" charset="0"/></a:rPr><m:t xml:space="preserve">${esc(text)}</m:t></m:r>`;
    };
    const ctrl = `<m:ctrlPr><a:rPr lang="en-GB" sz="${size}" i="1">${fill}<a:latin typeface="Cambria Math" panose="02040503050406030204" pitchFamily="18" charset="0"/></a:rPr></m:ctrlPr>`;
    const kids = (el) => [...el.children];
    const tag = (el) => (el.localName || el.nodeName).replace(/^.*:/, '');
    const text = (el) => (el.textContent || '').replace(/⁡|⁢|⁣/g, '');
    const arg = (el) => (el ? conv(el) : '');
    const seq = (list) => {
      let out = '';
      for (let i = 0; i < list.length; i++) {
        const el = list[i], t = tag(el), next = list[i + 1];
        // \sin x: the function name, an invisible "function application" sign, then its argument
        if (t === 'mi' && FUNCS.has(text(el)) && next && tag(next) === 'mo' && next.textContent === '⁡') {
          const argEl = list[i + 2];
          out += `<m:func><m:funcPr>${ctrl}</m:funcPr><m:fName>${run(text(el), 'p')}</m:fName><m:e>${argEl ? conv(argEl) : ''}</m:e></m:func>`;
          i += argEl ? 2 : 1;
          continue;
        }
        // big operators: \sum, \int (with or without limits); the next item is what they act on
        const base = ['munderover', 'msubsup', 'munder', 'msub', 'mover', 'msup'].includes(t) ? el.children[0] : (t === 'mo' ? el : null);
        if (base && tag(base) === 'mo' && NARY.has(base.textContent.trim())) {
          const c = kids(el), chr = base.textContent.trim();
          let sub = '', sup = '';
          if (t === 'munderover' || t === 'msubsup') { sub = arg(c[1]); sup = arg(c[2]); }
          else if (t === 'munder' || t === 'msub') sub = arg(c[1]);
          else if (t === 'mover' || t === 'msup') sup = arg(c[1]);
          const loc = chr === '∑' || chr === '∏' ? 'undOvr' : 'subSup';
          const e = next ? conv(next) : '';
          if (next) i++;
          out += `<m:nary><m:naryPr><m:chr m:val="${chr}"/><m:limLoc m:val="${loc}"/>${sub ? '' : '<m:subHide m:val="1"/>'}${sup ? '' : '<m:supHide m:val="1"/>'}${ctrl}</m:naryPr>`
            + `<m:sub>${sub}</m:sub><m:sup>${sup}</m:sup><m:e>${e}</m:e></m:nary>`;
          continue;
        }
        out += conv(el);
      }
      return out;
    };
    function style(el, fallback) {
      const v = el.getAttribute('mathvariant');
      if (v === 'normal') return 'p';
      if (v === 'bold') return 'b';
      if (v === 'bold-italic') return 'bi';
      if (v === 'italic') return 'i';
      return fallback;
    }
    function conv(el) {
      const t = tag(el), c = kids(el);
      switch (t) {
        case 'math': case 'mrow': case 'mstyle': case 'mpadded': case 'semantics': case 'inferred': {
          if (t === 'semantics') return c[0] ? conv(c[0]) : '';
          // \left( … \right): a stretchy bracket pair
          const first = c[0], last = c[c.length - 1];
          if (t === 'mrow' && c.length >= 2 && tag(first) === 'mo' && tag(last) === 'mo'
            && first.getAttribute('data-mjx-texclass') === 'OPEN' && last.getAttribute('data-mjx-texclass') === 'CLOSE') {
            const beg = first.textContent, end = last.textContent;
            return `<m:d><m:dPr><m:begChr m:val="${esc(beg)}"/><m:endChr m:val="${esc(end)}"/>${ctrl}</m:dPr><m:e>${seq(c.slice(1, -1))}</m:e></m:d>`;
          }
          return seq(c);
        }
        case 'mi': {
          const s = text(el);
          return run(s, style(el, [...s].length === 1 ? 'i' : 'p'));
        }
        case 'mn': return run(text(el), style(el, 'p'));
        case 'mo': {
          const s = text(el);
          // PowerPoint doesn't space × and ÷ between numbers by itself, so add medium maths spaces
          if (s === '×' || s === '÷') return run(` ${s} `, 'p');
          return s ? run(s, style(el, 'p')) : '';
        }
        case 'mtext': return run(el.textContent.replace(/ /g, ' '), 'nor');
        case 'ms': return run(el.textContent, 'nor');
        case 'mspace': {
          const w = parseFloat(el.getAttribute('width') || '0');
          const em = /ex$/.test(el.getAttribute('width') || '') ? w / 2 : w;
          return run(SPACES.find(([lim]) => em <= lim)[1], 'p');
        }
        case 'mphantom': return '';
        case 'mfrac': {
          const bar = el.getAttribute('linethickness') === '0' ? '<m:type m:val="noBar"/>' : '';
          return `<m:f><m:fPr>${bar}${ctrl}</m:fPr><m:num>${arg(c[0])}</m:num><m:den>${arg(c[1])}</m:den></m:f>`;
        }
        case 'msqrt':
          return `<m:rad><m:radPr><m:degHide m:val="1"/>${ctrl}</m:radPr><m:deg/><m:e>${seq(c)}</m:e></m:rad>`;
        case 'mroot':
          return `<m:rad><m:radPr>${ctrl}</m:radPr><m:deg>${arg(c[1])}</m:deg><m:e>${arg(c[0])}</m:e></m:rad>`;
        case 'msup':
          return `<m:sSup><m:sSupPr>${ctrl}</m:sSupPr><m:e>${arg(c[0])}</m:e><m:sup>${arg(c[1])}</m:sup></m:sSup>`;
        case 'msub':
          return `<m:sSub><m:sSubPr>${ctrl}</m:sSubPr><m:e>${arg(c[0])}</m:e><m:sub>${arg(c[1])}</m:sub></m:sSub>`;
        case 'msubsup':
          return `<m:sSubSup><m:sSubSupPr>${ctrl}</m:sSubSupPr><m:e>${arg(c[0])}</m:e><m:sub>${arg(c[1])}</m:sub><m:sup>${arg(c[2])}</m:sup></m:sSubSup>`;
        case 'mover': {
          const mark = c[1] && tag(c[1]) === 'mo' ? c[1].textContent.trim() : null;
          if (mark && /^[¯‾―_]$/.test(mark) && (c[1].getAttribute('stretchy') !== 'false' || [...text(c[0])].length > 1)) {
            return `<m:bar><m:barPr><m:pos m:val="top"/>${ctrl}</m:barPr><m:e>${arg(c[0])}</m:e></m:bar>`; // \overline
          }
          if (mark && ACCENTS[mark]) return `<m:acc><m:accPr><m:chr m:val="${ACCENTS[mark]}"/>${ctrl}</m:accPr><m:e>${arg(c[0])}</m:e></m:acc>`;
          return `<m:limUpp><m:limUppPr>${ctrl}</m:limUppPr><m:e>${arg(c[0])}</m:e><m:lim>${arg(c[1])}</m:lim></m:limUpp>`;
        }
        case 'munder':
          return `<m:limLow><m:limLowPr>${ctrl}</m:limLowPr><m:e>${arg(c[0])}</m:e><m:lim>${arg(c[1])}</m:lim></m:limLow>`;
        case 'munderover':
          return `<m:limUpp><m:limUppPr>${ctrl}</m:limUppPr><m:e><m:limLow><m:limLowPr>${ctrl}</m:limLowPr><m:e>${arg(c[0])}</m:e><m:lim>${arg(c[1])}</m:lim></m:limLow></m:e><m:lim>${arg(c[2])}</m:lim></m:limUpp>`;
        case 'menclose': case 'mtable': case 'mtr': case 'mtd': case 'mmultiscripts': default:
          problems.push(t);
          return run(text(el), 'p');
      }
    }
    const body = conv(math);
    const omml = display
      ? `<m:oMathPara><m:oMathParaPr><m:jc m:val="left"/></m:oMathParaPr><m:oMath>${body}</m:oMath></m:oMathPara>`
      : `<m:oMath>${body}</m:oMath>`;
    return { omml, problems };
  }

  // A plain-text version of an equation (for the fallback copy that Google Slides and older viewers show,
  // when the equation sits inside a line of text).
  function plainText(math) {
    const tag = (el) => (el.localName || el.nodeName).replace(/^.*:/, '');
    const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '−': '⁻', '-': '⁻', '+': '⁺', n: 'ⁿ' };
    const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', x: 'ₓ', y: 'ᵧ' };
    const map = (s, table) => ([...s].every((ch) => table[ch]) ? [...s].map((ch) => table[ch]).join('') : null);
    const group = (s) => ([...s].length > 1 ? `(${s})` : s);
    function go(el) {
      const t = tag(el), c = [...el.children];
      const txt = (el.textContent || '').replace(/⁡|⁢|⁣/g, '');
      switch (t) {
        case 'mfrac': return `${group(go(c[0]))}/${group(go(c[1]))}`;
        case 'msqrt': return `√${group(c.map(go).join(''))}`;
        case 'mroot': return `${go(c[1])}√${group(go(c[0]))}`;
        case 'msup': { const s = go(c[1]); return go(c[0]) + (map(s, SUP) ?? `^${group(s)}`); }
        case 'msub': { const s = go(c[1]); return go(c[0]) + (map(s, SUB) ?? `_${group(s)}`); }
        case 'msubsup': { const a = go(c[1]), b = go(c[2]); return go(c[0]) + (map(a, SUB) ?? `_${group(a)}`) + (map(b, SUP) ?? `^${group(b)}`); }
        case 'mover': return go(c[0]) + (/^[→⃗]$/.test(c[1]?.textContent.trim()) ? '⃗' : /^[¯‾―_]$/.test(c[1]?.textContent.trim()) ? '̅' : '');
        case 'munder': case 'munderover': return go(c[0]);
        case 'mspace': return ' ';
        case 'mphantom': return '';
        case 'mo': return /^[=+−<>≈≤≥∝×÷±→]$/.test(txt) ? ` ${txt} ` : txt;
        case 'mi': case 'mn': case 'mtext': return txt.replace(/ /g, ' ');
        default: return c.length ? c.map(go).join('') : txt;
      }
    }
    return go(math).replace(/ {2,}/g, ' ').trim();
  }

  const api = { fromMathML, plainText, unsupported, COMMANDS };
  if (typeof window !== 'undefined') window.Omml = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
