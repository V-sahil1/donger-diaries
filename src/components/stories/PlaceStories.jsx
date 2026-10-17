import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { placeStories } from '../../data/content.js';
import { gsap, ScrollTrigger } from '../../lib/gsap.js';
import Icon from '../Icon.jsx';
import { Item, Reveal, Stagger } from '../motion.jsx';
import SectionHeading from '../SectionHeading.jsx';
import Lightbox from './Lightbox.jsx';

const pad = (n) => String(n).padStart(2, '0');

// Scroll animations live in the parent, which knows whether the chapters run
// sideways (and so must hang off the horizontal tween) or stack vertically.
function PlaceStory({ place, index, total, onOpen }) {
  const flip = index % 2 === 1;
  const { name, tagline, region, story, facts, cover, inset, photos } = place;

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
            <img src={cover.src} alt={cover.alt} loading="lazy" />
          </figure>
          {inset.map((ph, k) => (
            <figure key={ph.caption} className={`story__inset story__inset--${k}`} data-parallax={k ? -34 : -18}>
              <img src={ph.src} alt={ph.alt} loading="lazy" />
            </figure>
          ))}
          <span className="pill pill--float story__tag" data-parallax="-60">
            <Icon name="landscape" className="tone-accent" />
            {facts[0].value}
          </span>
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
            {photos.map((ph, k) => (
              <Item
                as="button"
                type="button"
                key={ph.caption}
                className="story__thumb"
                onClick={() => onOpen(photos, k)}
                aria-label={`Open photo: ${ph.caption}`}
              >
                <img src={ph.src} alt="" loading="lazy" />
              </Item>
            ))}
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
 * On desktop the section pins and the chapters slide in from the right as you
 * scroll down; on smaller screens (or with reduced motion) they stack.
 */
export default function PlaceStories() {
  const [active, setActive] = useState(0);
  const [viewer, setViewer] = useState(null); // { photos, index }
  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const indexRef = useRef(null);
  const sideways = useRef(null); // { st, tl } while the sideways mode is active

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const nav = section.querySelector('.stories__index');
    const stories = gsap.utils.toArray('.story', section);
    const coverFrom = { clipPath: 'inset(14% 12% 14% 12% round 1rem)' };
    const coverTo = { clipPath: 'inset(0% 0% 0% 0% round 1rem)' };

    const mm = gsap.matchMedia();
    mm.add(
      { wide: '(min-width: 1024px)', reduce: '(prefers-reduced-motion: reduce)' },
      ({ conditions: { wide, reduce } }) => {
        if (wide && !reduce) {
          // ---- Sideways storytelling --------------------------------------
          // One scrubbed timeline per pass: the chapter's photo opens, the
          // chapter holds so it can be read, then the track slides to the next.
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
            if (i > 0) {
              tl.to(track, { x: () => -stories[i].offsetLeft, duration: 1.2, ease: 'power2.inOut' });
            }
            // photo opens as the chapter settles (overlaps the end of the slide)
            tl.fromTo(q('.story__cover'), coverFrom, { ...coverTo, duration: 1, ease: 'power1.out' }, i ? '-=0.5' : 0)
              .fromTo(q('.story__cover img'), { scale: 1.35 }, { scale: 1, duration: 1, ease: 'power1.out' }, '<')
              // the place name drifts behind the chapter like a passing road sign
              .fromTo(
                q('.story__marquee-drift'),
                { x: () => window.innerWidth * (flip ? -0.3 : 0) },
                { x: () => window.innerWidth * (flip ? 0 : -0.3), duration: 2.2 },
                '<'
              )
              .addLabel(`story${i}`, '<+=1')
              .to({}, { duration: 0.8 }); // hold: time to read before moving on
          });

          const labelTimes = stories.map((_, i) => tl.labels[`story${i}`]);
          const st = ScrollTrigger.create({
            animation: tl,
            trigger: viewport,
            start: () => `top ${offset()}`,
            // ~half a screen of scrolling per unit of timeline
            end: () => `+=${tl.duration() * window.innerHeight * 0.5}`,
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            snap: { snapTo: 'labelsDirectional', duration: { min: 0.3, max: 0.8 }, delay: 0.1, ease: 'power2.inOut' },
            onUpdate: () => {
              const t = tl.time();
              let current = 0;
              labelTimes.forEach((lt, i) => {
                if (t >= lt - 1.2) current = i; // switch as the next chapter slides in
              });
              setActive(current);
            },
          });
          sideways.current = { st, tl };

          return () => {
            section.classList.remove('stories--h');
            section.style.removeProperty('--stories-offset');
            ScrollTrigger.removeEventListener('refreshInit', setOffset);
            sideways.current = null;
          };
        }

        // ---- Stacked chapters (tablet / phone / reduced motion) --------------
        stories.forEach((el, index) => {
          const q = gsap.utils.selector(el);
          const flip = index % 2 === 1;
          // keeps the place index in sync while this chapter fills the middle of the screen
          ScrollTrigger.create({
            trigger: el,
            start: 'top center',
            end: 'bottom center',
            onToggle: (self) => self.isActive && setActive(index),
          });
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
          gsap.fromTo(q('.story__cover img'), { scale: 1.35 }, { scale: 1, ease: 'none', scrollTrigger: { ...arrive } });
        });
        return undefined;
      }
    );
    return () => mm.revert();
  }, []);

  // Sideways mode: index links scroll to the moment that chapter is fully open.
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
        <div ref={trackRef} className="stories__track">
          {placeStories.map((place, i) => (
            <PlaceStory key={place.slug} place={place} index={i} total={placeStories.length} onOpen={open} />
          ))}
        </div>
      </div>

      <Lightbox viewer={viewer} onClose={close} onStep={step} />
    </section>
  );
}
