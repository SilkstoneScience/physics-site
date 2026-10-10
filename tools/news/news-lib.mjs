// Shared rules for the science news: categories, their icons, file locations and validation.
// Used by collect.mjs, build.mjs and tools/check.mjs. No packages, so the checker can import it.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const NEWS_DIR = path.join(ROOT, 'news');
export const LATEST_COUNT = 6;   // stories in the home-page panel
// Source text under MIN_SOURCE_WORDS can't be summarised honestly, so the publisher's description is quoted instead
// (agreed with the teacher, October 2026); under MIN_QUOTE_WORDS it is too short to be useful and the story is skipped.
export const MIN_SOURCE_WORDS = 40;
export const MIN_QUOTE_WORDS = 10;

// Category → [label, icon]. Icons are line drawings in the style of the home page's category cards
// (40 × 40 grid; class "o" = orange line, "of" = orange dot). Decorative only.
export const CATEGORIES = {
  physics: ['Physics', '<path d="M4 33H36"/><path class="o" d="M4 20C8 9 12 9 16 20S24 31 28 20S34 12 36 15"/><circle class="of" cx="16" cy="20" r="2.4"/>'],
  astronomy: ['Astronomy', '<path class="o" d="M20 6L22.6 17.4L34 20L22.6 22.6L20 34L17.4 22.6L6 20L17.4 17.4Z"/><circle cx="32" cy="8" r="1.6"/><circle cx="8" cy="31" r="1.2"/><circle class="of" cx="20" cy="20" r="2"/>'],
  space: ['Space', '<circle cx="20" cy="20" r="8"/><ellipse class="o" cx="20" cy="20" rx="16" ry="5" transform="rotate(-20 20 20)"/><circle class="of" cx="34" cy="13" r="2.4"/>'],
  'earth-climate': ['Earth and climate', '<circle cx="20" cy="20" r="14"/><ellipse cx="20" cy="20" rx="6" ry="14"/><path class="o" d="M6 20H34"/><circle class="of" cx="34" cy="20" r="2.4"/>'],
  energy: ['Energy', '<path d="M5 34H35"/><path class="o" d="M23 5L11 21H19L16 33L29 16H21Z"/><circle class="of" cx="29" cy="16" r="2"/>'],
  quantum: ['Quantum', '<path d="M5 9H35M5 19H35M5 32H35"/><path class="o" d="M14 9V30M11 27L14 31L17 27"/><path class="o" d="M21 22C23 18 25 26 27 22S31 18 33 22"/><circle class="of" cx="14" cy="9" r="2.4"/>'],
  particles: ['Particles', '<path d="M20 20L6 8M20 20L35 12M20 20L9 35"/><path class="o" d="M20 20C26 24 30 31 28 36"/><path class="dash" d="M20 20L34 28"/><circle class="of" cx="20" cy="20" r="2.6"/>'],
  technology: ['Technology', '<rect x="10" y="10" width="20" height="20" rx="2"/><path d="M15 10V5M20 10V5M25 10V5M15 30V35M20 30V35M25 30V35M10 15H5M10 25H5M30 15H35M30 25H35"/><rect class="o" x="15" y="15" width="10" height="10" rx="1"/><circle class="of" cx="20" cy="20" r="2"/>'],
};

export const tidyUrl = (u) => {
  try {
    const url = new URL(u);
    url.hash = '';
    for (const k of [...url.searchParams.keys()]) if (/^(utm_|rss|ref$|src$)/i.test(k)) url.searchParams.delete(k);
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    url.protocol = 'https:';
    return url.toString().replace(/\/$/, '');
  } catch { return u; }
};
export const storyId = (key, url) => `${key}-${crypto.createHash('sha1').update(tidyUrl(url)).digest('hex').slice(0, 8)}`;

