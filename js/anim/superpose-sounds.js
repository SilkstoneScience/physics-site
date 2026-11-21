/* "Hear it" buttons for animations/superposition.html: short sounds made with the Web Audio API (no files).
   They use the animation's numbers: 440 Hz and 444 Hz (4 beats a second); harmonics of 220 Hz with amplitudes
   1, 0.50, 0.33, 0.25 (instrument A) and 1, 0.15, 0.45, 0.10 (instrument B). The background music is not touched. */
(() => {
  'use strict';
  let ac = null, current = null;
  const SOUNDS = {
    'two-notes': [{ f: [440], a: [1], start: 0, dur: 1.6 }, { f: [444], a: [1], start: 1.8, dur: 1.6 }],
    beats: [{ f: [440, 444], a: [0.5, 0.5], start: 0, dur: 4 }],
    first: [{ f: [220], a: [1], start: 0, dur: 3 }],
    harmonics: [{ f: [220, 440, 660, 880], a: [1, 0.5, 0.33, 0.25], start: 0, dur: 3 }],
    'other-mix': [{ f: [220, 440, 660, 880], a: [1, 0.15, 0.45, 0.1], start: 0, dur: 3 }],
  };
  function stop() {
    if (!current) return;
    const { out, end } = current, now = ac.currentTime;
    out.gain.cancelScheduledValues(now); out.gain.setValueAtTime(out.gain.value, now); out.gain.linearRampToValueAtTime(0, now + 0.08);
    end.forEach((o) => { try { o.stop(now + 0.1); } catch { /* already stopped */ } });
    current = null;
  }
  function play(name) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    if (!ac) ac = new AC();
    if (ac.state === 'suspended') ac.resume();
    stop();
    const out = ac.createGain(); out.gain.value = 1; out.connect(ac.destination);
    const t0 = ac.currentTime + 0.05, oscs = [];
    for (const part of SOUNDS[name]) {
      // equal loudness for every button: scale the amplitudes to the same RMS (gain aᵢ / √(Σa²)), so they differ in sound, not volume
      const rms = Math.sqrt(part.a.reduce((p, q) => p + q * q, 0)), g = ac.createGain(), s = t0 + part.start, e = s + part.dur;
      const LEVEL = 0.10;                                                              // gentle level (peaks stay below about 0.13)
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(LEVEL, s + 0.08);       // fade in
      g.gain.setValueAtTime(LEVEL, e - 0.3); g.gain.linearRampToValueAtTime(0, e);       // fade out
      g.connect(out);
      part.f.forEach((f, i) => {
        const o = ac.createOscillator(), og = ac.createGain();
        o.type = 'sine'; o.frequency.value = f; og.gain.value = part.a[i] / rms;
        o.connect(og).connect(g); o.start(s); o.stop(e + 0.05); oscs.push(o);
      });
    }
    current = { out, end: oscs };
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-sound]');
    if (b) play(b.dataset.sound);
  });
})();
