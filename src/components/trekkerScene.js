import * as THREE from 'three';

/*
 * Three.js trekker for the scroll trail.
 * A small articulated hiker (backpack, bedroll, hat, trekking pole) whose
 * walk cycle is driven by scroll distance: scroll faster and he strides
 * faster, stop and he settles into an idle breathing pose, scroll up and he
 * turns around.
 */

const COLORS = {
  jacket: '#f58220',
  pack: '#087a35',
  packDark: '#05582a',
  pants: '#2f3b45',
  skin: '#d99a6c',
  boot: '#5a3a22',
  hat: '#c9b48a',
  pole: '#9aa3ab',
  bedroll: '#7a5230',
};

const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, flatShading: true, ...opts });

const capsule = (radius, length, material) => {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 4, 10), material);
  mesh.position.y = -length / 2; // hang from the joint above
  return mesh;
};

/** A joint: a group at `pos` with an optional limb hanging below it. */
const joint = (parent, pos, limb) => {
  const g = new THREE.Group();
  g.position.set(...pos);
  if (limb) g.add(limb);
  parent.add(g);
  return g;
};

function buildTrekker() {
  const m = {
    jacket: mat(COLORS.jacket),
    pack: mat(COLORS.pack),
    packDark: mat(COLORS.packDark),
    pants: mat(COLORS.pants),
    skin: mat(COLORS.skin),
    boot: mat(COLORS.boot),
    hat: mat(COLORS.hat),
    pole: mat(COLORS.pole, { metalness: 0.6, roughness: 0.35 }),
    bedroll: mat(COLORS.bedroll),
  };

  // Chunky, slightly stylised proportions so he reads clearly at ~70px.
  const THIGH = 0.34;
  const SHIN = 0.32;
  const HIP_Y = THIGH + SHIN + 0.18;

  const root = new THREE.Group(); // turns to face the walking direction
  const body = joint(root, [0, HIP_Y, 0]); // bobs with each step

  // ---- legs ----
  const legs = [-1, 1].map((side) => {
    const hip = joint(body, [0, 0, side * 0.13], capsule(0.105, THIGH, m.pants));
    const knee = joint(hip, [0, -THIGH, 0], capsule(0.09, SHIN, m.pants));
    const ankle = joint(knee, [0, -SHIN - 0.06, 0]);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.17), m.boot);
    boot.position.set(0.06, -0.05, 0);
    ankle.add(boot);
    return { hip, knee, ankle };
  });

  // ---- torso ----
  const torso = joint(body, [0, 0.02, 0]);
  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.28, 4, 14), m.jacket);
  chest.position.y = 0.32;
  chest.scale.set(1, 1, 1.12);
  torso.add(chest);

  // backpack + bedroll sit behind (walking direction is +X)
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.52, 0.44), m.pack);
  pack.position.set(-0.32, 0.36, 0);
  torso.add(pack);
  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.32), m.packDark);
  pocket.position.set(-0.49, 0.28, 0);
  torso.add(pocket);
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 12), m.bedroll);
  roll.rotation.x = Math.PI / 2;
  roll.position.set(-0.3, 0.7, 0);
  torso.add(roll);

  // head + wide-brim hat
  const neck = joint(torso, [0.03, 0.66, 0]);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 14), m.skin);
  head.position.y = 0.14;
  neck.add(head);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.03, 18), m.hat);
  brim.position.y = 0.25;
  neck.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.13, 16), m.hat);
  crown.position.y = 0.32;
  neck.add(crown);

  // ---- arms ----
  const UPPER = 0.22;
  const FORE = 0.2;
  const arms = [-1, 1].map((side) => {
    const shoulder = joint(torso, [0, 0.54, side * 0.29], capsule(0.08, UPPER, m.jacket));
    const elbow = joint(shoulder, [0, -UPPER, 0], capsule(0.07, FORE, m.jacket));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), m.skin);
    hand.position.y = -FORE - 0.06;
    elbow.add(hand);
    return { shoulder, elbow, hand };
  });

  // trekking pole in the near (camera-side) hand
  const grip = joint(arms[1].elbow, [0, -FORE - 0.06, 0]);
  const POLE = 0.95;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, POLE, 6), m.pole);
  pole.position.y = -POLE / 2 + 0.1;
  grip.add(pole);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.14, 8), m.boot);
  handle.position.y = 0.05;
  grip.add(handle);

  // dark inverted-hull outline so the figure pops on photos and plain headers alike
  const outlineMat = new THREE.MeshBasicMaterial({ color: '#1c2620', side: THREE.BackSide });
  const solids = [];
  root.traverse((obj) => obj.isMesh && solids.push(obj));
  solids.forEach((mesh) => {
    const hull = new THREE.Mesh(mesh.geometry, outlineMat);
    hull.position.copy(mesh.position);
    hull.rotation.copy(mesh.rotation);
    hull.scale.copy(mesh.scale).multiplyScalar(mesh === pole ? 1.6 : 1.1);
    mesh.parent.add(hull);
  });
  m.outline = outlineMat;

  return { root, body, torso, neck, legs, arms, grip, hipY: HIP_Y, materials: Object.values(m) };
}

