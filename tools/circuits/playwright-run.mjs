// Runs the circuit builder's interface tests (tools/circuits/ui-test.html) in real browsers with Playwright.
// Used by .github/workflows/circuits-ui.yml (teacher's decision: Playwright runs only on GitHub, after stage 3).
// It needs Playwright installed in tools/circuits/.pw (the workflow does this) and the site served on PORT.
// The same page can be opened by hand in the preview: http://localhost:<port>/tools/circuits/ui-test.html
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(here, '.pw', 'node_modules', 'noop.js'));
const playwright = require('playwright');
const port = process.env.PORT || 8044;
const names = (process.env.BROWSERS || 'chromium,webkit').split(',');

let failed = 0;
for (const name of names) {
  const browser = await playwright[name].launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  page.on('pageerror', (e) => console.log(`[${name}] error on the page: ${e.message}`));
  let ok = false;
  for (let attempt = 0; attempt < 10 && !ok; attempt++) { // the server may still be starting
    try { await page.goto(`http://localhost:${port}/tools/circuits/ui-test.html`); ok = true; } catch (e) { await new Promise((r) => setTimeout(r, 1000)); }
  }
  if (!ok) { console.log(`[${name}] could not open the test page`); failed++; await browser.close(); continue; }
  await page.waitForFunction(() => window.uiTestResults, null, { timeout: 180000 });
  const r = await page.evaluate(() => window.uiTestResults);
  console.log(`[${name}] ${r.passed} of ${r.total} interface checks passed.`);
  for (const f of r.failures) console.log(`  ✗ ${f.name}${f.detail ? ` (${f.detail})` : ''}`);
  if (!r.total) failed++;
  failed += r.failures.length;
  await browser.close();
}
process.exitCode = failed ? 1 : 0;
