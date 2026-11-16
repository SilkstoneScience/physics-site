// Universe Engine: the physics visualisations drawn in the 3D view:
// velocity and force arrows, the field-strength map, equipotentials, the potential-well model,
// swept areas (Kepler's second law) and the test mass. Each can be switched on and off.
import * as THREE from 'three';
import { VERT_COMMON, FRAG_COMMON } from './shaders.js';
import { U, FOV } from './scene.js';
import { G, solveKepler, TWO_PI } from './physics.js';

// Colour scale for the field map: log10(g) from -6 to +2 (N/kg). Display (sRGB) values; also used for the legend.
export const FIELD_STOPS = [[0.07, 0.04, 0.3], [0.13, 0.3, 0.72], [0.1, 0.66, 0.62], [0.97, 0.76, 0.25], [1, 1, 0.93]];
export const FIELD_RANGE = [-6, 2];
export const ARROW_PX = 90;          // length of the longest arrow on screen
export const WELL_STEPS = 12;

const FIELD_FRAG = /* glsl */`
uniform float uLogFC;
uniform vec3 uRight; uniform vec3 uUp; uniform vec3 uFwd; uniform vec2 uTan;
uniform float uPlaneZ; uniform vec4 uBody[10]; uniform int uN; uniform vec3 uStarP; uniform float uRmax;
uniform float uField; uniform float uEqui; uniform float uDV; uniform vec3 uStops[5];
varying vec2 vNdc;
void main() {
  vec3 dir = uFwd + uRight * vNdc.x * uTan.x + uUp * vNdc.y * uTan.y;
  if (abs(dir.z) < 1e-7) discard;
  float t = uPlaneZ / dir.z;
  if (t <= 0.0) discard;
  vec3 P = dir * t;
  float rs = length(P.xy - uStarP.xy);
  if (rs > uRmax) discard;
  vec3 g = vec3(0.0); float V = 0.0;
  for (int i = 0; i < 10; i++) {
    if (i >= uN) break;
    vec3 d = uBody[i].xyz - P; float inv = inversesqrt(dot(d, d) + 1e-12);
    g += d * (uBody[i].w * inv * inv * inv); V -= uBody[i].w * 1e6 * inv;
  }
  float edge = smoothstep(uRmax, uRmax * 0.82, rs);
  vec4 o = vec4(0.0);
  if (uField > 0.0) {
    float lg = log(length(g)) / 2.302585;
    float x = clamp((lg + 6.0) / 8.0, 0.0, 1.0) * 4.0; int k = int(min(floor(x), 3.0));
    vec3 c = mix(uStops[k], uStops[k + 1], x - float(k));
    float w = fwidth(lg) + 1e-6;
    float line = 1.0 - smoothstep(0.6, 1.6, abs(fract(lg + 0.5) - 0.5) / w);
    c = mix(c, vec3(1.0), line * 0.55 * smoothstep(0.5, 0.2, w));
    float a = 0.8 * edge * uField;
    o = vec4(c * a, a);
  }
  if (uEqui > 0.0) {
    float x = V / uDV, w = fwidth(x) + 1e-6;
    float line = (1.0 - smoothstep(0.7, 1.7, abs(fract(x + 0.5) - 0.5) / w)) * smoothstep(0.45, 0.15, w);
    float a = 0.85 * line * edge * uEqui;
    o = vec4(vec3(0.72, 0.86, 1.0) * a + o.rgb * (1.0 - a), a + o.a * (1.0 - a));
  }
  if (o.a < 0.003) discard;
  gl_FragColor = o;
  gl_FragDepth = log2(1.0 + t) * uLogFC;
}
`;
const WELL_VERT = /* glsl */`
${VERT_COMMON}
uniform vec3 uStarP; uniform float uRin; uniform float uRout; uniform float uDepth;
varying float vK; varying float vTh; varying float vR01;
void main() {
  float r = uRin * pow(uRout / uRin, position.x), th = position.y;
  vK = uRin / r; vTh = th; vR01 = position.x;
  setPos(uStarP + vec3(r * cos(th), r * sin(th), -uDepth * vK));
}
`;
const WELL_FRAG = /* glsl */`
${FRAG_COMMON}
varying float vK; varying float vTh; varying float vR01;
void main() {
  float x = vK * ${WELL_STEPS}.0, w = fwidth(x) + 1e-6;
  float ring = (1.0 - smoothstep(0.6, 1.6, abs(fract(x + 0.5) - 0.5) / w)) * smoothstep(0.5, 0.15, w);
  float y = vTh * 24.0 / 6.2831853, wy = fwidth(y) + 1e-6;
  float spoke = (1.0 - smoothstep(0.6, 1.6, abs(fract(y + 0.5) - 0.5) / wy)) * step(wy, 0.5);
  float fade = smoothstep(1.0, 0.9, vR01) * smoothstep(0.0, 0.04, vR01);
  float a = (0.07 + 0.6 * max(ring, spoke * 0.6)) * fade;
  vec3 c = mix(vec3(0.35, 0.5, 0.85), vec3(0.75, 0.6, 1.0), vK);
  gl_FragColor = vec4(c * a, a);
  LOGDEPTH
}
`;
const AREA_VERT = /* glsl */`
${VERT_COMMON}
uniform vec3 uParent; uniform vec3 uPv; uniform vec3 uQv; uniform float uA;
varying float vSec;
void main() { vSec = position.z; setPos(uParent + (uPv * position.x + uQv * position.y) * uA); }
`;
const AREA_FRAG = /* glsl */`
${FRAG_COMMON}
varying float vSec;
void main() {
  float odd = mod(floor(vSec + 0.5), 2.0);
  float stripes = step(0.5, fract((gl_FragCoord.x + gl_FragCoord.y) / 9.0));
  float a = mix(0.2, 0.05 + 0.1 * stripes, odd);
  gl_FragColor = vec4(vec3(1.0, 0.85, 0.55) * a, a);
  LOGDEPTH
}
`;

