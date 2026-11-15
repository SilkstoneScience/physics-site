// IA builder: the Word file (plan: docs/IA_BUILDER_PLAN.md, section 5).
// IAExport.build(ctx) turns one IA into blocks for Lab.docx (js/labs/report.js) and returns the file's bytes.
// ctx comes from js/ia/builder.js: { ia, sections, walk, numbering, orderedRefs, formatCell, totalWords, getImage }.
// Not exported: checklists, guidance, hidden explanation boxes and empty sections.
(() => {
  const TWIP_EMU = 635, PX_EMU = 9525;              // Word measures pictures in EMU: 635 per twip, 9525 per screen pixel
  const MARGIN = 1134, WIDE_RIGHT = 3402;           // 2 cm; 6 cm for the teacher's comments

  // ---------- equations: LaTeX -> MathML (the page's MathJax) -> Word equation (js/omml.js) ----------
  function omml(latex, display) {
    try {
      const mml = window.MathJax.tex2mml(latex, { display });
      const math = new DOMParser().parseFromString(mml, 'application/xml').documentElement;
      return window.Omml.fromMathML(math, { display, word: true }).omml;
    } catch (e) {
      return null;
    }
  }

  // ---------- text from the builder's cleaned HTML ----------
  // Inline content -> runs. A display equation inside a paragraph is returned as { display: omml } and splits it.
  function inlineRuns(node, ctx, fmt = {}, out = []) {
    for (const n of node.childNodes) {
      if (n.nodeType === 3) { if (n.nodeValue) out.push(Object.assign({ t: n.nodeValue.replace(/ /g, ' ') }, fmt)); continue; }
      if (n.nodeType !== 1) continue;
      const tag = n.nodeName;
      if (tag === 'BR') { out.push({ br: true }); continue; }
      if (n.hasAttribute('data-cite')) { const k = ctx.nums.cite[n.getAttribute('data-cite')]; if (k) out.push(Object.assign({ t: `[${k}]` }, fmt)); continue; }
      if (n.hasAttribute('data-eq')) {
        const latex = n.getAttribute('data-eq'), display = n.getAttribute('data-display') === '1' && !ctx.flat;
        const m = omml(latex, display);
        if (!m) out.push({ t: latex });
        else out.push(display ? { display: m } : { math: m });
        continue;
      }
      const f = Object.assign({}, fmt);
      if (tag === 'B') f.b = true;
      if (tag === 'I') f.i = true;
      if (tag === 'SUB') f.sub = true;
      if (tag === 'SUP') f.sup = true;
      inlineRuns(n, ctx, f, out);
    }
    return out;
  }
  // Split runs at display equations: [{ runs }, { display }, { runs }…], dropping empty pieces
  function splitDisplay(runs) {
    const parts = [];
    let cur = [];
    const push = () => { while (cur.length && (cur[0].br || (cur[0].t != null && !cur[0].t.trim() && cur.length === 1))) cur.shift(); if (cur.some(r => r.math || (r.t && r.t.trim()))) parts.push({ runs: cur }); cur = []; };
    for (const r of runs) { if (r.display) { push(); parts.push({ display: r.display }); } else cur.push(r); }
    push();
    // tidy spaces at the start and end of each paragraph
    for (const p of parts) if (p.runs) {
      const first = p.runs.find(r => r.t != null), last = [...p.runs].reverse().find(r => r.t != null);
      if (first) first.t = first.t.replace(/^\s+/, '');
      if (last) last.t = last.t.replace(/\s+$/, '');
    }
    return parts;
  }
  const parse = html => new DOMParser().parseFromString('<body>' + (html || '') + '</body>', 'text/html').body;
  const hasText = html => { const b = parse(html); return !!(b.textContent.trim() || b.querySelector('[data-eq]')); };
  // Runs for a short box (caption, table cell): no display equations
  const shortRuns = (html, ctx) => inlineRuns(parse(html), Object.assign({}, ctx, { flat: true }));

  // A text box's HTML -> paragraph, list and equation blocks
  let listCount = 0;
  function textBlocks(html, ctx) {
    const out = [];
    const para = (runs, extra = {}) => { for (const part of splitDisplay(runs)) out.push(part.display ? { math: part.display } : { para: Object.assign({ runs: part.runs }, extra) }); };
    for (const n of parse(html).childNodes) {
      if (n.nodeType !== 1) continue;
      if (n.nodeName === 'H3') out.push({ para: { runs: inlineRuns(n, ctx), style: 'Heading2' } });
      else if (n.nodeName === 'H4') out.push({ para: { runs: inlineRuns(n, ctx), style: 'Heading3' } });
      else if (n.nodeName === 'UL' || n.nodeName === 'OL') {
        const key = n.nodeName === 'UL' ? 'bullet' : 'number:' + (++listCount);
        for (const li of n.children) para(inlineRuns(li, ctx), { style: 'ListParagraph', list: key });
      } else para(inlineRuns(n, ctx));
    }
    return out;
  }

  // ---------- pictures, tables, captions ----------
  const caption = (label, html, ctx, above) => ({ para: { runs: [{ t: label + ' ', b: true }, ...shortRuns(html, ctx)], style: 'Caption', align: 'center', keepNext: above } });
  async function figure(b, ctx) {
    const out = [];
    if (b.img) {
      const rec = await ctx.getImage(b.img);
      if (rec && rec.blob) {
        const data = new Uint8Array(await rec.blob.arrayBuffer());
        const maxW = ctx.contentWidth * TWIP_EMU, maxH = 8 * 914400;   // at most the text width and 8 inches high
        let cx = Math.min(rec.w * PX_EMU, maxW), cy = Math.round(cx * rec.h / rec.w);
        if (cy > maxH) { cx = Math.round(cx * maxH / cy); cy = maxH; }
        out.push({ image: { data, ext: rec.type === 'image/jpeg' ? 'jpeg' : 'png', w: rec.w, h: rec.h, cx, cy, align: 'center' } });
      }
    }
    if (!out.length) return out;                      // a picture box with no picture isn't exported
    out.push(caption(`Figure ${ctx.nums.fig[b.id]}:`, b.caption, ctx));
    return out;
  }
  function dataTable(t, ctx) {
    const filled = t.rows.filter(r => r.some(c => String(c).trim()));
    if (!filled.length && !t.head.some(hasText)) return [];
    const rows = [t.head.map(c => ({ runs: shortRuns(c, ctx), align: 'center' })),
      ...filled.map(r => r.map((c, i) => ({ runs: [{ t: ctx.formatCell(c, t.dp[i]) }], align: 'center' })))];
    return [caption(`Table ${ctx.nums.tab[t.id]}:`, t.caption, ctx, true), { grid: { rows } }];
  }
  async function blockList(list, ctx) {
    const out = [];
    for (const b of list || []) {
      if (b.type === 'text') out.push(...textBlocks(b.html, ctx));
      if (b.type === 'image') out.push(...await figure(b, ctx));
      if (b.type === 'table') out.push(...dataTable(b, ctx));
    }
    return out;
  }

  // ---------- each section ----------
  const VAR_ROWS = [['quantity', 'Quantity, symbol and unit'], ['instrument', 'Instrument'], ['precision', 'Precision / uncertainty'], ['range', 'Range'],
    ['interval', 'Interval and number of values'], ['repeats', 'Repeats'], ['how', 'How it is changed / measured']];
  async function variables(d, ctx) {
    const out = [];
    const rows = VAR_ROWS.filter(([k]) => hasText(d.iv[k]) || hasText(d.dv[k]));
    if (rows.length) {
      out.push(caption(`Table ${ctx.nums.tab['var-main']}:`, d.captions.main, ctx, true), { grid: { widths: [26, 37, 37], rows: [
        [{ runs: [] }, { runs: [{ t: 'Independent variable' }] }, { runs: [{ t: 'Dependent variable' }] }],
        ...rows.map(([k, label]) => [{ runs: [{ t: label, b: true }], shade: 'F3F5F8' }, { runs: shortRuns(d.iv[k], ctx) }, { runs: shortRuns(d.dv[k], ctx) }]),
      ] } });
    }
    const controls = d.controls.filter(c => ['name', 'value', 'instrument', 'how'].some(k => hasText(c[k])));
    if (controls.length) {
      out.push(caption(`Table ${ctx.nums.tab['var-controls']}:`, d.captions.controls, ctx, true), { grid: { widths: [26, 22, 20, 32], rows: [
        ['Control variable', 'Value', 'Instrument', 'How it is kept constant'].map(t => ({ runs: [{ t }] })),
        ...controls.map(c => ['name', 'value', 'instrument', 'how'].map(k => ({ runs: shortRuns(c[k], ctx) }))),
      ] } });
    }
    for (const k of ['range', 'interval', 'repeats', 'precision']) out.push(...textBlocks(d.why[k], ctx));
    for (const c of d.controls) out.push(...textBlocks(d.whyControls[c.id], ctx));
    out.push(...await blockList(d.extra, ctx));
    return out;
  }
  async function method(d, ctx) {
    const out = await blockList(d.top, ctx);
    const key = 'number:method';
    for (const st of d.steps) {
      if (!hasText(st.html)) continue;
      // one numbered paragraph per step (a step written over several lines keeps its line breaks)
      const runs = [];
      for (const n of parse(st.html).childNodes) {
        if (n.nodeType !== 1) continue;
        if (runs.length) runs.push({ br: true });
        inlineRuns(n, Object.assign({}, ctx, { flat: true }), {}, runs);
      }
      out.push({ para: { runs, style: 'ListParagraph', list: key } });
    }
    return out;
  }
  async function story(d, ctx) {
    const out = [];
    for (const st of d.steps) {
      out.push(...textBlocks(st.intro, ctx));
      const it = st.item;
      if (it && it.type === 'table') out.push(...dataTable(it, ctx));
      if (it && it.type === 'image') out.push(...await figure(it, ctx));
      if (it && it.type === 'calc') out.push(...await blockList(it.blocks, ctx));
      if (it && !st.explainHidden) out.push(...textBlocks(st.explain, ctx));
    }
    return out;
  }
  const EVAL_COLS = [['weak', 'Weakness or limitation'], ['data', 'Effect on the data and analysis'], ['concl', 'Effect on the conclusion, and how large'], ['improve', 'Realistic improvement, and what would change']];
  function evaluation(d, ctx) {
    const out = [];
    const rows = d.rows.filter(r => EVAL_COLS.some(([k]) => hasText(r[k])));
    if (rows.length) {
      out.push(caption(`Table ${ctx.nums.tab.eval}:`, d.caption, ctx, true), { grid: { rows: [
        EVAL_COLS.map(([, t]) => ({ runs: [{ t }] })),
        ...rows.map(r => EVAL_COLS.map(([k]) => ({ runs: shortRuns(r[k], ctx) }))),
      ] } });
    }
    out.push(...textBlocks(d.most, ctx));
    return out;
  }
  function references(ctx) {
    const refs = ctx.orderedRefs(ctx.ia, ctx.nums).filter(r => hasText(r.html));
    let next = Object.keys(ctx.nums.cite).length;
    return refs.map(r => {
      const k = ctx.nums.cite[r.id] || ++next;
      return { para: { runs: [{ t: `[${k}]` }, { tab: true }, ...shortRuns(r.html.replace(/<\/p><p>/g, ' '), ctx)], indent: { left: 567, hanging: 567 } } };
    });
  }

  // ---------- the whole report ----------
  async function build(ctx) {
    const { ia, sections } = ctx;
    listCount = 0;
    const margins = { top: MARGIN, right: ia.settings.wideMargins ? WIDE_RIGHT : MARGIN, bottom: MARGIN, left: MARGIN };
    ctx = Object.assign({}, ctx, { nums: ctx.numbering(ia), contentWidth: 11906 - margins.left - margins.right });
    const f = ia.front, blocks = [];
    blocks.push({ para: { runs: [{ t: f.title.trim() || 'Title of the investigation' }], style: 'Title' } });
    blocks.push({ para: { runs: [{ t: 'Candidate code: ', b: true }, { t: f.code.trim() }], after: 0 } });
    if (f.group.trim()) blocks.push({ para: { runs: [{ t: 'Group members\' candidate codes: ', b: true }, { t: f.group.trim() }], after: 0 } });
    blocks.push({ para: { runs: [{ t: 'Word count: ', b: true }, { t: ctx.totalWords(ia).toLocaleString('en-GB') }], after: 240 } });

    const SEC = Object.fromEntries(sections.map(s => [s.id, s]));
    const order = sections.map(s => s.id).filter(id => id !== 'rq');
    if (ia.settings.rqPlace === 'before') order.unshift('rq');
    if (ia.settings.rqPlace === 'after') order.splice(order.indexOf('background') + 1, 0, 'rq');
    const empty = [];
    for (const id of order) {
      const sec = SEC[id], d = ia.s[id];
      let body = [];
      if (sec.kind === 'rq') body = textBlocks(d.text, ctx);
      if (sec.kind === 'blocks' || sec.kind === 'hypothesis') body = await blockList(d.blocks, ctx);
      if (id === 'background' && ia.settings.rqPlace === 'inside' && hasText(ia.s.rq.text)) {
        const runs = [];
        for (const n of parse(ia.s.rq.text).childNodes) { if (n.nodeType !== 1) continue; if (runs.length) runs.push({ br: true }); inlineRuns(n, Object.assign({}, ctx, { flat: true }), {}, runs); }
        body.push({ para: { runs: [{ t: 'Research question: ', b: true }, ...runs] } });
      }
      if (sec.kind === 'variables') body = await variables(d, ctx);
      if (sec.kind === 'method') body = await method(d, ctx);
      if (sec.kind === 'story') body = await story(d, ctx);
      if (sec.kind === 'evaluation') body = evaluation(d, ctx);
      if (sec.kind === 'references') body = references(ctx);
      if (!body.length) { empty.push(sec.kind === 'hypothesis' ? sec.versions[ia.settings.kind].heading : sec.title); continue; }
      const heading = sec.kind === 'hypothesis' ? sec.versions[ia.settings.kind].heading : sec.heading;
      blocks.push({ para: { runs: [{ t: heading }], style: 'Heading1' } }, ...body);
    }
    const bytes = window.Lab.docx(blocks, { report: true, margins, pageNumbers: true });
    return { bytes, empty };
  }

  window.IAExport = { build, margins: { normal: MARGIN, wide: WIDE_RIGHT } };
})();
