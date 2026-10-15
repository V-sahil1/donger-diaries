import * as THREE from 'three';

/*
 * Three.js topographic map for the loader.
 * A procedural terrain with two mountain massifs (top-left, bottom-right),
 * shaded like an engraved map: contour lines from real height, ink-hatched
 * shadow faces, snow on the peaks. A jeep drives a route laid on the terrain.
 */

// ---------- deterministic noise ------------------------------------------------
const hash = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const vnoise = (x, y) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
  const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const fbm = (x, y, octaves = 5) => {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i += 1) {
    sum += amp * vnoise(x * freq, y * freq);
    freq *= 2.03;
    amp *= 0.5;
  }
  return sum;
};
const ridged = (x, y, octaves = 6) => {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let weight = 1;
  for (let i = 0; i < octaves; i += 1) {
    let n = 1 - Math.abs(vnoise(x * freq, y * freq) * 2 - 1);
    n *= n * weight;
    weight = Math.min(1, n * 1.8);
    sum += n * amp;
    freq *= 2.1;
    amp *= 0.5;
  }
  return sum;
};
const seeded = (seed) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// ---------- shaders ----------------------------------------------------------
const terrainVertex = /* glsl */ `
  uniform float uRise;
  attribute float aMassif;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying float vMassif;
  void main() {
    vec3 p = position;
    p.y *= uRise;
    vPos = p;
    vNormal = normal;
    vMassif = aMassif;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

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
`;

