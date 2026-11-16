// Universe Engine: GLSL shaders (the small programs that run on the graphics chip).
// Everything is procedural: no image files. All are written for WebGL2 (GLSL ES 3.00).

// ---------- Shared pieces ----------
// Depth: a logarithmic depth value written per pixel, so a planet 100 km away and one 40 AU away never flicker.
export const VERT_COMMON = /* glsl */`
uniform float uLogFC;
varying float vLogW;
void setPos(vec3 world) {
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  vLogW = 1.0 + gl_Position.w;
}
`;
export const FRAG_COMMON = /* glsl */`
uniform float uLogFC;
varying float vLogW;
#define LOGDEPTH gl_FragDepth = log2(max(vLogW, 1e-6)) * uLogFC;
`;

// Integer-hash value noise with analytic gradients, and fractal sums of it.
export const NOISE = /* glsl */`
uint hu(uint n) { n ^= n >> 16; n *= 0x7feb352du; n ^= n >> 15; n *= 0x846ca68bu; n ^= n >> 16; return n; }
float h1(int p) { return float(hu(uint(p) * 2654435761u)) * (1.0 / 4294967296.0); }
float h3(ivec3 p) { return float(hu(uint(p.x) * 73856093u ^ uint(p.y) * 19349663u ^ uint(p.z) * 83492791u)) * (1.0 / 4294967296.0); }
// 1D smooth noise, 0..1
float n1(float x) { float i = floor(x), f = x - i; f = f * f * (3.0 - 2.0 * f); return mix(h1(int(i)), h1(int(i) + 1), f); }
// 3D noise: x = value (0..1), yzw = gradient
vec4 noised(vec3 x) {
  vec3 p = floor(x), w = x - p; ivec3 i = ivec3(p);
  vec3 u = w * w * w * (w * (w * 6.0 - 15.0) + 10.0), du = 30.0 * w * w * (w * (w - 2.0) + 1.0);
  float a = h3(i), b = h3(i + ivec3(1, 0, 0)), c = h3(i + ivec3(0, 1, 0)), d = h3(i + ivec3(1, 1, 0));
  float e = h3(i + ivec3(0, 0, 1)), f = h3(i + ivec3(1, 0, 1)), g = h3(i + ivec3(0, 1, 1)), h = h3(i + ivec3(1, 1, 1));
  float k1 = b - a, k2 = c - a, k3 = e - a, k4 = a - b - c + d, k5 = a - c - e + g, k6 = a - b - e + f, k7 = -a + b + c - d + e - f - g + h;
  return vec4(a + k1 * u.x + k2 * u.y + k3 * u.z + k4 * u.x * u.y + k5 * u.y * u.z + k6 * u.z * u.x + k7 * u.x * u.y * u.z,
    du * vec3(k1 + k4 * u.y + k6 * u.z + k7 * u.y * u.z, k2 + k5 * u.z + k4 * u.x + k7 * u.z * u.x, k3 + k6 * u.x + k5 * u.y + k7 * u.x * u.y));
}
const mat3 M3 = mat3(0.00, 1.60, 1.20, -1.60, 0.72, -0.96, -1.20, -0.96, 1.28);
// Fractal noise: x = value (about -1..1), yzw = gradient. fp is the size of one pixel in noise units:
// octaves finer than a pixel fade out, which stops distant planets shimmering.
vec4 fbmd(vec3 x, int oct, float fp) {
  // (the gradient of fine octaves is damped by ga, so that shading follows the larger shapes)
  float a = 0.5, f = 1.0, ga = 1.0; vec4 s = vec4(0.0); mat3 m = mat3(1.0);
  for (int i = 0; i < oct; i++) {
    float w = smoothstep(1.0, 2.5, 1.0 / (f * fp + 1e-9));
    if (w <= 0.0) break;
    vec4 n = noised(x);
    s.x += a * w * (n.x * 2.0 - 1.0);
    s.yzw += a * w * 2.0 * ga * (n.yzw * m);
    a *= 0.5; f *= 2.0; ga *= 0.66; x = M3 * x; m = M3 * m;
  }
  return s;
}
float fbm(vec3 x, int oct, float fp) { return fbmd(x, oct, fp).x; }
`;

// Shadows shared by planets, moons and rings. All lengths are in units of the planet's radius,
// measured from the planet's centre.
export const SHADOW = /* glsl */`
uniform vec4 uRing;        // inner radius, outer radius, seed, opacity (0 = no rings)
uniform vec3 uRingN;       // ring-plane normal
uniform vec4 uOcc[5];      // spheres that can cast a shadow: xyz = centre, w = radius
uniform int uOccN;
float ringDensity(float t, float seed, float fw) {
  if (t <= 0.0 || t >= 1.0) return 0.0;
  float d = 0.0, a = 0.5, f = 5.0;
  for (int i = 0; i < 6; i++) {
    float w = smoothstep(0.6, 1.6, 1.0 / (f * fw + 1e-9));
    d += a * mix(0.5, n1(t * f + seed * 91.0 + float(i) * 13.7), w);
    a *= 0.62; f *= 2.7;
  }
  d = smoothstep(0.26, 0.74, d);
  float gap = smoothstep(0.012, 0.03, abs(t - (0.35 + 0.4 * fract(seed * 7.13)))) ;
  return d * gap * smoothstep(0.0, 0.035, t) * smoothstep(1.0, 0.93, t);
}
float ringShadow(vec3 P, vec3 L) {
  if (uRing.w <= 0.0) return 1.0;
  float dn = dot(L, uRingN);
  if (abs(dn) < 1e-4) return 1.0;
  float s = -dot(P, uRingN) / dn;
  if (s <= 0.0) return 1.0;
  float r = length(P + s * L);
  float t = (r - uRing.x) / (uRing.y - uRing.x);
  return 1.0 - 0.85 * uRing.w * ringDensity(t, uRing.z, 0.03);
}
float sphereShadow(vec3 P, vec3 L) {
  float sh = 1.0;
  for (int i = 0; i < 5; i++) {
    if (i >= uOccN) break;
    vec3 o = uOcc[i].xyz - P; float along = dot(o, L);
    if (along > 0.0) { float d = length(o - along * L), r = uOcc[i].w; sh *= smoothstep(r * 0.94, r * 1.06 + 0.002 * along, d); }
  }
  return sh;
}
`;

