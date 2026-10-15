import { useLayoutEffect, useRef } from 'react';
import { featuredTrips, heroImage } from '../data/content.js';
import { gsap, prefersReducedMotion } from '../lib/gsap.js';
import Logo from './Logo.jsx';

const MIN_DURATION = 4200; // ms — long enough to flip through every destination
const MAX_DURATION = 9000; // never hold visitors hostage to a slow image

const DESTINATIONS = [
  { name: 'Manali → Leh', region: 'Himachal · Ladakh' },
  { name: 'Kalsubai Peak', region: 'Sahyadri · Maharashtra' },
  { name: 'Ratangad Fort', region: 'Bhandardara · Maharashtra' },
  { name: 'Spiti Valley', region: 'Himachal Pradesh' },
  { name: 'McLeod Ganj', region: 'Dharamshala · Himachal' },
  { name: 'Igatpuri', region: 'Nashik · Maharashtra' },
];

const PRELOAD = [heroImage, ...featuredTrips.map((t) => t.image)];

// Topographic contour rings, generated once and deterministic.
const contour = (cx, cy, r, seed) => {
  let d = '';
  for (let i = 0; i <= 72; i += 1) {
    const t = (i / 72) * Math.PI * 2;
    const k =
      r *
      (1 +
        0.14 * Math.sin(3 * t + seed) +
        0.07 * Math.sin(5 * t + seed * 1.7) +
        0.04 * Math.sin(9 * t + seed * 0.3));
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(t) * k * 1.25).toFixed(1)} ${(cy + Math.sin(t) * k * 0.8).toFixed(1)}`;
  }
  return `${d}Z`;
};
const CONTOURS = [
  [1300, 100, 1.1],
  [130, 730, 2.3],
  [1400, 780, 0.7],
  [40, 40, 3.1],
].flatMap(([cx, cy, s]) => Array.from({ length: 12 }, (_, i) => contour(cx, cy, 40 + i * 38, s + i * 0.18)));

const pine = (x, y, s = 1) =>
  `M${x} ${y - 28 * s} L${x + 9 * s} ${y - 12 * s} L${x + 5 * s} ${y - 12 * s} L${x + 12 * s} ${y} L${x - 12 * s} ${y} L${x - 5 * s} ${y - 12 * s} L${x - 9 * s} ${y - 12 * s}Z`;

function Pin({ x, y, className = 'pl-pin', color = '#087A35', scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className={className}>
        <path d="M0 0 C -6 -9, -10 -13, -10 -19 A10 10 0 1 1 10 -19 C 10 -13, 6 -9, 0 0Z" fill={color} />
        <circle cy="-19" r="4" fill="#fff" />
      </g>
    </g>
  );
}

const TL_TRAIL = 'M340 188 C 336 210, 312 214, 312 236 S 290 268, 277 272 S 236 290, 228 305 S 210 330, 196 340';
const BR_ROUTE =
  'M20 300 C 60 280, 70 250, 100 240 S 170 240, 200 215 S 270 200, 310 185 S 350 160, 360 130 S 400 100, 440 80';
const BR_PINS = [
  [100, 240],
  [200, 215],
  [310, 185],
  [360, 130],
];

/**
 * Topographic-map loader shown on every load/refresh: contour lines draw in,
 * a jeep drives the route as assets load, map pins drop as it passes, and the
 * destination label flips through favourite trips before the site fades in.
 */
export default function Preloader({ onReveal, onDone }) {
  const root = useRef(null);
  const skipped = useRef(false);
  const callbacks = useRef({ onReveal, onDone });
  callbacks.current = { onReveal, onDone };

  useLayoutEffect(() => {
    const el = root.current;
    const q = (sel) => el.querySelector(sel);
    const reduce = prefersReducedMotion();
    const minDuration = reduce ? 600 : MIN_DURATION;
    const html = document.documentElement;
    html.classList.add('is-loading');

    let loaded = 0;
    const total = PRELOAD.length + 1;
    const bump = () => {
      loaded = Math.min(total, loaded + 1);
    };
    PRELOAD.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = bump;
      img.src = src;
    });
    (document.fonts?.ready ?? Promise.resolve()).then(bump);
    const failSafe = setTimeout(() => {
      loaded = total;
    }, MAX_DURATION);

    // Where along the route each pin sits (0–1), so it drops as the jeep passes.
    const route = q('.pl-route-ghost');
    const routeLength = route.getTotalLength();
    const pinAt = BR_PINS.map(([px, py]) => {
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i <= 200; i += 1) {
        const pt = route.getPointAtLength((i / 200) * routeLength);
        const dist = (pt.x - px) ** 2 + (pt.y - py) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = i / 200;
        }
      }
      return best;
    });
    const pins = gsap.utils.toArray(el.querySelectorAll('.pl-corner--br .pl-pin'));
    const dropped = pins.map(() => false);

    let progressTl;
    const ctx = gsap.context(() => {
      gsap.set(pins, { scale: 0, transformOrigin: '50% 100%' });

      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .fromTo('.pl-contour', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.4, stagger: 0.02, ease: 'power2.inOut' }, 0)
        .from('.pl-corner--tl', { x: -40, y: -30, opacity: 0, duration: 1 }, 0.2)
        .from('.pl-corner--br', { x: 40, y: 30, opacity: 0, duration: 1 }, 0.3)
        .fromTo('.pl-tl-trail', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, ease: 'power1.inOut' }, 0.7)
        .from('.pl-corner--tl .pl-pin', { scale: 0, y: -16, transformOrigin: '50% 100%', stagger: 0.25, duration: 0.6, ease: 'back.out(3)' }, 1.3)
        .fromTo('.pl-ring', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 0.2)
        .from('.pl-emblem-logo', { scale: 0.6, opacity: 0, duration: 0.8, ease: 'back.out(1.8)' }, 0.55)
        .from('.pl-char', { yPercent: 110, opacity: 0, stagger: 0.04, duration: 0.7 }, 0.8)
        .from('.pl-tagline', { y: 12, opacity: 0, duration: 0.7 }, 1.35)
        .from('.pl-hud, .pl-skip, .pl-compass, .pl-bubble', { opacity: 0, y: 10, stagger: 0.08, duration: 0.6 }, 1.2);

      // Everything that advances with real loading progress.
      progressTl = gsap
        .timeline({ paused: true, defaults: { ease: 'none', duration: 1 } })
        .to(
          '.pl-jeep',
          {
            motionPath: { path: route, align: route, alignOrigin: [0.5, 1], autoRotate: true },
          },
          0
        )
        .fromTo('.pl-route-progress', { strokeDashoffset: 1 }, { strokeDashoffset: 0 }, 0)
        .fromTo('.pl-bar-fill', { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left center' }, 0);

      if (!reduce) {
        gsap.to('.pl-jeep-wheel', { rotation: 360, transformOrigin: '50% 50%', duration: 0.6, ease: 'none', repeat: -1 });
        gsap.to('.pl-jeep-body', { y: -0.8, duration: 0.18, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        gsap.to('.pl-dest', { y: -6, duration: 0.7, ease: 'sine.inOut', yoyo: true, repeat: -1, transformOrigin: '50% 100%' });
        gsap.to('.pl-tracker', {
          motionPath: { path: q('.pl-tl-trail'), align: q('.pl-tl-trail'), alignOrigin: [0.5, 0.5] },
          duration: 3.2,
          ease: 'sine.inOut',
          repeat: -1,
        });
        gsap.fromTo('.pl-tracker-ping', { scale: 0.6, opacity: 0.7 }, { scale: 2.6, opacity: 0, transformOrigin: '50% 50%', duration: 1.2, repeat: -1, ease: 'power1.out' });
        gsap.to('.pl-compass', { rotation: 8, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        gsap.to('.pl-sun', { scale: 1.08, transformOrigin: '50% 50%', duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      }
    }, el);

    // Destination flip: name + region slide out/in whenever the index changes.
    const flipTargets = [q('.pl-dest-name'), q('.pl-dest-region'), q('.pl-bubble-name')];
    let destIndex = -1;
    const showDestination = (index) => {
      const d = DESTINATIONS[index];
      const texts = [d.name, d.region, d.name];
      ctx.add(() => {
        flipTargets.forEach((node, i) => {
          if (destIndex < 0) {
            node.textContent = texts[i];
            return;
          }
          gsap
            .timeline()
            .to(node, { yPercent: -100, opacity: 0, duration: 0.18, ease: 'power2.in' })
            .add(() => {
              node.textContent = texts[i];
            })
            .fromTo(node, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.3, ease: 'power3.out' });
        });
      });
      destIndex = index;
    };
    showDestination(0);

    const percent = q('.pl-percent');
    const start = performance.now();
    const shown = { p: 0 };

    const finish = () => {
      ctx.add(() => {
        gsap
          .timeline({
            onComplete: () => {
              html.classList.remove('is-loading');
              callbacks.current.onDone?.();
            },
          })
          .to('.pl-center', { scale: 0.94, opacity: 0, duration: 0.5, ease: 'power2.in' }, '+=0.45')
          .to('.pl-corner--tl', { x: -80, y: -60, opacity: 0, duration: 0.6, ease: 'power2.in' }, '<')
          .to('.pl-corner--br', { x: 80, y: 60, opacity: 0, duration: 0.6, ease: 'power2.in' }, '<')
          .to('.pl-hud, .pl-skip, .pl-compass, .pl-contours', { opacity: 0, duration: 0.45 }, '<')
          .add(() => callbacks.current.onReveal?.())
          .to(el, { opacity: 0, duration: 0.7, ease: 'power2.out' });
      });
    };

    const tick = () => {
      const timeFraction = Math.min(1, (performance.now() - start) / minDuration);
      const target = skipped.current ? 1 : Math.min(loaded / total, timeFraction);
      shown.p += (target - shown.p) * (skipped.current ? 0.25 : 0.07);
      if (target >= 1 && shown.p > 0.995) shown.p = 1;

      progressTl.progress(shown.p);
      percent.textContent = `${Math.round(shown.p * 100)}%`;

      const nextIndex = Math.min(DESTINATIONS.length - 1, Math.floor(shown.p * DESTINATIONS.length));
      if (nextIndex !== destIndex && !skipped.current) showDestination(nextIndex);

      pins.forEach((pin, i) => {
        if (!dropped[i] && shown.p >= pinAt[i]) {
          dropped[i] = true;
          gsap.to(pin, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
        }
      });

      if (shown.p === 1) {
        gsap.ticker.remove(tick);
        finish();
      }
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      clearTimeout(failSafe);
      ctx.revert();
      html.classList.remove('is-loading');
    };
  }, []);

  return (
    <div ref={root} className="preloader" role="status" aria-live="polite" aria-label="Loading Dongar Diaries">
      {/* Topographic paper */}
      <svg className="pl-contours" viewBox="0 0 1440 810" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {CONTOURS.map((d, i) => (
          <path key={i} className="pl-contour" d={d} pathLength="1" />
        ))}
      </svg>
      <div className="pl-paper-fade" aria-hidden="true" />

      {/* Top-left: sketched range, sun and a trail with a live tracker */}
      <div className="pl-corner pl-corner--tl" aria-hidden="true">
        <svg viewBox="0 0 460 380">
          <circle className="pl-sun" cx="300" cy="80" r="28" fill="#F58220" />
          <path
            d="M40 190 L95 120 L120 140 L165 85 L190 105 L225 58 L255 92 L280 70 L330 130 L360 112 L430 190 Z"
            fill="#fff"
            stroke="#222"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M225 58 L255 92 L244 150 L230 110Z M165 85 L190 105 L178 160 L170 120Z M280 70 L330 130 L305 160 L290 110Z M95 120 L120 140 L108 175Z M360 112 L430 190 L392 190Z"
            fill="#2a2a2a"
            opacity="0.85"
          />
          <path
            d="M212 80 L206 130 M200 98 L196 150 M150 108 L146 160 M268 92 L262 150 M340 140 L336 185 M80 150 L78 185"
            stroke="#333"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <g fill="#1F4D36">
            <path d={pine(80, 232, 1)} />
            <path d={pine(104, 226, 1.25)} />
            <path d={pine(128, 234, 0.9)} />
            <path d={pine(150, 228, 1.1)} />
            <path d={pine(398, 220, 0.9)} />
            <path d={pine(418, 226, 1.1)} />
          </g>
          <path d="M330 190 L346 190" stroke="#222" strokeWidth="1.5" />
          <path
            className="pl-tl-trail"
            d={TL_TRAIL}
            pathLength="1"
            fill="none"
            stroke="#F58220"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M196 340 C 186 350, 170 356, 150 360" fill="none" stroke="#F58220" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
          <Pin x={277} y={272} />
          <Pin x={196} y={340} />
          <g className="pl-tracker">
            <circle className="pl-tracker-ping" r="6" fill="#F58220" />
            <circle r="4.5" fill="#F58220" stroke="#fff" strokeWidth="2" />
          </g>
        </svg>
      </div>

      {/* Bottom-right: a jeep driving the route towards the destination */}
      <div className="pl-corner pl-corner--br" aria-hidden="true">
        <svg viewBox="0 0 580 320">
          <path
            d="M445 178 L482 122 L500 136 L528 84 L552 114 L566 100 L585 178 Z"
            fill="#fff"
            stroke="#222"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M528 84 L552 114 L540 160 L532 120Z M482 122 L500 136 L490 165Z M566 100 L585 178 L570 178Z" fill="#2a2a2a" opacity="0.85" />
          <ellipse cx="520" cy="196" rx="58" ry="12" fill="#E3EDF0" stroke="#7D99A2" strokeWidth="1.2" />
          <path d="M485 194 H505 M520 199 H548 M498 202 H512" stroke="#7D99A2" strokeWidth="1" strokeLinecap="round" />
          <g fill="#1F4D36">
            <path d={pine(398, 214, 1)} />
            <path d={pine(418, 210, 1.2)} />
            <path d={pine(438, 216, 0.85)} />
          </g>

          <path className="pl-route-ghost" d={BR_ROUTE} fill="none" stroke="#F58220" strokeOpacity="0.3" strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round" />
          <path className="pl-route-progress" d={BR_ROUTE} pathLength="1" fill="none" stroke="#F58220" strokeWidth="3.4" strokeLinecap="round" />

          {BR_PINS.map(([x, y]) => (
            <Pin key={`${x}-${y}`} x={x} y={y} />
          ))}
          <Pin x={440} y={80} className="pl-dest" color="#F58220" scale={1.35} />

          <g className="pl-jeep">
            <g className="pl-jeep-body" transform="scale(0.95)">
              <rect x="-31" y="-26" width="5" height="13" rx="2" fill="#1c1c1c" />
              <path
                d="M-26 -10 V-24 Q-26 -27 -23 -27 H-12 L-6 -38 H16 Q19 -38 20 -35 L24 -27 H27 Q29 -27 29 -24 V-10 Z"
                fill="#1c1c1c"
              />
              <path d="M-9 -27 L-4 -35 H4 V-27Z M7 -35 H15 L19 -27 H7Z" fill="#f4f4f4" />
              <path d="M-8 -41 H18 M-4 -41 V-38 M14 -41 V-38" stroke="#1c1c1c" strokeWidth="1.6" />
              <rect x="25.5" y="-23" width="3" height="3" rx="0.5" fill="#F58220" />
              <g transform="translate(-15 -8)">
                <g className="pl-jeep-wheel">
                  <circle r="8" fill="#1c1c1c" />
                  <circle r="3.6" fill="#c9c9c9" />
                  <path d="M-3.6 0H3.6" stroke="#1c1c1c" strokeWidth="1.4" />
                </g>
              </g>
              <g transform="translate(16 -8)">
                <g className="pl-jeep-wheel">
                  <circle r="8" fill="#1c1c1c" />
                  <circle r="3.6" fill="#c9c9c9" />
                  <path d="M-3.6 0H3.6" stroke="#1c1c1c" strokeWidth="1.4" />
                </g>
              </g>
            </g>
          </g>
        </svg>
        <div className="pl-bubble">
          <span className="pl-bubble-label">Next stop</span>
          <span className="pl-flip">
            <span className="pl-bubble-name" />
          </span>
        </div>
      </div>

      <svg className="pl-compass" viewBox="0 0 40 70" aria-hidden="true">
        <text x="20" y="13" textAnchor="middle" fontSize="12" fontWeight="700" fill="#222">
          N
        </text>
        <path d="M20 21 L30 58 L20 50 Z" fill="#1F4D36" />
        <path d="M20 21 L10 58 L20 50 Z" fill="none" stroke="#1F4D36" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>

      <button type="button" className="pl-skip" onClick={() => (skipped.current = true)}>
        Skip intro <span aria-hidden="true">→</span>
      </button>

      {/* Brand */}
      <div className="pl-center">
        <div className="pl-emblem">
          <svg className="pl-emblem-ring" viewBox="0 0 100 100" aria-hidden="true">
            <circle className="pl-ring" cx="50" cy="50" r="47" pathLength="1" />
          </svg>
          <div className="pl-emblem-logo">
            <Logo />
          </div>
        </div>
        <p className="pl-title" aria-label="Dongar Diaries">
          {'DONGAR DIARIES'.split('').map((ch, i) => (
            <span key={i} className={`pl-char${i === 5 ? ' is-green' : ''}`} aria-hidden="true">
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </p>
        <p className="pl-tagline">
          Find your <span>own</span> way.
        </p>
      </div>

      {/* Loading readout with the flipping destination */}
      <div className="pl-hud">
        <span className="pl-flip pl-flip--name">
          <span className="pl-dest-name" />
        </span>
        <span className="pl-flip pl-flip--region">
          <span className="pl-dest-region" />
        </span>
        <div className="pl-bar">
          <span className="pl-bar-fill" />
        </div>
        <div className="pl-hud-meta">
          <span>Loading journeys…</span>
          <span className="pl-percent">0%</span>
        </div>
      </div>
    </div>
  );
}
