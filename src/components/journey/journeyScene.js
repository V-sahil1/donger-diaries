import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { fbm, ridged, seeded, smoothstep } from '../../lib/noise.js';

/*
 * Three.js fly-through for "The Route" section.
 * Scroll flies a drone-style camera down one long Himalayan valley that
 * changes as it goes: monsoon Sahyadri mesas → Kullu pine forest → Spiti's
 * banded cold desert → Ladakh at dusk with a high lake, prayer flags and a
 * night sky. Giant snow ranges stand behind the valley walls in aerial haze,
 * an asphalt road runs along the floor and its centre line turns orange as the
 * journey progresses. Rendered with ACES tone mapping and a soft bloom.
 */

export const LEN = 420; // valley length along -Z
const HALF_W = 380; // terrain half-width — far ranges sit out here
const Z_START = 40;
const Z_END = -LEN - 220; // terrain runs well past the route so haze hides its edge

// Map pins sit at these points along the route (0..1); copy lives in content.js.
export const WAYPOINTS = [0.1, 0.36, 0.62, 0.88];
const FLAGS_AT = 0.835; // Khardung La prayer flags, just before the last pin
const ROAD_W = 3.4;

// Scroll progress (0..1) → where the camera is along the route.
export const routeAt = (p) => 0.015 + p * 0.905;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;

/** Valley centreline: two sine waves so the road meanders without repeating. */
const centerX = (z) => 14 * Math.sin(z * 0.018) + 6 * Math.sin(z * 0.047 + 1.3);
const biomeAt = (z) => clamp01(-z / LEN);
/** Piecewise blend across the four regions, matching the shader's biome(). */
const byBiome = (b, [a, c, d, e]) => {
  const s1 = smoothstep(0.2, 0.3, b);
  const s2 = smoothstep(0.45, 0.55, b);
  const s3 = smoothstep(0.7, 0.8, b);
  return lerp(lerp(lerp(a, c, s1), d, s2), e, s3);
};
const FLOOR_RISE = 8; // the valley floor climbs this much from ghats to Ladakh
const floorAt = (x, z) => {
  const d = Math.abs(x - centerX(z));
  // bumpy meadow, flattened where the road is cut
  return biomeAt(z) * FLOOR_RISE + fbm(x * 0.08, z * 0.08, 3) * 0.9 * smoothstep(2.5, 7, d);
};

function heightAt(x, z) {
  const b = biomeAt(z);
  const d = Math.abs(x - centerX(z));
  // domain warp so ridges bend like real drainage instead of a noise grid
  const wx = x + (fbm(x * 0.01, z * 0.01, 2) - 0.5) * 60;
  const wz = z + (fbm(x * 0.01 + 5.2, z * 0.01 + 1.3, 2) - 0.5) * 60;

  const valley = smoothstep(7, 46, d);
  const amp = byBiome(b, [16, 38, 32, 44]);
  let m = ridged(wx * 0.02 + 3.1, wz * 0.02, 6) * amp * 1.6 + fbm(x * 0.07, z * 0.07, 4) * 4 + d * 0.16;
  // Sahyadri: Deccan-trap basalt mesas — flat tops, steep scarps.
  const deccan = 1 - smoothstep(0.18, 0.3, b);
  if (deccan > 0) {
    const cap = 13 + fbm(x * 0.03, z * 0.03, 2) * 9;
    const capped = m > cap ? cap + (m - cap) * 0.06 : m;
    m += (capped - m) * deccan;
  }
  // the great ranges behind the valley walls — the Himalaya proper
  const far = smoothstep(50, 190, d) * ridged(wx * 0.007 + 7.7, wz * 0.007, 5) * byBiome(b, [26, 150, 125, 160]);
  return floorAt(x, z) + valley * m + far;
}

// ---------- time of day, keyed by where the camera is on the map ------------
const SKY_KEYS = [
  // overcast monsoon morning, low cloud in the ghats
  { at: 0.0, top: '#8a9ca3', horizon: '#c9d1c9', sun: '#fff0d8', sunI: 0.75, amb: 1.0, cloud: '#eef1ee', cover: 0.85, fog: 0.0065, fogLift: 5, dir: [0.4, 0.55, -0.75], disc: 0.0, stars: 0 },
  // crisp Himachal noon
  { at: 0.32, top: '#2d6cc2', horizon: '#c2dbef', sun: '#fff6e6', sunI: 1.35, amb: 0.7, cloud: '#ffffff', cover: 0.45, fog: 0.0034, fogLift: 3, dir: [0.35, 0.75, -0.55], disc: 1, stars: 0 },
  // Spiti golden hour
  { at: 0.6, top: '#355a93', horizon: '#f0ad78', sun: '#ffb062', sunI: 1.35, amb: 0.5, cloud: '#ffd2a6', cover: 0.4, fog: 0.003, fogLift: 2, dir: [-0.5, 0.2, -0.85], disc: 1, stars: 0 },
  // Ladakh dusk
  { at: 0.8, top: '#201b48', horizon: '#d06c58', sun: '#ff8457', sunI: 0.8, amb: 0.42, cloud: '#c48282', cover: 0.35, fog: 0.003, fogLift: 2, dir: [-0.45, 0.05, -0.9], disc: 1, stars: 0.35 },
  // night under the stars (the "sun" is now a small, cool moon)
  { at: 0.95, top: '#03060d', horizon: '#141c33', sun: '#9fb2ff', sunI: 0.45, amb: 0.3, cloud: '#3a4568', cover: 0.2, fog: 0.0028, fogLift: 2, dir: [0.35, 0.45, -0.8], disc: 0.6, stars: 1 },
].map((k) => ({
  ...k,
  top: new THREE.Color(k.top),
  horizon: new THREE.Color(k.horizon),
  sun: new THREE.Color(k.sun),
  cloud: new THREE.Color(k.cloud),
  dir: new THREE.Vector3(...k.dir).normalize(),
}));
const SKY_SCALARS = ['sunI', 'amb', 'cover', 'fog', 'fogLift', 'disc', 'stars'];