// ---------- Planets and moons ----------
export const PLANET_VERT = /* glsl */`
${VERT_COMMON}
uniform vec3 uCenter; uniform float uRadius; uniform mat3 uSpin;   // uSpin: world -> planet-fixed
varying vec3 vN; varying vec3 vObj; varying vec3 vWorld;
void main() {
  vN = position; vObj = uSpin * position; vWorld = uCenter + position * uRadius;
  setPos(vWorld);
}
`;
export const PLANET_FRAG = /* glsl */`
${FRAG_COMMON}
${NOISE}
${SHADOW}
uniform int uType;           // 0 rocky, 1 ocean, 2 desert, 3 ice, 4 gas giant, 5 ice giant, 6 rocky moon, 7 icy moon
uniform vec3 uSun; uniform vec3 uSunCol; uniform vec4 uSeed; uniform vec4 uP;
uniform vec3 uColA; uniform vec3 uColB; uniform vec3 uColC; uniform vec3 uColD;
uniform vec3 uAtmCol; uniform float uAtm; uniform vec2 uCloudRot; uniform mat3 uSpin;
uniform float uRadius;
varying vec3 vN; varying vec3 vObj; varying vec3 vWorld;

vec4 craterLayer(vec3 q) {
  ivec3 b = ivec3(floor(q + 0.5)); vec4 r = vec4(0.0);
  for (int i = 0; i < 8; i++) {
    ivec3 c = b - ivec3(i & 1, (i >> 1) & 1, (i >> 2) & 1);
    float keep = h3(c + ivec3(0, 0, 53));
    if (keep < 0.3) continue;
    vec3 ctr = vec3(c) + 0.5 + (vec3(h3(c), h3(c + ivec3(17, 0, 0)), h3(c + ivec3(0, 31, 0))) - 0.5) * 0.5;
    float rad = 0.1 + 0.22 * keep * keep;
    vec3 d = q - ctr; float dist = length(d) + 1e-5, t = dist / rad;
    if (t < 2.4) {
      float f = t < 1.0 ? 0.6 * t * t - 0.5 : 0.1 * exp(-(t - 1.0) * 4.0);
      float df = t < 1.0 ? 1.2 * t : -0.4 * exp(-(t - 1.0) * 4.0);
      r += vec4(rad * f, df * d / dist);
    }
  }
  return r;
}
vec4 craters(vec3 p, float fp, float amount) {
  vec4 r = vec4(0.0); float f = 3.0;
  for (int i = 0; i < CRATER_LAYERS; i++) {
    float w = smoothstep(0.25, 0.08, fp * f) * amount;
    if (w > 0.0) { vec4 c = craterLayer(p * f + uSeed.zxy * 19.0 + float(i) * 7.3); r += w * vec4(c.x / f * 3.0, c.yzw * 3.0); }
    f *= 2.3;
  }
  return r;
}

void main() {
  vec3 N = normalize(vN), p = normalize(vObj), V = normalize(-vWorld), L = uSun;
  float fp = length(fwidth(vObj)) + 1e-6;
  vec3 so = uSeed.xyz * 37.0;
  vec3 col = vec3(0.5), g = vec3(0.0); float spec = 0.0, bump = 0.0, cloud = 0.0, rough = 60.0;
  float lat = p.z, alat = abs(lat);

  if (uType == 0 || uType == 6) {                       // rock: highlands, dark plains, craters
    vec4 n = fbmd(p * 2.0 + so, OCT, fp * 2.0);
    vec4 c = craters(p, fp, uP.x);
    float m = fbm(p * 1.1 + so.yzx, 4, fp * 1.1);
    float h = n.x * 0.8 + c.x * 2.0;
    g = n.yzw * 1.6 + c.yzw * 0.9; bump = 0.5;
    col = mix(uColA, uColB, smoothstep(-0.45, 0.5, h + m * 0.5));
    col = mix(col, uColC, smoothstep(0.05, 0.4, m) * 0.55);
    col *= 0.85 + 0.3 * fbm(p * 9.0 + so, 3, fp * 9.0);
  } else if (uType == 1) {                              // ocean world: seas, continents, ice caps, clouds
    vec4 n = fbmd(p * 1.7 + so, OCT, fp * 1.7);
    float h = n.x, sea = uP.x, aa = max(0.006, fp * 3.0);
    float land = smoothstep(sea - aa, sea + aa, h);
    float moist = fbm(p * 2.3 + so.zxy, 4, fp * 2.3);
    vec3 lc = mix(uColA, uColB, smoothstep(-0.25, 0.35, moist - (0.45 - alat) * 0.5));
    lc = mix(lc, uColC, smoothstep(sea + 0.22, sea + 0.5, h));
    lc = mix(lc, vec3(0.85, 0.88, 0.92), smoothstep(sea + 0.42, sea + 0.62, h + alat * 0.25));
    vec3 oc = mix(uColD * 0.55, uColD * 1.25 + vec3(0.0, 0.06, 0.05), smoothstep(sea - 0.35, sea, h));
    col = mix(oc, lc, land);
    float cap = smoothstep(uP.y - 0.04, uP.y + 0.03, alat + 0.09 * n.x);
    col = mix(col, vec3(0.9, 0.93, 0.97), cap);
    g = n.yzw * 1.7 * land; bump = 0.32 * (1.0 - cap * 0.6); spec = (1.0 - land) * (1.0 - cap) * 0.5; rough = 1400.0;
    vec3 cp = vec3(p.x * uCloudRot.x - p.y * uCloudRot.y, p.x * uCloudRot.y + p.y * uCloudRot.x, p.z);
    float warp = fbm(cp * 1.4 + so.yzx, 3, fp * 1.4);
    float cl = fbm(cp * vec3(2.6, 2.6, 3.4) + so + warp * 0.9, OCT - 1, fp * 3.0);
    cloud = smoothstep(uP.z, uP.z + 0.42, cl + 0.12 * sin(lat * 9.0 + warp * 3.0));
  } else if (uType == 2) {                              // desert: dunes, dark rock, canyons, small caps
    vec4 n = fbmd(p * 2.0 + so, OCT, fp * 2.0);
    float m = fbm(p * 1.3 + so.zxy, 4, fp * 1.3);
    vec4 dn = noised(p * 26.0 + n.x * 3.0 + so);
    float dune = (1.0 - abs(dn.x * 2.0 - 1.0)) * smoothstep(0.3, 0.1, fp * 26.0);
    col = mix(uColA, uColB, smoothstep(-0.4, 0.45, n.x + 0.25 * dune));
    col = mix(col, uColC, smoothstep(0.1, 0.42, m) * 0.7);
    float canyon = 1.0 - smoothstep(0.0, 0.03 + fp * 3.0, abs(fbm(p * 2.6 + so.yzx, 5, fp * 2.6)));
    col *= 1.0 - 0.45 * canyon * smoothstep(0.0, 0.3, m + 0.2);
    col = mix(col, vec3(0.88, 0.86, 0.84), smoothstep(uP.y, uP.y + 0.03, alat + 0.03 * n.x));
    g = n.yzw * 2.0 + dn.yzw * 0.05 * dune; bump = 0.4;
    cloud = uAtm * 0.35 * smoothstep(0.25, 0.7, fbm(p * 3.0 + so * 1.7, 4, fp * 3.0)) * uP.z;
  } else if (uType == 3 || uType == 7) {                // ice: bright plains, long dark cracks
    vec4 n = fbmd(p * 1.6 + so, OCT, fp * 1.6);
    col = mix(uColA, uColB, smoothstep(-0.4, 0.4, n.x));
    float c1 = abs(fbm(p * 2.2 + so.yzx, 5, fp * 2.2)), c2 = abs(fbm(p * 4.7 + so.zxy, 4, fp * 4.7));
    float line = max(1.0 - smoothstep(0.0, 0.022 + fp * 2.5, c1), 0.6 * (1.0 - smoothstep(0.0, 0.03 + fp * 5.0, c2)));
    col = mix(col, uColC, line * 0.75 * uP.z);
    vec4 c = craters(p, fp, uP.x * 0.5);
    g = n.yzw * 0.7 + c.yzw * 0.6; bump = 0.3; spec = 0.12; rough = 30.0;
    col *= 0.9 + 0.2 * fbm(p * 11.0 + so, 3, fp * 11.0);
  } else {                                              // gas giant and ice giant: bands, turbulence, a storm
    float turb = fbm(vec3(p.xy * 2.0, lat * 5.0) + so, OCT - 2, fp * 5.0);
    float fine = fbm(vec3(p.xy * 5.0, lat * 34.0) + so.yzx, OCT - 2, fp * 34.0);
    float t = lat * uP.x + turb * uP.y + uSeed.w * 31.0;
    float curl = fbm(vec3(p.xy * 3.5, lat * 9.0) + so.zxy + turb, OCT - 3, fp * 9.0);
    t += curl * 0.22 * uP.y;
    float b = 0.65 * n1(t) + 0.35 * n1(t * 2.7 + 3.0) + fine * 0.16 + curl * 0.08;
    col = mix(uColA, uColB, smoothstep(0.3, 0.7, b));
    col = mix(col, uColC, smoothstep(0.5, 0.85, n1(t * 1.9 + 5.0)) * uP.w);
    vec3 sc = normalize(vec3(cos(uSeed.w * 40.0), sin(uSeed.w * 40.0), uP.z));
    vec3 dp = p - sc; float sd = length(vec3(dp.xy * 0.55, dp.z * 1.5) * 6.0 + turb * 0.5);
    col = mix(col, uColD, (1.0 - smoothstep(0.55, 1.0, sd)) * 0.85);
    col *= (0.95 + fine * 0.25) * (1.0 - 0.3 * smoothstep(0.65, 1.0, alat));
  }

  // Lighting from the star
  vec3 gw = g * uSpin;                                   // planet-fixed gradient -> world
  vec3 Nn = normalize(N - bump * (gw - dot(gw, N) * N));
  float ndl = dot(N, L), dif = max(dot(Nn, L), 0.0) * smoothstep(-0.02, 0.06, ndl);
  if (uType == 4 || uType == 5) dif = pow(smoothstep(-0.12, 1.0, ndl), 1.35);      // deep atmospheres scatter light past the edge
  if (uType == 4 || uType == 5) dif = pow(smoothstep(-0.12, 1.0, ndl), 1.35);      // deep atmospheres scatter light past the edge
  vec3 Pp = N;                                           // surface point in planet radii
  float sh = ringShadow(Pp, L) * sphereShadow(Pp, L);
  float cshade = 1.0;
  if (cloud > 0.0) {                                     // clouds: lit smoothly, hide the sea's glint
    float cl = max(ndl, 0.0);
    col = mix(col * (1.0 - 0.25 * cloud), vec3(0.95), cloud * 0.92);
    dif = mix(dif, cl, cloud * 0.8); spec *= 1.0 - cloud;
  }
  vec3 lit = col * uSunCol * dif * sh;
  vec3 H = normalize(L + V);
  lit += uSunCol * spec * sh * pow(max(dot(Nn, H), 0.0), rough) * min(rough * 0.012, 6.0) * smoothstep(0.0, 0.1, ndl);
  if (uType >= 4 && uType <= 5) lit *= 0.5 + 0.5 * pow(max(dot(N, V), 0.0), 0.6);   // gas limb darkening
  // Atmosphere over the disc: a rim that glows on the day side and reddens at the day/night edge
  if (uAtm > 0.0) {
    float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    float day = smoothstep(-0.22, 0.35, ndl);
    vec3 ac = mix(uAtmCol, vec3(1.0, 0.45, 0.2) * 0.8, exp(-abs(ndl + 0.05) * 7.0) * 0.6);
    lit = mix(lit, ac * uSunCol * day, rim * uAtm * 0.85 * day) + ac * uSunCol * rim * day * uAtm * 0.25 * sh;
    lit += ac * uSunCol * uAtm * 0.05 * smoothstep(-0.18, 0.0, ndl) * smoothstep(0.12, 0.0, ndl) * sh;   // twilight band
  }
  lit += col * 0.0035;                                   // faint starlight, so the night side is not pure black
  gl_FragColor = vec4(lit, 1.0);
  LOGDEPTH
}
`;

