// Universe Engine: the camera. Positions are 64-bit, in metres, in the same frame as the simulation (z is "up",
// at right angles to the system's plane). Four modes:
//   follow   orbit around a body, which stays in the middle of the view
//   chase    like follow, but the view turns with the body's direction of travel
//   top      looking straight down on the system
//   free     fly anywhere (W A S D, Q and E)
import * as THREE from 'three';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (6 * x - 15) + 10));
const LIMIT = 1.553;

export class CameraRig {
  constructor(sim, reduced) {
    this.sim = sim; this.reduced = reduced;
    this.pos = new Float64Array(3); this.quat = new THREE.Quaternion();
    this.mode = 'follow'; this.target = 0;
    this.yaw = 0.6; this.pitch = 0.45; this.dist = 1e12; this.yawT = 0.6; this.pitchT = 0.45; this.distT = 1e12;
    this.fyaw = 0; this.fpitch = 0; this.vel = new Float64Array(3);
    this.keys = Object.create(null);
    this.nearDist = 1e9;                 // distance to the nearest surface, set by the page each frame
    this.minDist = 1e6;
    this.tr = { active: false, t: 0, dur: 2, from: new Float64Array(3), fromQ: new THREE.Quaternion(), fromLen: 1 };
    this.goal = new Float64Array(3); this.off = new Float64Array(3);
    this.m4 = new THREE.Matrix4(); this.vx = new THREE.Vector3(); this.vy = new THREE.Vector3(); this.vz = new THREE.Vector3(); this.gq = new THREE.Quaternion();
    this.onClick = null; this.onDouble = null; this.onUser = null;
    this.chaseBase = 0;
  }

  // ----- maths helpers (no allocation) -----
  lookQuat(fx, fy, fz, out) {             // orientation that looks along (fx, fy, fz) with z up
    const fl = Math.hypot(fx, fy, fz) || 1; fx /= fl; fy /= fl; fz /= fl;
    let rx = fy, ry = -fx, rz = 0;        // forward x up(0,0,1)
    let rl = Math.hypot(rx, ry);
    if (rl < 1e-6) { rx = 1; ry = 0; rl = 1; }
    rx /= rl; ry /= rl;
    const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;
    this.m4.makeBasis(this.vx.set(rx, ry, rz), this.vy.set(ux, uy, uz), this.vz.set(-fx, -fy, -fz));
    return out.setFromRotationMatrix(this.m4);
  }
  targetPos(c) { return this.sim.pos[3 * this.target + c]; }
  bodyRadius() { return this.sim.bodies[this.target].radius; }

