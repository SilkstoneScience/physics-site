// Checks the sub-part tags on questions ("sections"), used by tools/check.mjs.
// Plan: docs/TEACHERS_PLAN.md, section 6c. The tags say which sections of the topic page a question uses, so a
// future version of the revision sheet builder can offer questions for chosen sub-parts of a topic.
//
//   "sections": ["projectiles", "drag"]   on the question: every section it uses, the MAIN one first
//   "sections": ["drag"]                  on each part of a structured question (Paper 1B / 2): what that part uses
//
// Each tag is the id of an <h2> on the topic's page (themes/a1.html#projectiles), except the ToK box,
// "Common mistakes" and "Check your understanding". Renaming such an id would break the tags, and this check says so.
// Every question must be tagged (except 20-mark linking questions). Generated questions (1b.json, p2.json and their
// local preview files, which hold drafts) get their tags from their recipe files in tools/1b/datasets and
// tools/p2/questions (`sections` on the recipe and on each part), never by hand in the built JSON. The tags are
// left out of the review fingerprints, so tagging never changes a question's review status.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/^﻿/, '');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
const NOT_SECTIONS = new Set(['tok-title', 'mistakes', 'check']);
const PREVIEWS = ['1b-preview.json', 'p2-preview.json']; // drafts, never published: checked too, so tags are added before approval

const sectionCache = new Map();
export function sectionsOf(topic) { // topic "A.1" -> Map(id -> title) of the h2 sections on themes/a1.html
  if (!sectionCache.has(topic)) {
    const page = `themes/${topic.replace('.', '').toLowerCase()}.html`;
    const map = new Map();
    if (exists(page)) {
      for (const m of read(page).matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)) {
        if (!NOT_SECTIONS.has(m[1])) map.set(m[1], { title: m[2].replace(/<[^>]+>/g, '').replace(/^\d+\.\s*/, '').trim(), hl: /class="tag hl"/.test(m[2]) || hlZone(read(page), m.index) });
      }
    }
    sectionCache.set(topic, map);
  }
  return sectionCache.get(topic);
}

// Is this position inside the page's <div class="hl-zone"> (the HL-only part of an SL+HL topic)?
function hlZone(html, at) {
  const start = html.indexOf('<div class="hl-zone">');
  return start >= 0 && at > start;
}

function tagList(v, where, err) {
  if (!Array.isArray(v) || !v.length) { err(where, '"sections" must be a non-empty list of section ids'); return null; }
  if (v.some((s) => typeof s !== 'string' || !s)) { err(where, '"sections" must contain only section ids (text)'); return null; }
  if (new Set(v).size !== v.length) err(where, '"sections" lists a section twice');
  return v;
}

export function checkSections({ err, warn }) {
  const index = JSON.parse(read('questions/index.json'));
  let tagged = 0;
  for (const file of [...index.files, ...PREVIEWS]) {
    if (!exists(`questions/${file}`)) continue;
    for (const q of JSON.parse(read(`questions/${file}`))) {
      if (q.topic === 'Linking') continue; // 20-mark linking questions span several topics: not tagged
      const where = `questions/${file} ${q.id}`;
      const valid = sectionsOf(q.topic);
      if (q.sections === undefined) {
        const how = /^(1b|p2)/.test(file) ? ` (add "sections" to its recipe file in tools/${file.startsWith('1b') ? '1b/datasets' : 'p2/questions'}, and to each part)` : '';
        err(where, `has no "sections" tag (the sections of themes/${q.topic.replace('.', '').toLowerCase()}.html it uses, main one first)${how}`);
        continue;
      }
      const tags = tagList(q.sections, where, err);
      if (!tags) continue;
      tagged++;
      for (const s of tags) if (!valid.has(s)) err(where, `"sections": "${s}" isn't a section of the ${q.topic} page (sections: ${[...valid.keys()].join(', ')})`);
      // An SL question (or SL_HL Paper 1B) should not need HL-only content, unless the whole topic is HL.
      if (q.level !== 'HL') for (const s of tags) if (valid.get(s)?.hl) warn(where, `is ${q.level} but is tagged with the HL-only section "${s}": check the tag (or the question's level)`);
      if (!Array.isArray(q.parts)) {
        if (q.parts !== undefined) err(where, '"parts" should be a list');
        continue;
      }
      // Structured questions: every part is tagged too, and the question's list is exactly what its parts use.
      const used = new Set();
      for (const p of q.parts) {
        const pw = `${where} part (${p.label})`;
        const pt = p.sections === undefined ? (err(pw, 'has no "sections" tag (each part of a tagged question needs one)'), null) : tagList(p.sections, pw, err);
        if (!pt) continue;
        for (const s of pt) {
          used.add(s);
          if (!tags.includes(s)) err(pw, `uses section "${s}", which isn't in the question's "sections" list`);
        }
      }
      for (const s of tags) if (!used.has(s)) err(where, `"sections" lists "${s}", but no part is tagged with it`);
    }
  }
  return tagged;
}
