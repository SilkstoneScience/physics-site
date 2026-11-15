// Runs the circuit builder's interface tests (tools/circuits/ui-test.html) in real browsers with Playwright.
// Used by .github/workflows/circuits-ui.yml (teacher's decision: Playwright runs only on GitHub, after stage 3).
// It needs Playwright installed in tools/circuits/.pw (the workflow does this) and the site served at BASE.
// Every problem is also written as a GitHub annotation ("::error ..."), which anyone can read on the run's page
// and through GitHub's public API, without signing in (the full log needs a signed-in account).
// The same page can be opened by hand in the preview: http://localhost:<port>/tools/circuits/ui-test.html
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.BASE || 'http://127.0.0.1:8044';
const names = (process.env.BROWSERS || 'chromium,webkit').split(',');
// GitHub's annotation syntax: % and line breaks escaped in both parts; a title also needs : and , escaped.
const clean = (s) => String(s).replace(/%/g, '%25').replace(/\r?\n/g, ' ').slice(0, 400);
const cleanTitle = (s) => clean(s).replace(/:/g, '%3A').replace(/,/g, '%2C');
let failed = 0;
const problem = (title, message) => {
  failed++;
  console.log(`✗ ${title}: ${message}`);
  console.log(`::error title=${cleanTitle(title)}::${clean(message)}`);
};

let playwright;
try {
  playwright = createRequire(path.join(here, '.pw', 'node_modules', 'noop.js'))('playwright');
} catch (e) {
  problem('Playwright not found', e.message);
}

for (const name of playwright ? names : []) {
  let browser;
  try {
    browser = await playwright[name].launch();
    const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()); });
    const response = await page.goto(`${base}/tools/circuits/ui-test.html`, { timeout: 30000 });
    if (!response || !response.ok()) { problem(`${name}: test page`, `could not open it (HTTP ${response ? response.status() : 'no response'})`); continue; }
    await page.waitForFunction(() => window.uiTestResults, null, { timeout: 240000 });
    const r = await page.evaluate(() => window.uiTestResults);
    console.log(`[${name}] ${r.passed} of ${r.total} interface checks passed.`);
    if (!r.total) problem(`${name}: no checks ran`, 'the test page finished without running any checks');
    for (const f of r.failures.slice(0, 15)) problem(`${name}: ${f.name}`, f.detail || 'failed');
    if (r.failures.length > 15) problem(`${name}: more failures`, `${r.failures.length - 15} more checks failed`);
    for (const m of pageErrors.slice(0, 5)) problem(`${name}: error on the page`, m);
  } catch (e) {
    problem(`${name}: the run stopped`, e.message);
  } finally {
    if (browser) await browser.close();
  }
}
console.log(failed ? `${failed} problem(s).` : 'All interface checks passed.');
process.exitCode = failed ? 1 : 0;