const terrainFragment = /* glsl */ `
  uniform vec3 uLight;
  uniform float uSnow;
  uniform float uMaxH;
  uniform float uScale;
  uniform float uInterval;
  uniform float uReveal;
  uniform vec2 uLakeC;
  uniform float uLakeR;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying float vMassif;

${NOISE_GLSL}
  float fbm(vec2 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      s += a * snoise(p);
      p = p * 2.03 + vec2(17.1, 9.2);
      a *= 0.5;
    }
    return s;
  }
  float ridge(vec2 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      float n = 1.0 - abs(snoise(p));
      s += a * n * n;
      p = p * 2.1 + vec2(3.7, 1.3);
      a *= 0.5;
    }
    return s;
  }

  // Bump mapping from a scalar height using screen-space derivatives.
  vec3 perturbNormal(vec3 pos, vec3 n, float h) {
    vec3 dpdx = dFdx(pos);
    vec3 dpdy = dFdy(pos);
    float dhdx = dFdx(h);
    float dhdy = dFdy(h);
    vec3 r1 = cross(dpdy, n);
    vec3 r2 = cross(n, dpdx);
    float det = dot(dpdx, r1);
    vec3 grad = sign(det) * (dhdx * r1 + dhdy * r2);
    return normalize(abs(det) * n - grad);
  }

  float contour(float h, float interval, float width) {
    float c = h / interval;
    float f = abs(fract(c - 0.5) - 0.5) / max(fwidth(c), 1e-4);
    return 1.0 - clamp(f / width, 0.0, 1.0);
  }

  void main() {
    vec2 uv = vPos.xz / uScale;
    float m = smoothstep(0.15, 0.75, vMassif);
    vec3 n = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vPos);
    vec3 L = normalize(uLight);
    vec3 col = vec3(1.0);

    // Only shade the mountains; open paper skips all the texture work.
    if (m > 0.002) {
      float slope = 1.0 - n.y;
      float alt = clamp(vPos.y / uMaxH, 0.0, 1.0);
      float nBroad = fbm(uv * 2.4) * 0.5 + 0.5;
      float nFine = fbm(uv * 8.0) * 0.5 + 0.5;
      float crevice = ridge(uv * 3.6);

      // Rock: warm grey granite with soft cracks and faint strata.
      vec3 rock = mix(vec3(0.42, 0.39, 0.36), vec3(0.62, 0.58, 0.52), nBroad);
      rock = mix(rock, vec3(0.27, 0.25, 0.24), smoothstep(0.55, 0.9, crevice) * 0.4);
      float strata = sin(vPos.y / uScale * 26.0 + nBroad * 5.0) * 0.5 + 0.5;
      rock *= 0.94 + 0.08 * strata;
      rock *= 0.92 + 0.16 * nFine;

      // Scree on gentler mid slopes, alpine grass at the foot.
      vec3 scree = mix(vec3(0.64, 0.6, 0.54), vec3(0.74, 0.7, 0.64), nFine);
      vec3 grass = mix(vec3(0.38, 0.46, 0.27), vec3(0.22, 0.33, 0.2), nBroad);
      float screeMask = smoothstep(0.18, 0.42, alt) * (1.0 - smoothstep(0.3, 0.6, slope)) * 0.5;
      float grassMask = (1.0 - smoothstep(0.08, 0.32, alt + (nBroad - 0.5) * 0.18))
        * (1.0 - smoothstep(0.38, 0.7, slope));
      vec3 albedo = mix(rock, scree, screeMask);
      albedo = mix(albedo, grass, grassMask);

      // Snow settles on flatter ground above a soft, ragged snow line.
      float snowLine = uSnow * (0.88 + 0.28 * (nBroad - 0.5));
      float snow = smoothstep(snowLine * 0.97, snowLine * 1.12, vPos.y)
        * (1.0 - smoothstep(0.4, 0.78, slope + (nFine - 0.5) * 0.25));
      albedo = mix(albedo, vec3(0.96, 0.97, 1.0), snow);

      // Soft wrapped sunlight, cool sky fill, gentle shading in hollows.
      float diff = clamp((dot(n, L) + 0.3) / 1.3, 0.0, 1.0);
      diff = diff * diff * (3.0 - 2.0 * diff);
      vec3 sunCol = vec3(1.0, 0.93, 0.84) * 1.05;
      vec3 sky = mix(vec3(0.5, 0.47, 0.43), vec3(0.74, 0.81, 0.92), n.y * 0.5 + 0.5);
      float ao = mix(0.68, 1.0, smoothstep(0.0, 0.32, alt)) * (0.85 + 0.15 * (1.0 - crevice));
      vec3 lit = albedo * (sunCol * diff + sky * 0.55 * ao);
      lit = mix(lit, lit * vec3(0.88, 0.93, 1.06), snow * (1.0 - diff));
      vec3 H = normalize(L + V);
      lit += snow * pow(max(dot(n, H), 0.0), 32.0) * 0.15;

      // Faint edge line so the ranges still sit in the map illustration.
      float rim = 1.0 - smoothstep(0.03, 0.2, dot(n, V));
      lit = mix(lit, lit * 0.6, rim * 0.4);

      col = mix(vec3(1.0), clamp(lit, 0.0, 1.0), m);
    }

    // Lake bank: wet sand and pebbles at the waterline, a meadow behind.
    vec2 lq = (vPos.xz - uLakeC) / uLakeR;
    float ld = length(vec2(lq.x / 1.6, lq.y)) + snoise(lq * 2.2) * 0.06;
    float bank = smoothstep(0.8, 0.93, ld) * (1.0 - smoothstep(1.02, 1.24, ld));
    float meadow = smoothstep(1.0, 1.12, ld) * (1.0 - smoothstep(1.18, 1.38, ld));
    if (bank + meadow > 0.001) {
      float pebble = snoise(lq * 30.0) * 0.5 + 0.5;
      vec3 sand = mix(vec3(0.69, 0.63, 0.52), vec3(0.84, 0.79, 0.69), pebble);
      sand = mix(sand * 0.74, sand, smoothstep(0.88, 1.02, ld));
      vec3 meadowCol = mix(vec3(0.5, 0.6, 0.36), vec3(0.36, 0.49, 0.27), pebble);
      col = mix(col, meadowCol, meadow * 0.35);
      col = mix(col, sand, bank);
    }

    float minor = contour(vPos.y, uInterval, 1.0);
    float major = contour(vPos.y, uInterval * 5.0, 1.5);
    float lines = max(minor * 0.55, major * 0.9) * uReveal * (1.0 - m * 0.9) * (1.0 - bank);
    col = mix(col, vec3(0.72), lines);

    gl_FragColor = vec4(col, 1.0);
  }
`;