// Atmosphere halo beyond the limb: a slightly larger transparent shell.
export const ATMO_VERT = /* glsl */`
${VERT_COMMON}
uniform vec3 uCenter; uniform float uRadius; uniform float uShell;
varying vec3 vWorld;
void main() { vWorld = uCenter + position * uRadius * uShell; setPos(vWorld); }
`;
export const ATMO_FRAG = /* glsl */`
${FRAG_COMMON}
${NOISE}
${SHADOW}
uniform vec3 uCenter; uniform float uRadius; uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uAtmCol; uniform float uAtm; uniform float uH;
varying vec3 vWorld;
void main() {
  vec3 D = normalize(vWorld);
  float t = dot(uCenter, D);
  vec3 T = D * t - uCenter;                       // point of the sight line closest to the planet's centre
  float b = length(T) / uRadius;
  if (b < 1.0 || t < 0.0) discard;
  vec3 n = T / (b * uRadius);
  float ndl = dot(n, uSun);
  float glow = exp(-(b - 1.0) / uH);
  float day = smoothstep(-0.25, 0.3, ndl);
  vec3 ac = mix(uAtmCol, vec3(1.0, 0.45, 0.2) * 0.8, exp(-abs(ndl + 0.05) * 7.0) * 0.6);
  float fwd = pow(max(dot(D, uSun), 0.0), 6.0);   // looking towards the star through the air: brighter
  float sh = ringShadow(n, uSun) * sphereShadow(n * 1.001, uSun);
  vec3 c = ac * uSunCol * glow * uAtm * (day * 1.1 + fwd * 1.6 * smoothstep(-0.5, 0.1, ndl)) * sh;
  gl_FragColor = vec4(c, 1.0);
  LOGDEPTH
}
`;

