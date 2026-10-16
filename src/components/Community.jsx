import { gallery } from '../data/content.js';
import Icon from './Icon.jsx';
import { Item, Reveal, Stagger } from './motion.jsx';
import SectionHeading from './SectionHeading.jsx';

// Per-tile parallax (% of tile height): neighbours drift in opposite directions.
const GALLERY_DEPTH = [8, -12, 6, -14];

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
          {gallery.map((g, i) => (
            <Item
              as="figure"
              key={g.caption}
              className={`gallery__item gallery__item--${g.shape} media-zoom`}
              data-parallax={GALLERY_DEPTH[i % GALLERY_DEPTH.length]}
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
