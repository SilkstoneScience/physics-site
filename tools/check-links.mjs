// Weekly link check for Think deeper (run by .github/workflows/links.yml, or by hand: node tools/check-links.mjs).
// Checks every "Find out more" video and article in think/*.json, any video shown in "What physicists think so far"
// (thinkingVideo) or as a challenge's answer (revealVideo), and the source pages named in photo credits.
// YouTube videos are checked with YouTube's oEmbed lookup, which reports removed and private videos.
// The run fails (and GitHub emails the teacher) only for a definite "not found" or "gone"; a site that is busy,
// slow or blocks automatic visitors is reported as a warning, so there are no false alarms.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['think/concepts.json', 'think/big-questions.json'];
const UA = 'Mozilla/5.0 (compatible; physics-site link check)';

// ----- Collect the links -----
const links = new Map(); // url -> where it is used
for (const file of FILES) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) continue;
  for (const it of JSON.parse(fs.readFileSync(full, 'utf8'))) {
    const add = (url, what) => { if (!links.has(url)) links.set(url, []); links.get(url).push(`${it.id} ${what}`); };
    for (const l of it.links || []) add(l.url, `"${l.title}"`);
    if (it.thinkingVideo) add(`https://www.youtube.com/watch?v=${it.thinkingVideo.youtube}`, `video in "What physicists think so far"`);
    if (it.revealVideo) add(`https://www.youtube.com/watch?v=${it.revealVideo.youtube}`, 'video answer');
    for (const f of [it.figure, it.revealFigure]) {
      for (const m of (f && f.credit ? f.credit : '').matchAll(/href="(https?:[^"]+)"/g)) add(m[1], 'photo credit');
    }
  }
}

// Video ideas in the revision sheet builder's teacher files (teachers/<topic>.json)
const teacherDir = path.join(ROOT, 'teachers');
for (const f of fs.existsSync(teacherDir) ? fs.readdirSync(teacherDir).filter((n) => /^[a-e]\d\.json$/.test(n)) : []) {
  for (const v of JSON.parse(fs.readFileSync(path.join(teacherDir, f), 'utf8')).videos || []) {
    const url = `https://www.youtube.com/watch?v=${v.youtube}`;
    if (!links.has(url)) links.set(url, []);
    links.get(url).push(`teachers/${f} video "${v.title}"`);
  }
}

// ----- Check one link -----
const youtubeId = (url) => (url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/) || [])[1];
async function get(url) {
  return fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
}
async function check(url) {
  const id = youtubeId(url);
  try {
    if (id) {
      const r = await get(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${id}`);
      if (r.ok) { const j = await r.json(); return { status: 'ok', note: `${j.title} [${j.author_name}]` }; }
      if ([400, 404].includes(r.status)) return { status: 'broken', note: 'the video has been removed or made private' };
      if (r.status === 401) return { status: 'warn', note: 'the video exists but its owner has turned off embedding' };
      return { status: 'warn', note: `YouTube answered ${r.status}` };
    }
    const r = await get(url);
    if (r.ok) return { status: 'ok', note: String(r.status) };
    if ([404, 410].includes(r.status)) return { status: 'broken', note: `page not found (${r.status})` };
    return { status: 'warn', note: `couldn't confirm (${r.status})` };
  } catch (e) {
    return { status: 'warn', note: `couldn't connect (${e.name === 'TimeoutError' ? 'timed out' : e.message})` };
  }
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// ----- Run (one at a time, politely; a warning gets one retry) -----
const results = [];
for (const [url, where] of links) {
  let res = await check(url);
  if (res.status === 'warn') { await pause(5000); res = await check(url); }
  results.push({ url, where, ...res });
  console.log(`${{ ok: '✓', warn: '!', broken: '✗' }[res.status]} ${url}  ${res.note}`);
  await pause(1000);
}
const broken = results.filter((r) => r.status === 'broken');
const warns = results.filter((r) => r.status === 'warn');
const summary = [
  `## Think deeper link check`,
  `${results.length} links checked: ${results.length - broken.length - warns.length} fine, ${warns.length} warning(s), ${broken.length} broken.`,
  ...(broken.length ? ['', '### Broken (please replace or remove these in think/*.json)', ...broken.map((r) => `- ${r.url}: ${r.note}. Used in: ${r.where.join('; ')}`)] : []),
  ...(warns.length ? ['', '### Warnings (check by hand if they keep appearing)', ...warns.map((r) => `- ${r.url}: ${r.note}. Used in: ${r.where.join('; ')}`)] : []),
].join('\n');
console.log('\n' + summary);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
process.exit(broken.length ? 1 : 0);