// ---------- Rings ----------
export const RING_VERT = /* glsl */`
${VERT_COMMON}
uniform vec3 uCenter; uniform float uRadius; uniform mat3 uBasis;   // columns: two in-plane axes and the normal
varying vec3 vWorld; varying vec2 vR;
void main() {
  vR = position.xy;
  vWorld = uCenter + uBasis * vec3(position.xy, 0.0) * uRadius;
  setPos(vWorld);
}
`;
export const RING_FRAG = /* glsl */`
${FRAG_COMMON}
${NOISE}
${SHADOW}
uniform vec3 uCenter; uniform float uRadius; uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uColA; uniform vec3 uColB;
varying vec3 vWorld; varying vec2 vR;
void main() {
  float r = length(vR), t = (r - uRing.x) / (uRing.y - uRing.x);
  float fw = fwidth(r) / (uRing.y - uRing.x);
  float dens = ringDensity(t, uRing.z, fw);
  if (dens <= 0.002) discard;
  vec3 V = normalize(-vWorld), P = (vWorld - uCenter) / uRadius;
  float sunSide = dot(uRingN, uSun), viewSide = dot(uRingN, V);
  float litSide = step(0.0, sunSide * viewSide);
  float elev = pow(abs(sunSide), 0.35);
  float bright = mix(dens * (1.0 - dens) * 2.2 + 0.05, 0.55 + 0.45 * dens, litSide) * (0.35 + 0.65 * elev);
  float fwd = pow(max(dot(-V, uSun), 0.0), 8.0) * (1.0 - litSide) * 1.5;
  float sh = sphereShadow(P, uSun);
  vec3 col = mix(uColA, uColB, n1(t * 6.0 + uRing.z * 40.0) * 0.8 + 0.2 * n1(t * 31.0));
  vec3 c = col * uSunCol * (bright + fwd) * sh + col * 0.003;
  float alpha = clamp(dens * uRing.w * (0.75 + 0.25 / max(abs(viewSide), 0.25)), 0.0, 1.0);
  gl_FragColor = vec4(c * alpha, alpha);
  LOGDEPTH
}
`;

