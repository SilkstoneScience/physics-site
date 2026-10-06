// Builds the lesson-slides part of resources.html and the "Lesson slides" buttons on topic pages.
// To add or change a deck: edit THEMES below (title, Google Drive file id, size in MB), then run: node tools/build-resources.mjs
import fs from 'fs';
import { fileURLToPath } from 'url';
const SITE = fileURLToPath(new URL('..', import.meta.url));

// [title shown, Google Drive file id, size in MB]
const D = (t, id, mb) => ({ t, id, mb });
const HL12 = D('D.1–D.2 Gravitational, electric and magnetic fields: HL', '1bFVfxZq7rK937q0tvUGlZ1hQ_CG1EIeK', 7.8);
const THEMES = [
 ['A', 'Space, time and motion', [
  ['a1', 'A.1 Kinematics', [D('A.1 Kinematics', '1Y0rqAiEvYNis4EFUQxj-UqMMuoqKXGVB', 6.3)]],
  ['a2', 'A.2 Forces and momentum', [D('A.2a Forces', '1Wfsrrriu1EDj3SNAUCEE0-QGr9mrNG6x', 11.2), D('A.2b Momentum', '1T6dJlwBXGChOXwnNUfeBel3wRzH1jaTh', 4.5), D('A.2c Circular motion', '1IkVq5PhnD7Vqgca-b1vWMFb-3tDjUQjD', 6.3)]],
  ['a3', 'A.3 Work, energy and power', [D('A.3 Work, energy and power', '1OTVECA9M2xjcIrsEnw5uYarTtDTpTUg1', 12.7)]],
  ['a4', 'A.4 Rigid body mechanics', [D('A.4 Rigid body mechanics', '1YkKZkncq7owXVvYnwQDmHnJPSg8pVx2k', 13.2)], true],
  ['a5', 'A.5 Galilean and special relativity', [D('A.5 Relativity', '13tNfC7JYo9ZRWwPask3A89nopNprpEml', 13.3)], true]]],
 ['B', 'The particulate nature of matter', [
  ['b1', 'B.1 Thermal energy transfers', [D('B.1 Thermal concepts', '1KF4yL-enXZiyJ9Gx2KO-YJL0W0lX4ZWS', 50.8)]],
  ['b2', 'B.2 Greenhouse effect', [D('B.2 Greenhouse effect', '1KBLS36NygR-dmUSq2oW08aKVcHhcClT4', 3.5)]],
  ['b3', 'B.3 Gas laws', [D('B.3 Gas laws', '1Kfl_dPBHQKiZsMxKhwtqHSBm3xOtJNrq', 4.0)]],
  ['b4', 'B.4 Thermodynamics', [D('B.4 Thermodynamics', '1KdJPM_OvC4jQA71blHMbf21WNaiqL0RY', 10.1)], true],
  ['b5', 'B.5 Current and circuits', [D('B.5a Electric circuits', '1KaeYBqi0rv4HcZAeCz33IC7jLL_hq3cq', 4.4), D('B.5b Cells', '1KYagMEjxTmPLB8oReVLfun6xKAZw17Lo', 1.8)]]]],
 ['C', 'Wave behaviour', [
  ['c1', 'C.1 Simple harmonic motion', [D('C.1 Simple harmonic motion: SL', '1KmweUblqsdIAjCKtCyL8flr9gIs5-wV-', 3.2), D('C.1 Simple harmonic motion: HL', '1KoUVUonS0WkK-3d4ILyMqP73Lp__nkMm', 1.9)]],
  ['c2', 'C.2 Wave model', [D('C.2 Wave model', '1Kmp864wMgJGnkGK6G3Lr764fVNfKIvsq', 6.3)]],
  ['c3', 'C.3 Wave phenomena', [D('C.3 Wave phenomena: SL', '1KjHfUK23XHCL1muMU6j22bhWmReN2vfL', 15.1), D('C.3 Wave phenomena: HL', '1KjjydtnLZMSJ_I5yWc6Tv4GmKNRnFPMi', 2.6)]],
  ['c4', 'C.4 Standing waves and resonance', [D('C.4 Standing waves and resonance', '1Krgmxum_zFvwerq_lH6o5dkMwp-J2_Ir', 13.7)]],
  ['c5', 'C.5 Doppler effect', [D('C.5 Doppler effect', '1KrYm2ES8f-4dWbAUhx9ZSKeE8C4uDi_T', 11.5)]]]],
 ['D', 'Fields', [
  ['d1', 'D.1 Gravitational fields', [D('D.1 Gravitational fields: SL', '11l0NWqBLfSl8KZyEqAeQoixxGix46VKz', 11.7), HL12]],
  ['d2', 'D.2 Electric and magnetic fields', [D('D.2 Electric and magnetic fields: SL', '1KtwA1EkwYQvfOneQp03Bc--LTRrjeMhH', 12.4), HL12]],
  ['d3', 'D.3 Motion in electromagnetic fields', [D('D.3 Motion in electromagnetic fields', '1WhlU8aIgVLJfXUeXFwMUpvZfyq5Ex3Vs', 8.1)]],
  ['d4', 'D.4 Induction', [D('D.4 Induction', '1tt0GXOANyjenkUtUPsXtBmYOOHRMOQyt', 6.1)], true]]],
 ['E', 'Nuclear and quantum physics', [
  ['e1', 'E.1 Structure of the atom', [D('E.1 Structure of the atom: SL', '13zBvBBi-wTRKSE94qoxtkEIYvS-Wvo3Y', 7.3), D('E.1 Structure of the atom: HL', '13h6FnKLZRpaaxZ8o_Y5d5AJVU9-gcgYT', 2.1)]],
  ['e2', 'E.2 Quantum physics', [D('E.2 Quantum physics', '13wea8XWitc6iSp9MydmmoTlrhCI_4Gv8', 3.2)], true],
  ['e3', 'E.3 Radioactive decay', [D('E.3 Radioactivity: SL', '148yCqpYMrLXGlVYUVp3AM8hoanBbBAOz', 177.6), D('E.3 Radioactivity: HL', '13q32gfM0xmuBxCzHa2Z1io-n50P3na4M', 1.7)]],
  ['e4', 'E.4 Fission', [D('E.4 Fission', '14CtljJAoYfe2YXF97BxKM36MSmA1fa3i', 8.7)]],
  ['e5', 'E.5 Fusion and stars', [D('E.5 Fusion and stars', '14ABaVtbRy4Q6MOzEzE-XY68GnZDiloki', 7.0)]]]],
];
const PREVIEW_LIMIT_MB = 100;   // Google Drive won't preview bigger files

