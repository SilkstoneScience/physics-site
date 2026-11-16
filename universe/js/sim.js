// Universe Engine: the simulation state. Plain ES module (no Three.js), so Node can test it.
// Two modes:
//   'kepler'  each body follows its exact two-body orbit around its parent (the star is fixed at the origin);
//   'nbody'   the star and planets all pull on each other (Yoshida 4th-order, fixed time step);
//             moons keep exact Kepler orbits around their moving planet.
// Positions and velocities are SI (metres, metres per second) in Float64Arrays; nothing is allocated per frame.
import * as P from './physics.js';

const G = P.G;
export const MAX_SUBSTEPS = 400;      // full-gravity steps allowed in one frame
export const STEPS_PER_ORBIT = 300;   // time step = shortest "periapsis period" / this

export class Sim {
  constructor(sys) {
    this.sys = sys;
    const bodies = this.bodies = [sys.star];
    sys.star.id = 0; sys.star.pid = -1;
    this.planetIds = [];
    for (const p of sys.planets) {
      p.id = bodies.length; p.pid = 0; bodies.push(p); this.planetIds.push(p.id);
      for (const m of p.moons) { m.id = bodies.length; m.pid = p.id; bodies.push(m); }
    }
    const n = this.n = bodies.length;
    this.pos = new Float64Array(3 * n); this.vel = new Float64Array(3 * n);
    this.t = 0; this.mode = 'kepler';
    this.nb = P.createSystem(1 + sys.planets.length);
    this.radii = new Float64Array(1 + sys.planets.length);
    this.dt = 0; this.acc = 0; this.E0 = 0; this.drift = 0; this.limited = false; this.steps = 0;
    this.shift = [0, 0, 0];           // how far the origin moved at the last change of mode (for the camera)
    this.events = [];                 // messages for the page (collisions, escapes)
    this.changed = false;             // true once the student has altered anything
    this.tmp = new Float64Array(6); this.st = [0, 0];
    this.probe = { active: false, id: -1, f: 0, GM: 0, R: 0, r: 0, v: 0, v0: 0, vEsc: 0, t: 0, rMax: 0, status: 'idle', slow: false };
    this.orig = bodies.map((b) => ({ mass: b.mass, el: b.el ? { ...b.el, P: [...b.el.P], Q: [...b.el.Q] } : null }));
    for (const b of bodies) { b.dead = false; b.escaping = false; }
    this.computeKepler();
  }

  // ----- Orbits mode -----
  computeKepler() {
    const { bodies, pos, vel, tmp, t } = this;
    if (this.mode === 'kepler') { pos[0] = pos[1] = pos[2] = vel[0] = vel[1] = vel[2] = 0; }
    for (let i = 1; i < this.n; i++) {
      const b = bodies[i];
      if (b.dead) continue;
      const moon = b.pid !== 0;
      if (this.mode === 'nbody' && !moon) continue;      // planets come from the integrator
      const par = bodies[b.pid], k = 3 * i, q = 3 * b.pid;
      b.el.anom = P.keplerState(b.el, G * par.mass, t, tmp, 0);
      pos[k] = pos[q] + tmp[0]; pos[k + 1] = pos[q + 1] + tmp[1]; pos[k + 2] = pos[q + 2] + tmp[2];
      vel[k] = vel[q] + tmp[3]; vel[k + 1] = vel[q + 1] + tmp[4]; vel[k + 2] = vel[q + 2] + tmp[5];
    }
  }