// ---------- The star ----------
export const STAR_FRAG = /* glsl */`
${FRAG_COMMON}
${NOISE}
uniform vec3 uColor; uniform float uTime; uniform vec4 uSeed; uniform float uGain;
varying vec3 vN; varying vec3 vObj; varying vec3 vWorld;
void main() {
  vec3 N = normalize(vN), p = normalize(vObj), V = normalize(-vWorld);
  float fp = length(fwidth(vObj)) + 1e-6;
  vec3 so = uSeed.xyz * 23.0;
  float flow = uTime * 0.012;
  float gran = fbm(p * 14.0 + so + vec3(0.0, flow, flow * 0.7), 4, fp * 14.0);
  float cells = fbm(p * 46.0 + so.yzx - vec3(flow * 1.7, 0.0, flow), 3, fp * 46.0);
  float big = fbm(p * 2.2 + so.zxy + flow * 0.2, 4, fp * 2.2);
  float spot = smoothstep(0.42, 0.58, big) * smoothstep(0.75, 0.35, abs(p.z));
  float mu = max(dot(N, V), 0.0);
  float limb = 0.3 + 0.7 * pow(mu, 0.75);
  vec3 base = pow(uColor, vec3(1.7));
  vec3 c = base * (1.0 + 0.34 * gran + 0.2 * cells + 0.3 * big) * (1.0 - 0.65 * spot);
  c = mix(c * vec3(1.0, 0.62, 0.38), c, pow(mu, 0.6)) * limb;      // redder and dimmer towards the edge
  gl_FragColor = vec4(c * uGain, 1.0);
  LOGDEPTH
}
`;
// Corona and glare: one square that always faces the camera.
export const CORONA_VERT = /* glsl */`
${VERT_COMMON}
uniform vec3 uCenter; uniform float uSize;
varying vec2 vUv;
void main() {
  vUv = position.xy;
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  setPos(uCenter + (right * position.x + up * position.y) * uSize);
}
`;
export const CORONA_FRAG = /* glsl */`
${FRAG_COMMON}
${NOISE}
uniform vec3 uColor; uniform float uTime; uniform float uDisc; uniform vec4 uSeed; uniform float uGain; uniform float uAnim;
varying vec2 vUv;
void main() {
  float q = length(vUv);                       // 0 at the centre, 1 at the edge of the square
  if (q >= 1.0) discard;
  float d = q / uDisc;                         // distance in star radii
  float ang = atan(vUv.y, vUv.x);
  vec3 dir = vec3(cos(ang), sin(ang), 0.0);
  float tt = uTime * 0.02 * uAnim;
  float st = fbm(dir * 2.4 + vec3(uSeed.xy * 9.0, tt + d * 0.12), 4, 0.01);
  float st2 = fbm(dir * 7.0 + vec3(uSeed.yz * 5.0, -tt * 1.7 + d * 0.3), 3, 0.01);
  float streamers = 0.75 + 0.9 * st + 0.35 * st2;
  float outside = smoothstep(0.96, 1.04, d);
  float inner = exp(-(max(d, 1.0) - 1.0) * 3.2) * 0.9;
  float outer = 0.13 / (d * d + 0.3);
  float corona = (inner + outer * max(streamers, 0.1)) * outside;
  // a point-like glare that keeps a distant star visible; it fades out as the disc itself grows on screen
  float glare = (0.007 / (q * q + 0.0005) + 0.035 / (q + 0.06)) * smoothstep(0.1, 0.02, uDisc);
  float fade = smoothstep(1.0, 0.5, q);
  vec3 c = uColor * (corona * 0.5 + glare) * fade * uGain;
  gl_FragColor = vec4(c, 1.0);
  LOGDEPTH
}
`;

