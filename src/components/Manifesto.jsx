import { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { manifesto } from '../data/content.js';
import { gsap } from '../lib/gsap.js';
import Icon from './Icon.jsx';
import { Reveal } from './motion.jsx';
import SectionHeading from './SectionHeading.jsx';

const ease = [0.2, 0.7, 0.2, 1];
const inView = { once: true, amount: 0.3 };

// '10,000+' -> { end: 10000, suffix: '+' }
const parseStat = (value) => {
  const match = value.match(/^([\d,]+)(.*)$/);
  return match ? { end: Number(match[1].replace(/,/g, '')), suffix: match[2] } : null;
};

export default function Manifesto() {
  const statsRef = useRef(null);

  // GSAP + ScrollTrigger: stats count up from zero the first time they scroll in.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      statsRef.current.querySelectorAll('[data-stat]').forEach((el) => {
        const stat = parseStat(el.dataset.stat);
        if (!stat) return;
        const counter = { value: 0 };
        gsap.to(counter, {
          value: stat.end,
          duration: 2.2,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => {
            el.textContent = Math.round(counter.value).toLocaleString('en-US') + stat.suffix;
          },
        });
      });
    }, statsRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="storytelling" className="section section--alt manifesto">
      <div className="glow" aria-hidden="true" />
      <div className="container manifesto__grid">
        <div className="manifesto__copy">
          <SectionHeading
            eyebrow="The Manifesto"
            title="We don’t just plan trips."
            accent="We create stories."
            breakBeforeAccent
          />
          <Reveal as="p" className="lede">
            From the first kilometre to the last sunset, every journey brings new people, unmapped
            terrain, and quiet campfire conversations that stay with you long after the mud washes
            off the tyres.
          </Reveal>

          <Reveal className="card stats-card">
            <div ref={statsRef} className="stats">
              {manifesto.stats.map((s) => (
                <div key={s.label}>
                  <span className={`stats__value tone-${s.tone}`} data-stat={s.value}>
                    {s.value}
                  </span>
                  <span className="label tone-muted">{s.label}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <a className="text-link" href="#storytelling">
            <span>Read Our Full Philosophy</span>
            <Icon name="arrow_forward" className="tone-accent" />
          </a>
        </div>

        <div className="collage">
          <motion.figure
            className="collage__main"
            initial={{ opacity: 0, x: 60, scale: 0.96 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={inView}
            transition={{ duration: 1, ease }}
          >
            <img
              src={manifesto.mainImage}
              alt="Group of adventurers sharing tea beside an overland SUV on a mountain pass"
              loading="lazy"
            />
            <figcaption className="collage__caption">
              <span className="label tone-green">Pass Transit • 4,900m</span>
              <p className="quote">
                “The air was thin, the engine was hot, and none of us wanted to turn around.”
              </p>
            </figcaption>
          </motion.figure>
          <motion.figure
            className="collage__secondary"
            initial={{ opacity: 0, y: 80, rotate: -6 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={inView}
            transition={{ duration: 1.1, ease, delay: 0.25 }}
          >
            <img
              src={manifesto.secondaryImage}
              alt="Campfire embers rising under a night sky"
              loading="lazy"
            />
          </motion.figure>
          <motion.span
            className="pill pill--float collage__badge"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={inView}
            transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.6 }}
          >
            <Icon name="camera_outdoor" className="tone-accent" />
            Unscripted Memories
          </motion.span>
        </div>
      </div>
    </section>
  );
}
