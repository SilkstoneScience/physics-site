// Checks for the revision sheet builder's teacher files (teachers/index.json and teachers/<topic>.json).
// Used by tools/check.mjs. Plan: docs/TEACHERS_PLAN.md.
//
// Each teacher file stores a fingerprint of its topic page (a short code worked out from the page's text).
// When the topic page changes, the fingerprint no longer matches and the checker warns, as a reminder to look
// at the revision summary. After checking it, record the new fingerprint with:
//   node tools/check-teachers.mjs --reviewed a1
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/^﻿/, '');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

// The fingerprint covers the text of the page's <main> (not its markup), so only content changes count.
export function pageFingerprint(rel) {
  const html = read(rel);
  const main = (html.match(/<main>([\s\S]*)<\/main>/) || [, html])[1];
  const text = main.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}

const strongs = (html) => [...html.matchAll(/<strong>([\s\S]*?)<\/strong>/g)].map((m) => m[1].replace(/\.$/, '').trim());

export function checkTeachers({ err, warn, TOPICS }) {
  if (!exists('teachers/index.json')) return;
  let index;
  try { index = JSON.parse(read('teachers/index.json')); } catch (e) { err('teachers/index.json', `isn't valid JSON (${e.message})`); return; }
  const practicals = exists('experimental/practicals.html') ? read('experimental/practicals.html') : '';
  for (const topic of index.topics || []) {
    if (!TOPICS.has(topic)) { err('teachers/index.json', `unknown topic ${topic}`); continue; }
    const slug = topic.replace('.', '').toLowerCase();
    const file = `teachers/${slug}.json`;
    if (!exists(file)) { err('teachers/index.json', `${topic} has no ${file}`); continue; }
    let t;
    try { t = JSON.parse(read(file)); } catch (e) { err(file, `isn't valid JSON (${e.message})`); continue; }
    if (t.topic !== topic) err(file, `"topic" should be "${topic}"`);
    const page = `themes/${slug}.html`;
    if (t.page !== page) err(file, `"page" should be "${page}"`);
    if (!exists(page)) { err(file, `topic page ${page} not found`); continue; }
    const html = read(page);

    // Revision summary
    if (!Array.isArray(t.summary) || !t.summary.length) err(file, 'needs a "summary" list of { heading, html }');
    for (const [i, s] of (t.summary || []).entries()) {
      if (!s.heading || !s.html) err(file, `summary ${i + 1} needs a heading and html`);
      if (((s.html || '').match(/\$/g) || []).length % 2) err(file, `summary "${s.heading}" has an odd number of $ signs`);
      if (/[\t\b\f\r]/.test(s.html || '')) err(file, `summary "${s.heading}" contains a control character: double every backslash`);
      // HL marks: "hl": true on a whole entry, class="hl-only" on a part (an SL sheet leaves both out)
      if ('hl' in s && typeof s.hl !== 'boolean') err(file, `summary "${s.heading}": "hl" must be true or false`);
      const hlTopic = /<span class="tag hl">HL<\/span>\s*only/.test((html.match(/<h1[\s\S]*?<\/h1>/) || [''])[0]) || /hl:\s*true/.test(((read('js/site.js').match(new RegExp(`id: '${topic.replace('.', '\\.')}'[^}]*`)) || [''])[0]));
      if (hlTopic && (s.hl || /class="hl-only"/.test(s.html || ''))) warn(file, `summary "${s.heading}": ${topic} is HL only, so it needs no HL marks`);
      if (!hlTopic && !html.includes('hl-zone') && !/class="tag hl"/.test(html) && (s.hl || /class="hl-only"/.test(s.html || ''))) warn(file, `summary "${s.heading}" is marked HL, but ${page} has no HL content`);
    }

    // Oracy activity (teacher notes): { activity, html }
    if (!t.oracy) warn(file, 'no oracy activity yet');
    else {
      if (!t.oracy.activity || !t.oracy.html) err(file, '"oracy" needs an activity and html');
      if (((t.oracy.html || '').match(/\$/g) || []).length % 2) err(file, 'oracy html has an odd number of $ signs');
      if (/[\t\b\f\r]/.test(t.oracy.html || '')) err(file, 'oracy html contains a control character: double every backslash');
    }

    // Discussion prompts must match the ToK questions and NoS ideas on the topic page.
    const tokBox = (html.match(/<section class="tok"[\s\S]*?<\/section>/) || [''])[0];
    const tokQs = [...(tokBox.match(/<ul class="tok-q">([\s\S]*?)<\/ul>/) || ['', ''])[1].matchAll(/<li><strong>([\s\S]*?)<\/strong>/g)].map((m) => m[1].trim());
    const nosBlock = (tokBox.match(/<h3>Nature of science<\/h3>([\s\S]*?)<\/div>\s*<div>/) || ['', ''])[1];
    const nosNames = [...nosBlock.matchAll(/<p><strong>([\s\S]*?)<\/strong>/g)].map((m) => m[1].replace(/\.$/, '').trim());
    for (const k of Object.keys(t.tokPrompts || {})) if (!tokQs.includes(k)) err(file, `tokPrompts "${k}" doesn't match a ToK question on ${page}`);
    for (const q of tokQs) if (!(t.tokPrompts || {})[q]?.length) warn(file, `no discussion prompts yet for the ToK question "${q}"`);
    for (const k of Object.keys(t.nosPrompts || {})) if (!nosNames.includes(k)) err(file, `nosPrompts "${k}" doesn't match a NoS idea on ${page}`);
    for (const n of nosNames) if (!(t.nosPrompts || {})[n]?.length) warn(file, `no discussion prompts yet for the NoS idea "${n}"`);

    // Videos (also checked weekly by tools/check-links.mjs)
    for (const v of t.videos || []) {
      if (!/^[\w-]{11}$/.test(v.youtube || '')) err(file, `video "${v.title}": "youtube" must be an 11-character video id`);
      if (!v.title || !v.channel || !v.use) err(file, `video ${v.youtube}: needs a title, channel and use`);
    }

    // "Also useful for" labs must be real lab pages with a card on the Practicals page.
    for (const l of t.alsoLabs || []) {
      if (!l.href || !exists(l.href)) { err(file, `alsoLabs: page not found: ${l.href}`); continue; }
      const card = l.href.replace(/^experimental\//, '');
      if (!practicals.includes(`href="${card}"`)) err(file, `alsoLabs: ${l.href} has no card on experimental/practicals.html`);
    }

    // Reminder when the topic page has changed since the summary was last checked
    const now = pageFingerprint(page);
    if (!t.pageFingerprint) warn(file, `the summary hasn't been marked as checked against ${page} yet: after checking it, run node tools/check-teachers.mjs --reviewed ${slug}`);
    else if (t.pageFingerprint !== now) warn(file, `${page} has changed since its revision summary was last checked: look at the summary, then run node tools/check-teachers.mjs --reviewed ${slug}`);
  }
}

// node tools/check-teachers.mjs --reviewed a1 [a2 …]: record that the summaries match their topic pages now.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--reviewed');
  const slugs = i < 0 ? [] : process.argv.slice(i + 1);
  if (!slugs.length) { console.log('Usage: node tools/check-teachers.mjs --reviewed a1 [a2 …]'); process.exit(1); }
  for (const slug of slugs) {
    const file = `teachers/${slug}.json`;
    if (!exists(file)) { console.log(`✗ ${file} not found`); process.exitCode = 1; continue; }
    const raw = read(file);
    const t = JSON.parse(raw);
    const fp = pageFingerprint(t.page);
    // Change only the fingerprint line, so the rest of the file keeps its layout.
    // A file without one yet gets the line straight after "page".
    const out = /"pageFingerprint": "[^"]*"/.test(raw)
      ? raw.replace(/"pageFingerprint": "[^"]*"/, `"pageFingerprint": "${fp}"`)
      : raw.replace(/("page": "[^"]*",)(\r?\n)(\s*)/, `$1$2$3"pageFingerprint": "${fp}",$2$3`);
    if (out === raw && !raw.includes(`"pageFingerprint": "${fp}"`)) { console.log(`✗ ${file}: couldn't find where to record the fingerprint`); process.exitCode = 1; continue; }
    fs.writeFileSync(path.join(ROOT, file), out);
    console.log(`✓ ${file}: recorded the fingerprint of ${t.page} (${fp}).`);
  }
}
