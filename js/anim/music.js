/* Background music for the animations, made live in the browser with the Web Audio API:
   no audio files, so nothing to license. Loaded by js/anim/player.js the first time someone
   switches music on. A scene sets its mood with `music: { chords, bar, cutoff, sparkle, arp }`:
   - chords: lists of MIDI note numbers (60 = middle C), played in turn as a soft pad
   - bar: seconds per chord; cutoff: brightness of the pad (Hz)
   - sparkle: high bell-like notes per second (0 = none); arp: seconds between plucked arpeggio notes (0 = none) */
(() => {
  'use strict';
  const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const DEFAULT = { chords: [[57, 64, 67, 71], [53, 60, 64, 69], [48, 55, 60, 64], [55, 59, 62, 67]], bar: 8, cutoff: 900, sparkle: 0.35, arp: 0, volume: 0.6 };

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

  // One piece of music. schedule(from, to) adds every note that starts in that window, so the same
  // code drives live playback (a little ahead of time) and the offline test render.
  function Piece(ac, chain, opts) {
    const o = { ...DEFAULT, ...opts };
    const bus = ac.createGain(); bus.gain.value = 0;
    bus.connect(chain.master);
    const send = ac.createGain(); send.gain.value = 0.9; bus.connect(send).connect(chain.reverb);
    const vol = ac.createGain(); vol.gain.value = o.volume; vol.connect(bus);
    // the pad's filter opens and closes slowly
    const filt = ac.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = o.cutoff; filt.Q.value = 0.5;
    const lfo = ac.createOscillator(), lfoAmt = ac.createGain();
    lfo.frequency.value = 0.035; lfoAmt.gain.value = o.cutoff * 0.4; lfo.connect(lfoAmt).connect(filt.frequency); lfo.start();
    filt.connect(vol);
    // an echo for the bells and plucks
    const delay = ac.createDelay(2), fb = ac.createGain(), echo = ac.createGain();
    delay.delayTime.value = 0.43; fb.gain.value = 0.36; echo.gain.value = 0.5;
    delay.connect(fb).connect(delay); delay.connect(echo).connect(vol);
    const bells = ac.createGain(); bells.gain.value = 1; bells.connect(vol); bells.connect(delay);

    let seed = 17; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const chordAt = (k) => o.chords[((k % o.chords.length) + o.chords.length) % o.chords.length];

    function pad(t, notes, len) {
      const peak = 0.11 / notes.length;
      for (const n of notes) {
        for (const det of [-7, 6]) {
          const osc = ac.createOscillator(), g = ac.createGain();
          osc.type = 'sawtooth'; osc.frequency.value = hz(n); osc.detune.value = det;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(peak, t + len * 0.45);
          g.gain.setValueAtTime(peak, t + len);
          g.gain.linearRampToValueAtTime(0, t + len * 1.6);
          osc.connect(g).connect(filt); osc.start(t); osc.stop(t + len * 1.65);
        }
      }
      const root = Math.min(...notes); let low = root; while (low > 45) low -= 12;   // a soft drone below
      const osc = ac.createOscillator(), g = ac.createGain();
      osc.type = 'sine'; osc.frequency.value = hz(low);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09, t + len * 0.5);
      g.gain.setValueAtTime(0.09, t + len); g.gain.linearRampToValueAtTime(0, t + len * 1.6);
      osc.connect(g).connect(vol); osc.start(t); osc.stop(t + len * 1.65);
    }
    function bell(t, n, level, decay) {
      const osc = ac.createOscillator(), osc2 = ac.createOscillator(), g = ac.createGain();
      osc.type = 'sine'; osc.frequency.value = hz(n);
      osc2.type = 'sine'; osc2.frequency.value = hz(n) * 2.01;          // a faint overtone gives a bell colour
      const g2 = ac.createGain(); g2.gain.value = 0.25;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0005, t + decay);
      osc.connect(g); osc2.connect(g2).connect(g); g.connect(bells);
      osc.start(t); osc2.start(t); osc.stop(t + decay + 0.05); osc2.stop(t + decay + 0.05);
    }

    let nextChord = 0, chordIdx = 0, nextBell = 0, nextArp = 0, arpIdx = 0;
    function reset(t) { nextChord = t; nextBell = t + 1.5; nextArp = t + 0.6; }
    function schedule(to) {
      while (nextChord < to) { pad(nextChord, chordAt(chordIdx), o.bar); nextChord += o.bar; chordIdx++; }
      const current = () => chordAt(chordIdx - 1);
      if (o.sparkle > 0) while (nextBell < to) {
        const ch = current(), n = ch[Math.floor(rnd() * ch.length)] + 12 * (1 + Math.floor(rnd() * 2));
        bell(nextBell, Math.min(n, 96), 0.05 + rnd() * 0.03, 2.2 + rnd() * 1.5);
        nextBell += (0.5 + rnd()) / o.sparkle;
      }
      if (o.arp > 0) while (nextArp < to) {
        const ch = current(), n = ch[arpIdx % ch.length] + 12;
        bell(nextArp, n, arpIdx % 4 === 0 ? 0.05 : 0.032, 0.9);
        nextArp += o.arp; arpIdx++;
      }
    }
    return { bus, schedule, reset };
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
      pause() {
        if (!playing) return;
        const g = piece.bus.gain, now = ac.currentTime;
        g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0, now + 1.2);
        clearTimeout(stopper);
        stopper = setTimeout(() => { clearInterval(timer); playing = false; }, 1400);
      },
    };
  }

  // For checking levels without listening: render `seconds` of a piece offline; returns peak and RMS.
  async function test(opts = {}, seconds = 30) {
    const off = new OfflineAudioContext(2, Math.floor(44100 * seconds), 44100);
    const ch = buildChain(off), piece = Piece(off, ch, opts);
    piece.bus.gain.value = 1; piece.reset(0); piece.schedule(seconds);
    const buf = await off.startRendering();
    let peak = 0, sum = 0, nan = 0; const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) { const v = d[i]; if (Number.isNaN(v)) nan++; peak = Math.max(peak, Math.abs(v)); sum += v * v; }
    return { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / d.length).toFixed(4), nan };
  }

  window.AnimMusic = { create, test, state: () => (ac ? ac.state : 'not started') };
})();