function sampleSky(b, out) {
  let i = 0;
  while (i < SKY_KEYS.length - 2 && b > SKY_KEYS[i + 1].at) i += 1;
  const a = SKY_KEYS[i];
  const c = SKY_KEYS[i + 1];
  const t = smoothstep(a.at, c.at, b);
  out.top.lerpColors(a.top, c.top, t);
  out.horizon.lerpColors(a.horizon, c.horizon, t);
  out.sun.lerpColors(a.sun, c.sun, t);
  out.cloud.lerpColors(a.cloud, c.cloud, t);
  out.dir.lerpVectors(a.dir, c.dir, t).normalize();
  for (const key of SKY_SCALARS) out[key] = lerp(a[key], c[key], t);
  return out;
}

// ---------- shared GLSL --------------------------------------------------------
const NOISE_GLSL = /* glsl */ `
  // 2D simplex noise (Ashima Arts / Stefan Gustavson, MIT).
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  float fbm(vec2 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < OCTAVES; i++) {
      s += a * snoise(p);
      p = p * 2.03 + vec2(17.1, 9.2);
      a *= 0.5;
    }
    return s;
  }
`;

const BIOME_GLSL = /* glsl */ `
  vec3 biome(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
    return mix(mix(mix(a, b, smoothstep(0.2, 0.3, t)), c, smoothstep(0.45, 0.55, t)), d, smoothstep(0.7, 0.8, t));
  }
  float biomeF(vec4 v, float t) {
    return mix(mix(mix(v.x, v.y, smoothstep(0.2, 0.3, t)), v.z, smoothstep(0.45, 0.55, t)), v.w, smoothstep(0.7, 0.8, t));
  }
  float centerX(float z) { return 14.0 * sin(z * 0.018) + 6.0 * sin(z * 0.047 + 1.3); }
`;

// Aerial perspective: haze thickens with distance, pools in the valley and
// glows toward the sun. Sky uses the same colours, so ridges melt into it.
const ATMOS_GLSL = /* glsl */ `
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uFogHeight;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  vec3 applyAtmosphere(vec3 col, vec3 wp) {
    vec3 rd = wp - cameraPosition;
    float dist = length(rd);
    rd /= dist;
    float pooled = exp(-max(wp.y - uFogHeight, 0.0) * 0.05);
    float amt = 1.0 - exp(-dist * uFogDensity * (0.45 + 1.8 * pooled));
    float toSun = pow(max(dot(rd, uSunDir), 0.0), 6.0);
    vec3 haze = mix(uFogColor, uFogColor * 0.55 + uSunColor * 0.65, toSun);
    return mix(col, haze, clamp(amt, 0.0, 1.0));
  }
`;