  // ----- Full gravity -----
  syncFromNb() {
    const { nb, pos, vel, bodies, planetIds } = this;
    for (let c = 0; c < 3; c++) { pos[c] = nb.x[c]; vel[c] = nb.v[c]; }
    for (let j = 0; j < planetIds.length; j++) {
      const id = planetIds[j], b = bodies[id], k = 3 * id, q = 3 * (j + 1);
      if (b.dead) continue;
      for (let c = 0; c < 3; c++) { pos[k + c] = nb.x[q + c]; vel[k + c] = nb.v[q + c]; }
      // the orbit it is on at this instant (it changes as the other planets pull on it)
      P.stateToElements(pos[k] - pos[0], pos[k + 1] - pos[1], pos[k + 2] - pos[2], vel[k] - vel[0], vel[k + 1] - vel[1], vel[k + 2] - vel[2], G * (nb.m[0] + nb.m[j + 1]), this.t, b.el);
      b.escaping = b.el.e >= 1;
    }
    this.computeKepler();           // moons
  }
  chooseDt() {
    let tMin = Infinity;
    const mu0 = G * this.nb.m[0];
    for (const id of this.planetIds) {
      const b = this.bodies[id];
      if (b.dead) continue;
      const q = Math.abs(b.el.a) * Math.abs(1 - b.el.e);
      tMin = Math.min(tMin, P.TWO_PI * Math.sqrt(q * q * q / mu0));
    }
    this.dt = isFinite(tMin) ? tMin / STEPS_PER_ORBIT : 1000;
    this.acc = 0;
  }
  rebase() {                        // after any change: centre of mass at rest, fresh energy reference
    const { nb } = this, sx = nb.x[0], sy = nb.x[1], sz = nb.x[2];
    P.toBarycentre(nb); P.accelerations(nb);
    this.shift[0] = nb.x[0] - sx; this.shift[1] = nb.x[1] - sy; this.shift[2] = nb.x[2] - sz;
    this.syncFromNb(); this.chooseDt();
    this.E0 = P.totalEnergy(nb); this.drift = 0;
  }
  toNbody() {
    if (this.mode === 'nbody') return false;
    const { nb, pos, vel, bodies, planetIds } = this;
    nb.m[0] = bodies[0].mass; this.radii[0] = bodies[0].radius; nb.dead[0] = 0;
    for (let c = 0; c < 3; c++) { nb.x[c] = pos[c]; nb.v[c] = vel[c]; }
    for (let j = 0; j < planetIds.length; j++) {
      const id = planetIds[j], b = bodies[id];
      nb.m[j + 1] = b.dead ? 0 : b.mass; nb.dead[j + 1] = b.dead ? 1 : 0; this.radii[j + 1] = b.radius;
      for (let c = 0; c < 3; c++) { nb.x[3 * (j + 1) + c] = pos[3 * id + c]; nb.v[3 * (j + 1) + c] = vel[3 * id + c]; }
    }
    this.mode = 'nbody';
    this.rebase();
    return true;
  }
  toKepler() {
    if (this.mode === 'kepler') return false;
    const { pos, vel, bodies } = this, mu = G * bodies[0].mass;
    for (const id of this.planetIds) {
      const b = bodies[id], k = 3 * id;
      if (b.dead) continue;
      P.stateToElements(pos[k] - pos[0], pos[k + 1] - pos[1], pos[k + 2] - pos[2], vel[k] - vel[0], vel[k + 1] - vel[1], vel[k + 2] - vel[2], mu, this.t, b.el);
    }
    this.shift[0] = -pos[0]; this.shift[1] = -pos[1]; this.shift[2] = -pos[2];
    this.mode = 'kepler'; this.drift = 0; this.limited = false;
    this.computeKepler();
    return true;
  }
  nbIndex(id) { return id === 0 ? 0 : this.planetIds.indexOf(id) + 1; }

  // Change a planet's velocity (m/s): along its motion, away from the star, and out of its orbital plane.
  kick(id, dvPro, dvRad, dvNorm) {
    this.toNbody();
    const j = this.nbIndex(id), { nb } = this;
    if (j <= 0 || nb.dead[j]) return;
    const q = 3 * j;
    const rx = nb.x[q] - nb.x[0], ry = nb.x[q + 1] - nb.x[1], rz = nb.x[q + 2] - nb.x[2];
    const vx = nb.v[q] - nb.v[0], vy = nb.v[q + 1] - nb.v[1], vz = nb.v[q + 2] - nb.v[2];
    const r = Math.hypot(rx, ry, rz), v = Math.hypot(vx, vy, vz);
    const hx = ry * vz - rz * vy, hy = rz * vx - rx * vz, hz = rx * vy - ry * vx, h = Math.hypot(hx, hy, hz);
    nb.v[q] += dvPro * vx / v + dvRad * rx / r + dvNorm * hx / h;
    nb.v[q + 1] += dvPro * vy / v + dvRad * ry / r + dvNorm * hy / h;
    nb.v[q + 2] += dvPro * vz / v + dvRad * rz / r + dvNorm * hz / h;
    this.changed = true; this.rebase();
  }
  setMass(id, mass) {
    this.toNbody();
    const j = this.nbIndex(id);
    if (j < 0 || this.nb.dead[j]) return;
    this.nb.m[j] = mass; this.bodies[id].mass = mass;
    this.changed = true; this.rebase();
  }
  // Put everything back as it was generated (the clock keeps running).
  reset() {
    this.bodies.forEach((b, i) => {
      const o = this.orig[i];
      b.mass = o.mass; b.dead = false; b.escaping = false;
      if (o.el) { Object.assign(b.el, o.el); b.el.P = [...o.el.P]; b.el.Q = [...o.el.Q]; }
    });
    this.shift[0] = -this.pos[0]; this.shift[1] = -this.pos[1]; this.shift[2] = -this.pos[2];
    this.mode = 'kepler'; this.changed = false; this.drift = 0; this.limited = false; this.probe.active = false; this.probe.status = 'idle';
    this.computeKepler();
  }