  // ----- commands -----
  // Go to a body. opts: { dist, mode, instant, dur }
  flyTo(id, opts = {}) {
    const b = this.sim.bodies[id];
    if (!b || b.dead) return;
    const tr = this.tr;
    for (let c = 0; c < 3; c++) tr.from[c] = this.pos[c] - this.sim.pos[3 * id + c];
    tr.fromLen = Math.hypot(tr.from[0], tr.from[1], tr.from[2]) || 1;
    tr.fromQ.copy(this.quat);
    const wasFree = this.mode === 'free';
    this.target = id;
    if (opts.mode) this.mode = opts.mode; else if (wasFree) this.mode = 'follow';
    this.minDist = b.radius * 1.25;
    if (opts.dist) this.distT = opts.dist;
    else if (opts.keepDist !== true) this.distT = b.radius * (b.kind === 'star' ? 7 : 5.5);
    if (this.mode === 'top') { this.pitchT = LIMIT; }
    else if (opts.pitch !== undefined) this.pitchT = opts.pitch;
    else if (Math.abs(this.pitchT) > 1.2) this.pitchT = 0.35;
    if (opts.yaw !== undefined) this.yawT = opts.yaw;
    else {
      // arrive on the side we are coming from, turned a little so the lit side shows
      this.yawT = Math.atan2(tr.from[1], tr.from[0]) - (this.mode === 'chase' ? this.chaseHeading() : 0);
    }
    // carry on smoothly from where we are
    this.yaw = this.yawT; this.pitch = this.pitchT; this.dist = this.distT;
    tr.dur = opts.dur || clamp(1.4 + 0.25 * Math.abs(Math.log10(tr.fromLen / this.distT)), 1.4, 3.2);
    tr.t = 0; tr.active = !(this.reduced || opts.instant);
  }
  setMode(mode) {
    if (mode === this.mode) return;
    if (mode === 'free') {
      // keep looking the same way
      const f = this.vz.set(0, 0, -1).applyQuaternion(this.quat);
      this.fyaw = Math.atan2(f.y, f.x); this.fpitch = Math.asin(clamp(f.z, -1, 1));
      this.vel.fill(0); this.mode = 'free'; this.tr.active = false;
      return;
    }
    const keep = this.mode !== 'free';
    const prev = this.mode; this.mode = mode;
    if (mode === 'top') this.flyTo(this.target, { mode: 'top', keepDist: keep, dist: keep ? undefined : this.distT });
    else if (mode === 'chase') this.flyTo(this.target, { mode: 'chase', keepDist: keep, yaw: Math.PI, pitch: 0.22 });
    else this.flyTo(this.target, { mode: 'follow', keepDist: keep, pitch: prev === 'top' ? 0.45 : undefined });
  }
  chaseHeading() {
    const b = this.sim.bodies[this.target], v = this.sim.vel, k = 3 * this.target, q = 3 * Math.max(b.pid, 0);
    const vx = v[k] - v[q], vy = v[k + 1] - v[q + 1];
    return Math.hypot(vx, vy) > 1e-9 ? Math.atan2(vy, vx) : this.chaseBase;
  }
  applyShift(s) { if (this.mode === 'free') { this.pos[0] += s[0]; this.pos[1] += s[1]; this.pos[2] += s[2]; } }
  zoom(factor) {
    if (this.mode === 'free') {
      const f = this.vz.set(0, 0, -1).applyQuaternion(this.quat), d = this.nearDist * (1 - factor);
      this.pos[0] += f.x * d; this.pos[1] += f.y * d; this.pos[2] += f.z * d;
    } else this.distT = clamp(this.distT * factor, this.minDist, 3e14);
  }
  rotate(dyaw, dpitch) {
    if (this.mode === 'free') { this.fyaw += dyaw; this.fpitch = clamp(this.fpitch + dpitch, -LIMIT, LIMIT); }
    else { this.yawT += dyaw; if (this.mode !== 'top') this.pitchT = clamp(this.pitchT + dpitch, -LIMIT, LIMIT); }
  }

