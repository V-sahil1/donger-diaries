import { useState } from 'react';
import { ctaImage } from '../data/content.js';
import Icon from './Icon.jsx';
import { Reveal } from './motion.jsx';
import SectionHeading from './SectionHeading.jsx';

export default function CallToAction() {
  const [destination, setDestination] = useState('');
  const [sent, setSent] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!destination.trim()) return;
    setSent(true);
  };

  return (
    <section id="contact" className="section">
      <div className="container">
        <Reveal
          className="cta"
          variants={{
            hidden: { opacity: 0, y: 60, scale: 0.96 },
            show: { opacity: 1, y: 0, scale: 1, transition: { duration: 1, ease: [0.2, 0.7, 0.2, 1] } },
          }}
        >
          <div className="cta__bg" style={{ backgroundImage: `url(${ctaImage})` }} aria-hidden="true" />
          <div className="cta__scrim" aria-hidden="true" />
          <div className="cta__content">
            <span className="round-icon tone-accent">
              <Icon name="signpost" />
            </span>
            <SectionHeading
              eyebrow="Start Your Chapter"
              title="Your Next Adventure"
              accent="is calling."
              breakBeforeAccent
            />
            <p className="lede">
              Pick a destination. Bring your curiosity. We&apos;ll handle the rugged logistics,
              secret camp locations, and expedition mechanics.
            </p>

            {sent ? (
              <p className="form-success" role="status">
                <Icon name="check_circle" className="tone-green" />
                <span>
                  Thanks! We&apos;ll be in touch about <strong>{destination}</strong> within 48 hours.
                </span>
              </p>
            ) : (
              <form className="inline-form" onSubmit={onSubmit}>
                <label className="sr-only" htmlFor="destination">
                  Where do you want to travel?
                </label>
                <input
                  id="destination"
                  className="input"
                  placeholder="Where do you want to travel?"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
                <button type="submit" className="btn btn--primary btn--lg">
                  <span>Let&apos;s Plan It</span>
                  <Icon name="arrow_forward" />
                </button>
              </form>
            )}
            <span className="label tone-muted">
              Limited small-group seats per expedition • Season 2026
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
