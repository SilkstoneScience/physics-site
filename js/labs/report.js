// Makes a Word document (.docx) in the browser, with no library: a .docx is a zip of a few XML files.
// Lab.docx(blocks) returns the file's bytes. Blocks, in order (used by the lab pages):
//   { h1: 'text' }, { h2: 'text' }, { p: 'text', bold?, italic? }, { qa: ['question', 'answer'] },
//   { table: { head: ['a', 'b'], rows: [['1', '2']] } }, { image: { png: Uint8Array, w: 600, h: 400 } }
//
// Lab.docx(blocks, options) adds a full report layout (used by the IA builder, js/ia/export.js; plan: docs/IA_BUILDER_PLAN.md).
// With no options the file is exactly what the lab pages have always made. Options:
//   { report: true, margins: { top, right, bottom, left } (twips; 567 twips = 1 cm), pageNumbers: true }
// adds a style sheet (Calibri 11 pt, Title, Heading1–3, Caption), bullet and numbered lists, page numbers and equations.
// Extra blocks for reports:
//   { para: { runs, style: 'Title' | 'Heading1' | 'Heading2' | 'Heading3' | 'Caption', list: 'bullet' | 'number:<key>',
//             align: 'center', indent: { left, hanging } (twips), keepNext, after (twips) } }
//       runs: [{ t: 'text', b, i, sub, sup }, { math: '<m:oMath>…</m:oMath>' }, { br: true }, { tab: true }]
//   { math: '<m:oMathPara>…</m:oMathPara>' }   an equation on its own line (OMML from js/omml.js with { word: true })
//   { grid: { rows: [[cell]], widths: [percent…], header: 1, size: 20 } }   cell: { runs } or { paras: [runs…] }, plus shade, align
//   { image: { data: Uint8Array, ext: 'png' | 'jpeg', w, h, cx, cy (EMU), align: 'center' } }
(() => {
  const enc = new TextEncoder();
  const xml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // ----- Word XML -----
  function run(text, { bold, italic, size, sub, sup } = {}) {
    const props = (bold ? '<w:b/>' : '') + (italic ? '<w:i/>' : '') + (size ? `<w:sz w:val="${size}"/>` : '')
      + (sub ? '<w:vertAlign w:val="subscript"/>' : sup ? '<w:vertAlign w:val="superscript"/>' : '');
    // keep line breaks the student typed
    return String(text).split('\n').map((line, i) =>
      `${i ? '<w:r><w:br/></w:r>' : ''}<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ''}<w:t xml:space="preserve">${xml(line)}</w:t></w:r>`).join('');
  }
  const para = (inner, after = 120) => `<w:p><w:pPr><w:spacing w:after="${after}"/></w:pPr>${inner}</w:p>`;
  function table({ head, rows }) {
    const cell = (t, b) => `<w:tc><w:p>${run(t, { bold: b, size: 20 })}</w:p></w:tc>`;
    const border = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(s => `<w:${s} w:val="single" w:sz="4" w:color="999999"/>`).join('');
    return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>${border}</w:tblBorders><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>`
      + `<w:tr>${head.map(h => cell(h, true)).join('')}</w:tr>`
      + rows.map(r => `<w:tr>${r.map(v => cell(v)).join('')}</w:tr>`).join('') + '</w:tbl>' + para('');
  }
  function image(n, { w, h, cx: wantCx, cy: wantCy, ext = 'png', align }) {
    const cx = wantCx || 5486400, cy = wantCy || Math.round(cx * h / w);   // 6 inches wide unless given
    const inner = `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${n}" name="Graph ${n}"/>`
      + '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
      + `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${n}" name="graph${n}.${ext}"/><pic:cNvPicPr/></pic:nvPicPr>`
      + `<pic:blipFill><a:blip r:embed="rIdImg${n}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>`
      + `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>`
      + '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
    return align ? `<w:p><w:pPr><w:keepNext/><w:spacing w:before="120" w:after="60"/><w:jc w:val="${align}"/></w:pPr>${inner}</w:p>` : para(inner);
  }

  // ----- report blocks (only with options.report) -----
  function runs(list) {
    return (list || []).map(r => {
      if (r.math) return r.math;
      if (r.br) return '<w:r><w:br/></w:r>';
      if (r.tab) return '<w:r><w:tab/></w:r>';
      return run(r.t || '', { bold: r.b, italic: r.i, sub: r.sub, sup: r.sup, size: r.size });
    }).join('');
  }
  function paraX(p, numId) {
    const list = p.list ? numId(p.list) : null;
    const pPr = (p.style ? `<w:pStyle w:val="${p.style}"/>` : '') + (p.keepNext ? '<w:keepNext/>' : '')
      + (list ? `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${list}"/></w:numPr>` : '')
      + (p.after != null || p.before != null ? `<w:spacing${p.before != null ? ` w:before="${p.before}"` : ''}${p.after != null ? ` w:after="${p.after}"` : ''}/>` : '')
      + (p.indent ? `<w:ind w:left="${p.indent.left || 0}"${p.indent.hanging ? ` w:hanging="${p.indent.hanging}"` : ''}/>` : '')
      + (p.align ? `<w:jc w:val="${p.align}"/>` : '');
    return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${runs(p.runs)}</w:p>`;
  }
  // A cell may also have span: n (across n columns) and vMerge: 'restart' | true (one cell down two rows; used by the
  // graph maker's two-row headings, js/graph-maker.js). Without them a table is exactly as before.
  function grid({ rows, widths, header = 1, size = 20 }, contentWidth) {
    const cols = Math.max(...rows.map(r => r.reduce((n, c) => n + (c.span || 1), 0)));
    const pct = widths && widths.length === cols ? widths : Array(cols).fill(100 / cols);
    const tw = pct.map(p => Math.round(contentWidth * p / 100));
    const border = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(s => `<w:${s} w:val="single" w:sz="4" w:color="808080"/>`).join('');
    const sized = list => (list || []).map(r => (r.math || r.br || r.tab ? r : Object.assign({ size }, r)));
    const cell = (c, i, isHead) => {
      const paras = c.paras || [c.runs || []];
      const shade = c.shade || (isHead ? 'E8EDF4' : null);
      const span = c.span || 1;
      const w = tw.slice(i, i + span).reduce((a, b) => a + b, 0);
      return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${span > 1 ? `<w:gridSpan w:val="${span}"/>` : ''}${c.vMerge ? `<w:vMerge${c.vMerge === 'restart' ? ' w:val="restart"' : ''}/>` : ''}${shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${shade}"/>` : ''}</w:tcPr>`
        + paras.map(ps => `<w:p><w:pPr><w:spacing w:before="40" w:after="40"/>${c.align ? `<w:jc w:val="${c.align}"/>` : ''}</w:pPr>${runs(sized(isHead ? ps.map(r => (r.math || r.br ? r : Object.assign({ b: true }, r))) : ps))}</w:p>`).join('')
        + '</w:tc>';
    };
    return `<w:tbl><w:tblPr><w:tblW w:w="${tw.reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:jc w:val="center"/><w:tblBorders>${border}</w:tblBorders><w:tblLayout w:type="fixed"/>`
      + '<w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>'
      + `<w:tblGrid>${tw.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>`
      + rows.map((r, ri) => `<w:tr>${ri < header ? '<w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>' : '<w:trPr><w:cantSplit/></w:trPr>'}${(() => { let at = 0; return r.map((c) => { const out = cell(c, at, ri < header); at += c.span || 1; return out; }).join(''); })()}</w:tr>`).join('')
      + '</w:tbl>' + para('', 200);
  }

  const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    + '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault>'
    + '<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>'
    + '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>'
    + '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="160"/></w:pPr><w:rPr><w:b/><w:sz w:val="34"/></w:rPr></w:style>'
    + '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="320" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>'
    + '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style>'
    + '<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="160" w:after="60"/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:b/><w:i/></w:rPr></w:style>'
    + '<w:style w:type="paragraph" w:styleId="Caption"><w:name w:val="caption"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="60" w:after="200"/></w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:style>'
    + '<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="60"/><w:ind w:left="720"/></w:pPr></w:style>'
    + '<w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="footer"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0"/><w:jc w:val="center"/></w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:style>'
    + '</w:styles>';
  const FOOTER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    + '<w:p><w:pPr><w:pStyle w:val="Footer"/></w:pPr><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>';
  function numbering(numbered) {
    // abstract 1: bullets; abstract 2: 1. 2. 3.; num 1 = bullets; num 2, 3… = one numbered list each, restarting at 1
    const lvl = (fmt, text, font) => `<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/><w:lvlText w:val="${text}"/><w:lvlJc w:val="left"/>`
      + `<w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>${font ? `<w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/></w:rPr>` : ''}</w:lvl>`;
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
      + `<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="singleLevel"/>${lvl('bullet', '•', 'Calibri')}</w:abstractNum>`
      + `<w:abstractNum w:abstractNumId="2"><w:multiLevelType w:val="singleLevel"/>${lvl('decimal', '%1.')}</w:abstractNum>`
      + '<w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>'
      + numbered.map(id => `<w:num w:numId="${id}"><w:abstractNumId w:val="2"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>`).join('')
      + '</w:numbering>';
  }

  function docx(blocks, options = {}) {
    const report = !!options.report;
    const m = Object.assign({ top: 1134, right: 1134, bottom: 1134, left: 1134 }, options.margins);
    const contentWidth = 11906 - m.left - m.right;
    const images = [];
    const numbered = [], numKeys = {};
    const numId = key => { if (key === 'bullet') return 1; if (!numKeys[key]) { numKeys[key] = numbered.length + 2; numbered.push(numKeys[key]); } return numKeys[key]; };
    const body = blocks.map(b => {
      if (b.h1) return para(run(b.h1, { bold: true, size: 36 }), 200);
      if (b.h2) return para(run(b.h2, { bold: true, size: 28 }), 120);
      if (b.qa) return para(run(b.qa[0], { bold: true }), 60) + para(run(b.qa[1] || '(no answer)', { italic: !b.qa[1] }), 200);
      if (b.table) return table(b.table);
      if (b.image) { images.push(b.image); return image(images.length, b.image); }
      if (report && b.para) return paraX(b.para, numId);
      if (report && b.math) return `<w:p><w:pPr><w:spacing w:before="60" w:after="120"/></w:pPr>${b.math}</w:p>`;
      if (report && b.grid) return grid(b.grid, contentWidth);
      return para(run(b.p || '', b));
    }).join('');
    const ext = im => im.ext || 'png';
    const hasJpeg = images.some(im => ext(im) === 'jpeg');
    const files = [
      ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
        + '<Default Extension="png" ContentType="image/png"/>' + (hasJpeg ? '<Default Extension="jpeg" ContentType="image/jpeg"/>' : '')
        + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
        + (report ? '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
          + '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>'
          + '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' : '')
        + '</Types>'],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
      ['word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + images.map((im, i) => `<Relationship Id="rIdImg${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/graph${i + 1}.${ext(im)}"/>`).join('')
        + (report ? '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
          + '<Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>'
          + '<Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' : '')
        + '</Relationships>'],
      ['word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
        + ' xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
        + ' xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"' + (report ? ' xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"' : '') + '>'
        + `<w:body>${body}<w:sectPr>${report && options.pageNumbers !== false ? '<w:footerReference w:type="default" r:id="rIdFooter"/>' : ''}<w:pgSz w:w="11906" w:h="16838"/>`
        + `<w:pgMar w:top="${m.top}" w:right="${m.right}" w:bottom="${m.bottom}" w:left="${m.left}" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`],
      ...(report ? [['word/styles.xml', STYLES], ['word/numbering.xml', numbering(numbered)], ['word/footer1.xml', FOOTER]] : []),
      ...images.map((im, i) => [`word/media/graph${i + 1}.${ext(im)}`, im.data || im.png]),
    ];
    return zip(files.map(([name, data]) => [name, typeof data === 'string' ? enc.encode(data) : data]));
  }

  // ----- A zip file with no compression ("stored"), which Word reads happily -----
  const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc32 = d => { let c = 0xFFFFFFFF; for (let i = 0; i < d.length; i++) c = CRC[(c ^ d[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(entries) {
    const parts = [], central = [];
    let offset = 0;
    for (const [name, data] of entries) {
      const n = enc.encode(name), crc = crc32(data);
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
      local.setUint32(14, crc, true); local.setUint32(18, data.length, true); local.setUint32(22, data.length, true); local.setUint16(26, n.length, true);
      parts.push(new Uint8Array(local.buffer), n, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, n.length, true);
      c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), n);
      offset += 30 + n.length + data.length;
    }
    const size = central.reduce((s, a) => s + a.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
    end.setUint32(12, size, true); end.setUint32(16, offset, true);
    const all = [...parts, ...central, new Uint8Array(end.buffer)];
    const out = new Uint8Array(all.reduce((s, a) => s + a.length, 0));
    let p = 0; all.forEach(a => { out.set(a, p); p += a.length; });
    return out;
  }

  // Save bytes as a file
  function download(bytes, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }

  const api = { docx, download, zip }; // zip is also used by js/pptx.js (lesson slides)
  if (typeof window !== 'undefined') window.Lab = Object.assign(window.Lab || {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})();