// ---------- Sky: nebulae baked once into a cube map, and stars drawn as points ----------
export const SKY_BAKE_VERT = /* glsl */`
varying vec2 vUv;
void main() { vUv = position.xy; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
export const SKY_BAKE_FRAG = /* glsl */`
${NOISE}
uniform int uFace; uniform vec3 uGal; uniform vec4 uSeed; uniform vec3 uNebA; uniform vec3 uNebB; uniform vec3 uNebC;
varying vec2 vUv;
void main() {
  float u = vUv.x, v = vUv.y; vec3 d;
  if (uFace == 0) d = vec3(1.0, -v, -u); else if (uFace == 1) d = vec3(-1.0, -v, u);
  else if (uFace == 2) d = vec3(u, 1.0, v); else if (uFace == 3) d = vec3(u, -1.0, -v);
  else if (uFace == 4) d = vec3(u, -v, 1.0); else d = vec3(-u, -v, -1.0);
  d = normalize(d);
  vec3 so = uSeed.xyz * 50.0;
  float lat = dot(d, uGal);
  float band = exp(-lat * lat / 0.045);
  float warp = fbm(d * 2.0 + so, 5, 0.002);
  float clouds = fbm(d * 3.5 + so.yzx + warp * 1.2, SKY_OCT, 0.002);
  float lanes = smoothstep(0.05, 0.5, fbm(d * vec3(5.0) + so.zxy + warp * 2.0, SKY_OCT, 0.002) + 0.25);
  vec3 col = vec3(0.95, 0.9, 0.82) * band * (0.5 + 0.7 * clouds) * mix(0.25, 1.0, lanes) * 0.075;
  // emission nebulae: a few coloured clouds with fine filaments
  float m1 = smoothstep(0.12, 0.6, fbm(d * 1.3 + so * 1.3, 5, 0.002) + 0.35 * band - 0.1);
  float f1 = fbm(d * 6.0 + so + warp * 2.5, SKY_OCT, 0.002);
  float fil = pow(1.0 - abs(f1), 6.0);
  col += uNebA * m1 * (0.35 + 0.65 * smoothstep(-0.3, 0.6, f1)) * 0.07 + uNebA * m1 * fil * 0.05;
  float m2 = smoothstep(0.2, 0.7, fbm(d * 1.7 - so * 0.7, 5, 0.002));
  float f2 = fbm(d * 4.5 - so.yzx + warp * 1.8, SKY_OCT, 0.002);
  col += uNebB * m2 * (0.3 + 0.7 * smoothstep(-0.2, 0.5, f2)) * 0.05;
  float m3 = smoothstep(0.3, 0.75, fbm(d * 2.3 + so.zxy * 2.1, 5, 0.002));
  col += uNebC * m3 * pow(1.0 - abs(fbm(d * 8.0 + so + warp, SKY_OCT, 0.002)), 4.0) * 0.06;
  col *= 0.75 + 0.25 * lanes;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;
export const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * viewMatrix * vec4(position * 1000.0, 1.0);
  gl_Position.z = gl_Position.w * 0.99999;
}
`;
export const SKY_FRAG = /* glsl */`
uniform samplerCube uSky; uniform float uGain;
varying vec3 vDir;
void main() { gl_FragColor = vec4(texture(uSky, normalize(vDir)).rgb * uGain, 1.0); }
`;
export const STARS_VERT = /* glsl */`
attribute vec4 aStar;       // rgb colour, a brightness
uniform float uPx;
varying vec4 vStar;
void main() {
  gl_Position = projectionMatrix * viewMatrix * vec4(position * 1000.0, 1.0);
  gl_Position.z = gl_Position.w * 0.99999;
  float s = (1.2 + 2.6 * sqrt(aStar.a)) * uPx;
  gl_PointSize = max(s, 1.6);
  vStar = vec4(aStar.rgb, aStar.a * min(1.0, (s * s) / (1.6 * 1.6)));
}
`;
export const STARS_FRAG = /* glsl */`
varying vec4 vStar;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0; float d2 = dot(c, c);
  if (d2 > 1.0) discard;
  float a = exp(-d2 * 3.5) * (1.0 - d2);
  gl_FragColor = vec4(vStar.rgb * (0.25 + 2.4 * vStar.a) * a, 1.0);
}
`;

// ---------- Asteroids (one draw call for all the rocks) ----------
export const ROCK_VERT = /* glsl */`
${VERT_COMMON}
${NOISE}
attribute vec3 iOffset; attribute vec4 iAxisSpin; attribute vec4 iScaleTint;   // axis xyz + spin rate; radius, tint, phase, stretch
uniform float uTime; uniform float uMinPx; uniform float uEnlarge;
varying vec3 vWorld; varying vec3 vDir; varying vec3 vAx; varying vec2 vCS; varying vec3 vStretch; varying vec2 vTint;
float rockH(vec3 d, float s) { return fbm(d * 1.3 + s * 50.0, 3, 0.0) * 0.42 + fbm(d * 3.1 + s * 20.0, 2, 0.0) * 0.14; }
void main() {
  vec3 ax = normalize(iAxisSpin.xyz); float ang = iScaleTint.z * 6.2832 + uTime * iAxisSpin.w;
  float c = cos(ang), s = sin(ang);
  vec3 d = normalize(position);
  vec3 stretch = vec3(1.0, iScaleTint.w, 0.7 + 0.5 * fract(iScaleTint.z * 7.0));
  vec3 q = d * (1.0 + rockH(d, iScaleTint.z)) * stretch;
  vec3 r = q * c + cross(ax, q) * s + ax * dot(ax, q) * (1.0 - c);
  float dist = length(iOffset);
  // enlarged near the camera; from far outside the belt the enlargement fades, or the rocks would merge into a solid ring
  float rad = max(iScaleTint.x * (1.0 + (uEnlarge - 1.0) * min(1.0, 2.5e5 / dist)), dist * uMinPx);
  vDir = d; vAx = ax; vCS = vec2(c, s); vStretch = stretch; vTint = iScaleTint.yz;
  vWorld = iOffset + r * rad;
  setPos(vWorld);
}
`;
export const ROCK_FRAG = /* glsl */`
${FRAG_COMMON}
${NOISE}
uniform vec3 uSunPos; uniform vec3 uSunCol;
varying vec3 vWorld; varying vec3 vDir; varying vec3 vAx; varying vec2 vCS; varying vec3 vStretch; varying vec2 vTint;
void main() {
  vec3 d = normalize(vDir); float fp = length(fwidth(vDir)) + 1e-6, sd = vTint.y;
  vec4 a = fbmd(d * 1.3 + sd * 50.0, 3, fp * 1.3), b = fbmd(d * 3.1 + sd * 20.0, 2, fp * 3.1), f = fbmd(d * 9.0 + sd * 70.0, OCT - 2, fp * 9.0);
  float h = a.x * 0.42 + b.x * 0.14;
  vec3 g = a.yzw * (0.42 * 1.3) + b.yzw * (0.14 * 3.1) + f.yzw * 1.1;
  vec3 n = normalize(d * (1.0 + h) - (g - dot(g, d) * d)) / vStretch;
  vec3 ax = normalize(vAx);
  vec3 N = normalize(n * vCS.x + cross(ax, n) * vCS.y + ax * dot(ax, n) * (1.0 - vCS.x));
  vec3 L = normalize(uSunPos - vWorld);
  vec3 col = mix(vec3(0.3, 0.27, 0.24), vec3(0.52, 0.44, 0.36), vTint.x) * (0.75 + 0.35 * f.x + 0.25 * a.x);
  col = mix(col, col * 0.55, smoothstep(0.1, 0.5, b.x));
  float dif = max(dot(N, L), 0.0);
  gl_FragColor = vec4(col * uSunCol * dif * 1.15 + col * 0.004, 1.0);
  LOGDEPTH
}
`;
// Fine dust: thousands of points on circular orbits, worked out on the graphics chip.
export const DUST_VERT = /* glsl */`
${VERT_COMMON}
attribute vec4 aOrb;        // radius (units), start angle, height, brightness
uniform vec3 uStar; uniform float uT; uniform float uMu; uniform float uPx;
varying float vA;
void main() {
  float ang = aOrb.y + uT * sqrt(uMu / (aOrb.x * aOrb.x * aOrb.x));
  vec3 w = uStar + vec3(cos(ang) * aOrb.x, sin(ang) * aOrb.x, aOrb.z);
  setPos(w);
  gl_PointSize = max(1.3 * uPx, 1.3);
  vA = aOrb.w;
}
`;
export const DUST_FRAG = /* glsl */`
${FRAG_COMMON}
uniform vec3 uSunCol; uniform float uFade; varying float vA;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0; float d2 = dot(c, c);
  if (d2 > 1.0) discard;
  gl_FragColor = vec4(vec3(0.6, 0.52, 0.44) * uSunCol * vA * (1.0 - d2) * 0.2 * uFade, 1.0);
  LOGDEPTH
}
`;

// ---------- Orbit paths: ribbons a constant number of pixels wide ----------
// Each vertex has aS (an angle offset from the body's present place on its orbit) and aSide (-1 or +1).
// The curve is worked out relative to the body itself, so the line passes exactly through it.
export const ORBIT_VERT = /* glsl */`
${VERT_COMMON}
attribute float aS; attribute float aSide;
uniform vec3 uBody; uniform vec3 uPv; uniform vec3 uQv; uniform vec4 uEl;   // uEl: |a| (units), e, anomaly now, 1 if hyperbolic
uniform vec2 uRes; uniform float uWidth; uniform float uLimit; uniform float uSc; uniform float uBodyR;
varying float vS; varying float vSide; varying float vNear;
vec3 delta(float s) {
  float a = uEl.x, e = uEl.y, E0 = uEl.z;
  if (uEl.w < 0.5) {
    float b = a * sqrt(1.0 - e * e), h = sin(s * 0.5);
    return uPv * (-2.0 * a * sin(E0 + s * 0.5) * h) + uQv * (2.0 * b * cos(E0 + s * 0.5) * h);
  }
  float b = a * sqrt(e * e - 1.0), h = sinh(s * 0.5);
  return uPv * (-2.0 * a * sinh(E0 + s * 0.5) * h) + uQv * (2.0 * b * cosh(E0 + s * 0.5) * h);
}
void main() {
  float s = uEl.w < 0.5 ? uSc + aS * 3.14159265 : aS * uLimit;
  vec3 dl = delta(s);
  vec3 w = uBody + dl, w2 = uBody + delta(s + 0.002);
  vec4 c1 = projectionMatrix * viewMatrix * vec4(w, 1.0), c2 = projectionMatrix * viewMatrix * vec4(w2, 1.0);
  vec2 dir = c2.xy / max(abs(c2.w), 1e-9) - c1.xy / max(abs(c1.w), 1e-9);
  dir *= uRes; float len = length(dir);
  vec2 nrm = len > 1e-9 ? vec2(-dir.y, dir.x) / len : vec2(0.0, 1.0);
  gl_Position = c1;
  gl_Position.xy += nrm / uRes * aSide * uWidth * c1.w;
  vLogW = 1.0 + c1.w; vSide = aSide; vNear = length(dl) / uBodyR;
  vS = uEl.w < 0.5 ? (mod(s + 3.14159265, 6.2831853) - 3.14159265) / 3.14159265 : aS;
}
`;
export const ORBIT_FRAG = /* glsl */`
${FRAG_COMMON}
uniform vec3 uColor; uniform float uAlpha; uniform float uDash;
varying float vS; varying float vSide; varying float vNear;
void main() {
  float edge = 1.0 - smoothstep(0.35, 1.0, abs(vSide));
  float trail = vS < 0.0 ? mix(1.0, 0.32, smoothstep(0.0, 1.0, -vS)) : mix(0.55, 0.32, smoothstep(0.0, 0.25, vS));
  trail *= smoothstep(1.3, 4.5, vNear);
  float dash = uDash > 0.0 ? step(0.5, fract(vS * uDash)) : 1.0;
  float a = edge * trail * uAlpha * dash;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor * a, a);
  LOGDEPTH
}
`;

// ---------- Straight segments (vectors, test-mass trail) and screen markers (labels, rings) ----------
export const SEG_VERT = /* glsl */`
${VERT_COMMON}
attribute vec3 aA; attribute vec3 aB; attribute vec4 aCol; attribute vec2 aStyle;   // width px, dash
uniform vec2 uRes;
varying vec4 vCol; varying vec2 vUv; varying float vDash; varying float vLenPx;
void main() {
  vec4 c1 = projectionMatrix * viewMatrix * vec4(aA, 1.0), c2 = projectionMatrix * viewMatrix * vec4(aB, 1.0);
  vec2 p1 = c1.xy / max(c1.w, 1e-6) * uRes, p2 = c2.xy / max(c2.w, 1e-6) * uRes;
  vec2 dir = p2 - p1; float len = length(dir);
  vec2 nrm = len > 1e-6 ? vec2(-dir.y, dir.x) / len : vec2(0.0, 1.0);
  vec4 c = mix(c1, c2, position.x);
  // position.z > 0: an arrowhead at B (a triangle); otherwise the shaft
  float w = aStyle.x * (position.z > 0.5 ? 3.2 * (1.0 - position.x) : 1.0);
  vec2 along = len > 1e-6 ? dir / len : vec2(1.0, 0.0);
  vec2 off = nrm * position.y * w;
  if (position.z > 0.5) { c = c2; off += along * (position.x - 1.0) * aStyle.x * 5.0; }
  gl_Position = c; gl_Position.xy += off / uRes * c.w;
  if (c1.w < 0.0 || c2.w < 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  vLogW = 1.0 + c.w; vCol = aCol; vUv = position.xy; vDash = position.z > 0.5 ? 0.0 : aStyle.y; vLenPx = len;
}
`;
export const SEG_FRAG = /* glsl */`
${FRAG_COMMON}
varying vec4 vCol; varying vec2 vUv; varying float vDash; varying float vLenPx;
void main() {
  float a = vCol.a * (1.0 - smoothstep(0.55, 1.0, abs(vUv.y)));
  if (vDash > 0.0) a *= step(0.5, fract(vUv.x * vLenPx / vDash));
  if (a < 0.004) discard;
  gl_FragColor = vec4(vCol.rgb * a, a);
}
`;
export const MARK_VERT = /* glsl */`
attribute vec3 iPos; attribute vec4 iRect; attribute vec4 iCol; attribute vec4 iParam;   // iRect: atlas u0,v0,u1,v1; iParam: w px, h px, kind, body px radius
uniform vec2 uRes;
varying vec2 vUv; varying vec4 vRect; varying vec4 vCol; varying vec4 vParam;
void main() {
  vec4 c = projectionMatrix * viewMatrix * vec4(iPos, 1.0);
  vec2 off = iParam.z < 0.5 ? vec2(iParam.w + 8.0 + (position.x + 1.0) * 0.5 * iParam.x, position.y * iParam.y * 0.5) : position.xy * iParam.x * 0.5;
  gl_Position = vec4(c.xy / c.w + off / uRes, 0.0, 1.0);
  if (c.w <= 0.0 || iCol.a <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  vUv = position.xy; vRect = iRect; vCol = iCol; vParam = iParam;
}
`;
export const MARK_FRAG = /* glsl */`
uniform sampler2D uAtlas; uniform float uTime;
varying vec2 vUv; varying vec4 vRect; varying vec4 vCol; varying vec4 vParam;
void main() {
  float a;
  if (vParam.z < 0.5) {                      // a name
    vec2 uv = mix(vRect.xy, vRect.zw, vec2(vUv.x * 0.5 + 0.5, 0.5 - vUv.y * 0.5));
    vec4 tx = texture(uAtlas, uv);
    float halo = tx.g * 0.75 * vCol.a;
    a = tx.r * vCol.a;
    gl_FragColor = vec4(vCol.rgb * a, max(a, halo));
    if (gl_FragColor.a < 0.01) discard;
    return;
  } else {
    float r = length(vUv), px = 2.0 / vParam.x;
    if (vParam.z < 1.5) a = (1.0 - smoothstep(px * 0.6, px * 1.6, abs(r - 0.8)));          // a thin ring: "a body is here"
    else {                                    // the selection mark: four corner ticks
      vec2 q = abs(vUv); float box = max(q.x, q.y);
      float line = 1.0 - smoothstep(px * 0.5, px * 1.5, abs(box - 0.9));
      a = line * step(0.66, min(q.x, q.y) / 0.9);
    }
  }
  a *= vCol.a;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vCol.rgb * a, a);
}
`;

// ---------- Final pass: tone mapping, sRGB, a little dither against banding ----------
export const FINAL_FRAG = /* glsl */`
uniform sampler2D tDiffuse; uniform float uExposure; uniform float uVignette;
varying vec2 vUv;
vec3 film(vec3 x) {                           // a smooth shoulder: bright things roll off instead of clipping
  x *= uExposure;
  return (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
}
void main() {
  vec3 c = film(max(texture2D(tDiffuse, vUv).rgb, 0.0));
  vec2 q = vUv - 0.5; c *= 1.0 - uVignette * dot(q, q);
  c = mix(c * 12.92, 1.055 * pow(max(c, 0.0), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) + fract(sin(dot(gl_FragCoord.xy, vec2(39.3468, 11.135))) * 24634.6345) - 1.0;
  gl_FragColor = vec4(c + n / 255.0, 1.0);
}
`;
export const PASS_VERT = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
