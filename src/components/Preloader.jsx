import { useLayoutEffect, useRef } from 'react';
import { featuredTrips, heroPoster } from '../data/content.js';
import { gsap, prefersReducedMotion } from '../lib/gsap.js';
import Logo from './Logo.jsx';
import { createTerrainScene } from './preloader/terrainScene.js';

const MIN_DURATION = 5400; // ms — long enough to flip through every destination
const MAX_DURATION = 9000; // never hold visitors hostage to a slow image

const DESTINATIONS = [
  { name: 'Manali → Leh', region: 'Himachal · Ladakh' },
  { name: 'Kalsubai Peak', region: 'Sahyadri · Maharashtra' },
  { name: 'Ratangad Fort', region: 'Bhandardara · Maharashtra' },
  { name: 'Spiti Valley', region: 'Himachal Pradesh' },
  { name: 'McLeod Ganj', region: 'Dharamshala · Himachal' },
  { name: 'Igatpuri', region: 'Nashik · Maharashtra' },
];

const PRELOAD = [heroPoster, ...featuredTrips.map((t) => t.image)];

function PinIcon({ color = '#087A35' }) {
  return (
    <svg viewBox="-11 -31 22 32" aria-hidden="true">
      <path d="M0 0 C -6 -9, -10 -13, -10 -19 A10 10 0 1 1 10 -19 C 10 -13, 6 -9, 0 0Z" fill={color} />
      <circle cy="-19" r="4" fill="#fff" />
    </svg>
  );
}