const esc = s => s.replace(/&/g, '&amp;');
const mb = x => x >= 10 ? Math.round(x) + ' MB' : x.toFixed(1) + ' MB';
let n = 0;
const out = [];
out.push(`    <nav class="theme-jump" aria-label="Jump to a theme">`);
for (const [L, name] of THEMES) out.push(`      <a data-theme="${L}" href="#theme-${L.toLowerCase()}"><b>${L}</b> ${name}</a>`);
out.push(`    </nav>`, '');
for (const [L, name, topics] of THEMES) {
  out.push(`    <h2 id="theme-${L.toLowerCase()}" class="theme-head" data-theme="${L}">Theme ${L}: ${name}</h2>`);
  for (const [id, title, decks, hlOnly] of topics) {
    out.push(`    <section class="deck-group" id="slides-${id}" data-theme="${L}">`);
    out.push(`      <h3>${esc(title)}${hlOnly ? ' <span class="tag hl">HL only</span>' : ''} <a class="deck-notes" href="themes/${id}.html">Notes →</a></h3>`);
    for (const d of decks) {
      n++;
      const box = `deck-${n}`, open = `https://drive.google.com/file/d/${d.id}/view`;
      const tooBig = d.mb > PREVIEW_LIMIT_MB;
      out.push(`      <div class="deck">`);
      out.push(`        <p class="deck-title">${esc(d.t)} <span class="deck-size">${mb(d.mb)}</span></p>`);
      out.push(`        <p class="deck-actions">` +
        (tooBig ? `<span class="deck-note">Too large to show here.</span> ` :
          `<button type="button" class="button secondary" data-slides="${d.id}" data-title="${esc(d.t)}" aria-expanded="false" aria-controls="${box}">Show slides</button> `) +
        `<a href="${open}" target="_blank" rel="noopener">Open in Google Drive&nbsp;↗</a></p>`);
      if (!tooBig) out.push(`        <div class="embed-frame deck-frame" id="${box}" hidden></div>`);
      out.push(`      </div>`);
    }
    out.push(`    </section>`);
  }
  out.push('');
}
const block = out.join('\n');

// ---- resources.html: replace everything between the markers ----
const rp = SITE + '/resources.html';
let r = fs.readFileSync(rp, 'utf8');
const nlR = r.includes('\r\n') ? '\r\n' : '\n';
const START = '<!-- LESSON SLIDES START -->', END = '<!-- LESSON SLIDES END -->';
if (!r.includes(START)) throw new Error('markers missing in resources.html');
r = r.slice(0, r.indexOf(START) + START.length) + nlR + block.replace(/\n/g, nlR) + nlR + '    ' + r.slice(r.indexOf(END));
fs.writeFileSync(rp, r);

// ---- topic pages: "Lesson slides" button beside the guiding questions ----
for (const [, , topics] of THEMES) for (const [id, , decks] of topics) {
  const p = `${SITE}/themes/${id}.html`;
  let s = fs.readFileSync(p, 'utf8');
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  if (s.includes('class="slides-link"')) continue;
  const a = s.indexOf('    <aside class="guiding"'), b = s.indexOf('</aside>', a) + '</aside>'.length;
  if (a < 0) throw new Error(id + ': no guiding box');
  const aside = s.slice(a, b).split(nl).map(l => '  ' + l).join(nl);
  const link = `      <a class="slides-link" href="../resources.html#slides-${id}">` +
    `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8"/><path d="M10 8.5v4l3.5-2z"/></svg>` +
    `<span>Lesson slides</span><small>${decks.length > 1 ? decks.length + ' decks' : '1 deck'}</small></a>`;
  s = s.slice(0, a) + `    <div class="guiding-row">${nl}${aside}${nl}${link}${nl}    </div>` + s.slice(b);
  fs.writeFileSync(p, s);
}
console.log(`Built ${n} decks.`);
