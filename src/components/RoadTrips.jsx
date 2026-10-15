import { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { roadTrip } from '../data/content.js';
import { gsap } from '../lib/gsap.js';
import Icon from './Icon.jsx';
import { Item, Reveal, Stagger } from './motion.jsx';
import SectionHeading from './SectionHeading.jsx';

const ease = [0.2, 0.7, 0.2, 1];

export default function RoadTrips() {
  const panoramaRef = useRef(null);

  // GSAP ScrollTrigger parallax: the road photo drifts inside its frame.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        'img',
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: {
            trigger: panoramaRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    }, panoramaRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="road-trips" className="section">
      <div className="container">
        <div className="section-head section-head--narrow">
          <SectionHeading
            eyebrow="02 / Highway Chronicles"
            eyebrowTone="green"
            title="Take The Long"
            accent="way home."
          />
          <Reveal as="p" className="lede">
            We specialize in unhurried overland journeys where the detour is the destination.
          </Reveal>
        </div>

        <motion.div
          ref={panoramaRef}
          className="panorama"
          initial={{ clipPath: 'inset(10% 8% 10% 8%)' }}
          whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.3, ease }}
        >
          <img
            src={roadTrip.image}
            alt="Expedition 4x4 on a winding mountain road carved into cliffs at golden hour"
            loading="lazy"
          />
          <div className="panorama__scrim" />
          <div className="panorama__overlay">
            <div className="panorama__top">
              <span className="pill pill--glass">Overland Expeditions</span>
              <span className="panorama__place">Zanskar Highway Sector</span>
            </div>
            <motion.div
              className="panorama__panel"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.9, delay: 0.5, ease }}
            >
              <h3 className="title-md">Wild Valleys &amp; Canyon Roads</h3>
              <p className="body-text">
                Engineered for those who measure a trip by heartbeats per hour, not kilometers per
                day.
              </p>
              <a className="btn btn--primary" href="#contact">
                <span>Discover Road Trips</span>
                <Icon name="arrow_forward" />
              </a>
            </motion.div>
          </div>
        </motion.div>

        <Stagger className="three-grid">
          {roadTrip.pillars.map((p) => (
            <Item as="article" key={p.num} className="card info-card">
              <div>
                <span className={`info-card__num tone-${p.tone}`}>{p.num}</span>
                <h4 className="title-sm">{p.title}</h4>
                <p className="body-text">{p.text}</p>
              </div>
              <div className="info-card__foot">
                <span className="label tone-muted">{p.footer}</span>
              </div>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