  // ----- Test mass launched straight up from a body's surface -----
  launch(id, f) {
    const b = this.bodies[id], p = this.probe;
    p.active = true; p.id = id; p.f = f; p.GM = G * b.mass; p.R = b.radius; p.vEsc = P.escapeSpeed(b.mass, b.radius);
    p.r = p.R; p.v = p.v0 = f * p.vEsc; p.t = 0; p.rMax = p.R; p.status = 'flight'; p.slow = false;
  }
  updateProbe(dt) {
    const p = this.probe, st = this.st;
    if (!p.active || p.status !== 'flight' || dt <= 0) return;
    if (this.bodies[p.id].dead) { p.active = false; p.status = 'idle'; return; }
    st[0] = p.r; st[1] = p.v;
    let rem = dt, steps = 0;
    while (rem > 0 && steps < 20000) {
      const h = Math.min(rem, 0.004 * Math.sqrt(st[0] * st[0] * st[0] / p.GM));
      P.radialStep(st, p.GM, h); rem -= h; steps++; p.t += h;
      if (st[0] > p.rMax) p.rMax = st[0];
      if (st[0] <= p.R && st[1] < 0) { st[0] = p.R; st[1] = 0; p.status = 'landed'; break; }
      if (st[0] > 60 * p.R) { p.status = 'escaped'; break; }      // far enough to call it: its energy is positive
    }
    p.slow = rem > 0 && p.status === 'flight';
    p.r = st[0]; p.v = st[1];
  }

  // ----- One frame -----
  update(dt) {
    if (dt > 0) {
      if (this.mode === 'kepler') { this.t += dt; this.computeKepler(); }
      else {
        const { nb } = this;
        this.acc += dt;
        let n = Math.floor(this.acc / this.dt);
        this.limited = n > MAX_SUBSTEPS;
        if (this.limited) { n = MAX_SUBSTEPS; this.acc = 0; } else this.acc -= n * this.dt;
        this.steps = n;
        for (let k = 0; k < n; k++) {
          P.stepYoshida(nb, this.dt); this.t += this.dt;
          const hit = P.findCollision(nb, this.radii);
          if (hit >= 0) this.collide(Math.floor(hit / nb.n), hit % nb.n);
        }
        if (n) { this.syncFromNb(); this.drift = (P.totalEnergy(nb) - this.E0) / Math.abs(this.E0); }
      }
      this.updateProbe(dt);
    }
  }
  collide(i, j) {
    const { nb, bodies, planetIds } = this;
    const idOf = (k) => (k === 0 ? 0 : planetIds[k - 1]);
    const keep = P.merge(nb, i, j), lose = keep === i ? j : i;
    const kb = bodies[idOf(keep)], lb = bodies[idOf(lose)];
    lb.dead = true; for (const m of lb.moons) m.dead = true;
    kb.mass = nb.m[keep];
    this.events.push({ type: 'collision', keep: kb.id, lose: lb.id });
    P.accelerations(nb);
    this.syncFromNb(); this.chooseDt();
    this.E0 = P.totalEnergy(nb); this.drift = 0;      // kinetic energy was lost in the collision: start a new reference
  }

  // Position and velocity of a body relative to its parent, into out[0..5]. Returns the distance.
  relState(id, out) {
    const b = this.bodies[id], k = 3 * id, q = 3 * Math.max(b.pid, 0), { pos, vel } = this;
    out[0] = pos[k] - pos[q]; out[1] = pos[k + 1] - pos[q + 1]; out[2] = pos[k + 2] - pos[q + 2];
    out[3] = vel[k] - vel[q]; out[4] = vel[k + 1] - vel[q + 1]; out[5] = vel[k + 2] - vel[q + 2];
    return Math.hypot(out[0], out[1], out[2]);
  }
}