// Crossbar-less "A" drawn as a mountain peak for the wordmark.
function PeakA() {
  return (
    <svg className="pl-peak" viewBox="0 0 80 70" aria-hidden="true">
      <path d="M0 70 L40 0 L80 70 H61 L40 32 L19 70 Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Topographic-map loader shown on every load/refresh. A Three.js terrain rises
 * out of the paper, a jeep drives the route as assets load, map pins drop as it
 * passes, and the destination flips through favourite trips before the site
 * fades in.
 */
export default function Preloader({ onReveal, onDone }) {
  const root = useRef(null);
  const canvasRef = useRef(null);
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

    // The terrain is heavy to build, so it is created after the first frame has
    // painted: the brand intro starts instantly instead of waiting on it.
    let map = null;
    let buildFrame = requestAnimationFrame(() => {
      buildFrame = requestAnimationFrame(() => {
        map = createTerrainScene(canvasRef.current);
        if (!map) return;
        map.update(0, 0, false); // compile shaders now rather than mid-intro
        ctx.add(() => {
          gsap
            .timeline()
            .to(map.state, { dolly: 1, duration: 2.4, ease: 'power3.inOut' }, 0)
            .to(map.state, { rise: 1, duration: 2, ease: 'power2.inOut' }, 0.1)
            .to(map.state, { reveal: 1, duration: 1.5, ease: 'power1.inOut' }, 0.15)
            .to(map.state, { props: 1, duration: 0.6 }, 1.3)
            .to(map.state, { trail: 1, duration: 1.4, ease: 'power1.inOut' }, 1.5)
            .to('.pl-markers', { autoAlpha: 1, duration: 0.4 }, 0.2);
        });
      });
    });

    // HTML pins that follow their 3D positions on the map.
    const pinEls = {
      trail: [...el.querySelectorAll('.pl-pin3d--trail')],
      route: [...el.querySelectorAll('.pl-pin3d--route')],
      dest: q('.pl-pin3d--dest'),
      bubble: q('.pl-bubble'),
    };
    const dropped = pinEls.route.map(() => false);
    const placeMarkers = () => {
      if (!map) return;
      const place = (node, vec) => {
        const { x, y, visible } = map.project(vec);
        node.style.transform = `translate(${x}px, ${y}px)`;
        node.style.visibility = visible ? 'visible' : 'hidden';
      };
      map.markers.trailPins.forEach((m, i) => place(pinEls.trail[i], m.pos));
      map.markers.routePins.forEach((m, i) => place(pinEls.route[i], m.pos));
      place(pinEls.dest, map.markers.destination);
      place(pinEls.bubble, map.markers.destination);
    };

    let progressTl;
    const ctx = gsap.context(() => {
      gsap.set('.pl-pin3d--route .pl-pin-icon', { scale: 0 });
      gsap.set('.pl-markers', { autoAlpha: 0 }); // shown once the map exists

      // Brand intro starts on the very first frame.
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .fromTo('.pl-ring', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 0)
        .from('.pl-emblem-logo', { scale: 0.7, opacity: 0, duration: 0.7, ease: 'back.out(1.6)' }, 0.05)
        .from('.pl-char', { yPercent: 110, opacity: 0, stagger: 0.035, duration: 0.65 }, 0.2)
        .from('.pl-tagline', { y: 12, opacity: 0, duration: 0.6 }, 0.6)
        .from('.pl-hud, .pl-skip, .pl-compass', { opacity: 0, y: 10, stagger: 0.08, duration: 0.6 }, 0.5)
        .from('.pl-pin3d--dest .pl-pin-icon', { scale: 0, y: -20, duration: 0.7, ease: 'back.out(3)' }, 1.6)
        .from('.pl-pin3d--trail .pl-pin-icon', { scale: 0, y: -16, stagger: 0.3, duration: 0.6, ease: 'back.out(3)' }, 2)
        .from('.pl-bubble-inner', { opacity: 0, y: 10, duration: 0.6 }, 1.9);

      progressTl = gsap
        .timeline({ paused: true, defaults: { ease: 'none', duration: 1 } })
        .fromTo('.pl-bar-fill', { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left center' }, 0);

      if (!reduce) {
        gsap.to('.pl-pin3d--dest .pl-pin-icon', { y: -6, duration: 0.7, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.6 });
        gsap.to('.pl-compass', { rotation: 8, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
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
            .to(node, { yPercent: -100, opacity: 0, duration: 0.12, ease: 'power2.in' })
            .add(() => {
              node.textContent = texts[i];
            })
            .fromTo(node, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.22, ease: 'power3.out' });
        });
      });
      destIndex = index;
    };
    showDestination(0);

    const percent = q('.pl-percent');
    const start = performance.now();
    const shown = { p: 0 };
    let finished = false;

    const finish = () => {
      finished = true;
      ctx.add(() => {
        const exit = gsap.timeline({
          onComplete: () => {
            html.classList.remove('is-loading');
            callbacks.current.onDone?.();
          },
        });
        exit
          .to('.pl-center', { scale: 0.94, opacity: 0, duration: 0.5, ease: 'power2.in' }, '+=0.45')
          .to('.pl-hud, .pl-skip, .pl-compass, .pl-markers', { opacity: 0, duration: 0.45 }, '<');
        if (map) exit.to(map.state, { push: 1, duration: 1.3, ease: 'power3.in' }, '<');
        exit.add(() => callbacks.current.onReveal?.(), '-=0.5').to(el, { opacity: 0, duration: 0.7, ease: 'power2.out' }, '-=0.5');
      });
    };

    const tick = (time, deltaTime) => {
      if (!finished) {
        const timeFraction = Math.min(1, (performance.now() - start) / minDuration);
        const target = skipped.current ? 1 : Math.min(loaded / total, timeFraction);
        const rate = skipped.current ? 0.25 : 0.05;
        shown.p += (target - shown.p) * (1 - (1 - rate) ** (deltaTime / 16.67));
        if (target >= 1 && shown.p > 0.995) shown.p = 1;

        progressTl.progress(shown.p);
        percent.textContent = `${Math.round(shown.p * 100)}%`;

        const nextIndex = Math.min(DESTINATIONS.length - 1, Math.floor(shown.p * DESTINATIONS.length));
        if (nextIndex !== destIndex && !skipped.current) showDestination(nextIndex);

        map?.markers.routePins.forEach((pin, i) => {
          if (!dropped[i] && shown.p >= pin.t) {
            dropped[i] = true;
            gsap.to(pinEls.route[i].querySelector('.pl-pin-icon'), { scale: 1, duration: 0.5, ease: 'back.out(3)' });
          }
        });

        if (shown.p === 1) finish();
      }

      map?.update(shown.p, time, !reduce);
      placeMarkers();
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      cancelAnimationFrame(buildFrame);
      clearTimeout(failSafe);
      ctx.revert();
      map?.dispose();
      html.classList.remove('is-loading');
    };
  }, []);

  return (
    <div ref={root} className="preloader" role="status" aria-live="polite" aria-label="Loading Dongar Diaries">
      <canvas ref={canvasRef} className="pl-canvas" aria-hidden="true" />
      <div className="pl-paper-fade" aria-hidden="true" />

      <div className="pl-markers" aria-hidden="true">
        {[0, 1].map((i) => (
          <span key={`t${i}`} className="pl-pin3d pl-pin3d--trail">
            <span className="pl-pin-icon">
              <PinIcon />
            </span>
          </span>
        ))}
        {[0, 1, 2, 3].map((i) => (
          <span key={`r${i}`} className="pl-pin3d pl-pin3d--route">
            <span className="pl-pin-icon">
              <PinIcon />
            </span>
          </span>
        ))}
        <span className="pl-pin3d pl-pin3d--dest">
          <span className="pl-pin-icon">
            <PinIcon color="#F58220" />
          </span>
        </span>
        <div className="pl-bubble">
          <div className="pl-bubble-inner">
            <span className="pl-bubble-label">Next stop</span>
            <span className="pl-flip">
              <span className="pl-bubble-name" />
            </span>
          </div>
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
          <span className="pl-word pl-word--main" aria-hidden="true">
            {'DONGAR'.split('').map((ch, i) => (
              <span key={i} className="pl-char">
                {ch === 'A' ? <PeakA /> : ch}
              </span>
            ))}
          </span>
          <span className="pl-word pl-word--sub" aria-hidden="true">
            {'DIARIES'.split('').map((ch, i) => (
              <span key={i} className="pl-char">
                {ch}
              </span>
            ))}
          </span>
          <span className="pl-tagline">
            <span>Track</span>
            <i aria-hidden="true">•</i>
            <span>Analyze</span>
            <i aria-hidden="true">•</i>
            <span>Explore</span>
          </span>
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
