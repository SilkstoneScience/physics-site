// Checks for the lesson slide generator's data files (teachers/slides/index.json and teachers/slides/<topic>.json).
// Used by tools/check.mjs. Plan: docs/SLIDES_PLAN.md.
// It also lists any LaTeX command the equation converter (js/omml.js) hasn't been written for, so a slide file
// can't contain an equation that would come out wrong in PowerPoint.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/^﻿/, '');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
const require = createRequire(import.meta.url);

const TYPES = { bullets: ['title', 'bullets'], equation: ['title', 'latex'], diagram: ['title'], worked: ['title', 'question', 'hint', 'steps'], derivation: ['title', 'start', 'steps'] };

export function checkSlides({ err, warn, TOPICS }) {
  if (!exists('teachers/slides/index.json')) return;
  const { unsupported } = require(path.join(ROOT, 'js/omml.js'));
  let index;
  try { index = JSON.parse(read('teachers/slides/index.json')); } catch (e) { err('teachers/slides/index.json', `isn't valid JSON (${e.message})`); return; }
  const concepts = exists('think/concepts.json') ? JSON.parse(read('think/concepts.json')) : [];
  const questions = JSON.parse(read('questions/index.json')).files.flatMap((f) => (exists(`questions/${f}`) ? JSON.parse(read(`questions/${f}`)) : []));

  for (const topic of index.topics || []) {
    if (!TOPICS.has(topic)) { err('teachers/slides/index.json', `unknown topic ${topic}`); continue; }
    const slug = topic.replace('.', '').toLowerCase();
    const file = `teachers/slides/${slug}.json`;
    if (!exists(file)) { err('teachers/slides/index.json', `${topic} has no ${file}`); continue; }
    let d;
    try { d = JSON.parse(read(file)); } catch (e) { err(file, `isn't valid JSON (${e.message})`); continue; }
    if (d.topic !== topic) err(file, `"topic" should be "${topic}"`);
    // "hours": the guide's SL-and-HL hours (0 for an HL-only subtopic); "hlHours": its additional HL hours
    if (!(d.hours >= 0) || !(d.hours > 0 || d.hlHours > 0)) err(file, '"hours" (the guide\'s teaching hours, and "hlHours" for HL content) is missing');
    const page = exists(`themes/${slug}.html`) ? read(`themes/${slug}.html`) : '';
    const h2 = new Set([...page.matchAll(/<h2 id="([^"]+)"/g)].map((m) => m[1]));
    const figures = new Set([...page.matchAll(/<figure[\s\S]*?<\/figure>/g)].flatMap((m) => [...m[0].matchAll(/<title id="([^"]+)"/g)].map((t) => t[1])));
    // every equation, in $…$ inside text, or a latex field
    const maths = (where, text) => {
      for (const m of String(text ?? '').matchAll(/\$([^$]+)\$/g)) mathOk(where, m[1]);
    };
    const mathOk = (where, latex) => {
      const bad = unsupported(latex);
      if (bad.length) err(file, `${where}: the equation converter can't handle ${bad.join(', ')} in "${latex}" (add it to js/omml.js and test it in PowerPoint, or rewrite the equation)`);
      if ((latex.match(/\{/g) || []).length !== (latex.match(/\}/g) || []).length) err(file, `${where}: unbalanced braces in "${latex}"`);
      // a lost backslash: "\t" in JSON is a tab, and "sqrt{" or "text{" without "\" shows as plain letters
      if (/[\t\n\r\f\b]/.test(latex)) err(file, `${where}: a control character in "${JSON.stringify(latex)}" (in JSON, write \\\\text, \\\\theta, \\\\tan… with two backslashes)`);
      const bare = latex.match(/(?<![\\a-zA-Z])(sqrt|frac|dfrac|tfrac|text|cos|sin|tan|circ|qquad|quad|times|theta|Delta|approx)(?=[{\s\d^_(]|$)/);
      if (bare) err(file, `${where}: "${bare[1]}" without its backslash in "${latex}"`);
    };
    const ids = new Set();
    let total = 0, hlTotal = 0;
    for (const p of d.points || []) {
      const at = `point "${p.id}"`;
      if (!p.id || ids.has(p.id)) err(file, `${at}: missing or repeated id`);
      ids.add(p.id);
      for (const k of ['short', 'guide']) if (!p[k]) err(file, `${at}: "${k}" is missing`);
      if (!(p.minutes > 0)) err(file, `${at}: "minutes" (estimated teaching time) is missing`);
      // extras (not in the guide's list for this topic) don't count towards its hours; HL points count towards the HL hours
      if (!p.extra) { if (p.hl) hlTotal += p.minutes || 0; else total += p.minutes || 0; }
      if (p.hl !== undefined && p.hl !== true) err(file, `${at}: "hl" should be true or left out`);
      if (!d.hours && !p.hl) err(file, `${at}: ${topic} is HL only, so every point needs "hl": true`);
      if (!Array.isArray(p.aims) || !p.aims.length) err(file, `${at}: needs 1–2 aims`);
      else if (p.aims.length > 2) warn(file, `${at}: has ${p.aims.length} aims (the plan says 1–2)`);
      (p.aims || []).forEach((a) => maths(`${at} aim`, a));
      if (!Array.isArray(p.sections) || !p.sections.length) err(file, `${at}: "sections" is missing`);
      for (const s of p.sections || []) if (!h2.has(s)) err(file, `${at}: section "${s}" isn't an <h2 id> on themes/${slug}.html`);
      (p.slides || []).forEach((s, i) => {
        const where = `${at}, slide ${i + 1} (${s.type})`;
        if (!TYPES[s.type]) { err(file, `${where}: unknown slide type`); return; }
        for (const k of TYPES[s.type]) if (s[k] == null || s[k] === '') err(file, `${where}: "${k}" is missing`);
        maths(where, s.title); maths(where, s.question); maths(where, s.hint); maths(where, s.notes); maths(where, s.start);
        (s.bullets || []).flat().forEach((b) => maths(where, b));
        [].concat(s.latex || []).forEach((l) => mathOk(where, l));
        if (s.type === 'equation' && [].concat(s.latex).length > 4) err(file, `${where}: at most four equations fit in the card`);
        if (s.type === 'diagram' && s.svg) {
          // a figure drawn just for the slides: needs alt text, and no ids or <defs> (the arrowheads are the page's #ah1–#ah3)
          if (!s.alt) err(file, `${where}: a figure file needs "alt" text`);
          if (!exists(`teachers/slides/${s.svg}`)) err(file, `${where}: teachers/slides/${s.svg} is missing`);
          else if (/\sid="|<defs/.test(read(`teachers/slides/${s.svg}`))) err(file, `${where}: ${s.svg} must not contain ids or <defs>`);
        } else if (s.type === 'diagram' && !figures.has(s.figure)) err(file, `${where}: no figure with <title id="${s.figure}"> on themes/${slug}.html`);
        if (s.type === 'bullets' && s.bullets.flat().length > 8) warn(file, `${where}: ${s.bullets.flat().length} bullets may not fit on one slide`);
        if (s.type === 'worked' || s.type === 'derivation') {
          if (!Array.isArray(s.steps) || !s.steps.length) err(file, `${where}: needs steps`);
          (s.steps || []).forEach((st, k) => {
            if (!st.text && !st.latex) err(file, `${where}, step ${k + 1}: needs text or latex`);
            maths(`${where}, step ${k + 1}`, st.text);
            if (st.latex) mathOk(`${where}, step ${k + 1}`, st.latex);
          });
        }
      });
      if (p.challenge) {
        const cc = concepts.find((c) => c.id === p.challenge);
        if (!cc) err(file, `${at}: concept challenge ${p.challenge} isn't in think/concepts.json`);
        else if (cc.topic !== topic) warn(file, `${at}: concept challenge ${p.challenge} is for ${cc.topic}`);
      }
      for (const q of p.checks || []) {
        const found = questions.find((x) => x.id === q);
        if (!found) err(file, `${at}: quick-check question ${q} isn't in the question bank`);
        else if (found.paper !== '1A') err(file, `${at}: quick-check question ${q} isn't a Paper 1A question`);
      }
    }
    if (total !== (d.hours || 0) * 60) warn(file, `the SL-and-HL points' minutes add up to ${total}, but the guide gives ${d.hours || 0} hours (${(d.hours || 0) * 60} minutes)`);
    if (hlTotal !== (d.hlHours || 0) * 60) warn(file, `the HL points' minutes add up to ${hlTotal}, but the guide gives ${d.hlHours || 0} additional HL hours (${(d.hlHours || 0) * 60} minutes)`);
    // an HL point's quick check may be HL; an SL point's must be SL
    for (const p of d.points || []) for (const q of p.checks || []) {
      const found = questions.find((x) => x.id === q);
      if (found && !p.hl && found.level === 'HL') err(file, `point "${p.id}": quick-check question ${q} is HL, but the point is SL`);
    }
  }
}
