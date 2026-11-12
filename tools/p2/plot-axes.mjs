// Writes the picture files for click-to-plot parts (js/plot.js) from the question files' plot settings:
// the blank axes (plot.axes, used on printed sheets) and the examiner's graph (plot.ms, shown in the mark scheme).
//   node tools/p2/plot-axes.mjs            every question with a plot part
//   node tools/p2/plot-axes.mjs B5-P02     one question
// The build (tools/p2/validate.mjs) fails if either file doesn't match the settings, so run this after
// changing a plot's axes, points or line. Changing a reviewed question's pictures changes its fingerprint.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { loadQuestions, ROOT } from './build.mjs';
import { buildQuestion } from './generate.mjs';

const Plot = createRequire(import.meta.url)('../../js/plot.js');
const only = process.argv[2];
let written = 0;
let same = 0;

for (const { def } of await loadQuestions()) {
  if (only && def.id !== only) continue;
  const built = buildQuestion(def).question;
  def.parts.forEach((pt, i) => {
    if (!pt.plot) return;
    const p = built.parts[i].plot;
    const files = [[pt.plot.axes, Plot.axesSvg(p)]];
    if (pt.plot.ms) files.push([pt.plot.ms, Plot.axesSvg(p, { title: pt.plot.msTitle, background: true, points: p.points, line: Plot.expectedLine(p) })]);
    for (const [file, svg] of files) {
      const full = path.join(ROOT, file);
      const old = fs.existsSync(full) ? fs.readFileSync(full, 'utf8').replace(/\r\n?/g, '\n') : null;
      if (old === svg) { same++; continue; }
      fs.writeFileSync(full, svg);
      written++;
      console.log(`${def.id} (${pt.label}): wrote ${file}`);
    }
  });
}
console.log(`${written} file(s) written, ${same} already up to date.`);