const worldVertex = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vNormalW;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const terrainFragment = /* glsl */ `
  uniform float uLen;
  uniform float uFloorRise;
  uniform vec3 uGrassA0, uGrassA1, uGrassA2, uGrassA3;
  uniform vec3 uGrassB0, uGrassB1, uGrassB2, uGrassB3;
  uniform vec3 uRock0, uRock1, uRock2, uRock3;
  uniform vec3 uDirt, uSnow;
  uniform vec4 uSnowLine;
  uniform vec4 uTreeLine;
  uniform vec3 uSkyAmb, uGroundAmb;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  ${NOISE_GLSL}
  ${BIOME_GLSL}
  ${ATMOS_GLSL}
  void main() {
    float b = clamp(-vWorld.z / uLen, 0.0, 1.0);
    vec2 p = vWorld.xz;
    vec3 ng = normalize(vNormalW);

    // per-pixel micro relief: bumps the normal so slopes read as rock and turf
    float e = 0.35;
    float n0 = fbm(p * 0.2);
    float nx = fbm((p + vec2(e, 0.0)) * 0.2);
    float nz = fbm((p + vec2(0.0, e)) * 0.2);
    vec3 n = normalize(ng + vec3(n0 - nx, 0.0, n0 - nz) * 1.4);

    float large = fbm(p * 0.025) * 0.5 + 0.5;
    float mid = fbm(p * 0.11 + 3.7) * 0.5 + 0.5;
    float fine = n0 * 0.5 + 0.5;
    float rel = vWorld.y - b * uFloorRise;
    float slope = 1.0 - ng.y;

    vec3 grass = mix(biome(uGrassA0, uGrassA1, uGrassA2, uGrassA3, b),
                     biome(uGrassB0, uGrassB1, uGrassB2, uGrassB3, b), smoothstep(0.3, 0.7, large));
    grass *= 0.82 + 0.36 * mid;

    float desert = smoothstep(0.45, 0.6, b);
    vec3 rock = biome(uRock0, uRock1, uRock2, uRock3, b) * (0.78 + 0.44 * fine);
    float camDist = length(cameraPosition - vWorld);
    float near = 1.0 - smoothstep(20.0, 90.0, camDist);
    float crack = 1.0 - abs(snoise(p * 0.55 + vWorld.y * 0.3));
    rock *= mix(1.0, 0.62 + 0.38 * smoothstep(0.0, 0.25, 1.0 - crack), 0.5 + 0.5 * near); // dark crevices
    grass *= 1.0 + near * 0.22 * snoise(p * 1.7); // tufts close to camera
    // sedimentary strata on the Spiti / Ladakh cliffs
    rock *= 1.0 + 0.14 * sin(vWorld.y * 1.9 + fbm(p * 0.04) * 4.0) * desert;

    float treeLine = biomeF(uTreeLine, b);
    float rockAmt = smoothstep(0.3, 0.52, slope + (mid - 0.5) * 0.22);
    rockAmt = max(rockAmt, smoothstep(treeLine, treeLine + 14.0, rel + (large - 0.5) * 10.0));
    vec3 col = mix(grass, rock, rockAmt);

    // dusty shoulder along the road cut
    float dr = abs(vWorld.x - centerX(vWorld.z));
    col = mix(uDirt * (0.85 + 0.3 * fine), col, smoothstep(1.9, 3.8, dr + (fine - 0.5) * 1.2));

    // snow with ragged edges, only where it can settle
    float line = biomeF(uSnowLine, b) + (large - 0.5) * 16.0;
    float snow = smoothstep(line - 2.0, line + 2.0, vWorld.y) * smoothstep(0.35, 0.62, ng.y + (fine - 0.5) * 0.3);
    col = mix(col, uSnow, snow);

    // light: sun + sky/ground ambient + cheap occlusion in hollows
    float diff = max(dot(n, uSunDir), 0.0);
    float ao = (0.72 + 0.28 * smoothstep(0.0, 10.0, rel)) * (0.82 + 0.18 * mid);
    vec3 amb = mix(uGroundAmb, uSkyAmb, n.y * 0.5 + 0.5);
    vec3 lit = col * (amb * ao + uSunColor * diff);
    vec3 V = normalize(cameraPosition - vWorld);
    lit += uSunColor * pow(max(dot(reflect(-uSunDir, n), V), 0.0), 48.0) * snow * 0.35;

    gl_FragColor = vec4(applyAtmosphere(lit, vWorld), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const roadVertex = /* glsl */ `
  attribute float aDist;
  attribute float aSide;
  varying vec3 vWorld;
  varying float vDist;
  varying float vSide;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vDist = aDist;
    vSide = aSide;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const roadFragment = /* glsl */ `
  uniform float uTravel;
  uniform vec3 uRoute;
  uniform vec3 uSkyAmb;
  varying vec3 vWorld;
  varying float vDist;
  varying float vSide;
  ${NOISE_GLSL}
  ${ATMOS_GLSL}
  void main() {
    float s = abs(vSide);
    float grain = fbm(vWorld.xz * 2.5) * 0.5 + 0.5;
    vec3 asphalt = vec3(0.13, 0.135, 0.14) * (0.8 + 0.4 * grain);
    asphalt = mix(asphalt, vec3(0.42, 0.36, 0.3) * (0.8 + 0.4 * grain), smoothstep(0.9, 1.0, s)); // gravel edge
    float edge = smoothstep(0.8, 0.82, s) * (1.0 - smoothstep(0.86, 0.88, s));
    vec3 col = mix(asphalt, vec3(0.85), edge * 0.85);

    // centre line: dashed ahead, solid glowing orange where we have travelled
    bool done = vDist < uTravel;
    float width = done ? 0.085 : 0.045;
    float centre = 1.0 - smoothstep(width - 0.02, width, s);
    float dash = step(fract(vDist / 5.0), 0.5);
    vec3 lit = col * (uSkyAmb * 1.4 + uSunColor * max(uSunDir.y, 0.0));
    if (done) {
      lit = mix(lit, uRoute * 1.5, centre); // unlit, so it glows at night
    } else {
      lit = mix(lit, vec3(0.95, 0.85, 0.45) * (uSkyAmb * 1.4 + uSunColor), centre * dash);
    }
    gl_FragColor = vec4(applyAtmosphere(lit, vWorld), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const lakeFragment = /* glsl */ `
  uniform vec3 uDeep, uTop;
  uniform vec3 uCenter;
  uniform vec2 uRadius;
  uniform float uTime;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  ${NOISE_GLSL}
  ${BIOME_GLSL}
  ${ATMOS_GLSL}
  void main() {
    vec2 e = (vWorld.xz - uCenter.xz) / uRadius;
    // an oval lake that never floods the road side of the valley
    if (dot(e, e) > 1.0 || vWorld.x < centerX(vWorld.z) + 5.0) discard;
    vec3 v = normalize(cameraPosition - vWorld);
    vec2 q = vWorld.xz * 0.6;
    vec3 n = normalize(vec3(snoise(q + uTime * 0.3) * 0.06, 1.0, snoise(q.yx - uTime * 0.25) * 0.06));
    float fres = pow(1.0 - max(dot(v, n), 0.0), 4.0);
    vec3 r = reflect(-v, n);
    vec3 skyRef = mix(uFogColor, uTop, smoothstep(0.0, 0.5, r.y));
    float shore = smoothstep(0.75, 1.0, dot(e, e));
    vec3 col = mix(uDeep, uDeep * 1.6 + 0.08, shore); // shallow turquoise rim
    col = mix(col, skyRef, 0.08 + 0.45 * fres);
    col += uSunColor * pow(max(dot(r, uSunDir), 0.0), 120.0) * 2.0;
    gl_FragColor = vec4(applyAtmosphere(col, vWorld), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = /* glsl */ `
  uniform vec3 uTop, uHorizon, uSunColor, uSunDir, uCloud;
  uniform float uDisc, uCover, uTime;
  varying vec3 vDir;
  ${NOISE_GLSL}
  void main() {
    vec3 d = normalize(vDir);
    float h = max(d.y, 0.0);
    vec3 col = mix(uHorizon, uTop, pow(smoothstep(0.0, 1.0, h), 0.55));
    float s = max(dot(d, uSunDir), 0.0);
    col += uSunColor * (pow(s, 5.0) * 0.22 + pow(s, 64.0) * 0.4);
    // sun / moon disc, bright enough to bloom
    col += uSunColor * smoothstep(0.99955, 0.9998, s) * 6.0 * uDisc;

    // cloud deck projected on a dome, lit from the sun side
    if (d.y > 0.0) {
      vec2 uv = d.xz / (d.y + 0.12) * 0.7 + vec2(uTime * 0.004, uTime * 0.002);
      float c = fbm(uv * 1.3) * 0.5 + 0.5;
      float cover = smoothstep(1.0 - uCover, 1.0 - uCover + 0.35, c) * smoothstep(0.0, 0.18, d.y);
      float thick = fbm(uv * 1.3 + 0.08) * 0.5 + 0.5;
      vec3 cloud = mix(uCloud * 0.62, uCloud, smoothstep(0.3, 0.8, thick));
      cloud += uSunColor * pow(s, 8.0) * 0.5 * cover; // silver lining toward the sun
      col = mix(col, cloud, cover * 0.9);
    }
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// ---------- builders -----------------------------------------------------------
const C = (hex) => new THREE.Color(hex);

function atmosphereUniforms() {
  return {
    uFogColor: { value: new THREE.Color() },
    uFogDensity: { value: 0.004 },
    uFogHeight: { value: 0 },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunColor: { value: new THREE.Color() },
  };
}

function buildTerrain(segX, segZ, atmos, octaves) {
  const geo = new THREE.PlaneGeometry(2, Z_START - Z_END, segX, segZ);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, (Z_START + Z_END) / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    // columns crowd around the winding road and spread out toward the far ranges
    const t = pos.getX(i);
    const z = pos.getZ(i);
    const a = Math.abs(t);
    const x = centerX(z) + Math.sign(t) * HALF_W * (a * 0.3 + a ** 2.4 * 0.7);
    pos.setX(i, x);
    pos.setY(i, heightAt(x, z));
  }
  geo.computeVertexNormals();
  geo.computeBoundingSphere();

  const material = new THREE.ShaderMaterial({
    vertexShader: worldVertex,
    fragmentShader: terrainFragment,
    defines: { OCTAVES: octaves },
    uniforms: {
      ...atmos,
      uLen: { value: LEN },
      uFloorRise: { value: FLOOR_RISE },
      // Sahyadri monsoon green · Kullu meadow · Spiti dry earth · Ladakh sand
      uGrassA0: { value: C('#4a8a2a') },
      uGrassA1: { value: C('#3d6a2c') },
      uGrassA2: { value: C('#ad8d63') },
      uGrassA3: { value: C('#ab947f') },
      uGrassB0: { value: C('#6f9d34') },
      uGrassB1: { value: C('#5a7a36') },
      uGrassB2: { value: C('#94704b') },
      uGrassB3: { value: C('#8d7b78') },
      uRock0: { value: C('#3b3934') },
      uRock1: { value: C('#6c6a66') },
      uRock2: { value: C('#8c5b3b') },
      uRock3: { value: C('#6b5b66') },
      uDirt: { value: C('#7b6349') },
      uSnow: { value: C('#f3f6fb') },
      uSnowLine: { value: new THREE.Vector4(999, 26, 40, 36) },
      uTreeLine: { value: new THREE.Vector4(70, 26, 6, 3) },
      uSkyAmb: { value: new THREE.Color() },
      uGroundAmb: { value: new THREE.Color() },
    },
  });
  return new THREE.Mesh(geo, material);
}

function buildRoute() {
  const pts = [];
  for (let z = 0; z >= -LEN; z -= 3) {
    const x = centerX(z);
    pts.push(new THREE.Vector3(x, heightAt(x, z), z));
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  // camera rides a smoothed copy so floor undulations don't jolt the view
  const camPts = pts.map((p, i) => {
    let y = 0;
    let n = 0;
    for (let j = Math.max(0, i - 4); j <= Math.min(pts.length - 1, i + 4); j += 1) {
      y += pts[j].y;
      n += 1;
    }
    return new THREE.Vector3(p.x, y / n, p.z);
  });
  const camCurve = new THREE.CatmullRomCurve3(camPts, false, 'centripetal');
  return { curve, camCurve, length: curve.getLength() };
}

function buildRoad(route, atmos, octaves) {
  const N = 1800;
  const positions = new Float32Array((N + 1) * 2 * 3);
  const dist = new Float32Array((N + 1) * 2);
  const side = new Float32Array((N + 1) * 2);
  const p = new THREE.Vector3();
  const t = new THREE.Vector3();
  const s = new THREE.Vector3();
  for (let i = 0; i <= N; i += 1) {
    const u = i / N;
    route.curve.getPointAt(u, p);
    route.curve.getTangentAt(u, t);
    s.crossVectors(t, THREE.Object3D.DEFAULT_UP).normalize();
    [-1, 1].forEach((k, j) => {
      const x = p.x + s.x * k * ROAD_W * 0.5;
      const z = p.z + s.z * k * ROAD_W * 0.5;
      positions.set([x, floorAt(x, z) + 0.06, z], (i * 2 + j) * 3);
      dist[i * 2 + j] = u * route.length;
      side[i * 2 + j] = k;
    });
  }
  const index = [];
  for (let i = 0; i < N; i += 1) {
    const a = i * 2;
    index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aDist', new THREE.BufferAttribute(dist, 1));
  geo.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
  geo.setIndex(index);
  geo.computeBoundingSphere();
  const material = new THREE.ShaderMaterial({
    vertexShader: roadVertex,
    fragmentShader: roadFragment,
    defines: { OCTAVES: Math.min(octaves, 2) },
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    uniforms: {
      ...atmos,
      uTravel: { value: 0 },
      uRoute: { value: C('#f58220') },
      uSkyAmb: { value: new THREE.Color() },
    },
  });
  return new THREE.Mesh(geo, material);
}

// ---------- vegetation: painted billboard trees --------------------------------
// Each tree is a single camera-facing card textured from a procedurally painted
// atlas (thousands of needle / leaf strokes, lit from the sun side), so forests
// read like photographs instead of geometric toys.
const CELL_W = 256;
const CELL_H = 512;
const CELLS = 8; // 0-3 deodar, 4-5 broadleaf, 6-7 poplar

function paintConifer(ctx, ox, rand) {
  const cx = ox + CELL_W / 2;
  const top = CELL_H * 0.03;
  const base = CELL_H * 0.84;
  // trunk peeking out under the skirt
  const trunk = ctx.createLinearGradient(cx - 6, 0, cx + 6, 0);
  trunk.addColorStop(0, '#5a412c');
  trunk.addColorStop(1, '#2a1d14');
  ctx.fillStyle = trunk;
  ctx.fillRect(cx - 5, CELL_H * 0.7, 10, CELL_H * 0.3);

  const tiers = 34 + Math.floor(rand() * 10);
  // dark inner mass first, then needle clumps on top — depth comes for free
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 0; i <= tiers; i += 1) {
      const t = i / tiers;
      const y = top + (base - top) * t;
      const half = CELL_W * 0.45 * t ** 0.85 * (0.75 + rand() * 0.35);
      const clumps = pass === 0 ? 10 + half * 0.25 : 18 + half * 0.9;
      for (let k = 0; k < clumps; k += 1) {
        const side = rand() < 0.5 ? -1 : 1;
        const r = rand() ** (pass === 0 ? 1.4 : 0.6) * half;
        const x = cx + side * r;
        const yy = y + (r / Math.max(half, 1)) * 14 + (rand() - 0.5) * 9; // branches droop at the tips
        const outer = r / Math.max(half, 1);
        const sunSide = side < 0 ? 9 : -2;
        const light = pass === 0 ? 7 + rand() * 5 : 10 + outer * 16 + sunSide + rand() * 8 - t * 4;
        ctx.fillStyle = `hsl(${118 + rand() * 26}, ${28 + rand() * 18}%, ${light}%)`;
        ctx.beginPath();
        ctx.ellipse(x, yy, 5 + rand() * 7, 2.5 + rand() * 3, side * (0.25 + rand() * 0.3), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // a few bright tips catching the light
  for (let k = 0; k < 160; k += 1) {
    const t = rand();
    const y = top + (base - top) * t;
    const half = CELL_W * 0.42 * t ** 0.85;
    const x = cx - rand() * half * 0.95;
    ctx.fillStyle = `hsla(${95 + rand() * 20}, 35%, ${30 + rand() * 12}%, 0.85)`;
    ctx.fillRect(x, y + rand() * 6, 2 + rand() * 3, 1.5);
  }
}

function paintCrown(ctx, cx, cy, rx, ry, rand, hue, sat, count) {
  for (let pass = 0; pass < 2; pass += 1) {
    for (let k = 0; k < count; k += 1) {
      const a = rand() * Math.PI * 2;
      const rr = Math.sqrt(rand()) * (pass === 0 ? 0.85 : 1);
      const x = cx + Math.cos(a) * rx * rr;
      const y = cy + Math.sin(a) * ry * rr;
      // light from the upper left, darker underside and core
      const lit = (1 - (Math.sin(a) * rr + 1) / 2) * 0.6 + (1 - (Math.cos(a) * rr + 1) / 2) * 0.4;
      const light = pass === 0 ? 8 + rand() * 6 : 12 + lit * 26 + rand() * 7;
      const size = pass === 0 ? 14 + rand() * 12 : 2.4 + rand() * 3.2;
      const leaves = pass === 0 ? 1 : 11;
      for (let l = 0; l < leaves; l += 1) {
        ctx.fillStyle = `hsl(${hue + rand() * 22}, ${sat + rand() * 15}%, ${light + (rand() - 0.5) * 6}%)`;
        ctx.beginPath();
        ctx.ellipse(x + (rand() - 0.5) * size * 2.2, y + (rand() - 0.5) * size * 1.6, size, size * 0.7, rand() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function paintTrunk(ctx, cx, fromY, toY, width, rand) {
  ctx.strokeStyle = '#3d2c1f';
  ctx.lineCap = 'round';
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(cx, fromY);
  ctx.quadraticCurveTo(cx + (rand() - 0.5) * 16, (fromY + toY) / 2, cx + (rand() - 0.5) * 10, toY);
  ctx.stroke();
  // a couple of limbs reaching into the crown
  for (let i = 0; i < 4; i += 1) {
    const y = toY + (fromY - toY) * (0.1 + rand() * 0.35);
    ctx.lineWidth = width * 0.35;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx + (rand() - 0.5) * 120, y - 30 - rand() * 50);
    ctx.stroke();
  }
}

function paintBroadleaf(ctx, ox, rand) {
  const cx = ox + CELL_W / 2;
  paintTrunk(ctx, cx, CELL_H * 0.99, CELL_H * 0.5, 13, rand);
  paintCrown(ctx, cx, CELL_H * 0.4, CELL_W * 0.42, CELL_H * 0.25, rand, 92, 34, 210);
}

function paintPoplar(ctx, ox, rand) {
  const cx = ox + CELL_W / 2;
  paintTrunk(ctx, cx, CELL_H * 0.99, CELL_H * 0.35, 8, rand);
  paintCrown(ctx, cx, CELL_H * 0.42, CELL_W * 0.2, CELL_H * 0.37, rand, 58, 42, 170);
}

function treeAtlas(maxAnisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = CELL_W * CELLS;
  canvas.height = CELL_H;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < CELLS; i += 1) {
    const rand = seeded(500 + i * 37);
    const ox = i * CELL_W;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox + 2, 0, CELL_W - 4, CELL_H); // keep strokes inside their cell
    ctx.clip();
    if (i < 4) paintConifer(ctx, ox, rand);
    else if (i < 6) paintBroadleaf(ctx, ox, rand);
    else paintPoplar(ctx, ox, rand);
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

const treeVertex = /* glsl */ `
  attribute float aCell;
  attribute vec3 aTint;
  varying vec2 vUv;
  varying float vCell;
  varying vec3 vTint;
  varying vec3 vWorld;
  void main() {
    vec3 base = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    float w = length(instanceMatrix[0].xyz);
    float h = length(instanceMatrix[1].xyz);
    // cylindrical billboard: always faces the camera, always stands upright
    vec3 toCam = cameraPosition - base;
    vec3 right = normalize(vec3(toCam.z, 0.0, -toCam.x));
    vec3 wp = base + right * position.x * w + vec3(0.0, position.y * h, 0.0);
    vWorld = wp;
    vUv = uv;
    vCell = aCell;
    vTint = aTint;
    gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
  }
`;

const treeFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uSkyAmb;
  varying vec2 vUv;
  varying float vCell;
  varying vec3 vTint;
  varying vec3 vWorld;
  ${ATMOS_GLSL}
  void main() {
    vec4 t = texture2D(uMap, vec2((vCell + vUv.x) / ${CELLS}.0, vUv.y));
    if (t.a < 0.2) discard;
    float ao = mix(0.55, 1.0, smoothstep(0.0, 0.55, vUv.y)); // darker towards the forest floor
    vec3 lit = t.rgb * vTint * (uSkyAmb * 1.5 * ao + uSunColor * 0.9);
    gl_FragColor = vec4(applyAtmosphere(lit, vWorld), smoothstep(0.25, 0.6, t.a));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function buildTrees(scale, atmos, maxAnisotropy) {
  const rand = seeded(1234);
  // [kind, count, zone along the valley, max distance from road, height range, cells, max height above floor, max slope, tint]
  const plan = [
    { count: 5200, zone: [0, 0.27], near: 80, h: [4.5, 8], cells: [4, 5], maxRel: 40, slope: 1.5, tint: [1, 1.05, 0.95], clump: true },
    { count: 9500, zone: [0.2, 0.5], near: 85, h: [6, 11.5], cells: [0, 3], maxRel: 26, slope: 1.9, tint: [0.95, 1, 1], clump: true },
    { count: 140, zone: [0.55, 0.72], near: 8, h: [6, 9], cells: [6, 7], maxRel: 1.5, slope: 0.8, tint: [1, 1, 0.95] },
    // undergrowth: bushes in the green valleys, dry sea-buckthorn scrub in the desert
    { count: 4500, zone: [0, 0.5], near: 40, h: [0.9, 2], cells: [4, 5], maxRel: 30, slope: 1.6, tint: [0.95, 1.05, 0.9] },
    { count: 1200, zone: [0.5, 0.86], near: 30, h: [0.3, 0.65], cells: [4, 5], maxRel: 6, slope: 1.2, tint: [1.6, 1.0, 0.45] },
  ];
  const total = plan.reduce((sum, p) => sum + Math.round(p.count * scale), 0);

  const geo = new THREE.PlaneGeometry(1, 1);
  geo.translate(0, 0.5, 0);
  const cells = new Float32Array(total);
  const tints = new Float32Array(total * 3);
  const material = new THREE.ShaderMaterial({
    vertexShader: treeVertex,
    fragmentShader: treeFragment,
    side: THREE.DoubleSide,
    alphaToCoverage: true,
    uniforms: { ...atmos, uMap: { value: treeAtlas(maxAnisotropy) }, uSkyAmb: { value: new THREE.Color() } },
  });
  const mesh = new THREE.InstancedMesh(geo, material, total);
  const m = new THREE.Matrix4();
  let placed = 0;
  plan.forEach((cfg) => {
    const want = Math.round(cfg.count * scale);
    let done = 0;
    for (let tries = 0; done < want && tries < want * 14; tries += 1) {
      const b = lerp(cfg.zone[0], cfg.zone[1], rand());
      const z = -b * LEN;
      const d = 5.5 + rand() ** 1.5 * cfg.near;
      const x = centerX(z) + (rand() < 0.5 ? -d : d);
      // natural stands and clearings instead of an even carpet
      if (cfg.clump && fbm(x * 0.045, z * 0.045, 2) < 0.4 + rand() * 0.18) continue;
      const y = heightAt(x, z);
      const slope = Math.abs(heightAt(x + 1, z) - y) + Math.abs(heightAt(x, z + 1) - y);
      const rel = y - b * FLOOR_RISE;
      if (slope > cfg.slope || rel > cfg.maxRel + (rand() - 0.5) * 8) continue;
      const h = lerp(cfg.h[0], cfg.h[1], rand()) * (rel > cfg.maxRel * 0.7 ? 0.7 : 1); // stunted near the tree line
      m.makeScale(h * 0.5 * (0.85 + rand() * 0.3), h, 1);
      m.setPosition(x, y - 0.2, z);
      mesh.setMatrixAt(placed, m);
      cells[placed] = cfg.cells[0] + Math.floor(rand() * (cfg.cells[1] - cfg.cells[0] + 1));
      const v = 0.85 + rand() * 0.3;
      tints.set([cfg.tint[0] * v, cfg.tint[1] * v, cfg.tint[2] * v], placed * 3);
      placed += 1;
      done += 1;
    }
  });
  geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(cells, 1));
  geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tints, 3));
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  return { mesh, material };
}

function cloudTextures() {
  return [11, 29, 47].map((seed) => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const dx = (x / size - 0.5) * 2;
        const dy = (y / size - 0.55) * 2.6;
        const fall = 1 - smoothstep(0.35, 1, Math.sqrt(dx * dx + dy * dy));
        const n = fbm(x * 0.045 + seed, y * 0.045 + seed * 0.5, 5);
        const a = clamp01((n - 0.32) * 2.6) * fall;
        const shade = 200 + 55 * (1 - y / size); // lit tops, greyer bases
        const i = (y * size + x) * 4;
        img.data.set([shade, shade, Math.min(255, shade + 4), a * 255], i);
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

function buildClouds(count) {
  const rand = seeded(42);
  const maps = cloudTextures();
  const group = new THREE.Group();
  const clouds = [];
  for (let i = 0; i < count; i += 1) {
    // most hang low in the monsoon ghats so the camera flies through mist
    const monsoon = i < count * 0.55;
    const z = monsoon ? -rand() * LEN * 0.32 : -rand() * LEN * 1.1;
    const b = biomeAt(z);
    const x = centerX(z) + (rand() - 0.5) * (monsoon ? 60 : 140);
    const y = b * FLOOR_RISE + (monsoon ? 5 + rand() * 12 : 30 + rand() * 30);
    const material = new THREE.SpriteMaterial({ map: maps[i % maps.length], transparent: true, depthWrite: false, fog: true });
    const sprite = new THREE.Sprite(material);
    const s = monsoon ? 16 + rand() * 26 : 26 + rand() * 40;
    sprite.scale.set(s, s * 0.5, 1);
    sprite.position.set(x, y, z);
    sprite.userData = { base: monsoon ? 0.9 : 0.7, drift: 0.3 + rand() * 0.6 };
    group.add(sprite);
    clouds.push(sprite);
  }
  return { group, clouds, maps };
}

function buildStars(count) {
  const rand = seeded(99);
  const positions = new Float32Array(count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i += 1) {
    v.set(rand() * 2 - 1, 0.03 + rand() * 0.97, rand() * 2 - 1).normalize().multiplyScalar(1100);
    positions.set([v.x, v.y, v.z], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: '#ffffff',
    size: 1.6,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  return new THREE.Points(geo, material);
}

function buildPin(color) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.9, 20, 14), mat);
  head.position.y = 3.2;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.62, 2.2, 20), mat);
  tip.rotation.x = Math.PI;
  tip.position.y = 1.9;
  const dotMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10), dotMat);
  dot.position.set(0, 3.25, 0.62);
  const beamMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 60, 8, 1, true), beamMat);
  beam.position.y = 33;
  const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 32), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.1;
  group.add(head, tip, dot, beam, ring);
  group.scale.setScalar(0.001);
  return { group, ring, ringMat, materials: [mat, dotMat, beamMat, ringMat] };
}

function buildPrayerFlags(curve) {
  const COLORS = ['#1e5bc6', '#f4f4f4', '#d62828', '#1f8a3b', '#f4c430'];
  const at = curve.getPointAt(FLAGS_AT);
  const tangent = curve.getTangentAt(FLAGS_AT);
  const group = new THREE.Group();
  group.position.copy(at);
  // local +X runs across the road, so each flag faces the oncoming camera
  group.rotation.y = Math.atan2(tangent.x, tangent.z);

  const HALF = 13;
  const TOP = 15;
  const SAG = 2.6;
  const yAt = (x) => TOP - SAG * (1 - (x / HALF) ** 2);

  // a little self-glow keeps the cloth colourful when it is backlit at dusk
  const materials = COLORS.map((c) => new THREE.MeshLambertMaterial({ color: c, emissive: new THREE.Color(c).multiplyScalar(0.35), side: THREE.DoubleSide }));
  const flagGeo = new THREE.PlaneGeometry(0.85, 1.05);
  flagGeo.translate(0, -0.55, 0); // hang from the string
  const flags = [];
  const N = 30;
  for (let i = 0; i < N; i += 1) {
    const x = -HALF + ((i + 0.5) / N) * HALF * 2;
    const flag = new THREE.Mesh(flagGeo, materials[i % COLORS.length]);
    flag.position.set(x, yAt(x), 0);
    group.add(flag);
    flags.push(flag);
  }

  const stringPts = [];
  for (let i = 0; i <= 24; i += 1) {
    const x = -HALF + (i / 24) * HALF * 2;
    stringPts.push(new THREE.Vector3(x, yAt(x), 0));
  }
  const stringMat = new THREE.LineBasicMaterial({ color: '#3a2f28' });
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(stringPts), stringMat));

  const poleMat = new THREE.MeshLambertMaterial({ color: '#5a4636' });
  [-HALF, HALF].forEach((x) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, TOP + 2, 6), poleMat);
    pole.position.set(x, (TOP + 2) / 2 - 1, 0);
    group.add(pole);
  });
  return { group, flags, materials: [...materials, stringMat, poleMat] };
}

// ---------- scene --------------------------------------------------------------
export function createJourneyScene(canvas, { onFrame } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const small = window.matchMedia('(max-width: 767px)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const octaves = small ? 3 : 4;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#ffffff', 0.004); // for sprites, trees and pins
  const camera = new THREE.PerspectiveCamera(small ? 60 : 50, 1, 0.1, 1600);

  const hemi = new THREE.HemisphereLight('#ffffff', '#444444', 1);
  const sunLight = new THREE.DirectionalLight('#ffffff', 1);
  scene.add(hemi, sunLight);

  const atmos = atmosphereUniforms();

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1200, 32, 16),
    new THREE.ShaderMaterial({
      vertexShader: skyVertex,
      fragmentShader: skyFragment,
      defines: { OCTAVES: octaves },
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTop: { value: new THREE.Color() },
        uHorizon: atmos.uFogColor,
        uSunColor: atmos.uSunColor,
        uSunDir: atmos.uSunDir,
        uCloud: { value: new THREE.Color() },
        uDisc: { value: 1 },
        uCover: { value: 0.5 },
        uTime: { value: 0 },
      },
    })
  );
  sky.renderOrder = -1;
  scene.add(sky);

  const stars = buildStars(small ? 1000 : 2200);
  scene.add(stars);

  const terrain = buildTerrain(small ? 180 : 300, small ? 300 : 460, atmos, octaves);
  scene.add(terrain);

  const route = buildRoute();
  const road = buildRoad(route, atmos, octaves);
  scene.add(road);

  const trees = buildTrees(small ? 0.4 : 1, atmos, renderer.capabilities.getMaxAnisotropy());
  scene.add(trees.mesh);

  const lakeCenter = route.curve.getPointAt(0.9).clone();
  lakeCenter.x += 24;
  const lakeMat = new THREE.ShaderMaterial({
    vertexShader: worldVertex,
    fragmentShader: lakeFragment,
    defines: { OCTAVES: 1 },
    uniforms: {
      ...atmos,
      uDeep: { value: C('#1293a6') },
      uTop: sky.material.uniforms.uTop,
      uCenter: { value: lakeCenter },
      uRadius: { value: new THREE.Vector2(19, 38) },
      uTime: { value: 0 },
    },
  });
  const lake = new THREE.Mesh(new THREE.PlaneGeometry(40, 80), lakeMat);
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(lakeCenter.x, floorAt(lakeCenter.x, lakeCenter.z) + 0.45, lakeCenter.z);
  scene.add(lake);

  const pins = WAYPOINTS.map((u, i) => {
    const pin = buildPin(i % 2 ? '#087a35' : '#f58220');
    // stand beside the road, alternating sides, so the camera flies past them
    const at = route.curve.getPointAt(u);
    const side = new THREE.Vector3().crossVectors(route.curve.getTangentAt(u), THREE.Object3D.DEFAULT_UP).normalize();
    at.addScaledVector(side, i % 2 ? -4.5 : 4.5);
    at.y = heightAt(at.x, at.z);
    pin.group.position.copy(at);
    pin.u = u;
    pin.grow = 0;
    scene.add(pin.group);
    return pin;
  });

  const flags = buildPrayerFlags(route.curve);
  scene.add(flags.group);

  const clouds = buildClouds(small ? 50 : 90);
  scene.add(clouds.group);

  // Phones render straight to the screen; larger screens get a soft bloom pass.
  let composer = null;
  let bloom = null;
  if (!small) {
    // multisampled target keeps edges (and the alpha-to-coverage foliage) smooth
    composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.35, 0.65, 0.92);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  // ---- state ----
  const sky$ = { top: new THREE.Color(), horizon: new THREE.Color(), sun: new THREE.Color(), cloud: new THREE.Color(), dir: new THREE.Vector3() };
  let target = 0; // scroll progress from ScrollTrigger
  let progress = 0; // damped
  let lastReported = -1;
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  let active = false;
  let raf = 0;
  let time = 0;
  let last = performance.now();

  const camPos = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const t0 = new THREE.Vector3();
  const t1 = new THREE.Vector3();

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    if (composer) {
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
    }
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const frame = (dt) => {
    time += dt;
    progress = reduceMotion ? target : progress + (target - progress) * Math.min(1, dt * 4.5);
    const u = routeAt(progress);

    // drone rides above the road; at the very end it cranes up to the stars
    const crane = smoothstep(0.93, 1, progress);
    const alt = 10 + Math.sin(progress * Math.PI * 3) * 1.6 + crane * 16; // above the canopy
    route.camCurve.getPointAt(u, camPos);
    route.camCurve.getPointAt(Math.min(1, u + 0.06), lookAt);
    camPos.y += alt;
    lookAt.y += alt * 0.62 + crane * 14;

    pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 3);
    pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 3);
    camPos.x += pointer.sx * 1.6;
    camPos.y += pointer.sy * 0.8;
    if (!reduceMotion) {
      // gentle hand-flown drift so the shot never feels locked off
      camPos.x += Math.sin(time * 0.37) * 0.3;
      camPos.y += Math.sin(time * 0.53 + 1.2) * 0.18;
    }
    camera.position.copy(camPos);
    camera.lookAt(lookAt);
    // bank into the bends
    route.camCurve.getTangentAt(u, t0);
    route.camCurve.getTangentAt(Math.min(1, u + 0.03), t1);
    camera.rotateZ((t1.x - t0.x) * -2.2 + (reduceMotion ? 0 : Math.sin(time * 0.29) * 0.008));

    // sky, light and haze follow the place on the map
    const s = sampleSky(biomeAt(camPos.z), sky$);
    atmos.uFogColor.value.copy(s.horizon);
    atmos.uFogDensity.value = s.fog;
    atmos.uFogHeight.value = biomeAt(camPos.z) * FLOOR_RISE + s.fogLift;
    atmos.uSunDir.value.copy(s.dir);
    atmos.uSunColor.value.copy(s.sun).multiplyScalar(s.sunI);

    const su = sky.material.uniforms;
    su.uTop.value.copy(s.top);
    su.uCloud.value.copy(s.cloud);
    su.uDisc.value = s.disc;
    su.uCover.value = s.cover;
    su.uTime.value = time;
    sky.position.copy(camera.position);
    stars.position.copy(camera.position);
    stars.material.opacity = s.stars;
    stars.visible = s.stars > 0.01;
    scene.fog.color.copy(s.horizon);
    scene.fog.density = s.fog * 1.4;

    const tu = terrain.material.uniforms;
    tu.uSkyAmb.value.copy(s.top).lerp(s.horizon, 0.5).multiplyScalar(s.amb);
    tu.uGroundAmb.value.copy(s.horizon).multiplyScalar(s.amb * 0.45);
    road.material.uniforms.uSkyAmb.value.copy(tu.uSkyAmb.value);
    trees.material.uniforms.uSkyAmb.value.copy(tu.uSkyAmb.value);
    road.material.uniforms.uTravel.value = Math.min(1, u + 0.07) * route.length;
    lakeMat.uniforms.uTime.value = time;

    hemi.color.copy(s.top).lerp(s.horizon, 0.5);
    hemi.groundColor.copy(s.horizon).multiplyScalar(0.35);
    hemi.intensity = 0.8 + s.amb * 2;
    sunLight.color.copy(s.sun);
    sunLight.intensity = s.sunI * 2.2;
    sunLight.position.copy(s.dir);

    pins.forEach((pin, i) => {
      const on = u > pin.u - 0.14 ? 1 : 0;
      pin.grow += (on - pin.grow) * Math.min(1, dt * 3);
      pin.group.scale.setScalar(Math.max(0.001, pin.grow));
      pin.group.rotation.y = time * 0.8 + i;
      const pulse = (time * 0.6 + i * 0.25) % 1;
      pin.ring.scale.setScalar(1 + pulse * 3);
      pin.ringMat.opacity = (1 - pulse) * 0.6;
    });

    flags.flags.forEach((flag, i) => {
      flag.rotation.x = reduceMotion ? 0.15 : 0.2 + Math.sin(time * 5 + i * 0.7) * 0.35;
    });

    clouds.clouds.forEach((c) => {
      if (!reduceMotion) c.position.x += c.userData.drift * dt;
      // fade as the camera passes through so sprites never pop
      const d = c.position.distanceTo(camera.position);
      c.material.opacity = c.userData.base * smoothstep(3, 16, d);
      c.material.color.copy(s.cloud);
    });

    if (bloom) bloom.strength = 0.3 + s.stars * 0.35;
    if (composer) composer.render();
    else renderer.render(scene, camera);

    if (onFrame && Math.abs(progress - lastReported) > 0.0005) {
      lastReported = progress;
      // report where the camera is on the map so the chapter copy matches the terrain
      onFrame(progress, biomeAt(camPos.z));
    }
  };

  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    frame(dt);
  };

  const start = () => {
    if (active) return;
    active = true;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    active = false;
    cancelAnimationFrame(raf);
  };

  // only spend GPU time while the section is on screen
  const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), {
    rootMargin: '100px 0px',
  });
  io.observe(canvas);
  frame(0);

  const onPointer = (e) => {
    if (reduceMotion || e.pointerType === 'touch') return;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  return {
    setProgress(p) {
      target = clamp01(p);
      if (!active) {
        progress = target;
        frame(0);
      }
    },
    dispose() {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      scene.traverse((obj) => {
        obj.geometry?.dispose();
        if (obj.material && !Array.isArray(obj.material)) obj.material.dispose();
      });
      [...flags.materials, ...pins.flatMap((p) => p.materials)].forEach((m) => m.dispose());
      trees.material.uniforms.uMap.value.dispose();
      clouds.maps.forEach((m) => m.dispose());
      bloom?.dispose();
      composer?.dispose();
      renderer.dispose();
    },
  };
}
