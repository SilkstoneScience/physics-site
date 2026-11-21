/* Background music for the animations, made live in the browser with the Web Audio API:
   no audio files, so nothing to license. Loaded by js/anim/player.js the first time music plays.
   Each scene sets its own score with `music: { … }` (all optional):
   - chords: lists of MIDI note numbers (60 = middle C), played in turn; bar: seconds per chord
   - pad: 'saw' | 'triangle' | 'sine' | 'square' (the sustained chord sound); cutoff: its brightness (Hz)
   - drone: level of a low sine under each chord (0 = none)
   - bells: high notes per second; bellType: 'sine' | 'glass' (FM, glassy); bellOct: octaves above the chord (1–3)
   - arp: seconds between plucked arpeggio notes (0 = none); arpMode: 'up' | 'updown' | 'random'
   - wind: level of a slowly swelling filtered-noise "space wind"; shimmer: level of a high glistening layer
   - tick: seconds between soft clock ticks; pulse: seconds between soft low heartbeat-like pulses
   - tremolo: speed (Hz) of a gentle wobble in the pad's volume; echo: delay time (s); volume: overall level
   - groove: level of a soft rhythm under the pad (a warm low bass line, a muted kick on the main beats and a very quiet
     brushed off-beat); 0 = none, which also brings back the old slow timing (one chord every `bar` seconds).
     bpm: its tempo (0 = from `bar`: 92 for bar 8 down to 80 for bar 12); chordBeats: beats per chord (default 8).
   - A score can follow the animation (the player tells it the scene time every frame):
     sections: [[sceneTime, { …any options above, plus tone }], …] change the score from that moment (at the next chord);
     tone: { note, level, harmonics: [amplitudes of the 1st, 2nd, 3rd… harmonics], beat: Hz, beatTo: Hz } adds a soft
       sustained note (a "singing" tone); beat adds a twin a few hertz higher, so the two beat, and beatTo slides the beat
       frequency across the section (e.g. to 0, like a string being tuned); tone: null removes it;
     events: [[sceneTime, 'swell' | 'dip', size], …] briefly swell or hush the whole score at that moment.
     It is meant to suggest what is on screen, not to be exact: pleasant sound comes first.
   Teacher's decisions: the music is low and atmospheric, with no "pinging" (16 November 2026), so no score uses bells,
   arp, tick or pulse, and pad cutoffs stay at 900 Hz or below; but "a little more upbeat, still lowkey" (17 November
   2026), so every score has the soft groove, quicker chord changes and quicker fades. The first chord of each piece has
   no groove, so the music still starts gently. See docs/ANIMATIONS_PLAN.md. */
