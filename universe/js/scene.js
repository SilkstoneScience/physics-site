// Universe Engine: everything drawn with Three.js.
// The camera always sits at the origin of the 3D scene. Each frame, every body's position is worked out
// relative to the camera in 64-bit numbers and only then handed to the graphics chip (which uses 32-bit numbers).
// This "floating origin" is what stops things jittering billions of kilometres from the star.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import * as SH from './shaders.js';
import { makeRng } from './generator.js';
import { G, R_EARTH, TWO_PI } from './physics.js';

export const U = 1e-6;                 // metres -> scene units (1 unit = 1000 km)
export const FOV = 50;
const FAR = 1e11, LOG_FC = 1 / Math.log2(FAR + 1);
export const ROCK_ENLARGE = 2500;      // asteroids are drawn this many times too big in the enlarged view

export const PRESETS = {
  low: { label: 'Low effects', scale: 0.75, maxDpr: 1, msaa: 0, fxaa: true, bloomRes: 0.5, oct: 5, craters: 1, skyOct: 4, sky: 512, stars: 4500, rocks: 1500, rockDetail: 0, rockNear: 10, dust: 6000, seg: [64, 40] },
  normal: { label: 'Normal', scale: 1, maxDpr: 1.25, msaa: 4, fxaa: false, bloomRes: 1, oct: 7, craters: 2, skyOct: 6, sky: 1024, stars: 9000, rocks: 4000, rockDetail: 1, rockNear: 20, dust: 14000, seg: [96, 64] },
  high: { label: 'High', scale: 1, maxDpr: 2, msaa: 4, fxaa: false, bloomRes: 1, oct: 8, craters: 3, skyOct: 7, sky: 1024, stars: 14000, rocks: 9000, rockDetail: 2, rockNear: 28, dust: 24000, seg: [128, 80] },
};
const TYPE_ID = { rocky: 0, ocean: 1, desert: 2, ice: 3, gas: 4, icegiant: 5, moonrock: 6, moonice: 7 };
// Smallest apparent size (radians) a body may have in the enlarged view.
const minAngle = (b) => (b.kind === 'star' ? 0.026 : b.kind === 'moon' ? 0.0032 : 0.0068 * Math.min(2.3, Math.max(0.7, Math.pow(b.radius / R_EARTH, 0.33))));

const hsl = (h, s, l) => new THREE.Color().setHSL(((h % 1) + 1) % 1, s, l, THREE.SRGBColorSpace);
function palette(b) {
  const v = b.vis, lerp = (a, c, t) => a + (c - a) * t;
  const o = { A: hsl(0, 0, 0.4), B: hsl(0, 0, 0.6), C: hsl(0, 0, 0.2), D: hsl(0, 0, 0.5), P: new THREE.Vector4(1, 0.9, 0.1, 0.5), atm: hsl(0.6, 0.6, 0.6), atmK: 0, H: 0.02, ringA: hsl(0.1, 0.25, 0.7), ringB: hsl(0.08, 0.2, 0.45) };
  switch (b.type) {
    case 'rocky': o.A = hsl(lerp(0.04, 0.1, v[0]), lerp(0.1, 0.3, v[1]), 0.2); o.B = hsl(lerp(0.05, 0.11, v[2]), lerp(0.1, 0.25, v[1]), 0.5); o.C = hsl(0.06, 0.1, 0.11); o.P.set(b.atmosphere ? 0.35 : 1, 0, 0, 0); o.atm = hsl(0.08, 0.3, 0.6); o.atmK = b.atmosphere ? 0.3 : 0; break;
    case 'moonrock': o.A = hsl(lerp(0.05, 0.1, v[0]), lerp(0.02, 0.14, v[1]), 0.22); o.B = hsl(0.08, lerp(0.02, 0.1, v[2]), 0.52); o.C = hsl(0.07, 0.05, 0.1); o.P.set(1, 0, 0, 0); break;
    case 'ocean': o.A = hsl(lerp(0.24, 0.38, v[0]), 0.5, 0.2); o.B = hsl(lerp(0.08, 0.13, v[1]), 0.45, 0.42); o.C = hsl(0.07, 0.15, 0.3); o.D = hsl(lerp(0.56, 0.63, v[2]), 0.75, 0.2);
      o.P.set(lerp(-0.02, 0.2, v[3]), lerp(0.76, 0.92, v[4]), lerp(-0.05, 0.15, v[5]), 0); o.atm = hsl(0.6, 0.85, 0.62); o.atmK = 1; o.H = 0.022; break;
    case 'desert': o.A = hsl(lerp(0.03, 0.08, v[0]), 0.6, 0.3); o.B = hsl(lerp(0.07, 0.12, v[1]), 0.55, 0.55); o.C = hsl(0.03, 0.3, 0.1);
      o.P.set(0, lerp(0.9, 0.98, v[3]), v[4], 0); o.atm = hsl(0.07, 0.6, 0.62); o.atmK = 0.45; o.H = 0.016; break;
    case 'ice': case 'moonice': o.A = hsl(lerp(0.54, 0.62, v[0]), 0.25, 0.72); o.B = hsl(0.56, 0.12, 0.9); o.C = hsl(lerp(0.02, 0.07, v[1]), 0.5, 0.22); o.P.set(lerp(0.3, 1, v[2]), 0, lerp(0.45, 1, v[3]), 0); break;
    case 'gas': {
      const fam = Math.floor(v[0] * 3);
      if (fam === 0) { o.A = hsl(0.08, 0.5, 0.62); o.B = hsl(0.05, 0.55, 0.3); o.C = hsl(0.11, 0.35, 0.82); o.D = hsl(0.02, 0.7, 0.35); o.atm = hsl(0.09, 0.5, 0.7); }
      else if (fam === 1) { o.A = hsl(0.12, 0.5, 0.68); o.B = hsl(0.09, 0.4, 0.45); o.C = hsl(0.14, 0.2, 0.88); o.D = hsl(0.07, 0.6, 0.4); o.atm = hsl(0.12, 0.5, 0.75); }
      else { o.A = hsl(0.55, 0.3, 0.6); o.B = hsl(0.6, 0.4, 0.3); o.C = hsl(0.5, 0.15, 0.85); o.D = hsl(0.62, 0.5, 0.25); o.atm = hsl(0.57, 0.5, 0.7); }
      o.P.set(lerp(5, 11, v[1]), lerp(0.25, 0.6, v[2]), lerp(-0.5, 0.5, v[3]), lerp(0.3, 0.8, v[4])); o.atmK = 0.7; o.H = 0.014; break;
    }
    case 'icegiant': o.A = hsl(lerp(0.5, 0.6, v[0]), 0.5, 0.5); o.B = hsl(lerp(0.5, 0.6, v[0]) + 0.02, 0.45, 0.62); o.C = hsl(0.52, 0.2, 0.85); o.D = hsl(0.62, 0.5, 0.3);
      o.P.set(lerp(3, 5.5, v[1]), 0.12, lerp(-0.5, 0.5, v[3]), 0.25); o.atm = hsl(lerp(0.5, 0.58, v[0]), 0.7, 0.68); o.atmK = 0.9; o.H = 0.018; break;
  }
  if (b.rings) { const t = b.rings.tint; o.ringA = hsl(lerp(0.07, 0.13, t), lerp(0.12, 0.4, t), 0.72); o.ringB = hsl(lerp(0.05, 0.1, t), 0.25, 0.42); }
  return o;
}

