// Makes a PowerPoint file (.pptx) in the browser, with no library: a .pptx is a zip of XML files.
// Used by the lesson slide generator (teachers/slides.html, js/slides.js). Plan and design: docs/SLIDES_PLAN.md.
//
// The design is our own "Option D": a theme-colour bar along the top, a faint wave motif, bold titles with a short
// rounded underline, round bullet dots, rounded panels and a footer pill. All decoration is drawn as ordinary
// PowerPoint shapes in the slide master and layouts, so teachers can change or delete it.
// The theme colour is the deck's "Accent 1", so Design > Variants > Colors in PowerPoint can change it.
//
// Pptx.build(deck) returns the file's bytes. deck = { code: 'A.1', title: 'Kinematics', theme: 'Space, time and motion',
//   color: '1f5fbf', slides: [...] }. Each slide is one of:
//   { kind: 'title', points: [paragraph], time: 'About 3 hours' }
//   { kind: 'content' | 'aims' | 'question', title, paras: [paragraph], notes }
//   { kind: 'equation', title, eqs: [eq], paras, notes }                 (key equations in a card, up to four)
//   { kind: 'worked' | 'derivation', title, question: [paragraph], steps: [{ paras, eq, n }], notes }  (a derivation has a "Derivation" label)
//   { kind: 'diagram', title, image: { png, w, h }, paras, notes }
// A paragraph is { runs: [run], level: 0 | 1, bullet: true | false, align }; a run is
//   { t: 'text', b, i, color: 'accent1' | 'good' | 'muted', sup, sub } or { m: { omml, plain } } (an equation inside the text).
// eq = { omml, png, wIn, hIn, plain }: a displayed equation (OMML from js/omml.js), with a picture for viewers without equations.
(() => {
  const enc = new TextEncoder();
  const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const IN = 914400;            // EMU per inch
  const PT = 12700;             // EMU per point
  const W = 12192000, H = 6858000; // 16:9 widescreen (13.333 × 7.5 in): the teacher's choice, November 2026
  const E = (inches) => Math.round(inches * IN);

  const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
  const MATHNS = 'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"';
  const HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const TEXT = '1C2430', MUTED = '5B6676', BORDER = 'DDE2E9', PANEL = 'F7F9FD', GOOD = '1E7A46';

  // Mix a colour with white (for the light tints of the theme colour)
  function tint(hex, amount) {
    const n = parseInt(hex, 16), mix = (c) => Math.round(c + (255 - c) * amount);
    return [mix(n >> 16), mix((n >> 8) & 255), mix(n & 255)].map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  // ---------- Small XML builders ----------
  const clr = (c) => (/^(accent\d|tx1|tx2|bg1|bg2|lt1|dk1)$/.test(c) ? `<a:schemeClr val="${c}"/>` : `<a:srgbClr val="${c}"/>`);
  const clrA = (c, alpha) => (/^(accent\d|tx1|tx2|bg1|bg2)$/.test(c) ? `<a:schemeClr val="${c}"><a:alpha val="${alpha * 1000}"/></a:schemeClr>` : `<a:srgbClr val="${c}"><a:alpha val="${alpha * 1000}"/></a:srgbClr>`);
  const solid = (c) => `<a:solidFill>${clr(c)}</a:solidFill>`;
  const xfrm = (x, y, w, h) => `<a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm>`;
  const COLORS = { accent1: 'accent1', good: GOOD, muted: 'tx2', text: 'tx1', white: 'bg1', orange: 'accent2' };

  function rPr(r, size, linkRel) {
    const attrs = [`lang="en-GB"`, size ? `sz="${size}"` : '', r.b ? 'b="1"' : '', r.i ? 'i="1"' : '', r.sup ? 'baseline="30000"' : r.sub ? 'baseline="-25000"' : '', 'dirty="0"'].filter(Boolean).join(' ');
    return `<a:rPr ${attrs}>${r.color ? solid(COLORS[r.color] || r.color) : ''}${linkRel ? `<a:hlinkClick r:id="${linkRel}"/>` : ''}</a:rPr>`;
  }
  // One paragraph. withMath = false writes the plain-text copy of any equations (for the fallback shape).
  // link(url) returns the relationship id of a web link (for runs with { link }).
  function para(p, { size, withMath = true, defaultBullet = true, link } = {}) {
    const lvl = p.level ? ` lvl="${p.level}"` : '';
    const algn = p.align ? ` algn="${p.align}"` : '';
    const bullet = p.bullet ?? defaultBullet;
    const pPr = `<a:pPr${lvl}${algn}${bullet ? '' : ' marL="0" indent="0"'}>${p.spaceBefore != null ? `<a:spcBef><a:spcPts val="${p.spaceBefore * 100}"/></a:spcBef>` : ''}${bullet ? '' : '<a:buNone/>'}</a:pPr>`;
    const runs = (p.runs || []).map((r) => {
      if (r.m) {
        return withMath ? `<a14:m>${r.m.omml}</a14:m>` : `<a:r>${rPr({ i: false }, size)}<a:t>${xml(r.m.plain)}</a:t></a:r>`;
      }
      const lr = r.link && link ? link(r.link) : null;
      return String(r.t).split('\n').map((line, i) => `${i ? `<a:br>${rPr(r, size)}</a:br>` : ''}<a:r>${rPr(r, size, lr)}<a:t>${xml(line)}</a:t></a:r>`).join('');
    }).join('');
    return `<a:p>${pPr}${runs}<a:endParaRPr lang="en-GB"${size ? ` sz="${size}"` : ''} dirty="0"/></a:p>`;
  }
  const hasMath = (paras) => (paras || []).some((p) => (p.runs || []).some((r) => r.m));

  // ---------- One slide's shapes ----------
  function slideBuilder() {
    let id = 1;
    const shapes = [];
    const rels = [];          // [type, target, external]; image targets are IMAGEn (this slide's nth picture), named later
    const images = [];        // png bytes
    const nextId = () => ++id;
    const relId = (type, target, external) => { rels.push([type, target, external]); return `rId${rels.length + 1}`; }; // rId1 is the layout
    const link = (url) => relId('http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink', url, true);
    // A text shape: a placeholder (ph = 'title' | 'body' | 'ctrTitle' | 'subTitle') or a free text box at box = [x, y, w, h]
    function text({ ph, box, paras, size, anchor = 't', name = 'Text', bullets = false, fill, line, geom = 'rect', inset = 0, autofit = false }) {
      const make = (withMath) => {
        const n = nextId();
        const phXml = ph === 'title' ? '<p:ph type="title"/>' : ph === 'ctrTitle' ? '<p:ph type="ctrTitle"/>' : ph === 'subTitle' ? '<p:ph type="subTitle" idx="1"/>' : ph === 'body' ? '<p:ph idx="1"/>' : '';
        const nv = `<p:nvSpPr><p:cNvPr id="${n}" name="${xml(name)} ${n}"/><p:cNvSpPr${ph ? '><a:spLocks noGrp="1"/></p:cNvSpPr>' : ' txBox="1"/>'}<p:nvPr>${phXml}</p:nvPr></p:nvSpPr>`;
        const sp = box ? `<p:spPr>${xfrm(...box)}<a:prstGeom prst="${geom}"><a:avLst/></a:prstGeom>${fill ? solid(fill) : ph ? '' : '<a:noFill/>'}${line ? `<a:ln w="12700">${solid(line)}</a:ln>` : ''}</p:spPr>` : '<p:spPr/>';
        const ins = E(inset);
        const body = ph && !box ? '<a:bodyPr/>' : `<a:bodyPr wrap="square" lIns="${ins}" tIns="${ins}" rIns="${ins}" bIns="${ins}" anchor="${anchor}" rtlCol="0">${autofit ? '<a:normAutofit/>' : '<a:noAutofit/>'}</a:bodyPr>`;
        return `<p:sp>${nv}${sp}<p:txBody>${body}<a:lstStyle/>${paras.map((p) => para(p, { size, withMath, link, defaultBullet: ph === 'body' || bullets })).join('')}</p:txBody></p:sp>`;
      };
      shapes.push(hasMath(paras)
        ? `<mc:AlternateContent ${MATHNS}><mc:Choice Requires="a14">${make(true)}</mc:Choice><mc:Fallback>${make(false)}</mc:Fallback></mc:AlternateContent>`
        : make(true));
    }
    // A displayed equation: the editable equation, with its picture as the fallback
    function equation(eq, [x, y, w, h], { size = 2400, align = 'l' } = {}) {
      const n1 = nextId();
      const jc = align === 'ctr' ? 'center' : 'left';
      const omml = eq.omml.replace('<m:jc m:val="left"/>', `<m:jc m:val="${jc}"/>`);
      const choice = `<p:sp><p:nvSpPr><p:cNvPr id="${n1}" name="Equation ${n1}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>`
        + `<p:spPr>${xfrm(x, y, w, h)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>`
        + `<p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr" rtlCol="0"><a:noAutofit/></a:bodyPr><a:lstStyle/>`
        + `<a:p><a:pPr marL="0" indent="0"${align === 'ctr' ? ' algn="ctr"' : ''}><a:buNone/></a:pPr><a14:m>${omml}</a14:m><a:endParaRPr lang="en-GB" sz="${size}" dirty="0"/></a:p></p:txBody></p:sp>`;
      let fallback;
      if (eq.png) {
        images.push(eq.png);
        const r = relId('http://schemas.openxmlformats.org/officeDocument/2006/relationships/image', `../media/IMAGE${images.length}.png`);
        // the picture's own size (worked out from the equation's size in points), shrunk to fit the box if needed
        let pw = eq.wIn * IN, ph = eq.hIn * IN;
        const k = Math.min(1, w / pw, h / ph);
        pw = Math.round(pw * k); ph = Math.round(ph * k);
        const px = align === 'ctr' ? x + Math.round((w - pw) / 2) : x, py = y + Math.round((h - ph) / 2);
        fallback = `<p:sp><p:nvSpPr><p:cNvPr id="${n1}" name="Equation ${n1}"/><p:cNvSpPr txBox="1"><a:spLocks noRot="1" noChangeAspect="1" noMove="1" noResize="1" noEditPoints="1" noAdjustHandles="1" noChangeArrowheads="1" noChangeShapeType="1" noTextEdit="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>`
          + `<p:spPr>${xfrm(px, py, pw, ph)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:blipFill><a:blip r:embed="${r}"/><a:stretch><a:fillRect/></a:stretch></a:blipFill></p:spPr>`
          + `<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-GB"><a:noFill/></a:rPr><a:t> </a:t></a:r></a:p></p:txBody></p:sp>`;
      } else {
        fallback = choice.replace(/<a14:m>[\s\S]*<\/a14:m>/, `<a:r><a:rPr lang="en-GB" sz="${size}"/><a:t>${xml(eq.plain || '')}</a:t></a:r>`);
      }
      shapes.push(`<mc:AlternateContent ${MATHNS}><mc:Choice Requires="a14">${choice}</mc:Choice><mc:Fallback>${fallback}</mc:Fallback></mc:AlternateContent>`);
    }
    function picture(img, [x, y, w, h], name = 'Diagram') {
      images.push(img.png);
      const r = relId('http://schemas.openxmlformats.org/officeDocument/2006/relationships/image', `../media/IMAGE${images.length}.png`);
      const k = Math.min(w / img.w, h / img.h);
      const pw = Math.round(img.w * k), ph = Math.round(img.h * k);
      const n = nextId();
      shapes.push(`<p:pic><p:nvPicPr><p:cNvPr id="${n}" name="${xml(name)} ${n}" descr="${xml(img.alt || '')}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>`
        + `<p:blipFill><a:blip r:embed="${r}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>`
        + `<p:spPr>${xfrm(x + Math.round((w - pw) / 2), y + Math.round((h - ph) / 2), pw, ph)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`);
    }
    function shape(geom, box, { fill, line, adj, name = 'Shape', textXml = '' } = {}) {
      const n = nextId();
      shapes.push(`<p:sp><p:nvSpPr><p:cNvPr id="${n}" name="${name} ${n}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>${xfrm(...box)}<a:prstGeom prst="${geom}"><a:avLst>${adj ? `<a:gd name="adj" fmla="val ${adj}"/>` : ''}</a:avLst></a:prstGeom>`
        + `${fill ? solid(fill) : '<a:noFill/>'}${line ? `<a:ln w="12700">${solid(line)}</a:ln>` : '<a:ln><a:noFill/></a:ln>'}</p:spPr>`
        + `<p:txBody><a:bodyPr wrap="none" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr" rtlCol="0"><a:noAutofit/></a:bodyPr><a:lstStyle/>${textXml || '<a:p><a:endParaRPr lang="en-GB" dirty="0"/></a:p>'}</p:txBody></p:sp>`);
    }
    return { text, equation, picture, shape, shapes, rels, images };
  }

  // ---------- Slides ----------
  const pills = (label, size = 1800) => `<a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="en-GB" sz="${size}" b="1" dirty="0">${solid('bg1')}</a:rPr><a:t>${xml(label)}</a:t></a:r></a:p>`;
  const LAYOUT = { title: 1, content: 2, aims: 3, equation: 4, worked: 5, diagram: 6, question: 7, derivation: 8 };

  function slideXml(s, deck) {
    const b = slideBuilder();
    if (s.kind === 'title') {
      b.text({ name: 'Code', box: [E(0.6), E(5.2), E(4.4), E(1.6)], anchor: 'b', size: 9600,
        paras: [{ bullet: false, runs: [{ t: deck.code, b: true, color: 'white' }] }] });
      const pillW = E(0.32 + 0.165 * deck.theme.length);
      b.shape('roundRect', [E(6.0), E(1.15), pillW, E(0.46)], { fill: tint(deck.color, 0.88), adj: 50000, name: 'Theme',
        textXml: `<a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="en-GB" sz="1800" b="1" spc="60" dirty="0">${solid('accent1')}</a:rPr><a:t>${xml(deck.theme.toUpperCase())}</a:t></a:r></a:p>` });
      b.text({ ph: 'ctrTitle', paras: [{ runs: [{ t: deck.title }] }] });
      b.text({ ph: 'subTitle', size: s.pointsSize, paras: s.points });
      b.text({ name: 'Teaching time', box: [E(6.0), E(6.25), E(6.8), E(0.5)], anchor: 'ctr', size: 2000,
        paras: [{ bullet: false, runs: [{ t: s.time, b: true, color: 'accent1' }] }] });
    } else {
      // Long titles get a smaller size, so they stay on one line above the underline (the box is 9.9 in wide)
      const len = [...s.title].length;
      const tsz = len <= 29 ? undefined : len <= 33 ? 3600 : len <= 37 ? 3200 : len <= 42 ? 2800 : 2400;
      b.text({ ph: 'title', size: tsz, paras: [{ runs: [{ t: s.title }] }] });
      if (s.kind === 'equation') {
        // one equation centred in the card, or up to four in two columns
        const eqs = s.eqs || [s.eq];
        if (eqs.length === 1) b.equation(eqs[0], [E(0.9), E(2.0), E(11.53), E(1.75)], { size: 3200, align: 'ctr' });
        else {
          const rows = Math.ceil(eqs.length / 2), rowH = 2.0 / rows;
          eqs.forEach((eq, i) => b.equation(eq, [E(1.0 + (i % 2) * 5.9), E(1.9 + Math.floor(i / 2) * rowH), E(5.6), E(rowH)], { size: 2800, align: 'ctr' }));
        }
        if (s.paras?.length) b.text({ ph: 'body', size: s.size, paras: s.paras });
      } else if (s.kind === 'worked' || s.kind === 'derivation') {
        // the question (smaller on the solution slides), then numbered steps: text on the left, the equation on the right
        b.text({ ph: 'body', size: s.questionSize, paras: s.question, box: s.steps?.length ? [E(0.6), E(1.55), E(12.13), E(s.stepsTop - 1.7)] : [E(0.6), E(1.55), E(12.13), E(5.2)] });
        const steps = s.steps || [];
        const top = s.stepsTop || 2.95, rowHEqual = Math.min(1.1, (6.85 - top) / Math.max(steps.length, 1));
        let next = top;
        steps.forEach((st, i) => {
          // a step's own height when the generator worked one out (tall equations), otherwise an equal share
          const y = next;
          const rowH = st.h || rowHEqual;
          next += rowH;
          const d = 0.46;
          b.shape('ellipse', [E(0.6), E(y + (rowH - d) / 2), E(d), E(d)], { fill: 'accent1', name: 'Step number', textXml: pills(String(st.n ?? i + 1), 1800) });
          // the equation starts at 7.0 in, or further left when it is long (but leaves the text at least 3.3 in)
          const eqX = !st.eq ? 12.73 : !st.paras?.length ? 1.3 : Math.max(4.85, Math.min(7.0, 12.73 - (st.eq.wIn || 0) * 1.08 - 0.1));
          const textW = st.eq ? eqX - 1.3 - 0.25 : 11.43;
          if (st.paras?.length) b.text({ name: 'Step', box: [E(1.3), E(y), E(textW), E(rowH)], anchor: 'ctr', size: 2000, paras: st.paras });
          if (st.eq) b.equation(st.eq, [E(eqX), E(y), E(12.73 - eqX), E(rowH)], { size: 2400 });
        });
      } else if (s.kind === 'diagram') {
        // a picture on a light panel, with text beside it (textW inches wide) or the picture across the whole slide
        const textW = s.paras?.length ? (s.textW || 4.73) : 0;
        const panel = [E(0.6), E(1.55), E(textW ? 12.13 - textW - 0.3 : 12.13), E(5.2)];
        b.shape('roundRect', panel, { fill: PANEL, line: BORDER, adj: 4000, name: 'Diagram panel' });
        b.picture(s.image, [panel[0] + E(0.15), panel[1] + E(0.15), panel[2] - E(0.3), panel[3] - E(0.3)]);
        if (textW) b.text({ ph: 'body', size: s.size, paras: s.paras, box: [E(12.73 - textW), E(1.55), E(textW), E(5.25)] });
      } else if (s.paras?.length) {
        b.text({ ph: 'body', size: s.size, paras: s.paras });
      }
    }
    // HL content gets an orange "HL" label at the top right (left of the worked-example or derivation label)
    if (s.hl && s.kind !== 'title') {
      const x = s.kind === 'worked' || s.kind === 'derivation' ? 9.8 : 11.98;
      b.shape('roundRect', [E(x), E(1.02), E(0.75), E(0.36)], { fill: 'accent2', adj: 50000, name: 'HL label', textXml: pills('HL', 1400) });
    }
    const tree = `<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr>${xfrm(0, 0, 0, 0).replace('</a:xfrm>', '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm>')}</p:grpSpPr>${b.shapes.join('')}</p:spTree>`;
    return {
      xml: `${HEAD}<p:sld ${NS} ${MATHNS} mc:Ignorable="a14"><p:cSld>${tree}</p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`,
      rels: b.rels, images: b.images, layout: LAYOUT[s.kind] || 2,
    };
  }

  function notesXml(paras, n) {
    const body = (paras && paras.length ? paras : [{ runs: [{ t: '' }] }]).map((p) => para({ ...p, bullet: false }, { withMath: false })).join('');
    return `${HEAD}<p:notes ${NS}><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>`
      + '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp>'
      + `<p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes ${n}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${body}</p:txBody></p:sp>`
      + '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>';
  }

  // ---------- The template: theme, slide master and layouts ----------
  function themeXml(color, name = 'Physics') {
    const fills = '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'.repeat(3);
    const lines = [6350, 12700, 19050].map((w) => `<a:ln w="${w}" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln>`).join('');
    const font = '<a:latin typeface="Arial" panose="020B0604020202020204"/><a:ea typeface=""/><a:cs typeface=""/>';
    return `${HEAD}<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="${xml(name)}"><a:themeElements>`
      + `<a:clrScheme name="${xml(name)}"><a:dk1><a:srgbClr val="${TEXT}"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="${MUTED}"/></a:dk2><a:lt2><a:srgbClr val="${PANEL}"/></a:lt2>`
      + `<a:accent1><a:srgbClr val="${color.toUpperCase()}"/></a:accent1><a:accent2><a:srgbClr val="C2561A"/></a:accent2><a:accent3><a:srgbClr val="0F8077"/></a:accent3>`
      + `<a:accent4><a:srgbClr val="7B3FBF"/></a:accent4><a:accent5><a:srgbClr val="2E7D32"/></a:accent5><a:accent6><a:srgbClr val="1F5FBF"/></a:accent6>`
      + `<a:hlink><a:srgbClr val="1F5FBF"/></a:hlink><a:folHlink><a:srgbClr val="7B3FBF"/></a:folHlink></a:clrScheme>`
      + `<a:fontScheme name="Arial"><a:majorFont>${font}</a:majorFont><a:minorFont>${font}</a:minorFont></a:fontScheme>`
      + `<a:fmtScheme name="Plain"><a:fillStyleLst>${fills}</a:fillStyleLst><a:lnStyleLst>${lines}</a:lnStyleLst>`
      + `<a:effectStyleLst>${'<a:effectStyle><a:effectLst/></a:effectStyle>'.repeat(3)}</a:effectStyleLst><a:bgFillStyleLst>${fills}</a:bgFillStyleLst></a:fmtScheme>`
      + '</a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>';
  }

  // A free shape for the master and layouts
  let decoId = 100;
  function deco(name, geomXml, box, { fill, line, lineW = 19050, dash, alpha, textXml, tail } = {}) {
    const n = decoId++;
    const f = fill ? `<a:solidFill>${alpha && !line ? clrA(fill, alpha) : clr(fill)}</a:solidFill>` : '<a:noFill/>';
    const l = line ? `<a:ln w="${lineW}" cap="rnd"><a:solidFill>${alpha ? clrA(line, alpha) : clr(line)}</a:solidFill>${dash ? '<a:prstDash val="dash"/>' : ''}<a:round/>${tail ? '<a:tailEnd type="triangle" w="med" len="med"/>' : ''}</a:ln>` : '<a:ln><a:noFill/></a:ln>';
    return `<p:sp><p:nvSpPr><p:cNvPr id="${n}" name="${name}"/><p:cNvSpPr/><p:nvPr userDrawn="1"/></p:nvSpPr><p:spPr>${xfrm(...box)}${geomXml}${f}${l}</p:spPr>`
      + `<p:txBody><a:bodyPr wrap="none" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr" rtlCol="0"><a:noAutofit/></a:bodyPr><a:lstStyle/>${textXml || '<a:p><a:endParaRPr lang="en-GB" dirty="0"/></a:p>'}</p:txBody></p:sp>`;
  }
  const prst = (p, adj) => `<a:prstGeom prst="${p}"><a:avLst>${adj != null ? `<a:gd name="adj" fmla="val ${adj}"/>` : ''}</a:avLst></a:prstGeom>`;
  // A curve through calculated points, drawn as a custom shape (w, h in EMU; pts in 0–1 of the box)
  function curve(pts, w, h) {
    const P = pts.map(([u, v]) => `<a:pt x="${Math.round(u * w)}" y="${Math.round(v * h)}"/>`);
    return `<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="0" t="0" r="r" b="b"/><a:pathLst><a:path w="${w}" h="${h}" fill="none">`
      + `<a:moveTo>${P[0]}</a:moveTo>${P.slice(1).map((p) => `<a:lnTo>${p}</a:lnTo>`).join('')}</a:path></a:pathLst></a:custGeom>`;
  }
  // Sine waves (calculated, not sketched): two periods, the second one shifted and dashed
  const wave = (phase) => Array.from({ length: 73 }, (_, i) => [i / 72, 0.5 - 0.42 * Math.sin(2 * Math.PI * 2 * i / 72 + phase)]);
  // Projectile parabolas for the title panel: y = 1 - (2u - 1)^2 across the box
  const parabola = Array.from({ length: 49 }, (_, i) => { const u = i / 48; return [u, 1 - (1 - (2 * u - 1) ** 2)]; });

  const textStyle = (lvls) => lvls.map((l, i) => `<a:lvl${i + 1}pPr ${l.attrs || ''}>${l.inner || ''}</a:lvl${i + 1}pPr>`).join('');
  function masterXml(deck) {
    decoId = 100;
    const bullet = (size, pct) => `<a:buClr><a:schemeClr val="accent1"/></a:buClr><a:buSzPct val="${pct}000"/><a:buFont typeface="Arial" panose="020B0604020202020204"/><a:buChar char="●"/>`;
    const lvl = (marL, indent, sz, before, pct, color = 'tx1') => ({
      attrs: `marL="${marL}" indent="${indent}" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"`,
      inner: `<a:lnSpc><a:spcPct val="100000"/></a:lnSpc><a:spcBef><a:spcPts val="${before}"/></a:spcBef>${bullet(sz, pct)}<a:defRPr sz="${sz}" kern="1200">${solid(color)}<a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr>`,
    });
    const body = textStyle([lvl(E(0.36), -E(0.36), 2400, 1200, 70), lvl(E(0.86), -E(0.32), 2000, 600, 60), lvl(E(1.3), -E(0.3), 1800, 600, 60),
      lvl(E(1.7), -E(0.3), 1800, 600, 60), lvl(E(2.1), -E(0.3), 1800, 600, 60)]);
    const title = `<a:lvl1pPr algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:lnSpc><a:spcPct val="90000"/></a:lnSpc><a:spcBef><a:spcPct val="0"/></a:spcBef><a:buNone/><a:defRPr sz="4000" b="1" kern="1200">${solid('tx1')}<a:latin typeface="+mj-lt"/><a:ea typeface="+mj-ea"/><a:cs typeface="+mj-cs"/></a:defRPr></a:lvl1pPr>`;
    const other = `<a:defPPr><a:defRPr lang="en-GB"/></a:defPPr><a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1800" kern="1200">${solid('tx1')}<a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr>`;
    const footText = (t, sz, algn, c = 'tx2', b = false) => `<a:p><a:pPr algn="${algn}"/><a:r><a:rPr lang="en-GB" sz="${sz}"${b ? ' b="1"' : ''} dirty="0">${solid(c)}</a:rPr><a:t>${xml(t)}</a:t></a:r></a:p>`;
    const pillW = E(0.25 + 0.11 * deck.code.length);
    const shapes = [
      // placeholders
      `<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr>${xfrm(E(0.6), E(0.3), E(9.9), E(0.92))}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>`
        + '<p:txBody><a:bodyPr vert="horz" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="b"><a:normAutofit/></a:bodyPr><a:lstStyle/><a:p><a:r><a:rPr lang="en-GB"/><a:t>Click to edit the title</a:t></a:r></a:p></p:txBody></p:sp>',
      `<p:sp><p:nvSpPr><p:cNvPr id="3" name="Text Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr>${xfrm(E(0.6), E(1.55), E(12.13), E(5.2))}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>`
        + '<p:txBody><a:bodyPr vert="horz" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0"><a:normAutofit/></a:bodyPr><a:lstStyle/><a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-GB"/><a:t>Click to edit the text</a:t></a:r></a:p><a:p><a:pPr lvl="1"/><a:r><a:rPr lang="en-GB"/><a:t>Second level</a:t></a:r></a:p></p:txBody></p:sp>',
      // decoration
      deco('Top bar', prst('rect'), [0, 0, W, E(0.08)], { fill: 'accent1' }),
      deco('Wave', curve(wave(0), E(2.1), E(0.5)), [E(10.75), E(0.38), E(2.1), E(0.5)], { line: 'accent1', alpha: 28, lineW: 22225 }),
      deco('Wave 2', curve(wave(Math.PI / 2), E(2.1), E(0.5)), [E(10.75), E(0.38), E(2.1), E(0.5)], { line: 'accent1', alpha: 18, lineW: 15875, dash: true }),
      deco('Title underline', prst('roundRect', 50000), [E(0.6), E(1.3), E(0.95), E(0.075)], { fill: 'accent1' }),
      deco('Footer pill', prst('roundRect', 50000), [E(0.6), E(7.0), pillW, E(0.3)], { fill: 'accent1', textXml: footText(deck.code, 1200, 'ctr', 'bg1', true) }),
      deco('Footer', prst('rect'), [E(0.6) + pillW + E(0.15), E(7.0), E(8), E(0.3)], { textXml: footText(deck.title, 1200, 'l') }).replace('wrap="none"', 'wrap="square"').replace('anchor="ctr"', 'anchor="ctr"'),
      deco('Slide number', prst('rect'), [E(11.73), E(7.0), E(1.0), E(0.3)], {
        textXml: `<a:p><a:pPr algn="r"/><a:fld id="{B6F15528-21DE-4FAA-801E-634DDDAF4B2B}" type="slidenum"><a:rPr lang="en-GB" sz="1200" dirty="0">${solid('tx2')}</a:rPr><a:t>‹#›</a:t></a:fld><a:endParaRPr lang="en-GB" sz="1200" dirty="0"/></a:p>` }).replace('wrap="none"', 'wrap="square"'),
    ];
    const layouts = Object.keys(LAYOUT).map((_, i) => `<p:sldLayoutId id="${2147483649 + i}" r:id="rId${i + 1}"/>`).join('');
    return `${HEAD}<p:sldMaster ${NS}><p:cSld><p:bg><p:bgPr><a:solidFill><a:schemeClr val="bg1"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr>${xfrm(0, 0, 0, 0).replace('</a:xfrm>', '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm>')}</p:grpSpPr>${shapes.join('')}</p:spTree></p:cSld>`
      + '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
      + `<p:sldLayoutIdLst>${layouts}</p:sldLayoutIdLst><p:txStyles><p:titleStyle>${title}</p:titleStyle><p:bodyStyle>${body}</p:bodyStyle><p:otherStyle>${other}</p:otherStyle></p:txStyles></p:sldMaster>`;
  }

  function layoutXml(kind, deck) {
    decoId = 200;
    const ph = (type, idx, name, box, lst = '', bodyPr = '<a:bodyPr/>') => `<p:sp><p:nvSpPr><p:cNvPr id="${decoId++}" name="${name}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph${type ? ` type="${type}"` : ''}${idx ? ` idx="${idx}"` : ''}/></p:nvPr></p:nvSpPr>`
      + `<p:spPr>${box ? xfrm(...box) : ''}</p:spPr><p:txBody>${bodyPr}<a:lstStyle>${lst}</a:lstStyle><a:p><a:r><a:rPr lang="en-GB"/><a:t>${name}</a:t></a:r></a:p></p:txBody></p:sp>`;
    const noBullet = (sz, extra = '') => `<a:lvl1pPr marL="0" indent="0"${extra}><a:spcBef><a:spcPts val="600"/></a:spcBef><a:buNone/><a:defRPr sz="${sz}"/></a:lvl1pPr>`;
    const title = ph('title', null, 'Title');
    let shapes = '', name = '', type = 'obj', showMaster = true;
    if (kind === 'title') {
      name = 'Title slide'; type = 'title'; showMaster = false;
      const pw = E(5.333);
      shapes = deco('Theme panel', prst('rect'), [0, 0, pw, H], { fill: 'accent1' })
        + deco('Path', curve(parabola, E(4.2), E(2.6)), [E(0.45), E(1.3), E(4.2), E(2.6)], { line: 'bg1', alpha: 26, lineW: 28575 })
        + deco('Path 2', curve(parabola, E(3.0), E(1.7)), [E(0.45), E(2.2), E(3.0), E(1.7)], { line: 'bg1', alpha: 18, lineW: 19050, dash: true })
        + deco('Velocity arrow', '<a:prstGeom prst="line"><a:avLst/></a:prstGeom>', [E(0.45), E(3.3), E(0.55), E(0.6)], { line: 'bg1', alpha: 30, lineW: 28575, tail: true }).replace('<a:xfrm>', '<a:xfrm flipV="1">')
        + deco('Ground', '<a:prstGeom prst="line"><a:avLst/></a:prstGeom>', [E(0.3), E(3.92), E(4.6), 0], { line: 'bg1', alpha: 18, lineW: 12700 })
        + ph('ctrTitle', null, 'Title', [E(6.0), E(1.8), E(6.8), E(1.35)], `<a:lvl1pPr algn="l"><a:defRPr sz="4400" b="1"/></a:lvl1pPr>`, '<a:bodyPr lIns="0" tIns="0" rIns="0" bIns="0" anchor="t"><a:normAutofit/></a:bodyPr>')
        + ph('subTitle', '1', 'Curriculum points', [E(6.0), E(3.25), E(6.8), E(2.9)],
          `<a:lvl1pPr marL="${E(0.3)}" indent="-${E(0.3)}" algn="l"><a:spcBef><a:spcPts val="600"/></a:spcBef><a:buClr><a:schemeClr val="accent1"/></a:buClr><a:buSzPct val="70000"/><a:buFont typeface="Arial"/><a:buChar char="●"/><a:defRPr sz="2000">${solid('tx2')}</a:defRPr></a:lvl1pPr>`,
          '<a:bodyPr lIns="0" tIns="0" rIns="0" bIns="0" anchor="t"><a:normAutofit/></a:bodyPr>');
    } else if (kind === 'content') {
      name = 'Title and bullets';
      shapes = title + ph(null, '1', 'Content');
    } else if (kind === 'aims') {
      name = 'Aims';
      // a faint target in the corner
      shapes = [1.9, 1.3, 0.7].map((d, i) => deco(`Target ${i + 1}`, prst('ellipse'), [E(11.7 - d / 2), E(5.75 - d / 2), E(d), E(d)], { line: 'accent1', alpha: 22, lineW: 19050 })).join('')
        + title + ph(null, '1', 'Aims', [E(0.6), E(1.55), E(10.2), E(5.2)]);
    } else if (kind === 'equation') {
      name = 'Key equation';
      const tintFill = tint(deck.color, 0.92), tintLine = tint(deck.color, 0.75);
      shapes = deco('Equation card', prst('roundRect', 8000), [E(0.6), E(1.7), E(12.13), E(2.3)], { fill: tintFill }).replace('<a:ln><a:noFill/></a:ln>', `<a:ln w="12700">${solid(tintLine)}</a:ln>`)
        + deco('Key equation label', prst('roundRect', 50000), [E(0.85), E(1.5), E(2.7), E(0.4)], { fill: 'accent1',
          textXml: `<a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="en-GB" sz="1800" b="1" spc="60" dirty="0">${solid('bg1')}</a:rPr><a:t>KEY EQUATION</a:t></a:r></a:p>` })
        + title + ph(null, '1', 'Notes on the equation', [E(0.6), E(4.3), E(12.13), E(2.45)],
          `<a:lvl1pPr><a:spcBef><a:spcPts val="900"/></a:spcBef><a:defRPr sz="2200"/></a:lvl1pPr>`);
    } else if (kind === 'worked' || kind === 'derivation') {
      // the same layout, with a different label
      const label = kind === 'worked' ? 'Worked example' : 'Derivation';
      name = label;
      shapes = deco(`${label} label`, prst('roundRect', 50000), [E(10.7), E(1.02), E(2.03), E(0.36)], { fill: tint(deck.color, 0.88),
        textXml: `<a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="en-GB" sz="1400" b="1" spc="40" dirty="0">${solid('accent1')}</a:rPr><a:t>${label.toUpperCase()}</a:t></a:r></a:p>` })
        + title + ph(null, '1', 'Question', [E(0.6), E(1.55), E(12.13), E(1.25)], noBullet(2400));
    } else if (kind === 'diagram') {
      name = 'Diagram and bullets';
      // the light panel behind the picture is drawn on each slide, because its width depends on how much text there is
      shapes = title + ph(null, '1', 'Content', [E(8.0), E(1.55), E(4.73), E(5.2)],
          `<a:lvl1pPr><a:defRPr sz="2200"/></a:lvl1pPr><a:lvl2pPr><a:defRPr sz="2000"/></a:lvl2pPr>`);
    } else if (kind === 'question') {
      name = 'Question';
      shapes = deco('Question mark', prst('rect'), [E(11.2), E(4.6), E(1.6), E(2.2)], {
        textXml: `<a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="en-GB" sz="16600" b="1" dirty="0"><a:solidFill>${clrA('accent1', 12)}</a:solidFill></a:rPr><a:t>?</a:t></a:r></a:p>` })
        + title + ph(null, '1', 'Question', [E(0.6), E(1.55), E(10.6), E(5.2)], noBullet(2400) + `<a:lvl2pPr marL="${E(0.6)}" indent="-${E(0.6)}"><a:spcBef><a:spcPts val="900"/></a:spcBef><a:buNone/><a:defRPr sz="2400"/></a:lvl2pPr>`);
    }
    return `${HEAD}<p:sldLayout ${NS} type="${type}" preserve="1"${showMaster ? '' : ' showMasterSp="0"'}><p:cSld name="${name}"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr>${xfrm(0, 0, 0, 0).replace('</a:xfrm>', '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm>')}</p:grpSpPr>${shapes}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;
  }

  function notesMasterXml() {
    return `${HEAD}<p:notesMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>`
      + `<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg" idx="2"/></p:nvPr></p:nvSpPr><p:spPr>${xfrm(685800, 1143000, 5486400, 3086100)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:prstClr val="black"/></a:solidFill></a:ln></p:spPr></p:sp>`
      + `<p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" sz="quarter" idx="3"/></p:nvPr></p:nvSpPr><p:spPr>${xfrm(685800, 4400550, 5486400, 3600450)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/><a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-GB"/><a:t>Notes</a:t></a:r></a:p></p:txBody></p:sp>`
      + '</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
      + `<p:notesStyle><a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1400" kern="1200">${solid('tx1')}<a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr></p:notesStyle></p:notesMaster>`;
  }

  // ---------- The whole file ----------
  const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const rels = (list) => `${HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${list.map(([id, type, target, external]) => `<Relationship Id="${id}" Type="${type.startsWith('http') ? type : `${REL}/${type}`}" Target="${xml(target)}"${external ? ' TargetMode="External"' : ''}/>`).join('')}</Relationships>`;
  const CT = 'application/vnd.openxmlformats-officedocument.presentationml.';

  function build(deck) {
    const files = [];
    const overrides = [];
    const add = (name, data, type) => { files.push([name, data]); if (type) overrides.push([`/${name}`, type]); };
    let imageCount = 0;
    deck.slides.forEach((s, i) => {
      const n = i + 1;
      const out = slideXml(s, deck);
      // name this slide's pictures
      const myRels = [['rId1', 'slideLayout', `../slideLayouts/slideLayout${out.layout}.xml`]];
      out.rels.forEach(([type, target, external], k) => {
        const local = target.match(/IMAGE(\d+)/);
        myRels.push([`rId${k + 2}`, type, local ? `../media/image${imageCount + Number(local[1])}.png` : target, external]);
      });
      out.images.forEach((png, k) => add(`ppt/media/image${imageCount + k + 1}.png`, png));
      imageCount += out.images.length;
      myRels.push([`rId${myRels.length + 1}`, 'notesSlide', `../notesSlides/notesSlide${n}.xml`]);
      add(`ppt/slides/slide${n}.xml`, out.xml, `${CT}slide+xml`);
      add(`ppt/slides/_rels/slide${n}.xml.rels`, rels(myRels));
      add(`ppt/notesSlides/notesSlide${n}.xml`, notesXml(s.notes, n), `${CT}notesSlide+xml`);
      add(`ppt/notesSlides/_rels/notesSlide${n}.xml.rels`, rels([['rId1', 'notesMaster', '../notesMasters/notesMaster1.xml'], ['rId2', 'slide', `../slides/slide${n}.xml`]]));
    });
    const kinds = Object.keys(LAYOUT);
    kinds.forEach((k, i) => {
      add(`ppt/slideLayouts/slideLayout${i + 1}.xml`, layoutXml(k, deck), `${CT}slideLayout+xml`);
      add(`ppt/slideLayouts/_rels/slideLayout${i + 1}.xml.rels`, rels([['rId1', 'slideMaster', '../slideMasters/slideMaster1.xml']]));
    });
    add('ppt/slideMasters/slideMaster1.xml', masterXml(deck), `${CT}slideMaster+xml`);
    add('ppt/slideMasters/_rels/slideMaster1.xml.rels', rels([...kinds.map((_, i) => [`rId${i + 1}`, 'slideLayout', `../slideLayouts/slideLayout${i + 1}.xml`]), [`rId${kinds.length + 1}`, 'theme', '../theme/theme1.xml']]));
    add('ppt/theme/theme1.xml', themeXml(deck.color, `${deck.code} ${deck.title}`), 'application/vnd.openxmlformats-officedocument.theme+xml');
    add('ppt/theme/theme2.xml', themeXml(deck.color, 'Notes'), 'application/vnd.openxmlformats-officedocument.theme+xml');
    add('ppt/notesMasters/notesMaster1.xml', notesMasterXml(), `${CT}notesMaster+xml`);
    add('ppt/notesMasters/_rels/notesMaster1.xml.rels', rels([['rId1', 'theme', '../theme/theme2.xml']]));
    const slideRels = deck.slides.map((_, i) => [`rId${i + 10}`, 'slide', `slides/slide${i + 1}.xml`]);
    add('ppt/_rels/presentation.xml.rels', rels([['rId1', 'slideMaster', 'slideMasters/slideMaster1.xml'], ['rId2', 'notesMaster', 'notesMasters/notesMaster1.xml'],
      ['rId3', 'theme', 'theme/theme1.xml'], ['rId4', 'presProps', 'presProps.xml'], ['rId5', 'viewProps', 'viewProps.xml'], ['rId6', 'tableStyles', 'tableStyles.xml'], ...slideRels]));
    add('ppt/presentation.xml', `${HEAD}<p:presentation ${NS} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:notesMasterIdLst><p:notesMasterId r:id="rId2"/></p:notesMasterIdLst>`
      + `<p:sldIdLst>${deck.slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 10}"/>`).join('')}</p:sldIdLst><p:sldSz cx="${W}" cy="${H}"/><p:notesSz cx="6858000" cy="9144000"/>`
      + `<p:defaultTextStyle><a:defPPr><a:defRPr lang="en-GB"/></a:defPPr></p:defaultTextStyle></p:presentation>`, `${CT}presentation.main+xml`);
    add('ppt/presProps.xml', `${HEAD}<p:presentationPr ${NS}/>`, `${CT}presProps+xml`);
    add('ppt/viewProps.xml', `${HEAD}<p:viewPr ${NS}><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`, `${CT}viewProps+xml`);
    add('ppt/tableStyles.xml', `${HEAD}<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`, `${CT}tableStyles+xml`);
    const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    add('docProps/core.xml', `${HEAD}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`
      + `<dc:title>${xml(`${deck.code} ${deck.title}`)}</dc:title><dc:creator>Mr Silkstone's Physics</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`,
      'application/vnd.openxmlformats-package.core-properties+xml');
    add('docProps/app.xml', `${HEAD}<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Office PowerPoint</Application><Slides>${deck.slides.length}</Slides><PresentationFormat>Widescreen</PresentationFormat></Properties>`,
      'application/vnd.openxmlformats-officedocument.extended-properties+xml');
    add('_rels/.rels', rels([['rId1', 'officeDocument', 'ppt/presentation.xml'], ['rId2', 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties', 'docProps/core.xml'], ['rId3', 'extended-properties', 'docProps/app.xml']]));
    const types = `${HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>`
      + overrides.map(([p, t]) => `<Override PartName="${p}" ContentType="${t}"/>`).join('') + '</Types>';
    files.unshift(['[Content_Types].xml', types]);
    const zip = (typeof window !== 'undefined' && window.Lab && window.Lab.zip) || (typeof require !== 'undefined' && require('./labs/report.js').zip);
    return zip(files.map(([name, data]) => [name, typeof data === 'string' ? enc.encode(data) : data]));
  }

  function download(bytes, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }

  const api = { build, download, tint };
  if (typeof window !== 'undefined') window.Pptx = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
