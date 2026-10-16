import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { heroPoster, heroVideo } from '../data/content.js';
import { gsap } from '../lib/gsap.js';
import { useTheme } from '../theme/ThemeContext.jsx';
import Icon from './Icon.jsx';

// Second headline line cycles through these, typewriter style.
const TYPED_PHRASES = [
  { accent: 'is our', word: 'Story.' },
  { accent: 'makes', word: 'Memories.' },
  { accent: 'leaves', word: 'Tyre Marks.' },
  { accent: 'is our', word: 'Therapy.' },
  { accent: 'fills our', word: 'Diaries.' },
  { accent: 'burns', word: 'Rubber.' },
];

const TYPE_MS = 85;
const DELETE_MS = 40;
const HOLD_MS = 2200;
const GAP_MS = 350;
// Let the GSAP intro finish revealing the first phrase before typing starts.
const START_DELAY_MS = 2200;

// The accent and the bold word are typed as one string with a space between.
const phraseLength = ({ accent, word }) => accent.length + 1 + word.length;

function Typewriter({ ready }) {
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(() => phraseLength(TYPED_PHRASES[0]));
  const [deleting, setDeleting] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ready) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setTimeout(() => setStarted(true), START_DELAY_MS);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    if (!started) return undefined;
    const full = phraseLength(TYPED_PHRASES[index]);
    let delay;
    let step;
    if (!deleting && count === full) {
      delay = HOLD_MS;
      step = () => setDeleting(true);
    } else if (deleting && count === 0) {
      delay = GAP_MS;
      step = () => {
        setDeleting(false);
        setIndex((i) => (i + 1) % TYPED_PHRASES.length);
      };
    } else {
      delay = deleting ? DELETE_MS : TYPE_MS;
      step = () => setCount((c) => c + (deleting ? -1 : 1));
    }
    const t = setTimeout(step, delay);
    return () => clearTimeout(t);
  }, [started, index, count, deleting]);

  const { accent, word } = TYPED_PHRASES[index];
  const accentShown = accent.slice(0, count);
  const wordShown = word.slice(0, Math.max(0, count - accent.length - 1));

  return (
    <span className="typewriter" aria-hidden="true">
      {accentShown && <em className="accent-italic tone-accent">{accentShown}</em>}
      {count > accent.length && ' '}
      {wordShown}
      <span className={`typewriter__caret${started ? '' : ' is-idle'}`} />
    </span>
  );
}

function HeroCopy({ ready }) {
  return (
    <>
      {/* Screen readers get the stable headline, not every keystroke. */}
      <h1 className="hero__title" aria-label="The Road is our Story.">
        <span className="hero__line" aria-hidden="true">
          <span className="hero__line-inner">The Road</span>
        </span>
        <span className="hero__line hero__line--typed">
          <span className="hero__line-inner">
            <Typewriter ready={ready} />
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
  const videoRef = useRef(null);

  // Keep the background loop playing: resume after tab switches, unexpected
  // pauses, or an autoplay block (retried on the first user interaction).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    // A touch faster so the slow drone shots read as motion, without making the
    // train and waterfall look sped up.
    const setRate = () => {
      video.defaultPlaybackRate = 1.15;
      video.playbackRate = 1.15;
    };
    setRate();
    video.addEventListener('loadedmetadata', setRate);
    const play = () => {
      if (document.hidden || !video.paused) return;
      video.play().catch(() => {});
    };
    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    play();
    video.addEventListener('pause', play);
    video.addEventListener('canplay', play);
    document.addEventListener('visibilitychange', play);
    events.forEach((e) => window.addEventListener(e, play, { passive: true }));
    return () => {
      video.removeEventListener('loadedmetadata', setRate);
      video.removeEventListener('pause', play);
      video.removeEventListener('canplay', play);
      document.removeEventListener('visibilitychange', play);
      events.forEach((e) => window.removeEventListener(e, play));
    };
  }, []);

  // GSAP intro: plays as the loader curtain opens.
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        // Zoom kept small: the footage is upscaled to fill the screen, and every
        // extra % of scale softens it further.
        .fromTo('.hero__bg', { scale: 1.12 }, { scale: 1.02, duration: 2.4, ease: 'power2.out' }, 0)
        .from('.hero__line-inner', { yPercent: 115, rotate: 2, stagger: 0.14, duration: 1.2 }, 0.45)
        .from('.hero__lede', { y: 24, opacity: 0, duration: 0.9 }, 0.9)
        .from('.hero__actions .btn', { y: 22, opacity: 0, stagger: 0.1, duration: 0.8 }, 1.05)
        .from('.hero__ticker-bar', { yPercent: 100, opacity: 0, duration: 0.9 }, 1.1)
        // Slow camera drift on top of the footage, forever.
        .to('.hero__bg', { scale: 1.05, xPercent: -1.5, duration: 16, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 2.4);
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
      <video
        ref={videoRef}
        className="hero__bg"
        src={heroVideo}
        poster={heroPoster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div className="hero__scrim" />

      <div className="container hero__content">
        <HeroCopy ready={ready} />
      </div>

      <div className="hero__ticker-bar">
        <div className="container">
          <Ticker />
        </div>
      </div>
    </section>
  );
}
