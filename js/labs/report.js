// Makes a Word document (.docx) in the browser, with no library: a .docx is a zip of a few XML files.
// Lab.docx(blocks) returns the file's bytes. Blocks, in order:
//   { h1: 'text' }, { h2: 'text' }, { p: 'text', bold?, italic? }, { qa: ['question', 'answer'] },
//   { table: { head: ['a', 'b'], rows: [['1', '2']] } }, { image: { png: Uint8Array, w: 600, h: 400 } }
(() => {
  const enc = new TextEncoder();
  const xml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // ----- Word XML -----
  function run(text, { bold, italic, size } = {}) {
    const props = (bold ? '<w:b/>' : '') + (italic ? '<w:i/>' : '') + (size ? `<w:sz w:val="${size}"/>` : '');
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
  function image(n, { w, h }) {
    const cx = 5486400, cy = Math.round(cx * h / w);   // 6 inches wide
    return para(`<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${n}" name="Graph ${n}"/>`
      + '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
      + `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${n}" name="graph${n}.png"/><pic:cNvPicPr/></pic:nvPicPr>`
      + `<pic:blipFill><a:blip r:embed="rIdImg${n}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>`
      + `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>`
      + '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>');
  }

  function docx(blocks) {
    const images = [];
    const body = blocks.map(b => {
      if (b.h1) return para(run(b.h1, { bold: true, size: 36 }), 200);
      if (b.h2) return para(run(b.h2, { bold: true, size: 28 }), 120);
      if (b.qa) return para(run(b.qa[0], { bold: true }), 60) + para(run(b.qa[1] || '(no answer)', { italic: !b.qa[1] }), 200);
      if (b.table) return table(b.table);
      if (b.image) { images.push(b.image); return image(images.length, b.image); }
      return para(run(b.p || '', b));
    }).join('');
    const files = [
      ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
        + '<Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
      ['word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + images.map((im, i) => `<Relationship Id="rIdImg${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/graph${i + 1}.png"/>`).join('') + '</Relationships>'],
      ['word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
        + ' xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
        + ' xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        + `<w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`],
      ...images.map((im, i) => [`word/media/graph${i + 1}.png`, im.png]),
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

  const api = { docx, download };
  if (typeof window !== 'undefined') window.Lab = Object.assign(window.Lab || {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})();
