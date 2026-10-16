import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { journey } from '../../data/content.js';
import { ScrollTrigger } from '../../lib/gsap.js';
import Icon from '../Icon.jsx';
import { createJourneyScene, routeAt, WAYPOINTS } from './journeyScene.js';

const { chapters } = journey;
// Odometer / altimeter readings at the start and at each map pin.
const STOPS = [
  { u: routeAt(0), ...journey.start },
  ...chapters.map((c, i) => ({ u: WAYPOINTS[i], altitude: c.altitude, km: c.km })),
];
// Region changes on the map (the terrain shader blends biomes at these points).
const BOUNDS = [0.25, 0.5, 0.75];
// Without WebGL there is no camera, so approximate its map position from the route.
const approxBiome = (p) => routeAt(p) * 0.95;
// Pin positions expressed as scroll progress, for the dots on the track.
const PIN_PROGRESS = WAYPOINTS.map((u) => (u - routeAt(0)) / (routeAt(1) - routeAt(0)));

const readingAt = (u, key) => {
  if (u <= STOPS[0].u) return STOPS[0][key];
  for (let i = 1; i < STOPS.length; i += 1) {
    const a = STOPS[i - 1];
    const b = STOPS[i];
    if (u <= b.u) return a[key] + ((b[key] - a[key]) * (u - a.u)) / (b.u - a.u);
  }
  return STOPS[STOPS.length - 1][key];
};
const fmt = (n) => Math.round(n).toLocaleString('en-US');

const ease = [0.2, 0.7, 0.2, 1];

/**
 * "The Route": a pinned, scroll-scrubbed Three.js flight from the Sahyadri
 * ghats to Khardung La, with chapter cards, a live altimeter/odometer and a
 * waypoint track overlaid on the canvas.
 */
export default function Journey() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const introRef = useRef(null);
  const hudRef = useRef(null);
  const altRef = useRef(null);
  const kmRef = useRef(null);
  const fillRef = useRef(null);
  const chapterRef = useRef(0);
  const [chapter, setChapter] = useState(0);

  useLayoutEffect(() => {
    const section = sectionRef.current;

    // Direct DOM writes: this runs every animation frame during the flight.
    const update = (p, biome = approxBiome(p)) => {
      const u = routeAt(p);
      altRef.current.textContent = fmt(readingAt(u, 'altitude'));
      kmRef.current.textContent = fmt(readingAt(u, 'km'));
      fillRef.current.style.transform = `scaleX(${p})`;
      const intro = Math.max(0, 1 - p / 0.06);
      introRef.current.style.opacity = intro;
      introRef.current.style.transform = `translateY(${(1 - intro) * -40}px)`;
      hudRef.current.classList.toggle('is-live', p > 0.04);
      const next = BOUNDS.filter((b) => biome > b).length;
      if (next !== chapterRef.current) {
        chapterRef.current = next;
        setChapter(next);
      }
    };

    let scene = null;
    try {
      scene = createJourneyScene(canvasRef.current, { onFrame: update });
    } catch {
      section.classList.add('journey--static'); // no WebGL: photo backdrop, HUD still works
    }
    update(0);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => `+=${window.innerHeight * 4}`,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => (scene ? scene.setProgress(self.progress) : update(self.progress)),
    });

    return () => {
      trigger.kill();
      scene?.dispose();
    };
  }, []);

  const c = chapters[chapter];

  return (
    <section ref={sectionRef} id="the-route" className="journey" aria-label="The route from the Sahyadri to Ladakh">
      <canvas ref={canvasRef} className="journey__canvas" aria-hidden="true" />
      <div className="journey__scrim" aria-hidden="true" />

      <div ref={introRef} className="journey__intro container">
        <span className="eyebrow">The Route • Mumbai → Khardung La</span>
        <h2 className="headline">
          2,700 km of <em className="accent-italic">stories.</em>
        </h2>
        <p className="journey__intro-text">
          Ride with us from monsoon ghats to the roof of the world, one scroll at a time.
        </p>
        <span className="journey__cue">
          <Icon name="south" className="bounce" /> Scroll to fly the route
        </span>
      </div>

      <div ref={hudRef} className="journey__hud container">
        <AnimatePresence mode="wait">
          <motion.article
            key={c.num}
            className="journey__card"
            initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
            transition={{ duration: 0.55, ease }}
          >
            <span className="journey__num">{c.num}</span>
            <span className="label journey__region">{c.region}</span>
            <h3 className="journey__title">
              {c.title} <em className="accent-italic">{c.accent}</em>
            </h3>
            <p className="journey__text">{c.text}</p>
            <span className="label journey__place">
              <Icon name="location_on" /> {c.place} • {fmt(c.altitude)} m
            </span>
          </motion.article>
        </AnimatePresence>

        <dl className="journey__meters" aria-live="off">
          <div>
            <dt className="label">Altitude</dt>
            <dd>
              <span ref={altRef}>{fmt(journey.start.altitude)}</span>
              <small>m</small>
            </dd>
          </div>
          <div>
            <dt className="label">On the road</dt>
            <dd>
              <span ref={kmRef}>0</span>
              <small>km</small>
            </dd>
          </div>
        </dl>
      </div>

      <div className="journey__track container" aria-hidden="true">
        <div className="journey__rail">
          <span ref={fillRef} className="journey__fill" />
          {chapters.map((ch, i) => (
            <span
              key={ch.num}
              className={`journey__stop${i <= chapter ? ' is-on' : ''}`}
              style={{ left: `${PIN_PROGRESS[i] * 100}%` }}
            >
              <span className="journey__dot" />
              <span className="journey__stop-label">{ch.place}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
