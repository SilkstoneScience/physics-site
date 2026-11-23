/**
 * @OnlyCurrentDoc
 * (This line limits the script's permission to this one spreadsheet, instead of all your Google Sheets.)
 *
 * Lightspeed leaderboard: a Google Apps Script web app that stores scores in this Google Sheet.
 * Setup (click by click): docs/LIGHTSPEED_SETUP.md in the physics-site repository.
 *
 * The sheet tab "Scores" holds one row per finished round:
 *   Time | Name | Board | Score | Correct | Hide
 * To remove a score (a rude name, a test), type anything in its "Hide" cell. Deleting the row works too.
 *
 * GET  ?board=A&range=week   -> { ok: true, rows: [{ name, score, correct }] }   (best score per name, top 20)
 * POST {"name","board","score","correct"} as text -> { ok: true } or { ok: false, error }
 */

const SHEET_NAME = 'Scores';
const BOARDS = ['A', 'B', 'C', 'D', 'E', 'ALL'];
const MAX_SCORE = 3400;           // must match MAX_SCORE in js/lightspeed.js
const MAX_PER_QUESTION = 400;     // 200 points at most, times the ×2 streak multiplier
const TOP = 20;
// Names containing any of these are refused. Add more in lower case if you need to.
const BLOCKED = ['fuck', 'shit', 'cunt', 'bitch', 'dick', 'cock', 'pussy', 'wank', 'twat', 'bastard', 'nigg', 'fag', 'retard', 'slut', 'whore', 'porn', 'penis', 'vagina', 'sex'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['Time', 'Name', 'Board', 'Score', 'Correct', 'Hide']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function cleanName_(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

function nameProblem_(name) {
  if (name.length < 2 || name.length > 20) return 'Names must be 2 to 20 characters long.';
  if (!/^[\p{L}\p{N} .'-]+$/u.test(name)) return 'Names can use only letters, numbers, spaces, full stops, hyphens and apostrophes.';
  const squashed = name.toLowerCase().replace(/[^a-z]/g, '');
  if (BLOCKED.some((w) => squashed.indexOf(w) >= 0)) return 'Please choose a different name.';
  return '';
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  const board = String(p.board || 'A').toUpperCase();
  const range = p.range === 'all' ? 'all' : 'week';
  if (BOARDS.indexOf(board) < 0) return json_({ ok: false, error: 'Unknown board.' });

  const cache = CacheService.getScriptCache();
  const cacheKey = 'board-' + board + '-' + range;
  const hit = cache.get(cacheKey);
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);

  const values = sheet_().getDataRange().getValues().slice(1);
  const since = range === 'week' ? startOfWeek_() : null;
  const best = {};
  values.forEach((r) => {
    const [time, name, b, score, correct, hide] = r;
    if (String(b) !== board || hide !== '' && hide !== null) return;
    if (since && !(time instanceof Date && time >= since)) return;
    const key = String(name).toLowerCase();
    if (!best[key] || Number(score) > best[key].score) best[key] = { name: String(name), score: Number(score), correct: Number(correct) };
  });
  const rows = Object.keys(best).map((k) => best[k]).sort((a, b) => b.score - a.score).slice(0, TOP);
  const out = JSON.stringify({ ok: true, rows: rows });
  cache.put(cacheKey, out, 20);   // seconds: a whole class loading at once reads the sheet only a few times
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'Unreadable score.' }); }
  const name = cleanName_(d.name);
  const board = String(d.board || '').toUpperCase();
  const score = Number(d.score);
  const correct = Number(d.correct);
  const problem = nameProblem_(name);
  if (problem) return json_({ ok: false, error: problem });
  if (BOARDS.indexOf(board) < 0) return json_({ ok: false, error: 'Unknown board.' });
  if (!Number.isInteger(score) || !Number.isInteger(correct) || score < 0 || score > MAX_SCORE || correct < 0 || correct > 10 || score > correct * MAX_PER_QUESTION) {
    return json_({ ok: false, error: 'That score could not be accepted.' });
  }

  const cache = CacheService.getScriptCache();
  const recent = 'recent-' + name.toLowerCase();
  if (cache.get(recent)) return json_({ ok: false, error: 'Scores from one name can be sent once every 30 seconds.' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet_().appendRow([new Date(), name, board, score, correct, '']);
  } finally {
    lock.releaseLock();
  }
  cache.put(recent, '1', 30);
  cache.removeAll(['board-' + board + '-week', 'board-' + board + '-all']);
  return json_({ ok: true });
}

// Monday 00:00 this week, in the script's time zone (File > Project settings).
function startOfWeek_() {
  const now = new Date();
  const tz = Session.getScriptTimeZone();
  const dow = Number(Utilities.formatDate(now, tz, 'u')); // 1 = Monday … 7 = Sunday
  const today = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  const monday = new Date(Utilities.parseDate(today, tz, 'yyyy-MM-dd').getTime() - (dow - 1) * 86400000);
  return monday;
}

// Run this once from the editor (select "setup" and press Run) to create the Scores tab and grant permissions.
function setup() {
  sheet_();
}