// ---------- water & sun -----------------------------------------------------
const waterVertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const waterFragment = /* glsl */ `
  uniform vec2 uCenter;
  uniform float uR;
  uniform float uTime;
  uniform vec3 uSunDir;
  varying vec3 vWorld;
  ${NOISE_GLSL}

  float waves(vec2 p, float t) {
    return snoise(p * 5.0 + vec2(t * 0.35, t * 0.12)) * 0.6
      + snoise(p * 11.0 + vec2(-t * 0.5, t * 0.3)) * 0.3
      + snoise(p * 23.0 + vec2(t * 0.8, -t * 0.6)) * 0.12;
  }

  void main() {
    vec2 q = (vWorld.xz - uCenter) / uR;
    float d = length(vec2(q.x / 1.6, q.y)) + snoise(q * 2.2) * 0.06;
    if (d > 0.98) discard;
    float t = uTime;

    // Turquoise shallows deepening to cold blue.
    float depth = smoothstep(0.95, 0.15, d);
    vec3 col = mix(vec3(0.45, 0.72, 0.69), vec3(0.06, 0.25, 0.34), pow(depth, 0.8));

    // Ripple normals from animated noise.
    float e = 0.015;
    float h0 = waves(q, t);
    float hx = waves(q + vec2(e, 0.0), t);
    float hz = waves(q + vec2(0.0, e), t);
    vec3 n = normalize(vec3(-(hx - h0) / e * 0.03, 1.0, -(hz - h0) / e * 0.03));
    vec3 V = normalize(cameraPosition - vWorld);

    // Sky reflection, stronger at grazing angles.
    float fres = pow(1.0 - max(dot(n, V), 0.0), 2.5);
    col = mix(col, vec3(0.86, 0.9, 0.95), clamp(fres * 0.7, 0.0, 0.7));

    // Light ripples and sun glints on the surface.
    col += vec3(0.03, 0.045, 0.045) * smoothstep(0.3, 0.9, h0) * (1.0 - depth * 0.6);
    vec3 L = normalize(uSunDir);
    float glint = pow(max(dot(reflect(-L, n), V), 0.0), 160.0);
    col += vec3(1.0, 0.88, 0.66) * glint * 1.6;

    // Foam lapping the shore.
    float band = smoothstep(0.8, 0.95, d);
    float foamN = snoise(q * 16.0 + vec2(t * 0.5, -t * 0.4)) * 0.5 + 0.5;
    float foam = band * smoothstep(0.5, 0.78, foamN + sin(d * 55.0 - t * 1.8) * 0.12);
    col = mix(col, vec3(0.96, 0.97, 0.96), foam * 0.75);

    float alpha = smoothstep(0.98, 0.93, d);
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), alpha);
  }
`;

const sunVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const sunFragment = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float d = length(p);
    const float R = 0.3;

    // Disc with limb darkening: white-hot centre to brand orange at the rim.
    float disc = 1.0 - smoothstep(R - 0.012, R, d);
    float limb = sqrt(max(0.0, 1.0 - (d * d) / (R * R)));
    vec3 core = mix(vec3(0.96, 0.47, 0.11), vec3(1.0, 0.82, 0.5), pow(limb, 0.6));
    core = mix(core, vec3(1.0, 0.97, 0.88), pow(limb, 4.0) * 0.55);
    core *= 0.97 + 0.03 * sin(uTime * 2.0 + d * 40.0);

    // Soft corona and slowly turning rays.
    float a = atan(p.y, p.x);
    float rays = 0.6 + 0.25 * sin(a * 9.0 + uTime * 0.25) + 0.15 * sin(a * 17.0 - uTime * 0.4);
    float out_ = max(d - R, 0.0);
    float halo = exp(-out_ * 5.5) * (1.0 - disc);
    float corona = exp(-out_ * 16.0) * (1.0 - disc);
    float alpha = disc + (halo * 0.32 * rays + corona * 0.5) * (1.0 - smoothstep(0.85, 1.0, d));
    vec3 glow = mix(vec3(0.96, 0.51, 0.13), vec3(1.0, 0.74, 0.38), corona);
    gl_FragColor = vec4(mix(glow, core, disc), clamp(alpha, 0.0, 1.0));
  }
