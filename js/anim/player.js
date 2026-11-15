/* Shared player for the animations (animations/*.html). Plan: docs/ANIMATIONS_PLAN.md.
   A scene file calls Anim.register(name, { duration, poster, resize(s), frame(s, t) }).
   The page has <figure class="anim-stage" data-anim="name"><canvas ...></canvas></figure>;
   the player adds the controls, sizes the canvas, plays when visible and loops.
   ?t=12 in the address freezes every animation on the page at 12 s (for checking frames). */
(() => {
  'use strict';

  // ---------- maths helpers ----------
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: (a) => Math.hypot(a[0], a[1], a[2]),
  };
  V.norm = (a) => V.mul(a, 1 / V.len(a));
  // Rotate v about the unit vector k by angle a (right-hand rule).
  V.rot = (v, k, a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return V.add(V.add(V.mul(v, c), V.mul(V.cross(k, v), s)), V.mul(k, V.dot(k, v) * (1 - c)));
  };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const lerp = (a, b, x) => a + (b - a) * x;
  // 0 before a, rising over fin, 1 until b - fout, falling to 0 at b.
  const fade = (t, a, b, fin = 0.5, fout = 0.7) => Math.min(smooth((t - a) / fin), smooth((b - t) / fout));

  // ---------- colours on the dark stage (r,g,b strings) ----------
  const C = {
    bg: '#04060d', text: '236,240,255', muted: '170,182,220',
    vel: '143,184,255', force: '255,170,85', pos: '255,79,123', neg: '63,211,255',
    field: '140,135,255', light: '255,214,102', good: '111,211,154', white: '255,255,255',
  };
  const SANS = '"Segoe UI", system-ui, -apple-system, sans-serif';
  const SERIF = '"Cambria Math", Cambria, Georgia, serif';

  // ---------- drawing helpers (s = stage state) ----------
  const D = {};
  D.background = (s, glow = 0.35) => {
    const { g, W, H } = s;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const rg = g.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.max(W, H) * 0.7);
    rg.addColorStop(0, `rgba(38,48,120,${glow})`); rg.addColorStop(1, 'rgba(4,6,13,0)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
  };
  D.vignette = (s, t, duration) => {
    const { g, W, H } = s;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.6);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    const black = Math.max(1 - smooth(t / 0.6), smooth((t - (duration - 0.6)) / 0.6));
    if (black > 0) { g.fillStyle = `rgba(4,6,13,${black})`; g.fillRect(0, 0, W, H); }
  };
  D.glowDot = (s, x, y, R, rgb, a) => {
    const { g } = s; if (a <= 0) return;
    g.globalCompositeOperation = 'lighter';
    const rg = g.createRadialGradient(x, y, 0, x, y, R);
    rg.addColorStop(0, `rgba(255,255,255,${0.9 * a})`);
    rg.addColorStop(0.18, `rgba(${rgb},${0.85 * a})`);
    rg.addColorStop(0.45, `rgba(${rgb},${0.22 * a})`);
    rg.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = rg; g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = 'source-over';
  };
  // A glowing polyline: pts = [[x,y], ...]; alphaAt(i) optional per-point brightness.
  D.glowLine = (s, pts, rgb, a, width = 1.6, alphaAt = null) => {
    const { g } = s; if (a <= 0 || pts.length < 2) return;
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    const CH = alphaAt ? 4 : pts.length;
    for (let j = 0; j < pts.length - 1; j += CH) {
      const end = Math.min(j + CH, pts.length - 1);
      const aa = a * (alphaAt ? alphaAt((j + end) >> 1) : 1);
      g.beginPath(); g.moveTo(pts[j][0], pts[j][1]);
      for (let k = j + 1; k <= end; k++) g.lineTo(pts[k][0], pts[k][1]);
      g.strokeStyle = `rgba(${rgb},${0.10 * aa})`; g.lineWidth = width * 7; g.stroke();
      g.strokeStyle = `rgba(${rgb},${0.28 * aa})`; g.lineWidth = width * 3; g.stroke();
      g.strokeStyle = `rgba(${rgb},${0.95 * aa})`; g.lineWidth = width; g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
  };
  // A plain thin line (axes, grid).
  D.line = (s, x1, y1, x2, y2, rgb, a, w = 1, dash = null) => {
    const { g } = s; if (a <= 0) return;
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = `rgba(${rgb},${a})`; g.lineWidth = w; g.setLineDash(dash || []);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.setLineDash([]);
  };
  // A glowing arrow in screen coordinates; label drawn beyond the tip.
  D.arrow = (s, ax, ay, bx, by, rgb, a, label = '', opts = {}) => {
    const { g } = s; if (a <= 0) return;
    const dx = bx - ax, dy = by - ay, dl = Math.hypot(dx, dy);
    if (dl < 4) return;
    const ux = dx / dl, uy = dy / dl, h = Math.min(opts.head || 12, dl * 0.4);
    g.globalCompositeOperation = 'source-over'; g.lineCap = 'round';
    g.strokeStyle = `rgba(${rgb},${a})`; g.fillStyle = `rgba(${rgb},${a})`;
    g.shadowColor = `rgba(${rgb},${0.8 * a})`; g.shadowBlur = opts.blur ?? 10;
    g.lineWidth = opts.width || 2.6;
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx - ux * h * 0.8, by - uy * h * 0.8); g.stroke();
    g.beginPath(); g.moveTo(bx, by);
    g.lineTo(bx - ux * h - uy * h * 0.5, by - uy * h + ux * h * 0.5);
    g.lineTo(bx - ux * h + uy * h * 0.5, by - uy * h - ux * h * 0.5); g.closePath(); g.fill();
    g.shadowBlur = 0;
    if (label) {
      g.font = opts.font || `italic ${Math.round(clamp(s.W / 50, 14, 24))}px ${SERIF}`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const off = opts.labelOff ?? 14;
      g.fillText(label, bx + ux * off, by + uy * off);
    }
  };
  D.wrap = (s, text, maxW) => {
    const out = []; let line = '';
    for (const w of text.split(' ')) {
      const test = line ? line + ' ' + w : w;
      if (s.g.measureText(test).width > maxW && line) { out.push(line); line = w; } else line = test;
    }
    if (line) out.push(line); return out;
  };
  // Centred text lines with a dark halo. align/x optional.
  D.text = (s, lines, x, y, size, a, font, rgb = C.text, align = 'center') => {
    const { g } = s; if (a <= 0) return;
    if (typeof lines === 'string') lines = [lines];
    g.globalCompositeOperation = 'source-over';
    g.font = font; g.textAlign = align; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 12;
    g.fillStyle = `rgba(${rgb},${a})`;
    lines.forEach((l, i) => g.fillText(l, x, y + i * size * 1.3));
    g.shadowBlur = 0;
  };
  D.sans = (size, weight = 400) => `${weight} ${size}px ${SANS}`;
  D.serif = (size, italic = true) => `${italic ? 'italic ' : ''}${size}px ${SERIF}`;
  // Captions: list of [start, end, text]; shown at the bottom, one at a time.
  D.captions = (s, t, list) => {
    const size = Math.round(clamp(s.W / 44, 15, 25)), font = D.sans(size);
    s.g.font = font;
    for (const [a, b, txt] of list) {
      const al = fade(t, a, b, 0.6, 0.6); if (al <= 0) continue;
      const lines = D.wrap(s, txt, Math.min(s.W - 40, 860));
      // a soft dark band so captions stay readable over photos and bright lines
      const top = s.H - size * (2.6 + 1.3 * lines.length);
      const band = s.g.createLinearGradient(0, top, 0, s.H);
      band.addColorStop(0, 'rgba(4,6,13,0)'); band.addColorStop(0.45, `rgba(4,6,13,${0.6 * al})`); band.addColorStop(1, `rgba(4,6,13,${0.7 * al})`);
      s.g.globalCompositeOperation = 'source-over'; s.g.fillStyle = band; s.g.fillRect(0, top, s.W, s.H - top);
      D.text(s, lines, s.W / 2, s.H - size * 1.9 - (lines.length - 1) * size * 1.3, size, al, font);
    }
  };
  // Big title with an optional subtitle.
  D.title = (s, t, a, b, title, sub) => {
    const al = fade(t, a, b, 0.9, 0.8); if (al <= 0) return;
    const s1 = Math.round(clamp(s.W / 22, 24, 50)), s2 = Math.round(clamp(s.W / 50, 14, 21));
    s.g.font = D.sans(s1, 300);
    const l1 = D.wrap(s, title, s.W - 48);
    const y = s.H * 0.42 - (l1.length - 1) * s1 * 0.65;
    D.text(s, l1, s.W / 2, y, s1, al, D.sans(s1, 300));
    if (sub) {
      s.g.font = D.sans(s2);
      D.text(s, D.wrap(s, sub, s.W - 48), s.W / 2, y + s1 * (0.6 + l1.length * 1.3) - s1 * 0.6, s2, al * 0.75, D.sans(s2));
    }
  };
  // Legend in the top-left: items = [[kind, rgb, label]], kind 'arrow' | 'dot' | 'line'.
  D.legend = (s, items, a) => {
    if (a <= 0 || s.W < 520) return;            // phones: no room; the pictures are labelled and the page explains the colours
    const { g } = s, size = Math.round(clamp(s.W / 80, 11, 14)), x = 14, lh = size * 1.7;
    let y = 18;
    g.globalCompositeOperation = 'source-over'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = D.sans(size);
    for (const [kind, rgb, label] of items) {
      g.strokeStyle = g.fillStyle = `rgba(${rgb},${a})`; g.lineWidth = 2.4;
      if (kind === 'dot') { g.beginPath(); g.arc(x + 10, y, 5, 0, 7); g.fill(); }
      else {
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20, y); g.stroke();
        if (kind === 'arrow') { g.beginPath(); g.moveTo(x + 22, y); g.lineTo(x + 15, y - 4); g.lineTo(x + 15, y + 4); g.fill(); }
      }
      g.fillStyle = `rgba(210,218,245,${0.85 * a})`; g.fillText(label, x + 30, y); y += lh;
    }
  };

  // ---------- 3D camera ----------
  // Camera on a sphere of radius dist about target, looking at it; yaw about y, pitch up.
  const camera = (yaw, pitch, dist = 20, target = [0, 0, 0]) => {
    const pos = V.add(target, [dist * Math.sin(yaw) * Math.cos(pitch), dist * Math.sin(pitch), dist * Math.cos(yaw) * Math.cos(pitch)]);
    const f = V.norm(V.sub(target, pos)), r = V.norm(V.cross(f, [0, 1, 0])), u = V.cross(r, f);
    return { pos, f, r, u, dist };
  };
  // Project a 3D point: returns [x, y, depth]; cx, cy = screen centre, unit = pixels per world unit at the target.
  const project = (cam, p, cx, cy, unit) => {
    const d = V.sub(p, cam.pos), zc = V.dot(d, cam.f), k = cam.dist / zc;
    return [cx + V.dot(d, cam.r) * k * unit, cy - V.dot(d, cam.u) * k * unit, zc];
  };

  // ---------- the player ----------
  const scenes = {};
  const register = (name, scene) => { scenes[name] = scene; };
  const qs = new URLSearchParams(location.search);
  const hold = qs.has('t') ? +qs.get('t') : null;      // a scene time, in seconds
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MUSIC_SRC = (document.currentScript && document.currentScript.src || '').replace(/player\.js(\?.*)?$/, 'music.js');

  // Pauses: a scene may list [sceneTime, seconds] moments where the picture holds still
  // (so a caption can be read) before the story carries on.
  const timing = (scene) => {
    const pauses = (scene.pauses || []).slice().sort((a, b) => a[0] - b[0]);
    const total = scene.duration + pauses.reduce((n, p) => n + p[1], 0);
    const toScene = (real) => {
      let acc = 0;
      for (const [st, d] of pauses) {
        if (real < st + acc) return real - acc;
        if (real < st + acc + d) return st;
        acc += d;
      }
      return Math.min(real - acc, scene.duration);
    };
    const toReal = (st) => st + pauses.filter((p) => p[0] < st).reduce((n, p) => n + p[1], 0);
    return { total, toScene, toReal };
  };

  // ---------- music (generated in the browser by js/anim/music.js, loaded only when first switched on) ----------
  const pref = { get() { try { return localStorage.getItem('anim-music') === 'on'; } catch { return false; } },
    set(on) { try { localStorage.setItem('anim-music', on ? 'on' : 'off'); } catch { /* private mode */ } } };
  let musicLib = null;
  const loadMusic = () => musicLib || (musicLib = new Promise((res, rej) => {
    if (window.AnimMusic) { res(window.AnimMusic); return; }
    const sc = document.createElement('script'); sc.src = MUSIC_SRC;
    sc.onload = () => res(window.AnimMusic); sc.onerror = rej; document.head.append(sc);
  }));
  let gestured = false;      // browsers only allow sound after the person has clicked or tapped
  const gestureWaiters = new Set();
  const onGesture = () => { gestured = true; gestureWaiters.forEach((f) => f()); };
  document.addEventListener('pointerdown', onGesture, { capture: true });
  document.addEventListener('keydown', onGesture, { capture: true });

  function mount(fig) {
    const scene = scenes[fig.dataset.anim];
    const cv = fig.querySelector('canvas');
    if (!scene || !cv) return;
    const tm = timing(scene);
    const s = { g: cv.getContext('2d'), W: 0, H: 0, fig, clock: 0 };
    const bar = document.createElement('div'); bar.className = 'anim-progress'; bar.setAttribute('aria-hidden', 'true');
    const ctrl = document.createElement('div'); ctrl.className = 'anim-ctrl';
    ctrl.innerHTML = '<button type="button" data-a="play">Pause</button><button type="button" data-a="replay">Replay</button>'
      + '<button type="button" data-a="music" aria-pressed="false" title="Background music, made by the browser">♪ Music</button>'
      + '<button type="button" data-a="full">Full screen</button>';
    fig.append(bar, ctrl);
    const [bPlay, bReplay, bMusic, bFull] = ctrl.querySelectorAll('button');
    if (!fig.requestFullscreen) bFull.hidden = true;
    if (!(window.AudioContext || window.webkitAudioContext)) bMusic.hidden = true;

    let paused = hold !== null || reduce, tHold = hold !== null ? tm.toReal(hold) : tm.toReal(scene.poster ?? 0), t0 = performance.now();
    let visible = false, raf = 0;
    const T = () => (paused ? tHold : ((performance.now() - t0) / 1000) % tm.total);
    const label = () => { bPlay.textContent = paused ? 'Play' : 'Pause'; };
    label();

    // music for this stage
    let musicOn = pref.get(), music = null;
    const musicLabel = () => { bMusic.setAttribute('aria-pressed', String(musicOn)); bMusic.textContent = musicOn ? '♪ Music on' : '♪ Music'; };
    musicLabel();
    async function syncMusic() {
      const want = musicOn && !paused && visible && gestured;
      if (!want) { if (music) music.pause(); return; }
      if (!music) {
        try { const lib = await loadMusic(); music = music || lib.create(scene.music || {}); } catch { bMusic.hidden = true; return; }
      }
      if (musicOn && !paused && visible) music.play();
    }
    gestureWaiters.add(syncMusic);

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = cv.getBoundingClientRect();
      s.W = Math.max(1, r.width); s.H = Math.max(1, r.height);
      s.top = s.W < 600 ? 44 : 0;      // on phones, overlays start below the buttons
      cv.width = Math.round(s.W * dpr); cv.height = Math.round(s.H * dpr);
      s.g.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (scene.resize) scene.resize(s);
    }
    function draw() {
      const real = T();
      s.clock = performance.now() / 1000;    // keeps gentle background motion going during a pause
      scene.frame(s, tm.toScene(real));
      bar.style.transform = `scaleX(${real / tm.total})`;
    }
    function loop() { draw(); raf = visible ? requestAnimationFrame(loop) : 0; }
    function start() { if (!raf && visible) raf = requestAnimationFrame(loop); }

    bPlay.addEventListener('click', () => {
      if (paused) { t0 = performance.now() - tHold * 1000; paused = false; }
      else { tHold = T(); paused = true; }
      label(); start(); syncMusic();
    });
    bReplay.addEventListener('click', () => { t0 = performance.now(); paused = false; label(); start(); syncMusic(); });
    bMusic.addEventListener('click', () => {
      musicOn = !musicOn; pref.set(musicOn); musicLabel();
      if (musicOn && paused && hold === null && !reduce) { t0 = performance.now() - tHold * 1000; paused = false; label(); start(); }
      gestured = true; syncMusic();
    });
    bFull.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen(); else fig.requestFullscreen().catch(() => {});
    });
    document.addEventListener('fullscreenchange', () => {
      bFull.textContent = document.fullscreenElement === fig ? 'Exit full screen' : 'Full screen';
      requestAnimationFrame(() => { resize(); draw(); });
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && music) music.pause(); else syncMusic(); });
    new ResizeObserver(() => { resize(); draw(); }).observe(cv);
    new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      if (visible) start();
      syncMusic();
    }, { threshold: 0.15 }).observe(fig);
    resize(); draw();
  }

  // A scene file (loaded after this one) mounts its own stages as it registers.
  const mountAll = (name) => document.querySelectorAll(`figure.anim-stage[data-anim="${name}"]`).forEach(mount);
  const registerAndMount = (name, scene) => {
    register(name, scene);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountAll(name));
    else mountAll(name);
  };
  // Draw one frame of a scene into a canvas at scene time t (for tools/anim-sheet.html, the contact sheet used to check frames).
  const still = (name, cv, t) => {
    const scene = scenes[name]; if (!scene) return false;
    const s = { g: cv.getContext('2d'), W: cv.width, H: cv.height, top: cv.width < 600 ? 44 : 0, clock: t };
    if (scene.resize) scene.resize(s);
    scene.frame(s, t); return true;
  };
  const durationOf = (name) => scenes[name] && scenes[name].duration;
  window.Anim = { register: registerAndMount, still, durationOf, V, D, C, clamp, smooth, lerp, fade, camera, project };
})();