export function createTrekkerScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  // three-quarter view: shows his width and the backpack, not just a thin profile
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(2.2, 1.55, 3.3);
  camera.lookAt(0, 0.9, 0);

  scene.add(new THREE.HemisphereLight('#fff6e8', '#4a5a3a', 1.6));
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.position.set(2, 4, 3);
  scene.add(sun);

  const t = buildTrekker();
  scene.add(t.root);

  // soft contact shadow
  const shadowMat = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.22, depthWrite: false });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1.3, 0.6, 1);
  shadow.position.y = 0.005;
  scene.add(shadow);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastY = window.scrollY;
  let phase = 0;
  let speed = 0; // radians of walk cycle per frame
  let stride = 0; // 0 = idle pose, 1 = full stride
  let heading = 0;
  let targetHeading = 0;
  let time = 0;
  let raf = 0;

  const pose = () => {
    const s = stride;
    const sin = Math.sin(phase);
    const cos = Math.cos(phase);

    t.legs.forEach((leg, i) => {
      const p = i === 0 ? phase : phase + Math.PI;
      const swing = Math.sin(p) * 0.55 * s;
      const bend = -(0.06 + 0.85 * Math.max(0, Math.cos(p))) * s - 0.04;
      leg.hip.rotation.z = swing;
      leg.knee.rotation.z = bend;
      leg.ankle.rotation.z = -(swing + bend) * 0.85;
    });

    t.arms.forEach((arm, i) => {
      const p = i === 0 ? phase + Math.PI : phase;
      arm.shoulder.rotation.z = Math.sin(p) * 0.45 * s + (i === 1 ? 0.25 : 0.05);
      arm.elbow.rotation.z = 0.35 + Math.max(0, Math.sin(p)) * 0.35 * s;
    });
    // keep the pole pointing at the ground ahead, planting on each stride
    const near = t.arms[1];
    t.grip.rotation.z = -(near.shoulder.rotation.z + near.elbow.rotation.z) + 0.15 * s;

    const breathe = Math.sin(time * 2.2) * 0.008;
    t.body.position.y = t.hipY - Math.abs(cos) * 0.035 * s + breathe;
    t.torso.rotation.z = -0.12 * s - 0.03 + sin * 0.02 * s; // lean into the climb
    t.torso.rotation.x = Math.sin(phase) * 0.04 * s;
    t.neck.rotation.z = 0.1 * s;

    shadow.scale.set(1.3 + Math.abs(sin) * 0.15 * s, 0.6, 1);
  };

  const tick = () => {
    raf = requestAnimationFrame(tick);
    time += 1 / 60;

    const y = window.scrollY;
    const dy = y - lastY;
    lastY = y;
    if (dy > 0.5) targetHeading = 0;
    else if (dy < -0.5) targetHeading = Math.PI;

    const targetSpeed = reduceMotion ? 0 : Math.min(Math.abs(dy) * 0.012, 0.32);
    speed += (targetSpeed - speed) * 0.12;
    stride += ((speed > 0.015 ? 1 : 0) - stride) * 0.08;
    phase += speed;
    heading += (targetHeading - heading) * 0.14;
    t.root.rotation.y = heading;

    pose();
    renderer.render(scene, camera);
  };
  tick();

  window.addEventListener('resize', resize);

  const dispose = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    scene.traverse((obj) => obj.geometry?.dispose());
    t.materials.forEach((m) => m.dispose());
    shadowMat.dispose();
    renderer.dispose();
  };

  return { dispose };
}
