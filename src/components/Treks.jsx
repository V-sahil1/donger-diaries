import { treks } from '../data/content.js';
import Icon from './Icon.jsx';
import { Item, Reveal, Stagger } from './motion.jsx';
import SectionHeading from './SectionHeading.jsx';

export default function Treks() {
  return (
    <section id="treks" className="section section--alt">
      <div className="container">
        <div className="section-head section-head--split section-head--center">
          <div>
            <SectionHeading
              eyebrow="03 / Wild Trails & Ascents"
              eyebrowTone="green"
              title="Find Your"
              accent="wild."
              accentTone="green"
            />
            <p className="lede">
              Beyond the blacktop lies terrain that can only be reached on foot. Untamed ridges,
              glacial moraines, and camps perched above cloud ceilings.
            </p>
          </div>
          <Reveal as="a" className="btn btn--secondary btn--lg" href="#treks">
            <span>View All Treks</span>
            <Icon name="hiking" className="tone-green" />
          </Reveal>
        </div>

        <Stagger className="three-grid">
          {treks.map((t) => (
            <Item key={t.title} className="reveal-cell">
            <article className="card trek-card lift">
              <div className="card__media media-zoom">
                <img src={t.image} alt={t.alt} loading="lazy" data-parallax="7" />
                <span className="chip chip--green card__altitude">{t.altitude}</span>
              </div>
              <div className="card__body">
                <span className="label tone-accent">{t.category}</span>
                <h4 className="title-sm">{t.title}</h4>
                <p className="body-text">{t.description}</p>
              </div>
              <div className="trek-card__foot">
                <span>{t.meta}</span>
                <Icon name="trending_flat" className="tone-accent nudge" />
              </div>
            </article>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