// The syllabus topics, read from js/site.js so there is only one list.
export function readTopics() {
  const siteJs = fs.readFileSync(path.join(ROOT, 'js/site.js'), 'utf8');
  const topics = [...siteJs.matchAll(/\{ id: '([A-E]\.\d)', title: '([^']+)'([^}]*)\}/g)]
    .map(([, id, title, rest]) => ({ id, title, hl: /hl: true/.test(rest) }));
  if (topics.length < 20) throw new Error('Could not read the syllabus list from js/site.js');
  return topics;
}

const readJson = (file, def) => { try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, '')); } catch (e) { if (e.code === 'ENOENT') return def; throw new Error(`${path.relative(ROOT, file)}: ${e.message}`); } };
export const archiveFiles = () => (fs.existsSync(NEWS_DIR) ? fs.readdirSync(NEWS_DIR).filter((f) => /^archive-\d{4}\.json$/.test(f)).sort() : []);
export const loadArchive = () => archiveFiles().flatMap((f) => readJson(path.join(NEWS_DIR, f), []));
// hidden.json: a list of story ids or article addresses (whichever is easier to copy) for stories the teacher has removed.
export function loadHidden() {
  const list = readJson(path.join(NEWS_DIR, 'hidden.json'), []);
  if (!Array.isArray(list)) throw new Error('news/hidden.json must be a list in square brackets, e.g. ["https://…", "aps-1234abcd"]');
  return list.map((h) => String(h).trim()).filter(Boolean);
}
export const isHidden = (story, hidden) => hidden.some((h) => h === story.id || tidyUrl(h) === tidyUrl(story.url));
export const loadStatus = () => readJson(path.join(NEWS_DIR, 'status.json'), { feeds: {} });

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
export const wordCount = (s) => s.trim().split(/\s+/).length;

// Every problem with one stored story (empty list = fine).
export function storyProblems(s, topicIds) {
  const p = [];
  const str = (k, min, max) => { if (typeof s[k] !== 'string' || s[k].length < min || s[k].length > max) p.push(`${k} must be text of ${min}–${max} characters`); };
  if (!/^[a-z0-9-]+-[0-9a-f]{8}$/.test(s.id ?? '')) p.push('id is missing or badly formed');
  str('title', 5, 250);
  if (!/^https?:\/\/[^\s"<>]+$/.test(s.url ?? '')) p.push('url must be a web address');
  if (!s.source || typeof s.source.key !== 'string' || typeof s.source.name !== 'string') p.push('source must have a key and a name');
  // summaryOrigin "ai" = our AI summary; "publisher" = the publisher's own short description, quoted word for word.
  if (!['ai', 'publisher'].includes(s.summaryOrigin)) p.push('summaryOrigin must be "ai" or "publisher"');
  const [minWords, maxWords] = s.summaryOrigin === 'publisher' ? [MIN_QUOTE_WORDS, MIN_SOURCE_WORDS - 1] : [30, 110];
  str('summary', 40, 900);
  if (typeof s.summary === 'string' && /[<>]|https?:/.test(s.summary)) p.push('summary must not contain markup or links');
  if (typeof s.summary === 'string' && (wordCount(s.summary) < minWords || wordCount(s.summary) > maxWords)) p.push(`summary must be ${minWords}–${maxWords} words`);
  if (!CATEGORIES[s.category]) p.push(`unknown category "${s.category}"`);
  if (!Array.isArray(s.topics) || s.topics.length < 1 || s.topics.length > 2 || s.topics.some((t) => !topicIds.has(t))) p.push('topics must be 1–2 syllabus codes');
  for (const k of ['publishedAt', 'collectedAt', 'featuredAt']) if (!ISO.test(s[k] ?? '')) p.push(`${k} must be a UTC date-time`);
  if (s.image !== null) p.push('image must be null until Stage 2');
  if (!['ok', 'gone'].includes(s.linkStatus)) p.push('linkStatus must be "ok" or "gone"');
  if (typeof s.score !== 'number') p.push('score must be a number');
  return p;
}

// Every problem with the whole archive: each story, plus ids that appear twice.
export function archiveProblems(stories, topicIds) {
  const out = [];
  const seen = new Set();
  for (const s of stories) {
    for (const p of storyProblems(s, topicIds)) out.push(`${s.id ?? '(no id)'}: ${p}`);
    if (seen.has(s.id)) out.push(`${s.id}: appears more than once`);
    seen.add(s.id);
  }
  return out;
}
