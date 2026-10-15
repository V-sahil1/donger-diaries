import { featuredTrips } from '../data/content.js';
import Icon from './Icon.jsx';
import { Item, Reveal, Stagger } from './motion.jsx';
import SectionHeading from './SectionHeading.jsx';

function TripCard({ trip }) {
  const isWide = trip.size === 'wide';
  return (
    <article className={`card trip-card trip-card--${trip.size || 'regular'} lift`}>
      <div className="card__media media-zoom">
        <img src={trip.image} alt={trip.alt} loading="lazy" />
        <div className="card__badges">
          {trip.badges.map((b) => (
            <span key={b.label} className={`chip chip--${b.tone || 'plain'}`}>
              {b.label}
            </span>
          ))}
        </div>
      </div>
      <div className="card__body">
        <div className={isWide ? 'trip-card__titlerow' : 'trip-card__titleblock'}>
          <h3 className={isWide ? 'title-md' : 'title-sm'}>{trip.title}</h3>
          <span className={`label tone-${trip.taglineTone}`}>{trip.tagline}</span>
        </div>
        <p className="body-text">{trip.description}</p>
        <a className="text-link" href="#contact">
          <span>Explore Journey</span>
          <Icon name="arrow_forward" className="tone-accent" />
        </a>
      </div>
    </article>
  );
}

export default function FeaturedTrips() {
  return (
    <section id="featured-adventures" className="section">
      <div className="container">
        <div className="section-head section-head--split">
          <SectionHeading
            eyebrow="01 / Field Expeditions"
            title="Your Next Story"
            accent="starts here."
            accentTone="green"
          />
          <Reveal as="p" className="section-head__aside">
            Handcrafted expeditions mapped across treacherous mountain highways, untamed valley
            tracks, and ancient high-altitude settlements.
          </Reveal>
        </div>

        <Stagger className="trip-grid">
          {featuredTrips.map((trip) => (
            <Item key={trip.id} className={`trip-cell trip-cell--${trip.size || 'regular'}`}>
              <TripCard trip={trip} />
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
