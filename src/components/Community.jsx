import { gallery } from '../data/content.js';
import Icon from './Icon.jsx';
import { Item, Reveal, Stagger } from './motion.jsx';
import SectionHeading from './SectionHeading.jsx';

export default function Community() {
  return (
    <section className="section section--alt">
      <div className="container">
        <div className="section-head section-head--split">
          <SectionHeading
            eyebrow="The Community"
            eyebrowTone="green"
            title="Good Roads. Great People."
            accent="Unforgettable stories."
            breakBeforeAccent
          />
          <Reveal as="span" className="pill pill--float">
            <Icon name="photo_camera" className="tone-accent" />
            @dongardiaries • Stories from the Wild
          </Reveal>
        </div>

        <Stagger className="gallery" stagger={0.15}>
          {gallery.map((g) => (
            <Item
              as="figure"
              key={g.caption}
              className={`gallery__item gallery__item--${g.shape} media-zoom`}
              variants={{
                hidden: { opacity: 0, y: 60, rotate: -3, scale: 0.94 },
                show: { opacity: 1, y: 0, rotate: 0, scale: 1, transition: { duration: 0.9, ease: [0.2, 0.7, 0.2, 1] } },
              }}
            >
              <img src={g.image} alt={g.caption} loading="lazy" />
              <figcaption>{g.caption}</figcaption>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