`;

// ---------- layout -----------------------------------------------------------
// Screen anchors in NDC (-1..1) so the composition matches the viewport shape.
// `tl` / `br` are the foot of each range; the peaks rise above them on screen.
const LAYOUTS = {
  wide: {
    tl: [-0.66, 0.36],
    br: [0.8, -0.52],
    lake: [0.74, -0.86],
    route: [[0.04, -1.25], [0.16, -0.98], [0.3, -0.92], [0.42, -0.8], [0.5, -0.66], [0.56, -0.52], [0.62, -0.4]],
    trail: [[-0.52, 0.26], [-0.56, 0.14], [-0.66, 0.06], [-0.76, -0.02], [-0.86, -0.08]],
    size: 0.12,
  },
  tall: {
    tl: [-0.5, 0.56],
    br: [0.6, -0.68],
    lake: [0.62, -0.9],
    route: [[-0.4, -1.3], [-0.2, -1.05], [0.0, -0.98], [0.14, -0.88], [0.24, -0.78], [0.3, -0.64]],
    trail: [[-0.3, 0.46], [-0.4, 0.38], [-0.56, 0.32], [-0.72, 0.26], [-0.9, 0.2]],
    size: 0.2,
  },
};

// Each range is a row of sharp peaks: [dx, dz, height, radius] in units of r.
const RANGES = {
  tl: [
    [-1.25, 0.15, 0.5, 0.7],
    [-0.7, -0.1, 0.78, 0.8],
    [-0.15, 0.0, 1.0, 0.9],
    [0.35, -0.25, 0.86, 0.75],
    [0.85, 0.05, 0.62, 0.72],
    [1.3, 0.2, 0.42, 0.6],
    [0.1, 0.45, 0.4, 0.55],
  ],
  br: [
    [-0.75, 0.1, 0.55, 0.7],
    [-0.2, -0.1, 0.95, 0.85],
    [0.35, 0.05, 0.75, 0.72],
    [0.85, -0.2, 0.62, 0.7],
    [1.3, 0.1, 0.4, 0.6],
  ],
};

const CAM_POS = new THREE.Vector3(0, 6.2, 9.5);
const CAM_TARGET = new THREE.Vector3(0, 0, -0.5);

export function createTerrainScene(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    return null; // no WebGL — the loader still works without the map
  }
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0xffffff, 1);

  const width = () => canvas.clientWidth || window.innerWidth;
  const height = () => canvas.clientHeight || window.innerHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, width() / height(), 0.1, 100);
  camera.position.copy(CAM_POS);
  camera.lookAt(CAM_TARGET);
  camera.updateMatrixWorld(); // raycasting below needs the final camera transform
  renderer.setSize(width(), height(), false);

  const layout = width() / height() < 1 ? LAYOUTS.tall : LAYOUTS.wide;

  // Project screen anchors onto the ground plane.
  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const toGround = ([x, y]) => {
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const p = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, p);
    return p;
  };
  const viewWidth = toGround([-1, 0]).distanceTo(toGround([1, 0]));
  const r = viewWidth * layout.size;

  const massifs = [
    { c: toGround(layout.tl), amp: r * 1.25, seed: 3.7, peaks: RANGES.tl, r: r * 1.05, stretch: 1.45 },
    { c: toGround(layout.br), amp: r * 1.05, seed: 11.3, peaks: RANGES.br, r: r * 0.95, stretch: 1.45 },
  ];
  const lake = { c: toGround(layout.lake), r: r * 0.3 };

  const rangeHeight = (m, x, z) => {
    const lx = (x - m.c.x) / r;
    const lz = (z - m.c.z) / r;
    if (lx * lx + lz * lz > 6) return 0; // far from this range: skip the expensive noise
    // Domain warp so the cones read as weathered rock, not geometry.
    const wx = lx + (vnoise(lx * 2.1 + m.seed, lz * 2.1) - 0.5) * 0.35;
    const wz = lz + (vnoise(lx * 2.1, lz * 2.1 - m.seed) - 0.5) * 0.35;
    // Soft union of peaks (p-norm): smooth saddles, exactly zero away from the range.
    let pow6 = 0;
    let sum = 0;
    for (const [px, pz, ph, pr] of m.peaks) {
      const d = Math.hypot(wx - px, (wz - pz) * 1.25) / pr;
      const v = ph * Math.max(0, 1 - d) ** 1.45;
      pow6 += v ** 6;
      sum += v;
    }
    const top = pow6 ** (1 / 6);
    const base = top + 0.22 * (sum - top);
    if (base <= 0) return 0;
    const rock = ridged(lx * 2.4 + m.seed, lz * 2.4 - m.seed, 3);
    return m.amp * (base + 0.12 * rock * smoothstep(0.02, 0.25, base));
  };

  const sample = (x, z) => {
    let h = (fbm(x * 0.2 + 3.1, z * 0.2 + 7.4) - 0.5) * r * 0.5;
    let weight = 0;
    for (const m of massifs) {
      const mh = rangeHeight(m, x, z);
      h += mh;
      weight = Math.max(weight, smoothstep(m.amp * 0.03, m.amp * 0.14, mh));
    }
    const ld = Math.hypot((x - lake.c.x) / 1.6, z - lake.c.z) / lake.r;
    const lakeMask = smoothstep(1.25, 0.85, ld);
    h = h * (1 - lakeMask) + -r * 0.05 * lakeMask;
    weight *= 1 - lakeMask;
    return { h, weight };
  };
  const heightAt = (x, z) => sample(x, z).h;

  // ---------- terrain mesh ----------
  const geo = new THREE.PlaneGeometry(36, 28, 460, 360);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, -4);
  const pos = geo.attributes.position;
  const massifAttr = new Float32Array(pos.count);
  let maxH = 0;
  for (let i = 0; i < pos.count; i += 1) {
    const { h, weight } = sample(pos.getX(i), pos.getZ(i));
    pos.setY(i, h);
    massifAttr[i] = weight;
    maxH = Math.max(maxH, h);
  }
  geo.setAttribute('aMassif', new THREE.BufferAttribute(massifAttr, 1));
  geo.computeVertexNormals();

  const uniforms = {
    uRise: { value: 0 },
    uReveal: { value: 0 },
    uLight: { value: new THREE.Vector3(-0.8, 0.55, 0.4) },
    uSnow: { value: maxH * 0.68 },
    uInterval: { value: r * 0.06 },
    uMaxH: { value: maxH },
    uScale: { value: r },
    uLakeC: { value: new THREE.Vector2(lake.c.x, lake.c.z) },
    uLakeR: { value: lake.r },
  };
  const terrain = new THREE.Mesh(
    geo,
    new THREE.ShaderMaterial({ uniforms, vertexShader: terrainVertex, fragmentShader: terrainFragment })
  );
  scene.add(terrain);

  // Things that sit on the terrain fade/scale in once it has risen.
  const props = new THREE.Group();
  scene.add(props);
  scene.add(new THREE.HemisphereLight(0xf2efe6, 0x5c5244, 0.7));
  const sunLight = new THREE.DirectionalLight(0xfff0dc, 1.7);
  sunLight.position.copy(uniforms.uLight.value).multiplyScalar(10);
  scene.add(sunLight);

  // ---------- lake ----------
  // Sun direction is set once the sun has been placed (below).
  const waterUniforms = {
    uCenter: { value: new THREE.Vector2(lake.c.x, lake.c.z) },
    uR: { value: lake.r },
    uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(-0.5, 0.4, -0.8) },
  };
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(lake.r * 1.6 * 2.2, lake.r * 2.2, 1, 1),
    new THREE.ShaderMaterial({
      uniforms: waterUniforms,
      vertexShader: waterVertex,
      fragmentShader: waterFragment,
      transparent: true,
      depthWrite: false,
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(lake.c.x, -r * 0.045, lake.c.z);
  props.add(water);

  // ---------- pines ----------
  const rand = seeded(42);
  const treeGeo = new THREE.ConeGeometry(r * 0.038, r * 0.09, 7);
  treeGeo.translate(0, r * 0.06, 0);
  const treeTopGeo = new THREE.ConeGeometry(r * 0.027, r * 0.075, 7);
  treeTopGeo.translate(0, r * 0.115, 0);
  const trunkGeo = new THREE.CylinderGeometry(r * 0.006, r * 0.008, r * 0.03, 5);
  trunkGeo.translate(0, r * 0.015, 0);
  const treeSpots = [];
  for (const m of massifs) {
    let tries = 0;
    while (treeSpots.length < (m === massifs[0] ? 60 : 120) && tries < 4000) {
      tries += 1;
      const a = rand() * Math.PI * 2;
      const d = (0.55 + rand() * 0.7) * m.r;
      const x = m.c.x + Math.cos(a) * d * m.stretch;
      const z = m.c.z + Math.sin(a) * d;
      const { h, weight } = sample(x, z);
      if (weight > 0.08 && weight < 0.5 && h < maxH * 0.35) treeSpots.push([x, h, z, 0.7 + rand() * 0.6]);
    }
  }
  const foliage = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const trees = new THREE.InstancedMesh(treeGeo, foliage, treeSpots.length);
  const treeTops = new THREE.InstancedMesh(treeTopGeo, foliage, treeSpots.length);
  const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshLambertMaterial({ color: 0x4a3626 }), treeSpots.length);
  const dummy = new THREE.Object3D();
  const leaf = new THREE.Color();
  treeSpots.forEach(([x, h, z, s], i) => {
    dummy.position.set(x, h, z);
    dummy.rotation.y = rand() * Math.PI;
    dummy.scale.set(s, s * (0.85 + rand() * 0.35), s);
    dummy.updateMatrix();
    trees.setMatrixAt(i, dummy.matrix);
    treeTops.setMatrixAt(i, dummy.matrix);
    trunks.setMatrixAt(i, dummy.matrix);
    leaf.setHSL(0.3 + rand() * 0.06, 0.35 + rand() * 0.15, 0.14 + rand() * 0.08);
    trees.setColorAt(i, leaf);
    treeTops.setColorAt(i, leaf.offsetHSL(0, 0, 0.03));
  });
  props.add(trees, treeTops, trunks);

  // ---------- sun behind the top-left massif ----------
  let peak = new THREE.Vector3();
  let peakH = -Infinity;
  const m0 = massifs[0];
  for (let i = 0; i < 900; i += 1) {
    const x = m0.c.x + (rand() - 0.5) * m0.r * 2 * m0.stretch;
    const z = m0.c.z + (rand() - 0.5) * m0.r * 2;
    const h = heightAt(x, z);
    if (h > peakH) {
      peakH = h;
      peak = new THREE.Vector3(x, h, z);
    }
  }
  const sunUniforms = { uTime: { value: 0 } };
  const sun = new THREE.Mesh(
    new THREE.PlaneGeometry(r * 2.4, r * 2.4),
    new THREE.ShaderMaterial({
      uniforms: sunUniforms,
      vertexShader: sunVertex,
      fragmentShader: sunFragment,
      transparent: true,
      depthWrite: false,
    })
  );
  sun.position.set(peak.x + r * 0.6, peak.y * 0.72, peak.z - r * 0.9);
  scene.add(sun);
  waterUniforms.uSunDir.value.copy(sun.position).sub(new THREE.Vector3(lake.c.x, 0, lake.c.z)).normalize();

  // ---------- routes laid on the terrain ----------
  const drape = (anchors, lift) => {
    const rough = new THREE.CatmullRomCurve3(anchors.map((a) => toGround(a)));
    const raw = rough.getSpacedPoints(260).map((p) => new THREE.Vector3(p.x, heightAt(p.x, p.z) + lift, p.z));
    const pts = raw.map((p, i) => {
      let sum = 0;
      let count = 0;
      for (let k = Math.max(0, i - 8); k <= Math.min(raw.length - 1, i + 8); k += 1) {
        sum += raw[k].y;
        count += 1;
      }
      return new THREE.Vector3(p.x, Math.max(sum / count, p.y - lift * 0.5), p.z);
    });
    return new THREE.CatmullRomCurve3(pts);
  };
  const orange = new THREE.MeshBasicMaterial({ color: 0xf58220 });

  const route = drape(layout.route, r * 0.03);
  const ROUTE_SEGS = 400;
  const RADIAL = 8;
  const routeTube = new THREE.Mesh(new THREE.TubeGeometry(route, ROUTE_SEGS, r * 0.022, RADIAL), orange);
  routeTube.geometry.setDrawRange(0, 0);
  props.add(routeTube);
  const ghost = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(route.getSpacedPoints(400)),
    new THREE.LineDashedMaterial({ color: 0xf58220, dashSize: r * 0.05, gapSize: r * 0.06, transparent: true, opacity: 0.55 })
  );
  ghost.computeLineDistances();
  props.add(ghost);

  const trail = drape(layout.trail, r * 0.03);
  const trailTube = new THREE.Mesh(new THREE.TubeGeometry(trail, 200, r * 0.018, RADIAL), orange);
  trailTube.geometry.setDrawRange(0, 0);
  props.add(trailTube);

  const tracker = new THREE.Group();
  tracker.add(new THREE.Mesh(new THREE.SphereGeometry(r * 0.045, 20, 16), orange));
  const ping = new THREE.Mesh(
    new THREE.SphereGeometry(r * 0.045, 20, 16),
    new THREE.MeshBasicMaterial({ color: 0xf58220, transparent: true, opacity: 0.4, depthWrite: false })
  );
  tracker.add(ping);
  props.add(tracker);

  // ---------- jeep ----------
  const ink = new THREE.MeshLambertMaterial({ color: 0x2b2d2c });
  const glass = new THREE.MeshPhongMaterial({ color: 0xbfd3db, specular: 0xffffff, shininess: 80 });
  const jeep = new THREE.Group();
  const box = (w, h, d, mat, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    jeep.add(mesh);
    return mesh;
  };
  box(0.36, 0.13, 0.62, ink, 0, 0.16, 0); // body (length along z)
  box(0.34, 0.14, 0.34, ink, 0, 0.29, -0.08); // cabin
  box(0.35, 0.08, 0.13, glass, 0, 0.3, 0.03); // windscreen band
  box(0.352, 0.07, 0.24, glass, 0, 0.3, -0.12); // side windows
  box(0.3, 0.02, 0.36, ink, 0, 0.39, -0.08); // roof rack
  box(0.06, 0.04, 0.02, orange, 0.12, 0.17, 0.315); // headlights
  box(0.06, 0.04, 0.02, orange, -0.12, 0.17, 0.315);
  const spare = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16), ink);
  spare.rotation.x = Math.PI / 2;
  spare.position.set(0, 0.2, -0.34);
  jeep.add(spare);
  const wheels = [];
  const wheelGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.07, 18);
  wheelGeo.rotateZ(Math.PI / 2);
  const hubGeo = new THREE.BoxGeometry(0.075, 0.12, 0.03);
  [[-0.19, 0.2], [0.19, 0.2], [-0.19, -0.2], [0.19, -0.2]].forEach(([x, z]) => {
    const wheel = new THREE.Group();
    wheel.add(new THREE.Mesh(wheelGeo, ink));
    wheel.add(new THREE.Mesh(hubGeo, glass));
    wheel.position.set(x, 0.09, z);
    jeep.add(wheel);
    wheels.push(wheel);
  });
  jeep.scale.setScalar(r * 0.42);
  props.add(jeep);

  // ---------- markers (projected to HTML by the component) ----------
  const markers = {
    trailPins: [0.42, 0.88].map((t) => ({ t, pos: trail.getPointAt(t) })),
    routePins: [0.16, 0.4, 0.62, 0.82].map((t) => ({ t, pos: route.getPointAt(t) })),
    destination: route.getPointAt(1),
  };

  // ---------- animation state (tweened by GSAP in the component) ----------
  const state = { rise: 0, reveal: 0, dolly: 1.35, trail: 0, props: 0, push: 0 };
  props.scale.set(1, 0.001, 1);

  const project = (v) => {
    const p = v.clone();
    p.y *= state.rise;
    p.project(camera);
    return { x: ((p.x + 1) / 2) * width(), y: ((1 - p.y) / 2) * height(), visible: p.z < 1 };
  };

  const resize = () => {
    renderer.setSize(width(), height(), false);
    camera.aspect = width() / height();
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);

  const tmp = new THREE.Vector3();
  const heading = new THREE.Object3D();
  let lastTime = 0;
  const update = (progress, time, motion = true) => {
    uniforms.uRise.value = state.rise;
    uniforms.uReveal.value = state.reveal;
    props.scale.y = Math.max(0.001, state.rise);
    props.visible = state.props > 0.01;
    ghost.material.opacity = 0.55 * state.props;

    // Camera: intro dolly, gentle drift, exit push.
    const drift = motion ? Math.sin(time * 0.25) * 0.35 : 0;
    camera.position.set(
      CAM_POS.x * state.dolly + drift,
      CAM_POS.y * state.dolly - state.push * 6,
      CAM_POS.z * state.dolly - state.push * 3
    );
    camera.lookAt(CAM_TARGET.x + drift * 0.4, 0, CAM_TARGET.z - state.push * 2);

    // Route fills in behind the jeep.
    const p = Math.min(progress, 0.999);
    routeTube.geometry.setDrawRange(0, Math.floor(ROUTE_SEGS * p) * RADIAL * 6);
    const at = route.getPointAt(p);
    jeep.position.copy(at);
    tmp.copy(route.getPointAt(Math.min(p + 0.025, 1)));
    heading.position.copy(at);
    heading.lookAt(tmp.x, at.y + (tmp.y - at.y) * 0.6, tmp.z);
    const dt = Math.min(0.1, Math.max(0, time - lastTime));
    lastTime = time;
    jeep.quaternion.slerp(heading.quaternion, 1 - Math.exp(-dt * 6));
    jeep.position.y += Math.sin(time * 9) * r * 0.0012;
    wheels.forEach((w) => {
      w.rotation.x = time * 14;
    });

    trailTube.geometry.setDrawRange(0, Math.floor(200 * state.trail) * RADIAL * 6);
    tracker.visible = state.trail > 0.99;
    const tt = ((time * 0.3) % 1 + 1) % 1;
    tracker.position.copy(trail.getPointAt(tt));
    const pulse = (time * 0.9) % 1;
    ping.scale.setScalar(1 + pulse * 2.4);
    ping.material.opacity = 0.45 * (1 - pulse);

    sun.quaternion.copy(camera.quaternion);
    sun.scale.setScalar(1 + Math.sin(time * 1.3) * 0.015);
    sunUniforms.uTime.value = time;
    waterUniforms.uTime.value = time;
    renderer.render(scene, camera);
  };

  const dispose = () => {
    window.removeEventListener('resize', resize);
    scene.traverse((obj) => {
      obj.geometry?.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((mat) => mat?.dispose());
    });
    renderer.dispose();
  };

  return { state, update, project, markers, dispose };
}