  // ----- every frame -----
  update(dt) {
    const k = this.keys, sim = this.sim;
    if (sim.bodies[this.target].dead) this.flyTo(0, { dist: this.distT, instant: true });
    const moveX = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0), moveY = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0), moveZ = (k.KeyE ? 1 : 0) - (k.KeyQ ? 1 : 0);
    if ((moveX || moveY || moveZ) && this.mode !== 'free') { this.setMode('free'); if (this.onUser) this.onUser('free'); }
    const turn = 1.3 * dt;
    const ax = (k.ArrowRight ? 1 : 0) - (k.ArrowLeft ? 1 : 0), ay = (k.ArrowUp ? 1 : 0) - (k.ArrowDown ? 1 : 0);
    if (ax || ay) this.rotate(this.mode === 'free' ? -ax * turn : ax * turn, ay * turn);
    const zk = (k.Minus || k.NumpadSubtract ? 1 : 0) - (k.Equal || k.NumpadAdd ? 1 : 0);
    if (zk) this.zoom(Math.exp(zk * 1.6 * dt));

    if (this.mode === 'free') {
      const cp = Math.cos(this.fpitch), fx = cp * Math.cos(this.fyaw), fy = cp * Math.sin(this.fyaw), fz = Math.sin(this.fpitch);
      this.lookQuat(fx, fy, fz, this.quat);
      const rx = Math.sin(this.fyaw), ry = -Math.cos(this.fyaw);
      const speed = Math.max(this.nearDist, 2e5) * (k.ShiftLeft || k.ShiftRight ? 4 : 1.1);
      const tx = (fx * moveY + rx * moveX) * speed, ty = (fy * moveY + ry * moveX) * speed, tz = (fz * moveY + moveZ) * speed;
      const s = this.reduced ? 1 : 1 - Math.exp(-dt / 0.12);
      this.vel[0] += (tx - this.vel[0]) * s; this.vel[1] += (ty - this.vel[1]) * s; this.vel[2] += (tz - this.vel[2]) * s;
      this.pos[0] += this.vel[0] * dt; this.pos[1] += this.vel[1] * dt; this.pos[2] += this.vel[2] * dt;
      return;
    }
    const s = this.reduced ? 1 : 1 - Math.exp(-dt / 0.09);
    this.yaw += (this.yawT - this.yaw) * s; this.pitch += (this.pitchT - this.pitch) * s;
    this.dist *= Math.pow(this.distT / this.dist, s);
    let yaw = this.yaw;
    if (this.mode === 'chase') { this.chaseBase = this.chaseHeading(); yaw += this.chaseBase; }
    const cp = Math.cos(this.pitch), g = this.goal, off = this.off, tr = this.tr;
    g[0] = cp * Math.cos(yaw) * this.dist; g[1] = cp * Math.sin(yaw) * this.dist; g[2] = Math.sin(this.pitch) * this.dist;
    let e = 1;
    if (tr.active) {
      tr.t += dt / tr.dur; e = ease(tr.t);
      if (tr.t >= 1) tr.active = false;
    }
    if (e >= 1) { off[0] = g[0]; off[1] = g[1]; off[2] = g[2]; }
    else {
      // blend the direction evenly and the distance on a log scale, so the approach slows smoothly at any scale
      const gl = this.dist, fl = tr.fromLen;
      let dx = tr.from[0] / fl * (1 - e) + g[0] / gl * e, dy = tr.from[1] / fl * (1 - e) + g[1] / gl * e, dz = tr.from[2] / fl * (1 - e) + g[2] / gl * e;
      let dl = Math.hypot(dx, dy, dz);
      if (dl < 1e-3) { dz += 0.05; dl = Math.hypot(dx, dy, dz); }
      // rise above the straight line a little in the middle of a long trip (a gentle arc)
      const len = Math.exp(Math.log(fl) * (1 - e) + Math.log(gl) * e);
      off[0] = dx / dl * len; off[1] = dy / dl * len; off[2] = dz / dl * len;
    }
    for (let c = 0; c < 3; c++) this.pos[c] = this.targetPos(c) + off[c];
    this.lookQuat(-off[0], -off[1], -off[2], this.gq);
    if (e >= 1) this.quat.copy(this.gq);
    else this.quat.copy(tr.fromQ).slerp(this.gq, ease(Math.min(1, tr.t * 1.8)));
  }

  // ----- mouse, trackpad -----
  attach(el) {
    let down = false, moved = 0, lx = 0, ly = 0, lastClick = 0, id = -1;
    el.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0 && ev.button !== 2) return;
      down = true; moved = 0; lx = ev.clientX; ly = ev.clientY; id = ev.pointerId;
      el.setPointerCapture(id); el.focus({ preventScroll: true });
    });
    el.addEventListener('pointermove', (ev) => {
      if (!down || ev.pointerId !== id) return;
      const dx = ev.clientX - lx, dy = ev.clientY - ly; lx = ev.clientX; ly = ev.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 4) { this.rotate((this.mode === 'free' ? 1 : -1) * dx * 0.0052, dy * 0.0052); if (this.tr.active && this.tr.t > 0.6) this.tr.active = false; }
    });
    const up = (ev) => {
      if (!down || ev.pointerId !== id) return;
      down = false;
      if (moved <= 4 && ev.type === 'pointerup') {
        const r = el.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top, now = performance.now();
        if (now - lastClick < 350 && this.onDouble) this.onDouble(x, y); else if (this.onClick) this.onClick(x, y);
        lastClick = now;
      }
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('contextmenu', (ev) => ev.preventDefault());
    el.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      let d = ev.deltaY * (ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? 400 : 1);
      // a pinch on a trackpad arrives as a wheel event with ctrlKey set, and small deltas
      const f = Math.exp(clamp(d * (ev.ctrlKey ? 0.012 : 0.0016), -0.6, 0.6));
      this.zoom(f);
      if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY) * 1.5 && !ev.ctrlKey) this.rotate(ev.deltaX * 0.002, 0);
    }, { passive: false });
  }
}