(() => {
  'use strict';
  const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const DEFAULT = { chords: [[57, 64, 67, 71], [53, 60, 64, 69], [48, 55, 60, 64], [55, 59, 62, 67]], bar: 8, pad: 'saw',
    cutoff: 900, drone: 0.09, bells: 0, bellType: 'sine', bellOct: 1, arp: 0, arpMode: 'up', wind: 0, shimmer: 0,
    tick: 0, pulse: 0, tremolo: 0, echo: 0.43, groove: 1, bpm: 0, chordBeats: 8, sections: null, tone: null, events: null,
    volume: 0.6 };
  const PAD_LEVEL = { saw: 1, square: 0.75, triangle: 2.2, sine: 2.8 };
  const OSC = { saw: 'sawtooth', square: 'square', triangle: 'triangle', sine: 'sine' };

  // Shared output chain: compressor + a synthetic reverb (noise dying away over 4.5 s).
  function buildChain(ac) {
    const master = ac.createGain(); master.gain.value = 1;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = 0.02; comp.release.value = 0.4;
    master.connect(comp).connect(ac.destination);
    const len = Math.floor(ac.sampleRate * 4.5), imp = ac.createBuffer(2, len, ac.sampleRate);
    let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / len, 3.4); }
    const conv = ac.createConvolver(); conv.buffer = imp;
    const wet = ac.createGain(); wet.gain.value = 0.5;
    const reverb = ac.createGain(); reverb.connect(conv).connect(wet).connect(master);
    return { master, reverb };
  }

  // One score. schedule(to) adds every note that starts before `to`, so the same code drives live
  // playback (a little ahead of time) and the offline test render.
  function Piece(ac, chain, opts) {
    const o = { ...DEFAULT, ...opts };
    const bus = ac.createGain(); bus.gain.value = 0;
    bus.connect(chain.master);
    const send = ac.createGain(); send.gain.value = 0.9; bus.connect(send).connect(chain.reverb);
    const dyn = ac.createGain(); dyn.gain.value = 1; dyn.connect(bus);      // swells and dips that follow the animation
    const vol = ac.createGain(); vol.gain.value = o.volume; vol.connect(dyn);
    // the pad: a filter that opens and closes slowly, and an optional tremolo
    const filt = ac.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = o.cutoff; filt.Q.value = 0.5;
    const lfo = ac.createOscillator(), lfoAmt = ac.createGain();
    lfo.frequency.value = 0.035; lfoAmt.gain.value = o.cutoff * 0.4; lfo.connect(lfoAmt).connect(filt.frequency); lfo.start();
    const trem = ac.createGain(); trem.gain.value = 1;
    if (o.tremolo > 0) {
      const tl = ac.createOscillator(), td = ac.createGain();
      tl.frequency.value = o.tremolo; td.gain.value = 0.28; tl.connect(td).connect(trem.gain); tl.start();
      trem.gain.value = 0.72;
    }
    filt.connect(trem).connect(vol);
    // an echo for bells, plucks and ticks
    const delay = ac.createDelay(2), fb = ac.createGain(), echo = ac.createGain();
    delay.delayTime.value = o.echo; fb.gain.value = 0.36; echo.gain.value = 0.5;
    delay.connect(fb).connect(delay); delay.connect(echo).connect(vol);
    const bells = ac.createGain(); bells.gain.value = 1; bells.connect(vol); bells.connect(delay);
    // space wind: looping noise through a slowly sweeping band-pass filter, swelling and fading
    if (o.wind > 0) {
      const n = ac.sampleRate * 3, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
      let sd = 5; for (let i = 0; i < n; i++) d[i] = ((sd = (sd * 16807) % 2147483647) / 2147483647) * 2 - 1;
      const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 1.4;
      const sweep = ac.createOscillator(), sweepAmt = ac.createGain(); sweep.frequency.value = 0.023; sweepAmt.gain.value = 450;
      sweep.connect(sweepAmt).connect(bp.frequency); sweep.start();
      const wg = ac.createGain(); wg.gain.value = o.wind * 0.05;
      const swell = ac.createOscillator(), swellAmt = ac.createGain(); swell.frequency.value = 0.06; swellAmt.gain.value = o.wind * 0.035;
      swell.connect(swellAmt).connect(wg.gain); swell.start();
      src.connect(bp).connect(wg).connect(vol); src.start();
    }

    // the groove: tempo, chord length and a low-pass for the bass line
    const lift = o.groove > 0;
    const bpm = o.bpm || Math.max(80, Math.min(92, Math.round(92 - (o.bar - 8) * 3)));
    const beat = 60 / bpm, len = lift ? o.chordBeats * beat : o.bar;   // seconds per chord
    const bassF = ac.createBiquadFilter(); bassF.type = 'lowpass'; bassF.frequency.value = 420; bassF.Q.value = 0.7; bassF.connect(vol);
    const brushF = ac.createBiquadFilter(); brushF.type = 'bandpass'; brushF.frequency.value = 3200; brushF.Q.value = 0.8; brushF.connect(vol);
    const nBuf = (() => {                          // a short burst of noise for the brushed off-beat
      const n = Math.floor(ac.sampleRate * 0.2), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
      let sd = 11; for (let i = 0; i < n; i++) d[i] = ((sd = (sd * 16807) % 2147483647) / 2147483647) * 2 - 1;
      return b;
    })();

    let seed = 17; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const chordAt = (k) => o.chords[((k % o.chords.length) + o.chords.length) % o.chords.length];

    function env(g, t, peak, attack, hold, release) {
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + attack);
      g.gain.setValueAtTime(peak, t + hold);
      g.gain.linearRampToValueAtTime(0, t + hold + release);
    }
    function pad(t, notes, len, c = o) {
      const peak = 0.11 * (PAD_LEVEL[c.pad] || 1) / notes.length;
      for (const n of notes) for (const det of [-7, 6]) {
        const osc = ac.createOscillator(), g = ac.createGain();
        osc.type = OSC[c.pad] || 'sawtooth'; osc.frequency.value = hz(n); osc.detune.value = det;
        env(g, t, peak, len * (lift ? 0.3 : 0.45), len, len * 0.6);
        osc.connect(g).connect(filt); osc.start(t); osc.stop(t + len * 1.65);
      }
      if (c.drone > 0) {
        let low = Math.min(...notes); while (low > 45) low -= 12;
        const osc = ac.createOscillator(), g = ac.createGain();
        osc.type = 'sine'; osc.frequency.value = hz(low);
        env(g, t, c.drone * (lift ? 0.6 : 1), len * 0.5, len, len * 0.6);
        osc.connect(g).connect(vol); osc.start(t); osc.stop(t + len * 1.65);
      }
      if (c.shimmer > 0) {                         // two very high, slightly detuned voices: a glistening halo
        const top = Math.max(...notes) + 24;
        for (const [n, det] of [[top, -4], [top + 7, 5]]) {
          const osc = ac.createOscillator(), g = ac.createGain();
          osc.type = 'sine'; osc.frequency.value = hz(n); osc.detune.value = det;
          env(g, t, c.shimmer * 0.014, len * 0.6, len, len * 0.6);
          osc.connect(g).connect(bells); osc.start(t); osc.stop(t + len * 1.65);
        }
      }
    }
    function bell(t, n, level, decay, type) {
      const f = hz(n), osc = ac.createOscillator(), g = ac.createGain();
      osc.type = 'sine'; osc.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0005, t + decay);
      if (type === 'glass') {                      // FM: a modulator at 3.5× makes a glassy, bell-like tone
        const mod = ac.createOscillator(), mg = ac.createGain();
        mod.frequency.value = f * 3.5; mg.gain.setValueAtTime(f * 1.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + decay * 0.6);
        mod.connect(mg).connect(osc.frequency); mod.start(t); mod.stop(t + decay + 0.05);
      } else {
        const o2 = ac.createOscillator(), g2 = ac.createGain();
        o2.type = 'sine'; o2.frequency.value = f * 2.01; g2.gain.value = 0.25;
        o2.connect(g2).connect(g); o2.start(t); o2.stop(t + decay + 0.05);
      }
      osc.connect(g).connect(bells); osc.start(t); osc.stop(t + decay + 0.05);
    }
    function tick(t, high) {                       // a soft wooden clock tick
      const osc = ac.createOscillator(), g = ac.createGain(), bp = ac.createBiquadFilter();
      osc.type = 'triangle'; osc.frequency.value = high ? 2100 : 1600;
      bp.type = 'bandpass'; bp.frequency.value = high ? 2100 : 1600; bp.Q.value = 6;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.07);
      osc.connect(bp).connect(g).connect(bells); osc.start(t); osc.stop(t + 0.1);
    }
    // the groove, one chord (8 beats = 16 half-beat steps) at a time: [step, interval above the root, level]
    const BASS = [[0, 0, 1], [3, 0, 0.55], [6, 7, 0.7], [8, 0, 0.9], [11, 0, 0.55], [14, 7, 0.65]];
    const KICK = [[0, 1], [4, 0.6], [8, 0.85], [12, 0.6]];
    const BRUSH = [[2, 1], [6, 0.8], [10, 1], [14, 0.8]];
    function groove(t, notes, lv = o.groove) {
      const step = beat / 2, n = o.chordBeats * 2;   // steps in one chord (the patterns are written for 8 beats)
      let root = Math.min(...notes); while (root > 47) root -= 12; while (root < 36) root += 12;
      for (const [s, iv, a] of BASS) {               // a warm, rounded bass note
        if (s >= n) continue;
        const tt = t + s * step, osc = ac.createOscillator(), g = ac.createGain();
        osc.type = 'triangle'; osc.frequency.value = hz(root + iv);
        g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.24 * lv * a, tt + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0005, tt + Math.min(0.9, step * 2.6));
        osc.connect(g).connect(bassF); osc.start(tt); osc.stop(tt + 1);
      }
      for (const [s, a] of KICK) {                   // a muted kick: a low sine that drops in pitch
        if (s >= n) continue;
        const tt = t + s * step, osc = ac.createOscillator(), g = ac.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(95, tt); osc.frequency.exponentialRampToValueAtTime(48, tt + 0.16);
        g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.3 * lv * a, tt + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0005, tt + 0.32);
        osc.connect(g).connect(vol); osc.start(tt); osc.stop(tt + 0.35);
      }
      for (const [s, a] of BRUSH) {                  // a very quiet brushed off-beat (filtered noise, no pitch)
        if (s >= n) continue;
        const tt = t + s * step, src = ac.createBufferSource(), g = ac.createGain();
        src.buffer = nBuf;
        g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.075 * lv * a, tt + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0005, tt + 0.16);
        src.connect(g).connect(brushF); src.start(tt); src.stop(tt + 0.2);
      }
    }
    // a soft sustained note made of sine-wave harmonics; with a beat, a twin of the first harmonic a few hertz higher
    const toneF = ac.createBiquadFilter(); toneF.type = 'lowpass'; toneF.frequency.value = 2400; toneF.Q.value = 0.5; toneF.connect(vol);
    function tone(t, len, tn, f0, f1) {
      const base = hz(tn.note), parts = tn.harmonics || [1], lev = tn.level ?? 0.05;
      const b0 = tn.beat || 0, b1 = tn.beatTo ?? b0, bA = b0 + (b1 - b0) * f0, bB = b0 + (b1 - b0) * f1;
      parts.forEach((amp, i) => {
        if (!(amp > 0)) return;
        const twins = i === 0 && (b0 > 0 || b1 > 0) ? [0, 1] : [0];
        for (const tw of twins) {
          const osc = ac.createOscillator(), g = ac.createGain();
          osc.type = 'sine';
          if (tw) { osc.frequency.setValueAtTime(base + bA, t); osc.frequency.linearRampToValueAtTime(base + bB, t + len); }
          else osc.frequency.value = base * (i + 1);
          env(g, t, lev * amp * (twins.length > 1 ? 0.6 : 1), len * 0.3, len, len * 0.5);
          osc.connect(g).connect(toneF); osc.start(t); osc.stop(t + len * 1.55);
        }
      });
    }
    // the animation's clock: scene time sceneT at audio time at, moving at rate scene seconds per second
    let st = null, evDone = [];
    const evReset = (sc) => { evDone = (o.events || []).map(([te]) => te < sc - 0.05); };
    function follow(sceneT, now = ac.currentTime) {
      if (!st) { st = { sceneT, at: now, rate: 1 }; evReset(sceneT); return; }
      const dA = now - st.at, dS = sceneT - st.sceneT;
      if (dS < -0.5 || dS > 2 + 3 * dA) { st = { sceneT, at: now, rate: st.rate || 1 }; evReset(sceneT); return; }   // a jump
      if (dA > 0.05) { st.rate = Math.max(0, Math.min(3, 0.6 * st.rate + 0.4 * (dS / dA))); st.sceneT = sceneT; st.at = now; }
    }
    const sceneAt = (ta) => (st ? st.sceneT + (ta - st.at) * st.rate : null);
    function sectionAt(sc) {
      if (!o.sections || sc === null) return null;
      let k = -1; for (let i = 0; i < o.sections.length; i++) if (o.sections[i][0] <= sc) k = i;
      if (k < 0) return null;
      return { sec: o.sections[k][1], start: o.sections[k][0], end: k + 1 < o.sections.length ? o.sections[k + 1][0] : Infinity };
    }
    let curCut = o.cutoff;
    function thump(t) {                            // a soft low pulse, like a slow heartbeat
      const osc = ac.createOscillator(), g = ac.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(70, t); osc.frequency.exponentialRampToValueAtTime(42, t + 0.3);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.5);
      osc.connect(g).connect(vol); osc.start(t); osc.stop(t + 0.55);
    }

    let nextChord = 0, chordIdx = 0, nextBell = 0, nextArp = 0, arpIdx = 0, nextTick = 0, tickIdx = 0, nextPulse = 0;
    function reset(t) { nextChord = t; nextBell = t + 1.5; nextArp = t + 0.6; nextTick = t + 0.5; nextPulse = t + 0.3; }
    function schedule(to) {
      while (nextChord < to) {
        const t = nextChord, s0 = sceneAt(t), sc = sectionAt(s0), c = sc ? { ...o, ...sc.sec } : o;
        const list = c.chords || o.chords, notes = list[chordIdx % list.length];
        if (c.cutoff !== curCut) { filt.frequency.setTargetAtTime(c.cutoff, t, 0.8); lfoAmt.gain.setTargetAtTime(c.cutoff * 0.4, t, 0.8); curCut = c.cutoff; }
        pad(t, notes, len, c);
        if (lift && chordIdx > 0 && c.groove > 0) groove(t, notes, c.groove);   // the first chord starts gently, with no groove
        if (c.tone) {
          const span = sc && Number.isFinite(sc.end) ? sc.end - sc.start : 0;
          const fr = (x) => (span > 0 ? Math.max(0, Math.min(1, (x - sc.start) / span)) : 0);
          tone(t, len, c.tone, fr(s0), fr(sceneAt(t + len)));
        }
        nextChord += len; chordIdx++;
      }
      // swells and dips at moments in the animation (scheduled up to a second ahead)
      if (o.events && st && st.rate > 0.2) {
        const sTo = sceneAt(to), now = ac.currentTime;
        o.events.forEach(([te, kind, size = 1], i) => {
          if (evDone[i] || te > sTo) return;
          evDone[i] = true;
          const ta = Math.max(now, st.at + (te - st.sceneT) / st.rate), g = dyn.gain;
          if (kind === 'swell') { g.setTargetAtTime(1 + 0.6 * size, Math.max(now, ta - 0.25), 0.08); g.setTargetAtTime(1, ta + 0.3, 0.4); }
          else { g.setTargetAtTime(Math.max(0.05, 1 - 0.85 * size), Math.max(now, ta - 0.2), 0.06); g.setTargetAtTime(1, ta + 0.2, 0.35); }
        });
      }
      const current = () => chordAt(chordIdx - 1);
      if (o.bells > 0) while (nextBell < to) {
        const ch = current(), n = ch[Math.floor(rnd() * ch.length)] + 12 * (o.bellOct + Math.floor(rnd() * 2));
        bell(nextBell, Math.min(n, 100), 0.045 + rnd() * 0.03, 2.2 + rnd() * 1.5, o.bellType);
        nextBell += (0.5 + rnd()) / o.bells;
      }
      if (o.arp > 0) while (nextArp < to) {
        const ch = current(), m = ch.length;
        let k = arpIdx % m;
        if (o.arpMode === 'updown') { const p = arpIdx % (2 * m - 2); k = p < m ? p : 2 * m - 2 - p; }
        if (o.arpMode === 'random') k = Math.floor(rnd() * m);
        bell(nextArp, ch[k] + 12, arpIdx % 4 === 0 ? 0.05 : 0.032, 0.9, 'sine');
        nextArp += o.arp; arpIdx++;
      }
      if (o.tick > 0) while (nextTick < to) { tick(nextTick, tickIdx % 2 === 0); nextTick += o.tick; tickIdx++; }
      if (o.pulse > 0) while (nextPulse < to) { thump(nextPulse); thump(nextPulse + 0.28); nextPulse += o.pulse; }
    }
    return { bus, schedule, reset, follow };
  }

  let ac = null, chain = null;
  function create(opts = {}) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!ac) { ac = new AC(); chain = buildChain(ac); }
    const piece = Piece(ac, chain, opts);
    let playing = false, timer = 0, stopper = 0;
    const tick = () => piece.schedule(ac.currentTime + 1.0);
    return {
      play() {
        if (ac.state === 'suspended') ac.resume();
        clearTimeout(stopper);
        if (!playing) { playing = true; piece.reset(ac.currentTime + 0.1); tick(); timer = setInterval(tick, 250); }
        const g = piece.bus.gain, now = ac.currentTime;
        g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(1, now + 2.5);
      },
      follow(sceneT) { piece.follow(sceneT); },      // the player calls this every frame with the scene time
      pause() {
        if (!playing) return;
        const g = piece.bus.gain, now = ac.currentTime;
        g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0, now + 1.2);
        clearTimeout(stopper);
        stopper = setTimeout(() => { clearInterval(timer); playing = false; }, 1400);
      },
    };
  }

  // For checking levels without listening: render `seconds` of a score offline; returns peak and RMS.
  async function test(opts = {}, seconds = 30, from = 0) {   // as if the animation were playing from scene time `from`
    const off = new OfflineAudioContext(2, Math.floor(44100 * seconds), 44100);
    const ch = buildChain(off), piece = Piece(off, ch, opts);
    piece.bus.gain.value = 1; piece.follow(from, 0); piece.reset(0); piece.schedule(seconds);
    const buf = await off.startRendering();
    let peak = 0, sum = 0, nan = 0; const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) { const v = d[i]; if (Number.isNaN(v)) nan++; peak = Math.max(peak, Math.abs(v)); sum += v * v; }
    const out = { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / d.length).toFixed(4), nan };
    if (opts.trace) {                                  // loudness every `trace` seconds, to check swells, dips and beats
      const w = Math.floor(44100 * opts.trace); out.trace = [];
      for (let i = 0; i + w <= d.length; i += w) { let q = 0; for (let j = i; j < i + w; j++) q += d[j] * d[j]; out.trace.push(+Math.sqrt(q / w).toFixed(3)); }
    }
    return out;
  }

  window.AnimMusic = { create, test, state: () => (ac ? ac.state : 'not started') };
})();
