import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { placeStories } from '../../data/content.js';
import { gsap, ScrollTrigger } from '../../lib/gsap.js';
import Icon from '../Icon.jsx';
import { Item, Reveal, Stagger } from '../motion.jsx';
import SectionHeading from '../SectionHeading.jsx';
import Lightbox from './Lightbox.jsx';

const pad = (n) => String(n).padStart(2, '0');
const STRIP_MAX = 6; // thumbnails shown under each chapter; the last one opens the rest
const IDLE_MS = 3000; // with no scrolling for this long, the section plays itself

// How each new cover photo arrives; one is picked at random per photo.
const REVEALS = [
  { from: { autoAlpha: 0, scale: 1.18 }, to: { autoAlpha: 1, scale: 1 } }, // fade + settle
  { from: { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 100%)' }, to: { clipPath: 'inset(0% 0% 0% 0%)' } }, // wipe from right
  { from: { autoAlpha: 1, clipPath: 'inset(0% 100% 0% 0%)' }, to: { clipPath: 'inset(0% 0% 0% 0%)' } }, // wipe from left
  { from: { autoAlpha: 1, clipPath: 'inset(100% 0% 0% 0%)' }, to: { clipPath: 'inset(0% 0% 0% 0%)' } }, // rise from below
  { from: { autoAlpha: 1, clipPath: 'circle(0% at 50% 50%)' }, to: { clipPath: 'circle(75% at 50% 50%)' } }, // iris open
];

const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Cover first, then the rest of the place's photos in a fresh random order
// (and with a random reveal each) on every visit.
const buildSlides = (place) => [
  { ...place.cover, reveal: 0 },
  ...shuffle(place.photos.filter((ph) => ph.src !== place.cover.src)).map((ph) => ({
    ...ph,
    reveal: Math.floor(Math.random() * REVEALS.length),
  })),
];

const INSET_MS = 3200; // how often a side photo swaps while its chapter is on screen

/**
 * Small floating photo that swaps itself for another of the place's photos
 * (picked at random) every few seconds while `playing`. The new photo fades
 * and settles in over the old one.
 */
function RotatingInset({ first, photos, playing, delay, className, parallax }) {
  const [shown, setShown] = useState({ now: first, before: null });

  useEffect(() => {
    if (!playing || photos.length < 2) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let timer = 0;
    const swap = () => {
      setShown(({ now }) => {
        const pool = photos.filter((ph) => ph.src !== now.src);
        return { now: pool[Math.floor(Math.random() * pool.length)], before: now };
      });
      timer = setTimeout(swap, INSET_MS);
    };
    // the two insets start out of step so they never change at the same moment
    timer = setTimeout(swap, delay);
    return () => clearTimeout(timer);
  }, [playing, photos, delay]);

  return (
    <figure className={className} data-parallax={parallax}>
      {shown.before && <img src={shown.before.src} alt="" />}
      <img key={shown.now.src} className={shown.before ? 'is-new' : ''} src={shown.now.src} alt={shown.now.alt} loading="lazy" />
    </figure>
  );
}

// Scroll animations live in the parent, which knows whether the chapters run
// sideways (and so must hang off the pinned timeline) or stack vertically.
function PlaceStory({ place, slides, index, total, active, onOpen }) {
  const flip = index % 2 === 1;
  const { name, tagline, region, story, facts, inset, photos } = place;
  const extra = photos.length - STRIP_MAX;
  // side photos rotate through everything except the big cover
  const insetPool = useMemo(
    () => [...inset, ...photos].filter((ph, k, all) => ph.src !== place.cover.src && all.findIndex((o) => o.src === ph.src) === k),
    [place, inset, photos]
  );

  return (
    <article id={`story-${place.slug}`} className={`story${flip ? ' story--flip' : ''}`}>
      <div className="story__marquee" aria-hidden="true">
        <span className="story__marquee-drift">
          {/* two identical halves, so the loop wraps seamlessly at -50% */}
          <span className="story__marquee-loop">
            {[0, 1].map((half) => (
              <span key={half} className="story__marquee-half">
                {[0, 1].map((k) => (
                  <span key={k} className="story__marquee-set">
                    <span className="story__marquee-word">{name}</span>
                    <Icon name="filter_hdr" className="story__marquee-sep" />
                    <span className="story__marquee-word story__marquee-word--solid">
                      {tagline.replace(/\.$/, '')}
                    </span>
                    <Icon name="filter_hdr" className="story__marquee-sep" />
                  </span>
                ))}
              </span>
            ))}
          </span>
        </span>
      </div>

      <div className="container story__grid">
        <div className="story__media">
          <figure className="story__cover">
            {slides.map((ph, k) => (
              <img
                key={ph.src}
                className="story__slide"
                src={ph.src}
                alt={k ? '' : ph.alt}
                data-reveal={ph.reveal}
                loading="lazy"
                decoding="async"
              />
            ))}
            <span className="pill pill--float story__tag">
              <Icon name="landscape" className="tone-accent" />
              {facts[0].value}
            </span>
          </figure>
          {inset.map((ph, k) => (
            <RotatingInset
              key={ph.caption}
              first={ph}
              photos={insetPool}
              playing={active}
              delay={INSET_MS * (0.6 + k * 0.5)}
              className={`story__inset story__inset--${k}`}
              parallax={k ? -34 : -18}
            />
          ))}
        </div>

        <div className="story__copy">
          <span className="label tone-accent story__count">
            {pad(index + 1)} / {pad(total)}
          </span>
          <SectionHeading
            as="h3"
            eyebrow={region}
            eyebrowTone="green"
            title={name}
            accent={tagline}
            breakBeforeAccent
          />
          {story.map((para) => (
            <Reveal key={para.slice(0, 24)} as="p" className="lede story__para">
              {para}
            </Reveal>
          ))}

          <Stagger as="dl" className="story__facts" stagger={0.08}>
            {facts.map((f) => (
              <Item key={f.label} className="story__fact">
                <dt className="label tone-muted">{f.label}</dt>
                <dd>{f.value}</dd>
              </Item>
            ))}
          </Stagger>

          <Stagger className="story__strip" stagger={0.06}>
            {photos.slice(0, STRIP_MAX).map((ph, k) => {
              const more = k === STRIP_MAX - 1 && extra > 0;
              return (
                <Item
                  as="button"
                  type="button"
                  key={ph.caption}
                  className="story__thumb"
                  onClick={() => onOpen(photos, k)}
                  aria-label={more ? `Open photo: ${ph.caption}, and ${extra} more` : `Open photo: ${ph.caption}`}
                >
                  <img src={ph.src} alt="" loading="lazy" />
                  {more && <span className="story__thumb-more">+{extra}</span>}
                </Item>
              );
            })}
          </Stagger>
          <span className="label tone-muted story__hint">
            <Icon name="photo_library" /> {photos.length} photos • tap to open
          </span>
        </div>
      </div>
    </article>
  );
}

/**
 * "Stories From The Forts": one chapter per place, with a photo viewer.
 * On desktop the section pins and each chapter is revealed over the last as you
 * scroll down; on smaller screens (or with reduced motion) they stack.
 */
export default function PlaceStories() {
  const [active, setActive] = useState(0);
  const [viewer, setViewer] = useState(null); // { photos, index }
  const [slides] = useState(() => placeStories.map(buildSlides));
  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const indexRef = useRef(null);
  const viewerOpen = useRef(false);
  const sideways = useRef(null); // { st, tl } while the sideways mode is active

  useEffect(() => {
    viewerOpen.current = Boolean(viewer);
  }, [viewer]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const nav = section.querySelector('.stories__index');
    const stories = gsap.utils.toArray('.story', section);
    const coverFrom = { clipPath: 'inset(14% 12% 14% 12% round 1rem)' };
    const coverTo = { clipPath: 'inset(0% 0% 0% 0% round 1rem)' };

    const mm = gsap.matchMedia();
    mm.add(
      // pinned on every screen tall enough to hold a chapter (phones included);
      // landscape phones and reduced motion get the stacked list instead
      { tall: '(min-height: 540px)', reduce: '(prefers-reduced-motion: reduce)' },
      ({ conditions: { tall, reduce } }) => {
        if (tall && !reduce) {
          // ---- Pinned storytelling ----------------------------------------
          // One scrubbed timeline: the chapter's photo opens, then each scroll
          // step reveals another of its photos (random order, random reveal);
          // after the last one the chapter zooms away and the next zooms in.
          section.classList.add('stories--h');
          // The pinned window sits just under the sticky header + place index.
          const offset = () => parseFloat(getComputedStyle(nav).top) + nav.offsetHeight;
          const setOffset = () => section.style.setProperty('--stories-offset', `${offset()}px`);
          setOffset();
          ScrollTrigger.addEventListener('refreshInit', setOffset);

          const tl = gsap.timeline({ defaults: { ease: 'none' } });
          stories.forEach((el, i) => {
            const q = gsap.utils.selector(el);
            const flip = i % 2 === 1;
            const layers = q('.story__slide');
            if (i > 0) {
              // Reveal: the next chapter opens out from the centre over the last
              // one while zooming out to rest; the last one sinks back and dims
              // underneath. Both happen on the same scroll stretch, so the new
              // place starts appearing the moment the old one ends.
              tl.fromTo(
                el,
                { clipPath: 'circle(0% at 50% 50%)', scale: 1.3, autoAlpha: 1 },
                { clipPath: 'circle(75% at 50% 50%)', scale: 1, duration: 1.2, ease: 'sine.inOut' }
              ).to(stories[i - 1], { scale: 0.88, autoAlpha: 0.25, duration: 1.2, ease: 'sine.inOut' }, '<')
                .set(stories[i - 1], { autoAlpha: 0 });
            }
            // photo opens as the chapter settles (overlaps the end of the reveal)
            tl.fromTo(q('.story__cover'), coverFrom, { ...coverTo, duration: 1, ease: 'power1.out' }, i ? '-=0.7' : 0)
              .fromTo(layers[0], { scale: 1.35 }, { scale: 1, duration: 1, ease: 'power1.out' }, '<')
              // the place name drifts behind the chapter like a passing road sign
              .fromTo(
                q('.story__marquee-drift'),
                { x: () => window.innerWidth * (flip ? -0.3 : 0) },
                { x: () => window.innerWidth * (flip ? 0 : -0.3), duration: 1.6 + layers.length * 0.6 },
                '<'
              )
              .addLabel(`story${i}`, '<+=0.7');

            // every further (small) scroll step lands on the next photo; the
            // first one starts as soon as the cover has opened
            layers.slice(1).forEach((img, k) => {
              const { from, to } = REVEALS[img.dataset.reveal];
              tl.fromTo(img, from, { ...to, duration: 0.45, ease: 'sine.inOut' }, k ? '>' : `story${i}`)
                .addLabel(`story${i}-${k + 1}`);
            });
            // the last chapter holds a moment before the page moves on
            if (i === stories.length - 1) tl.to({}, { duration: 0.4 });
          });

          const labelTimes = stories.map((_, i) => tl.labels[`story${i}`]);
          // every stop the snap (and the autoplay) can land on, in order
          const stops = Object.values(tl.labels).sort((a, b) => a - b);
          const st = ScrollTrigger.create({
            animation: tl,
            trigger: viewport,
            start: () => `top ${offset()}`,
            // ~0.4 screen of scrolling per unit, so one photo ≈ a short flick of the wheel
            end: () => `+=${tl.duration() * window.innerHeight * 0.4}`,
            pin: true,
            scrub: 1.2, // lag behind the wheel a little so every change glides
            anticipatePin: 1,
            invalidateOnRefresh: true,
            snap: { snapTo: 'labelsDirectional', duration: { min: 0.3, max: 0.8 }, delay: 0.1, ease: 'power2.inOut' },
            onUpdate: () => {
              const t = tl.time();
              let current = 0;
              labelTimes.forEach((lt, i) => {
                if (t >= lt - 0.8) current = i; // switch halfway through the reveal
              });
              setActive(current);
            },
          });
          sideways.current = { st, tl };

          // ---- Autoplay: idle for a while → move to the next photo / place --
          let idle = 0;
          const advance = () => {
            if (!st.isActive || viewerOpen.current || document.hidden) return;
            const now = st.progress * tl.duration();
            const next = stops.find((t) => t > now + 0.05);
            if (next === undefined) return; // end of the last chapter: hand back to the reader
            window.scrollTo({ top: st.start + (next / tl.duration()) * (st.end - st.start), behavior: 'smooth' });
          };
          // any scroll (ours included) restarts the countdown, so it steps once per pause
          const restart = () => {
            clearTimeout(idle);
            idle = setTimeout(advance, IDLE_MS);
          };
          const events = ['scroll', 'pointerdown', 'keydown', 'touchstart'];
          events.forEach((e) => window.addEventListener(e, restart, { passive: true }));

          return () => {
            clearTimeout(idle);
            events.forEach((e) => window.removeEventListener(e, restart));
            section.classList.remove('stories--h');
            section.style.removeProperty('--stories-offset');
            ScrollTrigger.removeEventListener('refreshInit', setOffset);
            sideways.current = null;
          };
        }

        // ---- Stacked chapters (tablet / phone / reduced motion) --------------
        const timers = [];
        stories.forEach((el, index) => {
          const q = gsap.utils.selector(el);
          const flip = index % 2 === 1;
          const layers = q('.story__slide');
          let shown = 0;
          let timer = 0;
          // cover photos rotate on their own while this chapter is on screen
          const cycle = () => {
            if (layers.length < 2 || viewerOpen.current) return;
            const next = (shown + 1) % layers.length;
            gsap.set(layers, { zIndex: 0 });
            gsap.set(layers[shown], { zIndex: 1 });
            gsap.fromTo(layers[next], { autoAlpha: 0, scale: 1.08, zIndex: 2 }, { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power2.out' });
            shown = next;
          };
          // keeps the place index in sync while this chapter fills the middle of the screen
          ScrollTrigger.create({
            trigger: el,
            start: 'top center',
            end: 'bottom center',
            onToggle: (self) => {
              if (self.isActive) setActive(index);
              clearInterval(timer);
              if (self.isActive && !reduce) timer = setInterval(cycle, 3500);
            },
          });
          timers.push(() => clearInterval(timer));
          if (reduce) return;

          gsap.fromTo(
            q('.story__marquee-drift'),
            { x: () => window.innerWidth * (flip ? -0.3 : 0) },
            {
              x: () => window.innerWidth * (flip ? 0 : -0.3),
              ease: 'none',
              scrollTrigger: {
                trigger: el,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
                invalidateOnRefresh: true,
              },
            }
          );
          const arrive = { trigger: el, start: 'top 85%', end: 'top 20%', scrub: true };
          gsap.fromTo(q('.story__cover'), coverFrom, { ...coverTo, ease: 'none', scrollTrigger: arrive });
          gsap.fromTo(layers[0], { scale: 1.35 }, { scale: 1, ease: 'none', scrollTrigger: { ...arrive } });
        });
        return () => timers.forEach((stop) => stop());
      }
    );
    return () => mm.revert();
  }, []);

  // Pinned mode: index links scroll to the moment that chapter is fully open.
  const jumpTo = (event, i) => {
    const side = sideways.current;
    if (!side) return;
    event.preventDefault();
    const { st, tl } = side;
    const progress = tl.labels[`story${i}`] / tl.duration();
    window.scrollTo({ top: st.start + progress * (st.end - st.start), behavior: 'smooth' });
  };

  // On narrow screens the index scrolls sideways: keep the current place in view.
  useEffect(() => {
    const list = indexRef.current;
    const link = list?.children[active];
    if (link) list.scrollTo({ left: link.offsetLeft - list.offsetLeft - 16, behavior: 'smooth' });
  }, [active]);

  const open = useCallback((photos, index) => setViewer({ photos, index }), []);
  const close = useCallback(() => setViewer(null), []);
  const step = useCallback(
    (dir) =>
      setViewer((v) => v && { ...v, index: (v.index + dir + v.photos.length) % v.photos.length }),
    []
  );

  return (
    <section ref={sectionRef} id="stories" className="section stories">
      <div className="container">
        <div className="section-head section-head--split">
          <SectionHeading
            eyebrow="04 / Stories From The Forts"
            eyebrowTone="green"
            title="Every fort"
            accent="has a story."
            breakBeforeAccent
          />
          <Reveal as="p" className="section-head__aside">
            Rock-cut steps, monsoon clouds and campfire legends from the Sahyadri forts and valleys we
            keep going back to.
          </Reveal>
        </div>
      </div>

      <nav className="stories__index" aria-label="Places in this section">
        <ol ref={indexRef} className="container">
          {placeStories.map((p, i) => (
            <li key={p.slug}>
              <a
                href={`#story-${p.slug}`}
                className={i === active ? 'is-active' : ''}
                onClick={(e) => jumpTo(e, i)}
              >
                <span>{pad(i + 1)}</span>
                {p.name}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div ref={viewportRef} className="stories__viewport">
        <div className="stories__track">
          {placeStories.map((place, i) => (
            <PlaceStory
              key={place.slug}
              place={place}
              slides={slides[i]}
              index={i}
              active={i === active}
              total={placeStories.length}
              onOpen={open}
            />
          ))}
        </div>
      </div>

      <Lightbox viewer={viewer} onClose={close} onStep={step} />
    </section>
  );
}