export class Scene {
  constructor(canvas, sim, quality, reducedMotion) {
    this.canvas = canvas; this.sim = sim; this.q = PRESETS[quality]; this.quality = quality; this.reduced = reducedMotion;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' });
    r.outputColorSpace = THREE.LinearSRGBColorSpace;
    r.info.autoReset = false;
    r.setClearColor(0x000000, 1);
    const gl = r.getContext();
    this.floatOK = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    this.gpuName = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 1e-4, FAR);
    this.shared = { uLogFC: { value: LOG_FC }, uRes: { value: new THREE.Vector2(960, 540) }, uPx: { value: 1 } };
    this.time = 0; this.trueScale = 0; this.trueScaleTarget = 0; this.show = { orbits: true, labels: true };
    this.selected = -1; this.cssW = 1; this.cssH = 1; this.focal = 1000;
    this.sunCol = new THREE.Color();
    this.vis = [];
    this.tmpV = new THREE.Vector3(); this.tmpQ = new THREE.Quaternion(); this.labelBox = new Float32Array(256);
    this.buildComposer();
    this.buildSky();
    this.buildSystem();
    this.buildMarkers();
    this.buildSegments();
  }

  material(vert, frag, uniforms, opts = {}) {
    const m = new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag,
      uniforms: { uLogFC: this.shared.uLogFC, uRes: this.shared.uRes, ...uniforms },
      defines: { OCT: this.q.oct, CRATER_LAYERS: this.q.craters, SKY_OCT: this.q.skyOct }, ...opts,
    });
    return m;
  }
  mesh(geo, mat, order = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false; m.matrixAutoUpdate = false; m.renderOrder = order;
    this.scene.add(m);
    return m;
  }

  // ---------- Post-processing ----------
  buildComposer() {
    const q = this.q, r = this.renderer;
    const rt = new THREE.WebGLRenderTarget(4, 4, { type: this.floatOK ? THREE.HalfFloatType : THREE.UnsignedByteType, samples: q.msaa, depthBuffer: true });
    const c = this.composer = new EffectComposer(r, rt);
    c.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.45, 0.5, 0.92);
    c.addPass(this.bloom);
    this.final = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uExposure: { value: 1.0 }, uVignette: { value: 0.35 } }, vertexShader: SH.PASS_VERT, fragmentShader: SH.FINAL_FRAG });
    c.addPass(this.final);
    if (q.fxaa) { this.fxaa = new ShaderPass(FXAAShader); c.addPass(this.fxaa); }
  }
  resize(w, h, exactPixels) {
    const q = this.q;
    this.cssW = w; this.cssH = h;
    const pr = exactPixels ? 1 : Math.min(window.devicePixelRatio || 1, q.maxDpr) * q.scale;
    this.pr = pr;
    this.renderer.setPixelRatio(pr); this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(pr); this.composer.setSize(w, h);
    this.bloom.resolution.set(w * pr * q.bloomRes, h * pr * q.bloomRes);
    if (this.fxaa) this.fxaa.material.uniforms.resolution.value.set(1 / (w * pr), 1 / (h * pr));
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.shared.uRes.value.set(w / 2, h / 2); this.shared.uPx.value = pr * Math.max(0.75, h / 1080);
    this.focal = h / 2 / Math.tan(FOV * Math.PI / 360);     // pixels per radian at the centre of the view
  }

  // ---------- Sky ----------
  buildSky() {
    const q = this.q, sys = this.sim.sys, r = makeRng('v1/sky/' + sys.seed);
    const gal = new THREE.Vector3(r.range(-1, 1), r.range(-1, 1), r.range(0.3, 1)).normalize();
    this.gal = gal;
    const size = q.sky;
    this.skyRT = new THREE.WebGLCubeRenderTarget(size, { type: this.floatOK ? THREE.HalfFloatType : THREE.UnsignedByteType, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    const h0 = r.f();
    this.bakeMat = new THREE.ShaderMaterial({
      vertexShader: SH.SKY_BAKE_VERT, fragmentShader: SH.SKY_BAKE_FRAG, depthTest: false, depthWrite: false,
      defines: { SKY_OCT: q.skyOct },
      uniforms: { uFace: { value: 0 }, uGal: { value: gal }, uSeed: { value: new THREE.Vector4(r.f(), r.f(), r.f(), r.f()) }, uNebA: { value: hsl(h0, 0.5, 0.45) }, uNebB: { value: hsl(h0 + r.range(0.25, 0.45), 0.5, 0.5) }, uNebC: { value: hsl(h0 + r.range(0.5, 0.7), 0.45, 0.6) } },
    });
    this.bakeScene = new THREE.Scene();
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    const bm = new THREE.Mesh(tri, this.bakeMat); bm.frustumCulled = false; this.bakeScene.add(bm);
    this.bakeCam = new THREE.Camera();
    this.skyFace = 0;
    this.skyMat = new THREE.ShaderMaterial({ vertexShader: SH.SKY_VERT, fragmentShader: SH.SKY_FRAG, uniforms: { uSky: { value: this.skyRT.texture }, uGain: { value: 1.5 } }, depthTest: false, depthWrite: false, side: THREE.BackSide });
    this.mesh(new THREE.BoxGeometry(2, 2, 2), this.skyMat, -100);

    // Stars: more of them near the galactic plane; a few bright, most faint; colours from temperature.
    const n = q.stars, pos = new Float32Array(3 * n), col = new Float32Array(4 * n), v = new THREE.Vector3(), c = [0, 0, 0];
    const ax = new THREE.Vector3(1, 0, 0).cross(gal).normalize(), ay = new THREE.Vector3().crossVectors(gal, ax);
    for (let i = 0; i < n; i++) {
      if (r.f() < 0.5) { const z = r.range(-1, 1), a = r.range(0, TWO_PI), s = Math.sqrt(1 - z * z); v.set(s * Math.cos(a), s * Math.sin(a), z); }
      else { const a = r.range(0, TWO_PI), lat = (r.f() + r.f() + r.f() - 1.5) * 0.28; v.copy(ax).multiplyScalar(Math.cos(a)).addScaledVector(ay, Math.sin(a)).addScaledVector(gal, lat).normalize(); }
      pos.set([v.x, v.y, v.z], 3 * i);
      const T = 2800 + 9000 * Math.pow(r.f(), 2.2), u = 1000 / T;
      // quick black-body tint (the same fit as physics.js, simplified)
      c[0] = 1; c[1] = Math.min(1, Math.max(0.55, 1.05 - 0.9 * Math.abs(u - 0.16))); c[2] = Math.min(1, Math.max(0.35, 1.25 - 2.6 * u));
      if (T > 7000) { c[0] = 0.78; c[1] = 0.87; c[2] = 1; }
      col.set([c[0], c[1], c[2], Math.pow(r.f(), 7) * 0.95 + 0.05 * r.f()], 4 * i);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setAttribute('aStar', new THREE.BufferAttribute(col, 4));
    const sm = new THREE.ShaderMaterial({ vertexShader: SH.STARS_VERT, fragmentShader: SH.STARS_FRAG, uniforms: { uPx: this.shared.uPx }, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, transparent: false });
    const pts = new THREE.Points(sg, sm); pts.frustumCulled = false; pts.matrixAutoUpdate = false; pts.renderOrder = -99; this.scene.add(pts);
  }
  // Paint one face of the nebula cube map. Returns true while there is more to do.
  bakeSkyStep() {
    if (this.skyFace >= 6) return false;
    this.bakeMat.uniforms.uFace.value = this.skyFace;
    this.renderer.setRenderTarget(this.skyRT, this.skyFace);
    this.renderer.render(this.bakeScene, this.bakeCam);
    this.renderer.setRenderTarget(null);
    this.skyFace++;
    return this.skyFace < 6;
  }

  // ---------- Star, planets, moons, rings, belt ----------
  buildSystem() {
    const { sim, q } = this, sys = sim.sys;
    const sphere = new THREE.SphereGeometry(1, q.seg[0], q.seg[1]);
    this.sunCol.setRGB(sys.star.color[0], sys.star.color[1], sys.star.color[2]).lerp(new THREE.Color(1, 1, 1), 0.45);
    const orbitGeo = this.orbitGeometry(800);
    const moonOrbitGeo = this.orbitGeometry(320);
    for (const b of sim.bodies) {
      const v = { b, rel: new Float64Array(3), dist: 1, rd: 1, px: 0, sx: 0, sy: 0, front: false, shown: true, grow: 1, enl: 1 };
      const seed = new THREE.Vector4(b.vis[0], b.vis[1], b.vis[2], b.vis[3]);
      const base = { uCenter: { value: new THREE.Vector3() }, uRadius: { value: 1 }, uSpin: { value: new THREE.Matrix3() }, uSeed: { value: seed } };
      if (b.kind === 'star') {
        v.mat = this.material(SH.PLANET_VERT, SH.STAR_FRAG, { ...base, uColor: { value: new THREE.Color(b.color[0], b.color[1], b.color[2]) }, uTime: { value: 0 }, uGain: { value: 1.25 } });
        v.mesh = this.mesh(sphere, v.mat);
        v.coronaMat = this.material(SH.CORONA_VERT, SH.CORONA_FRAG, { uCenter: base.uCenter, uSize: { value: 1 }, uDisc: { value: 0.2 }, uColor: v.mat.uniforms.uColor, uTime: v.mat.uniforms.uTime, uSeed: { value: seed }, uGain: { value: 1 }, uAnim: { value: this.reduced ? 0 : 1 } },
          { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
        const quad = new THREE.BufferGeometry();
        quad.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
        v.corona = this.mesh(quad, v.coronaMat, 8);
      } else {
        const pal = palette(b);
        v.pal = pal;
        const shadow = { uRing: { value: new THREE.Vector4(1, 2, 0, 0) }, uRingN: { value: new THREE.Vector3(0, 0, 1) }, uOcc: { value: [0, 1, 2, 3, 4].map(() => new THREE.Vector4(0, 0, 0, 0)) }, uOccN: { value: 0 } };
        const light = { uSun: { value: new THREE.Vector3(1, 0, 0) }, uSunCol: { value: this.sunCol } };
        if (b.rings) { shadow.uRing.value.set(b.rings.inner / b.radius, b.rings.outer / b.radius, b.rings.seed, 0.9); shadow.uRingN.value.set(b.axis[0], b.axis[1], b.axis[2]); }
        v.mat = this.material(SH.PLANET_VERT, SH.PLANET_FRAG, {
          ...base, ...shadow, ...light, uType: { value: TYPE_ID[b.type] }, uP: { value: pal.P }, uColA: { value: pal.A }, uColB: { value: pal.B }, uColC: { value: pal.C }, uColD: { value: pal.D },
          uAtmCol: { value: pal.atm }, uAtm: { value: pal.atmK }, uCloudRot: { value: new THREE.Vector2(1, 0) },
        });
        v.mesh = this.mesh(sphere, v.mat);
        if (pal.atmK > 0) {
          v.atmoMat = this.material(SH.ATMO_VERT, SH.ATMO_FRAG, { uCenter: base.uCenter, uRadius: base.uRadius, uShell: { value: 1 + pal.H * 7 }, uH: { value: pal.H }, ...shadow, ...light, uAtmCol: { value: pal.atm }, uAtm: { value: pal.atmK } },
            { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
          v.atmo = this.mesh(sphere, v.atmoMat, 5);
        }
        if (b.rings) {
          const n = 160, ri = b.rings.inner / b.radius, ro = b.rings.outer / b.radius, p = new Float32Array(n * 18);
          for (let i = 0; i < n; i++) {
            const a0 = i / n * TWO_PI, a1 = (i + 1) / n * TWO_PI, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), k = 1 / Math.cos(Math.PI / n);
            p.set([c0 * ri, s0 * ri, 0, c0 * ro * k, s0 * ro * k, 0, c1 * ro * k, s1 * ro * k, 0, c0 * ri, s0 * ri, 0, c1 * ro * k, s1 * ro * k, 0, c1 * ri, s1 * ri, 0], i * 18);
          }
          const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(p, 3));
          const bs = b.basis, basis = new THREE.Matrix3().set(bs[0], bs[3], bs[6], bs[1], bs[4], bs[7], bs[2], bs[5], bs[8]);
          const occ = { uOcc: { value: [0, 1, 2, 3, 4].map((i) => new THREE.Vector4(0, 0, 0, i === 0 ? 1 : 0)) }, uOccN: { value: 1 } };
          v.ringMat = this.material(SH.RING_VERT, SH.RING_FRAG, { uCenter: base.uCenter, uRadius: base.uRadius, uBasis: { value: basis }, uRing: shadow.uRing, uRingN: shadow.uRingN, ...occ, ...light, uColA: { value: pal.ringA }, uColB: { value: pal.ringB } },
            { transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
          v.ring = this.mesh(rg, v.ringMat, 6);
        }
        // orbit path
        v.orbitMat = this.material(SH.ORBIT_VERT, SH.ORBIT_FRAG, {
          uBody: base.uCenter, uPv: { value: new THREE.Vector3() }, uQv: { value: new THREE.Vector3() }, uEl: { value: new THREE.Vector4() }, uWidth: { value: 1.6 }, uLimit: { value: Math.PI }, uSc: { value: 0 }, uBodyR: { value: 1 },
          uColor: { value: b.kind === 'moon' ? new THREE.Color(0.5, 0.56, 0.66) : new THREE.Color(0.62, 0.7, 0.85) }, uAlpha: { value: 0.6 }, uDash: { value: 0 },
        }, { transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
        v.orbit = this.mesh(b.kind === 'moon' ? moonOrbitGeo : orbitGeo, v.orbitMat, 7);
      }
      this.vis.push(v);
    }
    this.buildBelt();
  }
  orbitGeometry(k) {
    const aS = new Float32Array(2 * (k + 1)), side = new Float32Array(2 * (k + 1)), pos = new Float32Array(6 * (k + 1)), idx = [];
    for (let i = 0; i <= k; i++) {
      const u = i / k * 2 - 1, s = Math.sign(u) * Math.pow(Math.abs(u), 4);
      aS[2 * i] = aS[2 * i + 1] = s; side[2 * i] = -1; side[2 * i + 1] = 1;
      if (i < k) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(aS, 1)); g.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
    g.setIndex(idx);
    return g;
  }
  buildBelt() {
    const { sim, q } = this, belt = sim.sys.belt;
    this.belt = null;
    if (!belt) return;
    const r = makeRng('v1/belt/' + sim.sys.seed), n = q.rocks;
    // each rock: a, e, M0, a^-1.5, then the two vectors of its orbital plane
    const el = new Float64Array(n * 10), off = new Float32Array(n * 3), axis = new Float32Array(n * 4), st = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const a = Math.sqrt(r.range(belt.inner * belt.inner, belt.outer * belt.outer)), e = 0.1 * r.f() * r.f(), inc = 0.035 * r.f(), O = r.range(0, TWO_PI), w = r.range(0, TWO_PI);
      const cO = Math.cos(O), sO = Math.sin(O), cw = Math.cos(w), sw = Math.sin(w), ci = Math.cos(inc), si = Math.sin(inc);
      el.set([a, e, r.range(0, TWO_PI), Math.pow(a, -1.5), cO * cw - sO * sw * ci, sO * cw + cO * sw * ci, sw * si, -cO * sw - sO * cw * ci, -sO * sw + cO * cw * ci, cw * si], i * 10);
      const ax = new THREE.Vector3(r.range(-1, 1), r.range(-1, 1), r.range(-1, 1)).normalize();
      axis.set([ax.x, ax.y, ax.z, r.range(-0.25, 0.25)], i * 4);
      // true radius 3-45 km, in scene units
      st.set([(3 + 42 * Math.pow(r.f(), 2.2)) * 1000 * U, r.f(), r.f(), r.range(0.6, 0.95)], i * 4);
    }
    // Two copies of the rock shape: a coarse one for the thousands far away, a fine one for the few nearest.
    const NEAR = this.nearMax = 12;
    const inst = (detail, count, o, a, s) => {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.IcosahedronGeometry(1, detail).attributes.position); g.instanceCount = count;
      const oa = new THREE.InstancedBufferAttribute(o, 3), aa = new THREE.InstancedBufferAttribute(a, 4), sa = new THREE.InstancedBufferAttribute(s, 4);
      oa.setUsage(THREE.DynamicDrawUsage); g.setAttribute('iOffset', oa); g.setAttribute('iAxisSpin', aa); g.setAttribute('iScaleTint', sa);
      return { g, oa, aa, sa };
    };
    const mat = this.material(SH.ROCK_VERT, SH.ROCK_FRAG, { uTime: { value: 0 }, uMinPx: { value: 0.0005 }, uEnlarge: { value: ROCK_ENLARGE }, uSunPos: { value: new THREE.Vector3() }, uSunCol: { value: this.sunCol } });
    const far = inst(q.rockDetail, n, off, axis, st), offAttr = far.oa, mesh = this.mesh(far.g, mat);
    const near = inst(q.rockNear, NEAR, new Float32Array(NEAR * 3), new Float32Array(NEAR * 4), new Float32Array(NEAR * 4));
    near.aa.setUsage(THREE.DynamicDrawUsage); near.sa.setUsage(THREE.DynamicDrawUsage);
    this.mesh(near.g, mat);
    near.idx = new Int32Array(NEAR).fill(-1); near.d2 = new Float64Array(NEAR); near.axis = axis; near.st = st;
    // dust
    const nd = q.dust, orb = new Float32Array(nd * 4), dp = new Float32Array(nd * 3), ang0 = new Float64Array(nd);
    for (let i = 0; i < nd; i++) {
      const a = Math.sqrt(r.range(belt.inner * belt.inner, belt.outer * belt.outer));
      ang0[i] = r.range(0, TWO_PI);
      orb.set([a * U, ang0[i], a * U * 0.03 * (r.f() + r.f() - 1), 0.25 + 0.75 * r.f() * r.f()], i * 4);
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    const orbAttr = new THREE.BufferAttribute(orb, 4); dg.setAttribute('aOrb', orbAttr);
    const dmat = this.material(SH.DUST_VERT, SH.DUST_FRAG, { uStar: { value: new THREE.Vector3() }, uT: { value: 0 }, uMu: { value: 1 }, uPx: this.shared.uPx, uSunCol: { value: this.sunCol } }, { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const dust = new THREE.Points(dg, dmat); dust.frustumCulled = false; dust.matrixAutoUpdate = false; dust.renderOrder = 3; this.scene.add(dust);
    this.belt = { n, el, off, offAttr, mat, mesh, near, dust, dmat, orb, orbAttr, ang0, nd, tBase: 0 };
  }

  // ---------- Names and markers ----------
  buildMarkers() {
    const bodies = this.sim.bodies, cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 512;
    const ctx = cv.getContext('2d');
    ctx.font = '500 26px system-ui, "Segoe UI", sans-serif'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
    let x = 4, y = 20;
    this.labelRect = bodies.map((b) => {
      const w = Math.ceil(ctx.measureText(b.name).width) + 4;
      if (x + w > 1020) { x = 4; y += 36; }
      ctx.fillText(b.name, x + 2, y);
      const rect = [x / 1024, 1 - (y - 18) / 512, (x + w) / 1024, 1 - (y + 18) / 512, w / 2, 18];
      x += w + 6;
      return rect;
    });
    this.glyph = {};
    ctx.font = 'italic 600 28px Georgia, serif';
    for (const ch of ['v', 'F']) {
      const w = Math.ceil(ctx.measureText(ch).width) + 6;
      if (x + w > 1020) { x = 4; y += 36; }
      ctx.fillText(ch, x + 3, y);
      this.glyph[ch] = [x / 1024, 1 - (y - 18) / 512, (x + w) / 1024, 1 - (y + 18) / 512, w / 2, 18];
      x += w + 6;
    }
    const tex = new THREE.CanvasTexture(cv); tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    const max = this.markMax = bodies.length * 3 + 48;
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
    const mk = (n, size) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(max * size), size); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(n, a); return a; };
    this.mk = { pos: mk('iPos', 3), rect: mk('iRect', 4), col: mk('iCol', 4), par: mk('iParam', 4), g };
    const mat = new THREE.ShaderMaterial({ vertexShader: SH.MARK_VERT, fragmentShader: SH.MARK_FRAG, uniforms: { uRes: this.shared.uRes, uAtlas: { value: tex }, uTime: { value: 0 } }, transparent: true, depthTest: false, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
    this.mesh(g, mat, 30);
  }
  buildSegments() {
    const max = this.segMax = 96, g = new THREE.InstancedBufferGeometry();
    // a shaft (two triangles) and an arrowhead (one triangle; z = 1 marks it)
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, -1, 0, 1, 1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 1, 0, 1]), 3));
    const mk = (n, size) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(max * size), size); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(n, a); return a; };
    this.seg = { a: mk('aA', 3), b: mk('aB', 3), col: mk('aCol', 4), style: mk('aStyle', 2), g, n: 0 };
    const mat = this.material(SH.SEG_VERT, SH.SEG_FRAG, {}, { transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
    this.segMesh = this.mesh(g, mat, 20);
  }
  // Add one straight line for this frame. Points are relative to the camera, in scene units. head: 1 draws an arrowhead.
  addSegment(ax, ay, az, bx, by, bz, r, g, b, alpha, width, dash) {
    const s = this.seg; if (s.n >= this.segMax) return;
    const i = s.n++;
    s.a.array[3 * i] = ax; s.a.array[3 * i + 1] = ay; s.a.array[3 * i + 2] = az;
    s.b.array[3 * i] = bx; s.b.array[3 * i + 1] = by; s.b.array[3 * i + 2] = bz;
    s.col.array[4 * i] = r; s.col.array[4 * i + 1] = g; s.col.array[4 * i + 2] = b; s.col.array[4 * i + 3] = alpha;
    s.style.array[2 * i] = width; s.style.array[2 * i + 1] = dash;
  }

  // ---------- Every frame ----------
  // cam: Float64Array(3) camera position in metres; quat: THREE.Quaternion; dtReal in seconds.
  update(cam, quat, dtReal) {
    const { sim, vis, camera, shared } = this, { pos, bodies } = sim, t = sim.t;
    if (!this.reduced) this.time = (this.time + dtReal) % 100000;
    this.trueScale += (this.trueScaleTarget - this.trueScale) * (this.reduced ? 1 : Math.min(1, dtReal * 5));
    const enlarge = 1 - this.trueScale;
    camera.quaternion.copy(quat); camera.updateMatrixWorld(true);
    const qi = this.tmpQ.copy(quat).invert(), tv = this.tmpV, focal = this.focal, hw = this.cssW / 2, hh = this.cssH / 2;
    const sx0 = pos[0], sy0 = pos[1], sz0 = pos[2];
    this.markN = 0;
    const mark = (v, kind, w, h, rect, r, g, b, a) => this.addMark(v.rel[0] * U, v.rel[1] * U, v.rel[2] * U, kind, w, h, rect, r, g, b, a, v.px);
    for (let i = 0; i < vis.length; i++) {
      const v = vis[i], b = v.b, k = 3 * i;
      v.shown = !b.dead;
      v.mesh.visible = v.shown; if (v.atmo) v.atmo.visible = v.shown; if (v.ring) v.ring.visible = v.shown; if (v.orbit) v.orbit.visible = v.shown && this.show.orbits; if (v.corona) v.corona.visible = v.shown;
      if (!v.shown) continue;
      const rx = v.rel[0] = pos[k] - cam[0], ry = v.rel[1] = pos[k + 1] - cam[1], rz = v.rel[2] = pos[k + 2] - cam[2];
      const d = v.dist = Math.hypot(rx, ry, rz);
      v.grow = 1;
      if (b.kind === 'moon') {                 // a moon that would sit inside its enlarged planet shrinks away
        const pv = vis[b.pid], sep = Math.hypot(pos[k] - pos[3 * b.pid], pos[k + 1] - pos[3 * b.pid + 1], pos[k + 2] - pos[3 * b.pid + 2]);
        const x = (sep / (pv.rd / U) - 1.4) / 1.2; v.grow = x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
      }
      const rdM = Math.max(b.radius, minAngle(b) * d * enlarge) * (b.kind === 'moon' ? Math.max(v.grow, 1e-4) : 1);
      v.enl = rdM / b.radius; v.rd = rdM * U; v.px = rdM / d * focal;
      const un = v.mat.uniforms;
      un.uCenter.value.set(rx * U, ry * U, rz * U); un.uRadius.value = v.rd;
      // where it is on the screen (CSS pixels from the top left)
      tv.set(rx, ry, rz).applyQuaternion(qi);
      v.front = tv.z < 0;
      if (v.front) { v.sx = hw + tv.x / -tv.z * focal; v.sy = hh - tv.y / -tv.z * focal; }
      if (b.kind === 'star') {
        un.uTime.value = this.time;
        const ang = TWO_PI * ((t / b.rotPeriod) % 1), c = Math.cos(ang), s = Math.sin(ang);
        un.uSpin.value.set(c, s, 0, -s, c, 0, 0, 0, 1);
        const size = Math.max(v.rd * 9, d * U * 0.03);
        v.coronaMat.uniforms.uSize.value = size; v.coronaMat.uniforms.uDisc.value = v.rd / size;
      } else {
        const L = un.uSun.value.set(sx0 - pos[k], sy0 - pos[k + 1], sz0 - pos[k + 2]).normalize();
        const bs = b.basis, ang = TWO_PI * ((t / b.rotPeriod) % 1), c = Math.cos(ang), s = Math.sin(ang);
        un.uSpin.value.set(bs[0] * c + bs[3] * s, bs[1] * c + bs[4] * s, bs[2] * c + bs[5] * s, -bs[0] * s + bs[3] * c, -bs[1] * s + bs[4] * c, -bs[2] * s + bs[5] * c, bs[6], bs[7], bs[8]);
        if (b.type === 'ocean') { const ca = TWO_PI * ((t / (b.rotPeriod * 9)) % 1); un.uCloudRot.value.set(Math.cos(ca), Math.sin(ca)); }
        const occ = un.uOcc.value; let n = 0;
        if (b.kind === 'planet') {
          for (const m of b.moons) {
            const mv = vis[m.id]; if (n >= 5 || m.dead || mv.grow < 1 || v.enl > 1.001) continue;
            const q = 3 * m.id; occ[n++].set((pos[q] - pos[k]) / rdM, (pos[q + 1] - pos[k + 1]) / rdM, (pos[q + 2] - pos[k + 2]) / rdM, m.radius / rdM);
          }
        } else {
          const pv = vis[b.pid], q = 3 * b.pid, prd = pv.rd / U;
          occ[n++].set((pos[q] - pos[k]) / rdM, (pos[q + 1] - pos[k + 1]) / rdM, (pos[q + 2] - pos[k + 2]) / rdM, prd / rdM);
        }
        un.uOccN.value = n;
        if (v.orbit && v.orbit.visible) {
          const ou = v.orbitMat.uniforms, el = b.el, hyp = el.e >= 1;
          ou.uPv.value.set(el.P[0], el.P[1], el.P[2]); ou.uQv.value.set(el.Q[0], el.Q[1], el.Q[2]);
          ou.uEl.value.set(Math.abs(el.a) * U, el.e, el.anom, hyp ? 1 : 0); ou.uLimit.value = hyp ? 2.2 : Math.PI;
          const sel = this.selected === i;
          let alpha = sel ? 0.85 : b.kind === 'moon' ? 0.3 : 0.34;
          if (b.kind === 'moon') { const pv = vis[b.pid]; alpha *= Math.min(1, Math.max(0, (el.a / pv.dist * focal - 30) / 60)) * v.grow; }
          ou.uAlpha.value = alpha; ou.uWidth.value = sel ? 1.8 : 1.2; ou.uBodyR.value = v.rd;
          if (alpha <= 0.004) v.orbit.visible = false;
          else if (!hyp) {
            // which point of the ellipse is nearest the camera? The ribbon puts most of its corners there.
            const pr = vis[b.pid].rel, cx = -(pr[0] * el.P[0] + pr[1] * el.P[1] + pr[2] * el.P[2]), cy = -(pr[0] * el.Q[0] + pr[1] * el.Q[1] + pr[2] * el.Q[2]);
            const a = el.a, e = el.e, bb = a * Math.sqrt(1 - e * e);
            let bestE = 0, bestD = Infinity;
            for (let j = 0; j < 48; j++) { const E = j * TWO_PI / 48, dx = a * (Math.cos(E) - e) - cx, dy = bb * Math.sin(E) - cy, dd = dx * dx + dy * dy; if (dd < bestD) { bestD = dd; bestE = E; } }
            let lo = bestE - TWO_PI / 48, hi = bestE + TWO_PI / 48;
            for (let j = 0; j < 24; j++) {
              const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;
              const d1 = (a * (Math.cos(m1) - e) - cx) ** 2 + (bb * Math.sin(m1) - cy) ** 2, d2 = (a * (Math.cos(m2) - e) - cx) ** 2 + (bb * Math.sin(m2) - cy) ** 2;
              if (d1 < d2) hi = m2; else lo = m1;
            }
            let sc = (lo + hi) / 2 - el.anom; sc -= TWO_PI * Math.round(sc / TWO_PI);
            ou.uSc.value = sc;
          }
        }
      }
      // markers
      const sel = this.selected === i;
      let hiddenBehind = false;
      if (v.front) for (let j = 0; j < vis.length; j++) {
        const o = vis[j];
        if (j !== i && o.shown && o.front && o.dist < v.dist && o.b.kind !== 'moon' && Math.hypot(o.sx - v.sx, o.sy - v.sy) < o.px) { hiddenBehind = true; break; }
      }
      v.hidden = hiddenBehind;
      if (v.front && !hiddenBehind) {
        let la = this.show.labels ? (b.kind === 'moon' ? 0.75 * v.grow * Math.min(1, Math.max(0, (b.el.a / vis[b.pid].dist * focal - 40) / 40)) : 0.85) : 0;
        la *= 1 - Math.min(1, Math.max(0, (v.px - 160) / 120));
        if (sel) la = Math.max(la, 0.95);
        v.la = la;
        if (v.px < 3.5 && (b.kind !== 'moon' || la > 0.01)) mark(v, 1, 13, 13, null, 0.7, 0.8, 0.95, 0.55 * (1 - v.px / 3.5) * (b.kind === 'moon' ? la : 1));
        if (sel) mark(v, 2, Math.max(30, v.px * 2 + 18), 0, null, 1, 0.88, 0.6, v.px > 400 ? 0 : 0.75);
      } else v.la = 0;
    }
    let placed = 0; const box = this.labelBox;
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < vis.length; i++) {
        const v = vis[i], sel = this.selected === i;
        if (!v.shown || !(v.la > 0.01) || (pass === 0) !== sel || (pass === 2) !== (v.b.kind === 'moon' && !sel)) continue;
        const lr = this.labelRect[i], x0 = v.sx + v.px * 0.75 + 4, x1 = x0 + lr[4] + 8, y0 = v.sy - 11, y1 = v.sy + 11;
        let clash = false;
        for (let j = 0; j < placed; j++) if (x0 < box[4 * j + 1] && x1 > box[4 * j] && y0 < box[4 * j + 3] && y1 > box[4 * j + 2]) { clash = true; break; }
        if (clash || placed >= 64) continue;
        box[4 * placed] = x0; box[4 * placed + 1] = x1; box[4 * placed + 2] = y0; box[4 * placed + 3] = y1; placed++;
        mark(v, 0, lr[4], lr[5], lr, sel ? 1 : 0.78, sel ? 0.93 : 0.84, sel ? 0.75 : 0.95, v.la);
      }
    }

    // belt
    const B = this.belt;
    if (B) {
      const mu = G * bodies[0].mass, sm = Math.sqrt(mu), { el, off, n } = B, NEAR = this.nearMax, nidx = B.near.idx, nd2 = B.near.d2;
      let nearN = 0, worst = 0;
      const cx = sx0 - cam[0], cy = sy0 - cam[1], cz = sz0 - cam[2];
      for (let i = 0, j = 0; i < n; i++, j += 10) {
        const a = el[j], e = el[j + 1], M = el[j + 2] + sm * el[j + 3] * t;
        let E = M + e * Math.sin(M);
        E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        const x = a * (Math.cos(E) - e), y = a * Math.sqrt(1 - e * e) * Math.sin(E);
        const ox = off[3 * i] = (cx + x * el[j + 4] + y * el[j + 7]) * U, oy = off[3 * i + 1] = (cy + x * el[j + 5] + y * el[j + 8]) * U, oz = off[3 * i + 2] = (cz + x * el[j + 6] + y * el[j + 9]) * U;
        // remember the nearest few rocks: they are drawn with the finely detailed shape
        const d2 = ox * ox + oy * oy + oz * oz;
        if (nearN < NEAR || d2 < nd2[worst]) {
          const slot = nearN < NEAR ? nearN++ : worst;
          nidx[slot] = i; nd2[slot] = d2;
          if (nearN === NEAR) { worst = 0; for (let k = 1; k < NEAR; k++) if (nd2[k] > nd2[worst]) worst = k; }
        }
      }
      for (let k = 0; k < NEAR; k++) {
        const i = nidx[k], no = B.near.oa.array, na = B.near.aa.array, ns = B.near.sa.array;
        no[3 * k] = off[3 * i]; no[3 * k + 1] = off[3 * i + 1]; no[3 * k + 2] = off[3 * i + 2];
        for (let c = 0; c < 4; c++) { na[4 * k + c] = B.near.axis[4 * i + c]; ns[4 * k + c] = B.near.st[4 * i + c]; }
        off[3 * i] = 1e13;                       // take it out of the coarse set (far beyond the edge of the view)
      }
      B.near.oa.needsUpdate = B.near.aa.needsUpdate = B.near.sa.needsUpdate = true;
      B.offAttr.needsUpdate = true;
      const bu = B.mat.uniforms;
      bu.uTime.value = this.time; bu.uSunPos.value.set(cx * U, cy * U, cz * U);
      bu.uEnlarge.value = 1 + (ROCK_ENLARGE - 1) * enlarge; bu.uMinPx.value = 0.55 / focal;
      // dust: angles are re-based now and then so the graphics chip's 32-bit time stays precise
      if (Math.abs(t - B.tBase) > 2e9 || B.muUsed !== mu) {
        for (let i = 0; i < B.nd; i++) { const a = B.orb[4 * i] / U; B.ang0[i] = (B.ang0[i] + Math.sqrt((B.muUsed || mu) / (a * a * a)) * (t - B.tBase)) % TWO_PI; B.orb[4 * i + 1] = B.ang0[i]; }
        B.tBase = t; B.muUsed = mu; B.orbAttr.needsUpdate = true;
      }
      const du = B.dmat.uniforms;
      du.uStar.value.set(cx * U, cy * U, cz * U); du.uT.value = t - B.tBase; du.uMu.value = mu * U * U * U;
    }
  }
  // Add a name (kind 0), a small ring (1) or a selection mark (2) for this frame, at a point relative to the camera.
  addMark(x, y, z, kind, w, h, rect, r, g, b, a, px) {
    const mk = this.mk;
    if (this.markN >= this.markMax) return;
    const i = this.markN++;
    mk.pos.array[3 * i] = x; mk.pos.array[3 * i + 1] = y; mk.pos.array[3 * i + 2] = z;
    if (rect) { mk.rect.array[4 * i] = rect[0]; mk.rect.array[4 * i + 1] = rect[1]; mk.rect.array[4 * i + 2] = rect[2]; mk.rect.array[4 * i + 3] = rect[3]; }
    mk.col.array[4 * i] = r; mk.col.array[4 * i + 1] = g; mk.col.array[4 * i + 2] = b; mk.col.array[4 * i + 3] = a;
    mk.par.array[4 * i] = w; mk.par.array[4 * i + 1] = h; mk.par.array[4 * i + 2] = kind; mk.par.array[4 * i + 3] = px;
  }
  render() {
    const mk = this.mk;
    if (!this.markN) { mk.col.array[3] = 0; }
    mk.g.instanceCount = Math.max(this.markN, 1);
    mk.pos.needsUpdate = mk.rect.needsUpdate = mk.col.needsUpdate = mk.par.needsUpdate = true;
    this.seg.g.instanceCount = this.seg.n;
    this.segMesh.visible = this.seg.n > 0;
    this.seg.a.needsUpdate = this.seg.b.needsUpdate = this.seg.col.needsUpdate = this.seg.style.needsUpdate = true;
    this.renderer.info.reset();
    this.composer.render();
    this.seg.n = 0;
  }
  setQualityUniform() { /* reserved */ }

  // Which body is under this point of the screen (CSS pixels)? Returns its id or -1.
  pick(x, y) {
    let best = -1, bestD = Infinity;
    for (let i = 0; i < this.vis.length; i++) {
      const v = this.vis[i];
      if (!v.shown || !v.front || v.hidden || (v.b.kind === 'moon' && v.grow < 0.5)) continue;
      const d = Math.hypot(v.sx - x, v.sy - y);
      if (d < Math.max(v.px, 14) && v.dist < bestD) { best = i; bestD = v.dist; }
    }
    return best;
  }
  dispose() {
    this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    this.skyRT.dispose(); this.composer.dispose(); this.renderer.dispose();
  }
}
