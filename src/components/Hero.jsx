import { useLayoutEffect, useRef } from 'react';
import { heroImage } from '../data/content.js';
import { gsap } from '../lib/gsap.js';
import { useTheme } from '../theme/ThemeContext.jsx';
import Icon from './Icon.jsx';

function HeroCopy() {
  return (
    <>
      <h1 className="hero__title">
        <span className="hero__line">
          <span className="hero__line-inner">The Road</span>
        </span>
        <span className="hero__line">
          <span className="hero__line-inner">
            <em className="accent-italic tone-accent">is our</em> Story.
          </span>
        </span>
      </h1>
      <p className="hero__lede">
        Unforgettable road trips, high-altitude passes, and slow deliberate journeys curated for
        untamed souls seeking raw natural wonder.
      </p>

      <div className="hero__actions">
        <a className="btn btn--primary btn--lg" href="#featured-adventures">
          <span>Explore Our Trips</span>
          <Icon name="arrow_downward" />
        </a>
        <a className="btn btn--secondary btn--lg" href="#storytelling">
          <span>Find Your Adventure</span>
          <Icon name="north_east" className="tone-green" />
        </a>
      </div>
    </>
  );
}

function Ticker() {
  return (
    <div className="ticker">
      <div className="ticker__left">
        <span className="ticker__live">
          <span className="dot dot--green" /> Live Route Openings
        </span>
        <span className="ticker__sep hide-md">/</span>
        <span className="hide-md">Spiti Valley Winter Transit Confirmed</span>
      </div>
      <a className="ticker__right" href="#featured-adventures">
        <span>Collect Moments, Not Miles</span>
        <Icon name="expand_more" className="bounce tone-accent" />
      </a>
    </div>
  );
}

export default function Hero({ ready }) {
  const { isDark } = useTheme();
  const root = useRef(null);

  // GSAP intro: plays as the loader curtain opens.
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .fromTo('.hero__bg', { scale: 1.3 }, { scale: 1.05, duration: 2.4, ease: 'power2.out' }, 0)
        .from('.hero__line-inner', { yPercent: 115, rotate: 2, stagger: 0.14, duration: 1.2 }, 0.45)
        .from('.hero__lede', { y: 24, opacity: 0, duration: 0.9 }, 0.9)
        .from('.hero__actions .btn', { y: 22, opacity: 0, stagger: 0.1, duration: 0.8 }, 1.05)
        .from('.hero__ticker-bar', { yPercent: 100, opacity: 0, duration: 0.9 }, 1.1);
    }, root);
    return () => ctx.revert();
  }, [ready]);

  // GSAP ScrollTrigger: photo drifts slower than the page, copy eases away.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const scrub = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('.hero__bg', { yPercent: 18, ease: 'none', scrollTrigger: scrub });
      gsap.to('.hero__content', { y: -80, opacity: 0.15, ease: 'none', scrollTrigger: { ...scrub } });
    }, root);
    return () => ctx.revert();
  }, []);

  // Full-bleed photo behind the copy in both themes; the scrim adapts so the
  // copy stays legible (dark vignette in dark mode, white wash in light mode).
  return (
    <section
      ref={root}
      id="top"
      className={`hero hero--cinematic${isDark ? '' : ' hero--light'}`}
    >
      <div className="hero__bg" style={{ backgroundImage: `url(${heroImage})` }} />
      <div className="hero__scrim" />

      <div className="container hero__content">
        <HeroCopy />
      </div>

      <div className="hero__ticker-bar">
        <div className="container">
          <Ticker />
        </div>
      </div>
    </section>
  );
}