export class Viz {
  constructor(scene, sim) {
    this.scene = scene; this.sim = sim;
    this.on = { vectors: false, field: false, equi: false, well: false, areas: false };
    this.vMax = 1; this.fMax = 1; this.dV = 1; this.areaEl = { a: 0, e: -1, id: -1 }; this.areaEach = 0; this.areaT = 0;
    this.tmp = new Float64Array(6);
    const blend = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };
    const sys = sim.sys, aOut = sys.planets[sys.planets.length - 1].el.a, aIn = sys.planets[0].el.a;
    this.rMax = aOut * 1.35 * U; this.aIn = aIn; this.aOut = aOut;

    // field map and equipotentials: one full-screen pass that works out where each pixel's sight line meets the orbital plane
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    this.fieldMat = new THREE.ShaderMaterial({
      vertexShader: 'varying vec2 vNdc; void main() { vNdc = position.xy; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: FIELD_FRAG, ...blend,
      uniforms: {
        uLogFC: scene.shared.uLogFC, uRight: { value: new THREE.Vector3() }, uUp: { value: new THREE.Vector3() }, uFwd: { value: new THREE.Vector3() }, uTan: { value: new THREE.Vector2() },
        uPlaneZ: { value: 0 }, uBody: { value: Array.from({ length: 10 }, () => new THREE.Vector4()) }, uN: { value: 0 }, uStarP: { value: new THREE.Vector3() }, uRmax: { value: this.rMax },
        uField: { value: 0 }, uEqui: { value: 0 }, uDV: { value: 1 }, uStops: { value: FIELD_STOPS.map((c) => new THREE.Color().setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace)).map((c) => new THREE.Vector3(c.r, c.g, c.b)) },
      },
    });
    this.field = scene.mesh(tri, this.fieldMat, 2);

    // potential well: a funnel under the orbital plane
    const nr = 90, nt = 180, wp = new Float32Array((nr + 1) * (nt + 1) * 3), idx = [];
    for (let i = 0; i <= nr; i++) for (let j = 0; j <= nt; j++) { const k = (i * (nt + 1) + j) * 3; wp[k] = i / nr; wp[k + 1] = j / nt * TWO_PI; }
    for (let i = 0; i < nr; i++) for (let j = 0; j < nt; j++) { const a = i * (nt + 1) + j, b = a + nt + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(wp, 3)); wg.setIndex(idx);
    this.wellRin = aIn * 0.45; this.wellDepth = aOut * 0.5;
    this.wellMat = scene.material(WELL_VERT, WELL_FRAG, { uStarP: this.fieldMat.uniforms.uStarP, uRin: { value: this.wellRin * U }, uRout: { value: this.rMax }, uDepth: { value: this.wellDepth * U } }, { ...blend, side: THREE.DoubleSide });
    this.well = scene.mesh(wg, this.wellMat, 2);

    // swept areas
    this.areaPos = new Float32Array(12 * 16 * 9);
    const ag = new THREE.BufferGeometry(); this.areaAttr = new THREE.BufferAttribute(this.areaPos, 3); this.areaAttr.setUsage(THREE.DynamicDrawUsage); ag.setAttribute('position', this.areaAttr);
    this.areaMat = scene.material(AREA_VERT, AREA_FRAG, { uParent: { value: new THREE.Vector3() }, uPv: { value: new THREE.Vector3() }, uQv: { value: new THREE.Vector3() }, uA: { value: 1 } }, { ...blend, side: THREE.DoubleSide });
    this.areas = scene.mesh(ag, this.areaMat, 4);
    this.field.visible = this.well.visible = this.areas.visible = false;
  }

  // Height of the well surface (metres below the plane) at distance r from the star.
  wellDrop(r) { return this.wellDepth * this.wellRin / Math.max(r, this.wellRin); }

  buildAreas(el) {
    const p = this.areaPos, e = el.e, b = Math.sqrt(1 - e * e);
    let o = 0;
    for (let s = 0; s < 12; s++) {
      let E0 = solveKepler(TWO_PI * s / 12, e), E1 = solveKepler(TWO_PI * (s + 1) / 12, e);
      if (E0 < 0) E0 += TWO_PI; if (E1 <= 0) E1 += TWO_PI;
      for (let k = 0; k < 16; k++) {
        const a0 = E0 + (E1 - E0) * k / 16, a1 = E0 + (E1 - E0) * (k + 1) / 16;
        p[o++] = 0; p[o++] = 0; p[o++] = s;
        p[o++] = Math.cos(a0) - e; p[o++] = b * Math.sin(a0); p[o++] = s;
        p[o++] = Math.cos(a1) - e; p[o++] = b * Math.sin(a1); p[o++] = s;
      }
    }
    this.areaAttr.needsUpdate = true;
  }

  // Called every frame after scene.update(). cam: camera position (metres); quat: its orientation.
  update(cam, quat, selected) {
    const { scene, sim, on } = this, { pos, vel, bodies } = sim, vis = scene.vis;
    const sRel = vis[0].rel;
    // ----- field map / equipotentials -----
    const showField = on.field || on.equi;
    this.field.visible = showField;
    if (showField || on.well) this.fieldMat.uniforms.uStarP.value.set(sRel[0] * U, sRel[1] * U, sRel[2] * U);
    if (showField) {
      const u = this.fieldMat.uniforms, tan = Math.tan(FOV * Math.PI / 360);
      u.uRight.value.set(1, 0, 0).applyQuaternion(quat); u.uUp.value.set(0, 1, 0).applyQuaternion(quat); u.uFwd.value.set(0, 0, -1).applyQuaternion(quat);
      u.uTan.value.set(tan * scene.camera.aspect, tan);
      u.uPlaneZ.value = sRel[2] * U;
      let n = 0;
      u.uBody.value[n++].set(sRel[0] * U, sRel[1] * U, sRel[2] * U, G * bodies[0].mass * 1e-12);
      for (const id of sim.planetIds) { const b = bodies[id], r = vis[id].rel; if (!b.dead && n < 10) u.uBody.value[n++].set(r[0] * U, r[1] * U, r[2] * U, G * b.mass * 1e-12); }
      u.uN.value = n; u.uField.value = on.field ? 1 : 0; u.uEqui.value = on.equi ? 1 : 0;
      this.dV = G * bodies[0].mass / this.aIn / 16; u.uDV.value = this.dV;
    }
    // ----- potential well -----
    this.well.visible = on.well;
    if (on.well) {
      for (const id of sim.planetIds) {
        const b = bodies[id], v = vis[id]; if (b.dead) continue;
        const r = Math.hypot(pos[3 * id] - pos[0], pos[3 * id + 1] - pos[1]), drop = this.wellDrop(r) + (pos[3 * id + 2] - pos[2]);
        const x = v.rel[0] * U, y = v.rel[1] * U, z = v.rel[2] * U;
        scene.addSegment(x, y, z, x, y, z - drop * U, 0.75, 0.65, 1, 0.55, 1.2, 6);
        scene.addMark(x, y, z - drop * U, 1, 9, 9, null, 0.85, 0.75, 1, 0.9, 0);
      }
    }
    // ----- swept areas -----
    const sb = selected > 0 ? bodies[selected] : null;
    this.areas.visible = !!(on.areas && sb && !sb.dead && sb.el.e < 1);
    if (this.areas.visible) {
      const el = sb.el, c = this.areaEl;
      if (c.id !== selected || Math.abs(c.e - el.e) > 2e-4) { this.buildAreas(el); c.id = selected; c.e = el.e; }
      const u = this.areaMat.uniforms, pr = vis[sb.pid].rel, par = bodies[sb.pid];
      u.uParent.value.set(pr[0] * U, pr[1] * U, pr[2] * U); u.uPv.value.set(el.P[0], el.P[1], el.P[2]); u.uQv.value.set(el.Q[0], el.Q[1], el.Q[2]); u.uA.value = el.a * U;
      this.areaEach = Math.PI * el.a * el.a * Math.sqrt(1 - el.e * el.e) / 12;
      this.areaT = TWO_PI * Math.sqrt(el.a ** 3 / (G * par.mass)) / 12;
    }
    // ----- velocity and force arrows -----
    if (on.vectors) {
      let vMax = 0, fMax = 0;
      const each = (fn) => { for (const id of sim.planetIds) if (!bodies[id].dead) fn(id); if (sb && sb.kind === 'moon' && !sb.dead && vis[selected].grow > 0.5) fn(selected); };
      const t = this.tmp;
      each((id) => {
        const b = bodies[id], r = sim.relState(id, t), v = Math.hypot(t[3], t[4], t[5]);
        b._v = v; b._f = G * bodies[b.pid].mass * b.mass / (r * r);
        if (b.kind === 'planet') { vMax = Math.max(vMax, v); fMax = Math.max(fMax, b._f); }
      });
      this.vMax = vMax; this.fMax = fMax;
      each((id) => {
        const b = bodies[id], v = vis[id], r = sim.relState(id, t);
        if (!v.front) return;
        const perPx = v.dist * U / scene.focal, x = v.rel[0] * U, y = v.rel[1] * U, z = v.rel[2] * U;
        const lv = Math.min(ARROW_PX * 1.6, Math.max(7, ARROW_PX * b._v / vMax)) * perPx / b._v;
        const vx = x + t[3] * lv, vy = y + t[4] * lv, vz = z + t[5] * lv;
        scene.addSegment(x, y, z, vx, vy, vz, 0.45, 0.95, 0.85, 0.95, 1.6, 0);
        scene.addMark(vx, vy, vz, 0, scene.glyph.v[4], scene.glyph.v[5], scene.glyph.v, 0.45, 0.95, 0.85, 0.95, 0);
        const lf = Math.min(ARROW_PX * 1.6, Math.max(7, ARROW_PX * b._f / fMax)) * perPx / r;
        const fx = x - t[0] * lf, fy = y - t[1] * lf, fz = z - t[2] * lf;
        scene.addSegment(x, y, z, fx, fy, fz, 1, 0.72, 0.35, 0.95, 1.6, 7);
        scene.addMark(fx, fy, fz, 0, scene.glyph.F[4], scene.glyph.F[5], scene.glyph.F, 1, 0.72, 0.35, 0.95, 0);
      });
    }
    // ----- test mass -----
    const p = sim.probe;
    if (p.active && !bodies[p.id].dead) {
      const b = bodies[p.id], v = vis[p.id], ax = b.axis, k = v.rd;
      const x = v.rel[0] * U, y = v.rel[1] * U, z = v.rel[2] * U;
      const h = p.r / p.R, hm = p.rMax / p.R;
      scene.addSegment(x + ax[0] * k, y + ax[1] * k, z + ax[2] * k, x + ax[0] * k * h, y + ax[1] * k * h, z + ax[2] * k * h, 1, 0.95, 0.7, 0.8, 1.3, 0);
      scene.addMark(x + ax[0] * k * h, y + ax[1] * k * h, z + ax[2] * k * h, 1, 12, 12, null, 1, 0.95, 0.7, 1, 0);
      if (hm > h * 1.001) scene.addMark(x + ax[0] * k * hm, y + ax[1] * k * hm, z + ax[2] * k * hm, 1, 7, 7, null, 1, 0.95, 0.7, 0.5, 0);
    }
  }
}

// The film curve and sRGB step of the final pass, for making legends that match what is on screen.
export function displayColour(lin) {
  const f = (x) => { x = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14); x = x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055; return Math.round(255 * Math.min(1, Math.max(0, x))); };
  return `rgb(${f(lin[0])},${f(lin[1])},${f(lin[2])})`;
}
