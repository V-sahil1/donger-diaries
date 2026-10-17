import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { journey } from '../../data/content.js';
import { ScrollTrigger } from '../../lib/gsap.js';
import Icon from '../Icon.jsx';

const { chapters, media } = journey;
// Each chapter owns a quarter of the scroll; its pin sits near the end of it,
// so the odometer "arrives" at the place just before the next region starts.
const SPAN = 1 / chapters.length;
const PINS = chapters.map((_, i) => i * SPAN + SPAN * 0.72);
// Odometer / altimeter readings at the start and at each map pin.
const STOPS = [{ p: 0, ...journey.start }, ...chapters.map((c, i) => ({ p: PINS[i], altitude: c.altitude, km: c.km }))];
const FADE = 0.035; // half-width of a crossfade between shots, in scroll progress

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smoothstep = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const readingAt = (p, key) => {
  for (let i = 1; i < STOPS.length; i += 1) {
    const a = STOPS[i - 1];
    const b = STOPS[i];
    if (p <= b.p) return a[key] + ((b[key] - a[key]) * (p - a.p)) / (b.p - a.p);
  }
  return STOPS[STOPS.length - 1][key];
};
const fmt = (n) => Math.round(n).toLocaleString('en-US');

const ease = [0.2, 0.7, 0.2, 1];

/**
 * "The Route": a pinned, scroll-scrubbed flight from the Sahyadri ghats to
 * Khardung La over real footage — each region's shot pushes in like a drone
 * and crossfades into the next — with chapter cards, a live
 * altimeter/odometer and a waypoint track on top.
 */
export default function Journey() {
  const sectionRef = useRef(null);
  const layersRef = useRef([]);
  const introRef = useRef(null);
  const hudRef = useRef(null);
  const altRef = useRef(null);
  const kmRef = useRef(null);
  const fillRef = useRef(null);
  const chapterRef = useRef(0);
  const [chapter, setChapter] = useState(0);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const layers = layersRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Direct DOM writes: this runs on every scroll tick during the flight.
    const update = (p) => {
      media.forEach((m, i) => {
        const el = layers[i];
        const end = media[i + 1]?.at ?? 1;
        // later shots stack on top, so each only needs to fade itself in
        const opacity = i === 0 ? 1 : smoothstep(m.at - FADE, m.at + FADE, p);
        const covered = i < media.length - 1 && p > media[i + 1].at + FADE;
        el.style.opacity = opacity;
        el.style.visibility = opacity > 0 && !covered ? 'visible' : 'hidden';
        if (reduceMotion) return;
        // slow drone push-in with a sideways drift that alternates per shot
        const t = clamp01((p - (m.at - FADE)) / (end - m.at + FADE * 2));
        const dir = i % 2 ? -1 : 1;
        el.style.transform = `translate3d(${dir * (t - 0.5) * 3}%, ${(0.5 - t) * 1.5}%, 0) scale(${1.08 + t * 0.14})`;
      });

      altRef.current.textContent = fmt(readingAt(p, 'altitude'));
      kmRef.current.textContent = fmt(readingAt(p, 'km'));
      fillRef.current.style.transform = `scaleX(${p})`;
      const intro = Math.max(0, 1 - p / 0.06);
      introRef.current.style.opacity = intro;
      introRef.current.style.transform = `translateY(${(1 - intro) * -40}px)`;
      hudRef.current.classList.toggle('is-live', p > 0.04);
      const next = Math.min(chapters.length - 1, Math.floor(p / SPAN));
      if (next !== chapterRef.current) {
        chapterRef.current = next;
        setChapter(next);
      }
    };
    update(0);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => `+=${window.innerHeight * 4}`,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => update(self.progress),
    });

    // only play the footage while the section is on screen
    const videos = section.querySelectorAll('video');
    const io = new IntersectionObserver(([entry]) => {
      videos.forEach((v) => (entry.isIntersecting ? v.play().catch(() => {}) : v.pause()));
    });
    io.observe(section);

    return () => {
      trigger.kill();
      io.disconnect();
    };
  }, []);

  const c = chapters[chapter];

  return (
    <section ref={sectionRef} id="the-route" className="journey" aria-label="The route from the Sahyadri to Ladakh">
      <div className="journey__media" aria-hidden="true">
        {media.map((m, i) =>
          m.video ? (
            <video
              key={m.video}
              ref={(el) => (layersRef.current[i] = el)}
              className="journey__layer"
              src={m.video}
              poster={m.poster}
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              key={m.image}
              ref={(el) => (layersRef.current[i] = el)}
              className="journey__layer"
              src={m.image}
              alt=""
              decoding="async"
            />
          )
        )}
      </div>
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
              style={{ left: `${PINS[i] * 100}%` }}
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
